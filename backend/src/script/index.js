// Run this script to create the fussy search index
// This will not work if you are using self hosted Mongodb
// This will only work for MongoDB Atlas

require('dotenv').config({ path: '.env' });
const { MongoClient } = require('mongodb');

async function createSearchIndex() {
    // 1. Validate Env Vars
    if (!process.env.MONGODB_URI) {
        console.error("❌ Error: MONGODB_URI is missing.");
        process.exit(1);
    }

    const client = new MongoClient(process.env.MONGODB_URI);

    try {
        await client.connect();
        
        // --- FIX IS HERE ---
        // Explicitly use the database name from your .env file
        // If not found, default to 'tempdb' based on your provided logs
        const dbName = process.env.MONGODB_DATABASE || 'tempdb';
        const db = client.db(dbName); 
        
        console.log(`✅ Connected to Database: "${db.databaseName}"`);

        const collectionName = 'product_list_dev';
        const collection = db.collection(collectionName);

        // 2. Check if collection exists
        const collections = await db.listCollections({ name: collectionName }).toArray();
        if (collections.length === 0) {
            console.error(`❌ Error: Collection "${collectionName}" does not exist in database "${db.databaseName}"`);
            console.error(`   Are you sure your data is in "${dbName}" and not "test"?`);
            process.exit(1);
        }

        console.log(`Found collection: "${collectionName}"`);

        // 3. Create Index
        const indexName = "default";
        const indexDefinition = {
            name: indexName,
            definition: {
                "mappings": {
                    "dynamic": false,
                    "fields": {
                        "product_name": {
                            "type": "string",
                            "analyzer": "lucene.english"
                        },
                        "price": {
                            "type": "number"
                        }
                    }
                }
            }
        };

        console.log("⏳ Creating Atlas Search Index...");
        await collection.createSearchIndex(indexDefinition);
        
        console.log(`\n🎉 SUCCESS! Index "${indexName}" created on ${dbName}.${collectionName}`);
        console.log("👉 Go to Atlas Dashboard > Search and wait for it to become 'Active'.");

    } catch (error) {
        console.error("❌ Failed:", error.message);
    } finally {
        await client.close();
    }
}

createSearchIndex();