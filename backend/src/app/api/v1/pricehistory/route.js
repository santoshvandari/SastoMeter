import { NextResponse } from "next/server";

// export async function GET(request) {
//     try {
//         query = request.url.split("?")[1]
//         return NextResponse.json({
//             message: "Hello from Price History" + b
//         })
//     } catch (error) {
//         return NextResponse.json({
//             message: "Internal Server Error"
//         }, { status: 500 })
//     }
// }


export function GET(request) {
    const searchQuery = request.nextUrl.searchParams
    const productId = searchQuery.get("id")
    const countryName = searchQuery.get("country")
    if (!productId || !countryName) {
        return NextResponse.json({
            message: "Product ID and Country Name are required"
        }, { status: 400 })
    }
    try {
        // some DB Query
        return NextResponse.json({
            message: "Hello from Price History " + productId+" " + countryName
        })
    } catch (error) {
        return NextResponse.json({
            message: "Internal Server Error"
        }, { status: 500 })
    }
} 