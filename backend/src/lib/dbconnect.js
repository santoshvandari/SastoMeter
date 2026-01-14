import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
const options = {
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    
}

if (!MONGODB_URI) {
    throw new Error('Please add your mongodb uri');
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI,options).then((mongoose) => mongoose);
    }
    cached.conn = await cached.promise;
    return cached.conn;
}

export default dbConnect;