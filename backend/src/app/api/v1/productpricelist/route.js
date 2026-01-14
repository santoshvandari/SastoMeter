import { NextResponse } from "next/server";

export async function POST(request) {
    const body = await request.json()
    if (!body) {
        return NextResponse.json({
            message: "Invalid Request"
        }, { status: 400 })
    }
    try {
        // Perform Some Query Operation and validate the data
        return NextResponse.json({
            message: "Hello from Product Price List"
        })
    } catch (error) {
        return NextResponse.json({
            message: "Internal Server Error"
        }, { status: 500 })
    }
}