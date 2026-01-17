import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbconnect';
import productList from '@/models/productList';
import { isDigit } from "@/lib/utils";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('id');

        // 1. Validation
        if (!productId || !isDigit(productId)) {
            return NextResponse.json({ error: "Bad Request: Invalid ID" }, { status: 400 });
        }

        await dbConnect();

        // 2. Fetch Target Product
        const current_product = await productList.findOne(
            { product_id: productId },
            { product_name: 1, price: 1, product_id: 1 }
        ).lean();

        if (!current_product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        const { product_name, price } = current_product;

        // 3. Search Pipeline
        const pipeline = [
            {
                $search: {
                    index: "default",
                    compound: {
                        must: [
                            {
                                text: {
                                    query: product_name,
                                    path: "product_name",
                                    fuzzy: { maxEdits: 2 }
                                }
                            }
                        ]
                    }
                }
            },
            {
                // Step A: Extract the score so we can filter by it
                $addFields: {
                    searchScore: { $meta: "searchScore" }
                }
            },
            {
                $match: {
                    // Step B: Apply filters
                    searchScore: { $gte: 7 }, // ✅ ONLY show results with score >= 7
                    price: { $lte: price },
                    product_id: { $ne: productId }
                }
            },
            {
                $sort: {
                    price: 1, // Cheapest first
                    searchScore: -1
                }
            },
            {
                $limit: 5
            },
            {
                $project: {
                    _id: 0,
                    product_name: 1,
                    price: 1,
                    image: 1,
                    link: 1,
                    score: "$searchScore" // Returning score to verify
                }
            }
        ];

        const recommendedProducts = await productList.aggregate(pipeline);

        return NextResponse.json({
            count: recommendedProducts.length,
            recommended_products: recommendedProducts || []
        }, { status: 200 });

    } catch (error) {
        console.error("Recommendation API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}