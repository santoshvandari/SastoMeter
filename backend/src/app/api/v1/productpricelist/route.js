import { NextResponse } from "next/server";
import mongoose from "mongoose";
import priceHistory from '@/models/priceHistory';
import productList from '@/models/productList';
import dbConnect from "@/lib/dbconnect";
import { isDigit } from "@/lib/utils";

const MAX_BATCH_SIZE = 100; // Strict limit: Only 100 items per request
const MAX_WORD_COUNT = 100; // Limit name to 100 Words

export async function POST(request) {
    await dbConnect();
    const session = await mongoose.startSession();

    try {
        session.startTransaction();
        const body = await request.json();

        if (!Array.isArray(body) || body.length === 0) {
            await session.abortTransaction();
            return NextResponse.json({ message: "Bad Request" }, { status: 400 });
        }

        if (body.length > MAX_BATCH_SIZE) {
            await session.abortTransaction();
            return NextResponse.json({
                message: "Bad Request"
            }, { status: 413 });
        }

        const incomingDataMap = new Map();

        for (const item of body) {
            if (isDigit(item.product_id) && isDigit(item.price)) {

                let cleanName = null;
                if (item.product_name) {
                    const rawName = String(item.product_name).trim();
                    const wordCount = rawName.split(/\s+/).filter(w => w.length > 0).length;
                    if (wordCount > 0 && wordCount <= MAX_WORD_COUNT) {
                        cleanName = rawName;
                    }
                }

                // Validate and clean image URL
                let cleanImage = null;
                if (item.image && typeof item.image === 'string') {
                    const imageUrl = item.image.trim();
                    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                        cleanImage = imageUrl;
                    }
                }

                // Validate and clean product link
                let cleanLink = null;
                if (item.link && typeof item.link === 'string') {
                    const linkUrl = item.link.trim();
                    if (linkUrl.startsWith('http://') || linkUrl.startsWith('https://')) {
                        cleanLink = linkUrl;
                    }
                }

                incomingDataMap.set(item.product_id, {
                    price: Number(item.price),
                    name: cleanName,
                    image: cleanImage,
                    link: cleanLink
                });
            }
        }

        if (incomingDataMap.size === 0) {
            await session.abortTransaction();
            return NextResponse.json({ message: "No valid data found in request." }, { status: 400 });
        }

        const productIds = Array.from(incomingDataMap.keys());

        const currentProducts = await productList.find({ product_id: { $in: productIds } })
            .select("product_id price")
            .session(session)
            .lean();

        const currentPriceMap = new Map(currentProducts.map(p => [p.product_id, p.price]));

        const historyToInsert = [];
        const bulkUpdateOps = [];
        const now = new Date();

        incomingDataMap.forEach(({ price, name, image, link }, pid) => {
            const oldPrice = currentPriceMap.get(pid);

            if (oldPrice !== undefined && oldPrice === price) return;

            historyToInsert.push({
                product_id: pid,
                price,
                updated_at: now
            });

            const updateDoc = {
                $set: { price: price, updated_at: now },
                $setOnInsert: {}
            };

            if (name) {
                updateDoc.$set.product_name = name;
            } else {
                updateDoc.$setOnInsert.product_name = "Unknown Product";
            }

            // Update image if provided
            if (image) {
                updateDoc.$set.image = image;
            }

            // Update link if provided
            if (link) {
                updateDoc.$set.link = link;
            }

            bulkUpdateOps.push({
                updateOne: {
                    filter: { product_id: pid },
                    update: updateDoc,
                    upsert: true
                }
            });
        });

        if (historyToInsert.length > 0) {
            await priceHistory.insertMany(historyToInsert, { session, ordered: false });
            await productList.bulkWrite(bulkUpdateOps, { session, ordered: false });
        }

        await session.commitTransaction();

        return NextResponse.json({
            message: "Success",
            processed: incomingDataMap.size,
            updates: historyToInsert.length
        }, { status: 200 });

    } catch (error) {
        await session.abortTransaction();

        if (error.code === 112 || (error.errorLabels && error.errorLabels.includes('TransientTransactionError'))) {
            console.warn("WriteConflict detected. Client should retry.");
            return NextResponse.json({ message: "Concurrency conflict, Please Retry." }, { status: 409 });
        }

        console.error("Database Transaction Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    } finally {
        session.endSession();
    }
}