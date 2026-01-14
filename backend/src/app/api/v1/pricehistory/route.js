import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbconnect';
import priceHistory from '@/models/priceHistory';

export async function GET(req) {
    try {

        // 2. Get the 'id' from the query parameters
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('id');

        if (!productId) {
            return NextResponse.json({ error: "Bad Request" }, { status: 400 });
        }

        // 1. Establish database connection only after data validated
        await dbConnect();
        // 3. Query to fetch price history
        const history = await priceHistory.find({ productId })
            .sort({ timestamp: 1 }) // Chronological order for charts
            .select('price timestamp -_id')
            .lean();

        if (!history || history.length === 0) {
            return NextResponse.json({
                data: { prices_history: [] },
            }, { status: 404 });
        }

        // 4. Return formatted response to match your api.ts requirements
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