"""
Script Used to Get Data from pasalay API and Store it in Our Own MongoDB
"""

import os
import sys
import time
import logging
from typing import List, Dict, Optional
from datetime import datetime, timezone

import requests
from pymongo import MongoClient, ReplaceOne
from dotenv import load_dotenv
from tqdm import tqdm

# Load environment variables
load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE")
SOURCE_API_URL = os.getenv("SOURCE_API_URL")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("price_history_load.log"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger(__name__)


def connect_mongo_db(mongo_uri: str, database: str) -> MongoClient:
    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        client.admin.command("ping")
        logger.info("Database Connected Successfully.")
        return client[database]
    except Exception as ex:
        logger.error(f"Failed to Connect to Database: {ex}")
        sys.exit(1)


def insert_data_in_collection(db, collection_name: str, product_id: str, prices: list):
    if not prices:
        logger.info("Price Not Found.")
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
        logger.info("No Unnique Price Found")
        return

    try:
        operations = []
        for p in unique_prices:
            p_id = p.get("productId")
            p_time = p.get("time")
            dt_object = datetime.fromisoformat(p_time)
            utc_dt = dt_object.astimezone(timezone.utc)
            if not p_id or not p_time:
                continue

            # Using ReplaceOne ensures we don't get duplicate IDs
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
            result = db[collection_name].bulk_write(operations)
            # logger.info(
            #     f"Product {product_id}: Saved {len(unique_prices)} price points "
            #     f"(inserted: {result.upserted_count}, modified: {result.modified_count})"
            # )
    except Exception as e:
        logger.error(f"Product {product_id}: Database error - {e}")


def get_prices_history(api_url: str, product_id: str, session: requests.Session):
    try:
        response = session.get(
            api_url, params={"id": product_id, "hostCountry": "np"}, timeout=20
        )
        response.raise_for_status()
        data = response.json()

        if data.get("success") and data.get("data", {}).get("prices"):
            logger.debug(f"Product {product_id}: Found price data")
            return data["data"]["prices"]

        logger.debug(f"Product {product_id}: No price data available")
        return None

    except requests.RequestException as e:
        logger.warning(f"Product {product_id}: API request failed - {e}")
        return None


def get_product_id_list(db: MongoClient, collection_name: str):
    try:
        total_count = db[collection_name].count_documents({})
        product_ids = db[collection_name].find({}, {"_id": 0, "product_id": 1})
        return product_ids, total_count

    except Exception as ex:
        logger.error(f"Error While Fetching Product ID list - {ex}")


def main():
    if not MONGODB_URI or not MONGODB_DATABASE or not SOURCE_API_URL:
        logger.error(
            "Env variables MONGODB_URI or MONGODB_DATABASE or SOURCE_API_URL are missing!"
        )
        return

    db: MongoClient = connect_mongo_db(MONGODB_URI, MONGODB_DATABASE)
    product_ids_list, total_product_ids = get_product_id_list(db, "product_list")
    if not product_ids_list:
        logger.info(f"No product id found in database")
        return
    logger.info(f"Total {total_product_ids} ids found.")
    session = requests.Session()
    counter = 0
    for data in tqdm(product_ids_list,total=total_product_ids, desc="Syncing Prices"):

        product_id = data.get("product_id")
        if not product_id:
            continue
        price_history = get_prices_history(SOURCE_API_URL, product_id, session)
        if not price_history:
            continue
        insert_data_in_collection(db, "price_history", product_id, price_history)
        counter += 1
        time.sleep(1)
        if counter % 100 == 0:
            time.sleep(9)
            logger.info(f"Processed total {counter} product id")
    logger.info(f"Finished! Processed total {counter} products.")


if __name__ == "__main__":
    main()
