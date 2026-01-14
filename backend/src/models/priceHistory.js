import mongoose from 'mongoose';

const priceHistorySchema = new mongoose.Schema(
    {
        // Unique identifier for the product
        productId: {
            type: String,
            required: true
        },
        // Price measurement
        price: {
            type: Number,
            required: true
        },
        // Timestamp
        timestamp: {
            type: Date,
            default: Date.now
        },
    },
    {
        // Set the specific collection name
        collection: 'price_history',

        // Configure Time-Series
        timeseries: {
            timeField: 'timestamp',
            metaField: 'productId',
            granularity: 'hours', // 'hours' is perfect for e-commerce price tracking
        },

        // Clean up the output for the API
        toJSON: {
            virtuals: false,
            versionKey: false, // Removes __v
            transform: (doc, ret) => {
                delete ret._id; // We don't need the internal ID for the chart
                return ret;
            }
        },
        toObject: { virtuals: false },
    }
);

// This ensures the model is only compiled once in Next.js
// Note the 3rd argument 'price_history' enforces the collection name
export default mongoose.models.priceHistory || mongoose.model('priceHistory', priceHistorySchema, 'price_history');