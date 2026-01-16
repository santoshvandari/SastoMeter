import { NextResponse } from "next/server";
import mongoose from "mongoose";
import priceHistory from '@/models/priceHistory';
import productList from '@/models/productList';
import dbConnect from "@/lib/dbconnect";
import { isDigit } from "@/lib/utils";

export async function POST(request) {
    await dbConnect();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const body = await request.json();
        if (!Array.isArray(body) || body.length === 0) {
            await session.abortTransaction();
            return NextResponse.json({ message: "Invalid Request" }, { status: 400 });
        }

        // 1. Prepare Data
        const incomingDataMap = new Map();
        body.forEach(item => {
            if (isDigit(item.product_id) && isDigit(item.price)) {
                incomingDataMap.set(item.product_id, {
                    price: item.price,
                    name: item.product_name || null
                });
            }
        });

        console.log(incomingDataMap);

        // 2. Fetch Existing Prices
        const productIds = Array.from(incomingDataMap.keys());
        const currentProducts = await productList.find({ product_id: { $in: productIds } })
            .select("product_id price")
            .session(session)
            .lean();

        const currentPriceMap = new Map(currentProducts.map(p => [p.product_id, p.price]));

        // 3. Build Operations
        const historyToInsert = [];
        const bulkUpdateOps = [];
        const now = new Date();

        incomingDataMap.forEach(({ price, name }, pid) => {
            const oldPrice = currentPriceMap.get(pid);

            // Skip if price exists and hasn't changed
            if (oldPrice != undefined && oldPrice == price) return;

            // Add to History
            historyToInsert.push({ product_id: pid, price, updated_at: now });

            // CHANGE 2: Conditional Update Logic
            const updateDoc = {
                $set: { price: price, updated_at: now },
                $setOnInsert: {} // Initialize this
            };

            if (name) {
                updateDoc.$set.product_name = name;
            } else {
                updateDoc.$setOnInsert.product_name = "Unknown Product";
            }

            bulkUpdateOps.push({
                updateOne: {
                    filter: { product_id: pid },
                    update: updateDoc,
                    upsert: true
                }
            });
        });

        // 4. Execute
        if (historyToInsert.length > 0) {
            await priceHistory.insertMany(historyToInsert, { session, ordered: false });
            await productList.bulkWrite(bulkUpdateOps, { session });
        }

        await session.commitTransaction();
        return NextResponse.json({
            message: "Success",
            updates: historyToInsert.length
        }, { status: 200 });

    } catch (error) {
        await session.abortTransaction();
        console.error("Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    } finally {
        session.endSession();
    }
}