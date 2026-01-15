from pymongo import MongoClient, ReplaceOne
import logging
import sys
import os
from datetime import datetime, timezone
import json
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("load_data_to_db.log"), logging.StreamHandler()],
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


def insert_data_in_collection(db, collection_name: str, data: list) -> bool:
    now = datetime.now(timezone.utc)
    try:
        operations = []
        for p in data:
            p_id = p.get("id")
            if not p_id:
                continue

            # Using ReplaceOne ensures we don't get duplicate IDs
            operations.append(
                ReplaceOne(
                    filter={"productId": p_id},
                    replacement={
                        "price": p.get("price"),
                        "productId": p_id,
                        "productName": p.get("name", "Unknown"),  # Future-proofing
                        "updatedAt": now,
                    },
                    upsert=True,
                )
            )

        if operations:
            result = db[collection_name].bulk_write(operations)
            logger.info(
                f"Upserted: {result.upserted_count}, Modified: {result.modified_count}"
            )
            return True
        return False
    except Exception as e:
        logger.error(f"Error Writing in DB - {e}")
        return False


def get_all_data_from_file(file_path: str) -> list:
    if not os.path.isfile(file_path):
        logger.error(f"{file_path} is not a valid file.")
        return []
    try:
        with open(file_path, "r") as f:
            return json.load(f)
    except Exception as ex:
        logger.error(f"Failed to load data from {file_path} - {ex}")
        return []


def main():
    if not MONGODB_URI or not MONGODB_DATABASE:
        logger.error("Env variables MONGODB_URI or MONGODB_DATABASE are missing!")
        return

    db: MongoClient = connect_mongo_db(MONGODB_URI, MONGODB_DATABASE)
    files_to_load_path: list = ["./product_ids_part_1.json","./product_ids_part_2.json"]
    for file_path in files_to_load_path:
        logger.info(f"Checking {file_path}")
        if not os.path.exists(file_path):
            logger.info(f"{file_path} doesn't exists.")
            continue
        data: list = get_all_data_from_file(file_path=file_path)
        if not data:
            logger.info(f"{file_path} doesn't contains data.")
            continue
        logger.info(f"{file_path} contains {len(data)} data")
        response = insert_data_in_collection(db, "product_list", data[:2])
        if not response:
            logger.error(f"{file_path} data failed to load in database")
        logger.info(f"{file_path} data to load in database successfully.")
        break


if __name__ == "__main__":
    main()
