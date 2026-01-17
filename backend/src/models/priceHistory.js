import mongoose from 'mongoose';

const priceHistorySchema = new mongoose.Schema(
    {
        // Unique identifier for the product
        product_id: {
            type: String,
            required: true,
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
        },
    },
    {
        // Set the specific collection name
        collection: 'price_history',
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

// Compound index for optimized queries (e.g., "Get history for Product X between dates Y and Z")
priceHistorySchema.index({ product_id: 1, updated_at: -1 });

export default mongoose.models.priceHistory || mongoose.model('priceHistory', priceHistorySchema, 'price_history');