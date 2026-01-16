import mongoose from 'mongoose';

const productListSchema = new mongoose.Schema(
    {
        // Unique identifier for the product
        product_id: {
            type: String,
            required: true,
            index: true // Essential for fast lookups by product
        },
        // Name of the Product
        product_name: {
            type: String,
            required: true,
            // index: true // InFuture We use it to search similary product
        },
        // Price measurement
        price: {
            type: Number,
            required: true
        },
        // Timestamp
        updated_at: {
            type: Date,
            default: Date.now,
            index: true // Essential for sorting by time for charts
        },
    },
    {
        // Set the specific collection name
        collection: 'product_list_temp',

         // Disabling Versioning
        versionKey: false,

        // Clean up the output for the API
        toJSON: {
            virtuals: false,
            transform: (doc, ret) => {
                delete ret._id;
                return ret;
            }
        },
        toObject: { virtuals: false },
    }
);

export default mongoose.models.productList || mongoose.model('productList', productListSchema, 'product_list_temp');