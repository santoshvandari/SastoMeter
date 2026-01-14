import mongoose from 'mongoose';

const priceHistorySchema = new mongoose.Schema(
    {
        // Unique identifier for the product
        productId: {
            type: String,
            required: true,
            index: true // Essential for fast lookups by product
        },
        // Price measurement
        price: {
            type: Number,
            required: true
        },
        // Timestamp
        timestamp: {
            type: Date,
            default: Date.now,
            index: true // Essential for sorting by time for charts
        },
    },
    {
        // Set the specific collection name
        collection: 'price_history',

        // Clean up the output for the API
        toJSON: {
            virtuals: false,
            versionKey: false,
            transform: (doc, ret) => {
                delete ret._id;
                return ret;
            }
        },
        toObject: { virtuals: false },
    }
);

// Compound index for optimized queries (e.g., "Get history for Product X between dates Y and Z")
priceHistorySchema.index({ productId: 1, timestamp: -1 });

export default mongoose.models.priceHistory || mongoose.model('priceHistory', priceHistorySchema, 'price_history');