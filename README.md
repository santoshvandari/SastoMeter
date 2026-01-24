# SastoMeter - Daraz Price Tracker & Recommendations

A comprehensive shopping assistant for the Daraz e-commerce platform (Nepal, Pakistan, Bangladesh, Sri Lanka, Myanmar). SastoMeter helps users save money by tracking price history, providing price drop statistics, and intelligently recommending cheaper alternatives for the same product.

## Key Features

### Smart Shopping Assistant (Browser Extension)
- **Real-time Price History**: View 1-year price history charts directly on product pages.
- **Cheaper Alternatives**: Automatically finds and suggests the same product from other sellers at a lower price using "Smart Recommendations".
- **Price Statistics**: Displays current, lowest, highest, and average prices with savings calculation.
- **Side Panel Support**: Quick access to tracking features via the browser side panel.
- **Crowdsourced Data**: Automatically contributes to the price database while browsing, helping the community.
- **Non-Intrusive**: Lightweight and clean UI that blends seamlessly into Daraz.

### Powerful Backend (Next.js API)
- **High-Performance API**: Built with Next.js 16 and Mongoose 9.
- **Advanced Search**: Uses MongoDB Atlas Search for fuzzy matching to find product duplicates and recommendations.
- **Efficient Storage**: Transaction-based updates that only store price *changes* to save space.
- **Batch Processing**: Handles bulk data submission from the extension efficiently.

### Data Engineering (Python Utilities)
- **DarazScraper**: Automated Python scrapers to seed the database with initial product and category data.
- **Bulk Loaders**: Scripts to import large historical datasets into MongoDB.

## Project Structure

```
SastoMeter/
├── extension/                      # Browser Extension (React 19 + Vite 7)
│   ├── src/
│   │   ├── components/            # UI Components (Charts, Recommendations)
│   │   ├── content/               # Content Scripts (Page Injection, scraping)
│   │   ├── popup/                 # Extension Popup
│   │   └── sidepanel/             # Side Panel View
│   └── manifest.config.js         # Manifest V3 Configuration
│
├── backend/                        # API Backend (Next.js 16)
│   ├── src/
│   │   ├── app/api/v1/            # API Routes (Price History, Recommendations)
│   │   ├── models/                # Mongoose Models (PriceHistory, ProductList)
│   │   └── lib/                   # DB Connection, Utils
│
├── DarazScraper/                   # Python Scraper for Category/Product Data
└── LoadPriceHistoryDataInMongoDB/  # Utilities for Bulk Data Loading
```

## Quick Start

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
MONGODB_URI=mongodb+srv://your_connection_string
EOF

# Start development server
npm run dev
```
Backend runs on `http://localhost:3000`.

### 2. Extension Setup

```bash
# Navigate to extension
cd extension

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
VITE_API_URL=http://localhost:3000
EOF

# Build extension
npm run build
```

### 3. Load Extension in Browser

1. Open Chrome/Edge and go to `chrome://extensions/`.
2. Enable **"Developer mode"** (top right).
3. Click **"Load unpacked"**.
4. Select the `extension/dist` folder.

### 4. (Optional) Run Scrapers
If you want to seed the database with data manually:

```bash
cd DarazScraper
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

## Architecture & API

### API Endpoints (`/api/v1`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/pricehistory?id={id}` | GET | Returns historical price points for a product. |
| `/recommendation?id={id}` | GET | Returns cheaper alternatives for a specific product using fuzzy search. |
| `/productpricelist` | POST | Accepts batch price updates from the extension. |

### Smart Recommendations Engine
The recommendation engine uses **MongoDB Atlas Search** to find similar products:
1. **Fuzzy Matching**: Searches for products with similar names (allowing for typos/variations).
2. **Price Filter**: Only returns items cheaper than the current product (`price < current_price`).
3. **Ranking**: Sorts candidates by price (asc) and search relevance score (desc).

### Crowdsourcing Strategy
1. **Interceptor**: The extension monitors network requests (`XHR`) on Daraz product pages.
2. **Extraction**: It passively extracts product metadata (ID, Name, Price) from JSON responses without making extra requests.
3. **Submission**: Data is batched and sent to the SastoMeter backend.
4. **Privacy**: No personal user data or browsing history outside of Daraz is collected.

## Deployment

### Backend
Deploy to **Vercel** or any Node.js hosting.
```bash
npm run build
npm start
```

### Extension
1. Run `npm run build`.
2. Zip the `dist` folder.
3. Upload to Chrome/Edge Web Store.
