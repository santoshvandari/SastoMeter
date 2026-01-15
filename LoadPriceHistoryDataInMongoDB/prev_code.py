'''
Script Used to Get Data from pasalay API and Store it in Our Own MongoDB
'''
import os
import sys
import time
import logging
from typing import List, Dict, Optional

import requests
from pymongo import MongoClient, ReplaceOne
from dotenv import load_dotenv
from rich.progress import (
    Progress,
    SpinnerColumn,
    TextColumn,
    BarColumn,
    TimeElapsedColumn,
)

# Load environment variables
load_dotenv()


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("migration.log"), logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)


class PriceMigrator:
    """Fetches and stores product price history from API to MongoDB"""

    def __init__(self,url):
        self.api_url = url
        self.session = requests.Session()
        self.db = self._connect_mongodb()
        self.call_count = 0

    def _connect_mongodb(self):
        """Connect to MongoDB and return collection"""
        uri = os.getenv("MONGODB_URI")
        db_name = os.getenv("MONGODB_DATABASE")

        if not uri or not db_name:
            logger.error("Missing MONGODB_URI or MONGODB_DATABASE in .env file")
            sys.exit(1)

        try:
            client = MongoClient(uri)
            client.admin.command("ping")
            logger.info(f"Connected to MongoDB database: {db_name}")
            return client[db_name]["price_history"]
        except Exception as e:
            logger.error(f"MongoDB connection failed: {e}")
            sys.exit(1)

    def fetch_prices(self, product_id: int) -> Optional[List[Dict]]:
        """Fetch price history for a product"""
        self.call_count += 1

        # Rate limiting: pause every 5 calls
        if self.call_count % 1000 == 0:
            time.sleep(10)

        try:
            response = self.session.get(
                self.api_url, params={"id": product_id, "hostCountry": "np"}, timeout=20
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

    def save_prices(self, product_id: int, prices: List[Dict]):
        """Process and save unique price points to database"""
        if not prices:
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
            return

        # Bulk upsert to database
        try:
            operations = [
                ReplaceOne(
                    filter={"productId": p["productId"], "time": p["time"]},
                    replacement=p,
                    upsert=True,
                )
                for p in unique_prices
            ]

            result = self.db.bulk_write(operations)
            logger.info(
                f"Product {product_id}: Saved {len(unique_prices)} price points "
                f"(inserted: {result.upserted_count}, modified: {result.modified_count})"
            )

        except Exception as e:
            logger.error(f"Product {product_id}: Database error - {e}")

    def migrate(self, start_id: int, end_id: int):
        """Scan product IDs and migrate price history"""
        total = end_id - start_id
        logger.info(
            f"Starting migration: scanning {total:,} product IDs ({start_id} to {end_id})"
        )

        successful = 0
        failed = 0

        try:
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                BarColumn(),
                TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
                TimeElapsedColumn(),
            ) as progress:
                task = progress.add_task("Migrating...", total=total)

                for product_id in range(start_id, end_id):
                    progress.update(task, description=f"Product ID: {product_id}")

                    prices = self.fetch_prices(product_id)

                    if prices:
                        self.save_prices(product_id, prices)
                        successful += 1
                    else:
                        failed += 1

                    progress.advance(task)

        except KeyboardInterrupt:
            logger.info("Migration stopped by user")

        finally:
            logger.info(
                f"Migration completed - Successful: {successful:,}, "
                f"No data: {failed:,}, Total processed: {successful + failed:,}"
            )


def main():
    migrator = PriceMigrator()
    # 500007153
    migrator.migrate(start_id=500001960, end_id=500500000)


if __name__ == "__main__":
    main()
