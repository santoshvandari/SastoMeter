import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbconnect';
import priceHistory from '@/models/priceHistory';
import { isDigit } from "@/lib/utils"

// Endpoint used to get price history data
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('id');
        if (!productId || !isDigit(productId)) {
            return NextResponse.json({ error: "Bad Request" }, { status: 400 });
        }
        await dbConnect();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const history = await priceHistory.find({
            product_id: productId,
            updated_at: { $gte: oneYearAgo }
        })
            .sort({ updated_at: 1 })
            .select('price updated_at -_id')
            .lean();

        if (!history || history.length === 0) {
            return NextResponse.json({
                data: { prices_history: [] },
            }, { status: 200 });
        }
        return NextResponse.json({
            data: {
                prices_history: history
            }
        });

    } catch (error) {
        console.error("Internal Server Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}