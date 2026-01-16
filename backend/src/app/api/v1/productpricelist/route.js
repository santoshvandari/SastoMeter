import { NextResponse } from "next/server";

// Endpoint use to Stored the Data
// Data format 
// {
//     "product_id":product_id, 
//     "price":price,
// }
// We append the updated_at time which is current time now() which is utc.

// operations = []
//         for p in unique_prices:
//             p_id = p.get("productId")
//             p_time = p.get("time")

//             # Sanitize ISO string for Python compatibility
//             dt_object = datetime.fromisoformat(p_time.replace("Z", "+00:00"))
//             utc_dt = dt_object.astimezone(timezone.utc)

//             operations.append(
//                 ReplaceOne(
//                     filter={"product_id": p_id, "updated_at": utc_dt},
//                     replacement={
//                         "price": p.get("price"),
//                         "product_id": p_id,
//                         "updated_at": utc_dt,
//                     },
//                     upsert=True,
//                 )
//             )

//         if operations:
//             # ordered=False allows Mongo to process faster and ignore minor individual errors
//             result = db[collection_name].bulk_write(operations, ordered=False)
//             logger.debug(
//                 f"Product {product_id}: Bulk write - Upserted: {result.upserted_count}, Modified: {result.modified_count}"
//             )



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