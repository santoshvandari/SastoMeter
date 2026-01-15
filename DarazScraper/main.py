import json
import os
import time
import signal
import sys
import logging
import undetected_chromedriver as uc

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scraper.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

CATEGORIES_FILE = "categories.json"
OUTPUT_FILE = "product_ids.json"
BATCH_SIZE = 10

def find_items(data, parent="ROOT"):
    """Exact Python translation of TypeScript findItems"""
    items = []
    
    if not data or not isinstance(data, (dict, list)):
        return items
    
    if isinstance(data, dict):
        for key in data.keys():
            if not data[key]:
                continue
            
            value = data[key]
            
            if isinstance(value, list) and len(value) > 0:
                def condition(item):
                    return (isinstance(item, dict) and 
                           'itemId' in item and 
                           ('price' in item or 'itemDiscountPrice' in item))
                
                if any(condition(item) for item in value):
                    valid_items = [item for item in value if condition(item)]
                    invalid_items = [item for item in value if not condition(item)]
                    
                    if len(valid_items) > len(invalid_items):
                        items.extend(valid_items)
                else:
                    items.extend(find_items(value, f"{parent} -> {key}"))
            
            elif isinstance(value, dict):
                items.extend(find_items(value, f"{parent} -> {key}"))
    
    elif isinstance(data, list):
        for i, item in enumerate(data):
            items.extend(find_items(item, f"{parent}[{i}]"))
    
    return items

driver = None
collected_items = []

def cleanup_driver(signum=None, frame=None):
    global driver, collected_items
    
    if collected_items:
        save_items(collected_items)
    
    if driver:
        try:
            driver.quit()
            logger.info("\nBrowser closed.")
        except:
            pass
    
    if signum is not None:
        sys.exit(0)

def save_items(new_items):
    if not new_items:
        return
    
    all_items = []
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "r") as f:
                content = f.read().strip()
                if content:
                    all_items = json.loads(content)
        except:
            pass
    
    all_items.extend(new_items)
    
    with open(OUTPUT_FILE, "w") as f:
        json.dump(all_items, f, indent=2)
    
    logger.info(f"  ✓ Saved! Total in file: {len(all_items)}")

# def save_items(new_items):
#     if not new_items:
#         return
    
#     # "a" mode opens the file for appending
#     with open(OUTPUT_FILE, "a") as f:
#         for item in new_items:
#             f.write(json.dumps(item) + "\n")
    
#     logger.info(f" ✓ Appended {len(new_items)} items.")

def scrape():
    global driver, collected_items
    
    options = uc.ChromeOptions()
    options.add_argument("--start-maximized")
    driver = uc.Chrome(options=options)
    
    signal.signal(signal.SIGINT, cleanup_driver)
    signal.signal(signal.SIGTERM, cleanup_driver)
    
    # Inject XHR interceptor
    driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
        'source': '''
            window.__AJAX_RESPONSES__ = [];
            
            let oldXHROpen = window.XMLHttpRequest.prototype.open;
            window.XMLHttpRequest.prototype.open = function() {
                this.addEventListener("load", function() {
                    const responseBody = this.responseText;
                    
                    try {
                        const url = this.responseURL;
                        
                        // Only capture if URL contains ajax=true
                        if (url.includes("ajax=true")) {
                            console.log("Captured AJAX:", url);
                            const data = JSON.parse(responseBody);
                            window.__AJAX_RESPONSES__.push(data);
                        }
                    } catch(err) {
                        // Ignore parse errors
                    }
                });
                return oldXHROpen.apply(this, arguments);
            };
        '''
    })
    
    seen_ids = set()
    
    # Load existing products
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "r") as f:
                existing = json.load(f)
                for p in existing:
                    seen_ids.add(str(p["id"]))
            logger.info(f"Loaded {len(seen_ids)} existing IDs\n")
        except:
            pass
    
    # STEP 1: Discover and save categories
    logger.info("=" * 60)
    logger.info("STEP 1: Discovering categories from Daraz homepage...")
    logger.info("=" * 60)
    
    try:
        driver.get("https://www.daraz.com.np/")
        time.sleep(5)
        
        # Extract all category links from the homepage
        discovered_categories = driver.execute_script("""
            let categories = new Set();
            
            // Find all links with category/catalog URLs
            document.querySelectorAll('a').forEach(a => {
                let href = a.href;
                if (href && href.includes('daraz.com.np')) {
                    // Match catalog URLs with queries
                    if (href.includes('/catalog/') && href.includes('?')) {
                        href = href.split('#')[0].split('&page=')[0];
                        if (!href.endsWith('?q=') && !href.endsWith('catalog/')) {
                            categories.add(href);
                        }
                    }
                }
            });
            
            return Array.from(categories);
        """)
        
        logger.info(f"Found {len(discovered_categories)} categories from homepage")
        
        # If we found categories, use them; otherwise use existing file
        if discovered_categories and len(discovered_categories) > 10:
            categories = discovered_categories
            logger.info(f"Using {len(categories)} discovered categories")
        else:
            # Try to load from existing file
            if os.path.exists(CATEGORIES_FILE):
                with open(CATEGORIES_FILE, "r") as f:
                    categories = json.load(f)
                logger.info(f"Loaded {len(categories)} categories from {CATEGORIES_FILE}")
            else:
                logger.error("No categories found and no categories.json file exists!")
                return
        
        # Save discovered/loaded categories
        # with open(CATEGORIES_FILE, "w") as f:
        #     json.dump(categories, f, indent=2)
        # logger.info(f"✓ Saved {len(categories)} categories to {CATEGORIES_FILE}\n")
        
    except Exception as e:
        logger.error(f"Error discovering categories: {e}")
        # Fallback to existing file
        if os.path.exists(CATEGORIES_FILE):
            with open(CATEGORIES_FILE, "r") as f:
                categories = json.load(f)
            logger.info(f"Using {len(categories)} categories from existing file")
        else:
            logger.error("Cannot proceed without categories!")
            return
    
    # STEP 2: Scrape products from all categories
    logger.info("=" * 60)
    logger.info(f"STEP 2: Scraping products from {len(categories)} categories...")
    logger.info("=" * 60)
    
    total_pages_visited = 0  # Track total pages for sleep intervals
    
    try:
        for i, category_url in enumerate(categories):
            category_name = category_url.split('?q=')[-1].split('&')[0] if '?q=' in category_url else category_url.split('/')[-1]
            logger.info(f"\n[{i+1}/{len(categories)}] {category_name}")
            
            page_num = 1
            while True:  # Continue until no more items
                url = f"{category_url}&page={page_num}"
                
                try:
                    # Clear previous AJAX responses
                    driver.execute_script("window.__AJAX_RESPONSES__ = [];")
                    
                    driver.get(url)
                    total_pages_visited += 1
                    time.sleep(8)  # Wait for AJAX requests to complete
                    
                    # Sleep after every 10 pages to avoid bot detection
                    if total_pages_visited % 10 == 0:
                        logger.info(f"  ⏸️  Pausing for 10 seconds (visited {total_pages_visited} pages)...")
                        time.sleep(10)
                    
                    # Get all captured AJAX responses
                    ajax_responses = driver.execute_script("return window.__AJAX_RESPONSES__ || [];")
                    
                    if not ajax_responses:
                        if page_num == 1:
                            logger.info(f"  Page {page_num}: No AJAX responses (empty category or blocked)")
                        break
                    
                    # Process all AJAX responses
                    items = []
                    for response_data in ajax_responses:
                        found = find_items(response_data)
                        if found:
                            items.extend(found)
                    
                    if not items:
                        if page_num == 1:
                            logger.info(f"  Page {page_num}: No items found")
                        break
                    
                    # Save items
                    new_count = 0
                    for item in items:
                        item_id = str(item.get('itemId', ''))
                        price = item.get('price') or item.get('itemDiscountPrice')
                        
                        if item_id and price and item_id not in seen_ids:
                            collected_items.append({"id": item_id, "price": str(price)})
                            seen_ids.add(item_id)
                            new_count += 1
                            
                            if len(collected_items) >= BATCH_SIZE:
                                save_items(collected_items)
                                collected_items = []
                    
                    logger.info(f"  Page {page_num}: {len(items)} items ({new_count} new) → Total: {len(seen_ids)}")
                    
                    if page_num == 102:
                        break
                    # Move to next page
                    page_num += 1
                    
                except Exception as e:
                    logger.info(f"  Error on page {page_num}: {e}")
                    break

    finally:
        cleanup_driver()
        logger.info(f"\n{'=' * 60}")
        logger.info(f"✓ COMPLETE! Total products scraped: {len(seen_ids)}")
        logger.info(f"{'=' * 60}")

def generate_fallback_categories():
    """Generate a comprehensive list of fallback categories"""
    base_categories = [
        "electronics", "smartphones", "laptops", "tablets", "cameras",
        "fashion", "mens-fashion", "womens-fashion", "kids-fashion",
        "shoes", "bags", "watches", "jewelry", "sunglasses",
        "home", "furniture", "kitchen", "bedding", "decor",
        "beauty", "makeup", "skincare", "haircare", "fragrances",
        "sports", "fitness", "outdoor", "cycling",
        "toys", "games", "books", "music",
        "groceries", "food", "beverages",
        "automotive", "car-accessories", "motorcycle",
        "health", "supplements", "medical",
        "appliances", "tv", "audio", "refrigerator", "washing-machine"
    ]
    
    return [f"https://www.daraz.com.np/catalog/?q={cat}" for cat in base_categories]

if __name__ == "__main__":
    scrape()