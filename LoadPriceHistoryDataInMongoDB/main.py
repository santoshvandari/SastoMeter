import os
import sys
import time
import logging
from typing import List, Dict, Optional
from datetime import datetime, timezone

import requests
from pymongo import MongoClient, ReplaceOne, ASCENDING
from dotenv import load_dotenv
from tqdm import tqdm

# Load environment variables
load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE")
SOURCE_API_URL = os.getenv("SOURCE_API_URL")

# --- ADVANCED LOGGING CONFIGURATION ---
logger = logging.getLogger("price_sync")
logger.setLevel(logging.DEBUG)  # Root level must be lowest to allow handlers to filter

# 1. File Handler (Stores everything: DEBUG and above)
file_handler = logging.FileHandler("price_history_load.log")
file_handler.setLevel(logging.DEBUG)
file_format = logging.Formatter(
    "%(asctime)s - %(levelname)s - [%(funcName)s] - %(message)s"
)
file_handler.setFormatter(file_format)

# 2. Console Handler (Shows only INFO and above)
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.INFO)
console_format = logging.Formatter("%(message)s")  # Simple format for clean console
console_handler.setFormatter(console_format)

# Add handlers to logger
logger.addHandler(file_handler)
logger.addHandler(console_handler)


def connect_mongo_db(mongo_uri: str, database_name: str) -> MongoClient:
    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        client.admin.command("ping")
        db = client[database_name]

        # Performance: Compound index for product_id and time
        logger.info("Connecting to DB and ensuring indexes...")
        db["price_history"].create_index(
            [("product_id", ASCENDING), ("updated_at", ASCENDING)]
        )

        return db
    except Exception as ex:
        logger.error(f"Failed to Connect to Database: {ex}")
        sys.exit(1)


def insert_data_in_collection(db, collection_name: str, product_id: str, prices: list):
    if not prices:
        logger.debug(f"Product {product_id}: No prices provided by API.")
        return

    # Sort by time and remove duplicate consecutive prices
    prices.sort(key=lambda x: x.get("time", 0))
    unique_prices = []
    last_price = None

    for price_entry in prices:
        current_price = price_entry.get("price")
        if current_price != last_price:
            unique_prices.append(
                {
                    "productId": product_id,
                    "price": current_price,
                    "time": price_entry.get("time"),
                }
            )
            last_price = current_price

    if not unique_prices:
        logger.debug(f"Product {product_id}: No unique price shifts detected.")
        return

    try:
        operations = []
        for p in unique_prices:
            p_id = p.get("productId")
            p_time = p.get("time")

            # Sanitize ISO string for Python compatibility
            dt_object = datetime.fromisoformat(p_time.replace("Z", "+00:00"))
            utc_dt = dt_object.astimezone(timezone.utc)

            operations.append(
                ReplaceOne(
                    filter={"product_id": p_id, "updated_at": utc_dt},
                    replacement={
                        "price": p.get("price"),
                        "product_id": p_id,
                        "updated_at": utc_dt,
                    },
                    upsert=True,
                )
            )

        if operations:
            # ordered=False allows Mongo to process faster and ignore minor individual errors
            result = db[collection_name].bulk_write(operations, ordered=False)
            logger.debug(
                f"Product {product_id}: Bulk write - Upserted: {result.upserted_count}, Modified: {result.modified_count}"
            )

    except Exception as e:
        logger.error(f"Product {product_id}: Database bulk write failed - {e}")


def get_prices_history(api_url: str, product_id: str, session: requests.Session):
    try:
        response = session.get(
            api_url, params={"id": product_id, "hostCountry": "np"}, timeout=20
        )
        response.raise_for_status()
        data = response.json()

        if data.get("success") and data.get("data", {}).get("prices"):
            logger.debug(
                f"Product {product_id}: API returned {len(data['data']['prices'])} price points."
            )
            return data["data"]["prices"]

        logger.debug(f"Product {product_id}: API success but no price history found.")
        return None

    except requests.RequestException as e:
        logger.warning(f"Product {product_id}: API request failed - {e}")
        return None


def get_product_id_list(db, collection_name: str):
    try:
        total_count = db[collection_name].count_documents({})
        product_ids = db[collection_name].find({}, {"_id": 0, "product_id": 1})
        return product_ids, total_count
    except Exception as ex:
        logger.error(f"Error fetching product ID list: {ex}")
        return None, 0


def main():
    if not all([MONGODB_URI, MONGODB_DATABASE, SOURCE_API_URL]):
        logger.error("Environment variables missing. Check your .env file.")
        return

    db = connect_mongo_db(MONGODB_URI, MONGODB_DATABASE)
    product_ids_list, total_product_ids = get_product_id_list(db, "product_list")

    if not product_ids_list:
        logger.info("No products found in source collection.")
        return

    logger.info(f"Syncing price history for {total_product_ids} products...")

    session = requests.Session()
    counter = 0
    # tqdm handles the progress bar; it works best if the console isn't flooded with logs
    for data in tqdm(
        product_ids_list, total=total_product_ids, desc="Processing Products"
    ):
        product_id = data.get("product_id")
        if not product_id:
            continue
        counter += 1
        price_history = get_prices_history(SOURCE_API_URL, product_id, session)

        if price_history:
            insert_data_in_collection(db, "price_history", product_id, price_history)

        # Adjust sleep as needed. 0.5s is usually safe for APIs.
        time.sleep(0.5)

        if counter % 100 == 0:
            logger.info(f"Checkpoint: {counter} items synchronized.")
            time.sleep(5)  # Give the API/DB a breather

    logger.info(f"Job Complete. Total processed: {counter}")


if __name__ == "__main__":
    main()
