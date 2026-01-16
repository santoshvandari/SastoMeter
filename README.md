# BuyHatke - Daraz Price Tracker

A comprehensive price tracking solution for Daraz e-commerce platform, featuring a browser extension with crowdsourced price data and a Next.js backend API.

## 🎯 Project Overview

BuyHatke helps shoppers save money by tracking price history on Daraz across multiple countries (Nepal, Pakistan, Bangladesh, Sri Lanka, Myanmar). The system uses crowdsourcing to collect price data from users browsing Daraz, creating a comprehensive price history database.

## 📁 Project Structure

```
buyhatke/
├── extension/              # Browser extension (Chrome/Edge)
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── content/       # Content scripts
│   │   ├── lib/          # Utilities and API client
│   │   └── popup/        # Extension popup
│   └── manifest.config.js
│
├── backend/               # Next.js API backend
│   ├── src/
│   │   ├── app/api/v1/   # API routes
│   │   ├── models/       # MongoDB schemas
│   │   └── lib/          # Database connection
│   └── package.json
│
├── DarazScraper/         # Python scraper for initial data
├── LoadPriceHistoryDataInMongoDB/  # Data import utilities
└── interceptor.ts        # Standalone interceptor script
```

## 🚀 Quick Start

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
MONGODB_URI=mongodb://localhost:27017/buyhatke
EOF

# Start backend
npm run dev
```

Backend runs on `http://localhost:3000`

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

### 3. Load Extension

1. Open Chrome/Edge → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `extension/dist` folder

## 🔍 Code Analysis

### Backend Architecture

**Database Models:**

1. **priceHistory** (`price_history_temp` collection)
   - Stores historical price points
   - Fields: `product_id`, `price`, `updated_at`
   - Indexed on `product_id` and `updated_at` for fast queries

2. **productList** (`product_list_temp` collection)
   - Stores current product information
   - Fields: `product_id`, `product_name`, `price`, `updated_at`
   - Maintains latest price for each product

**API Endpoints:**

1. **GET `/api/v1/pricehistory?id={productId}`**
   - Fetches price history for last 1 year
   - Returns sorted by date (oldest to newest)
   - Used by extension to display charts

2. **POST `/api/v1/productpricelist`**
   - Accepts batch product data (max 100 items)
   - Uses MongoDB transactions for consistency
   - Only creates history entries when prices change
   - Implements deduplication and validation

**Key Features:**
- Transaction-based updates for data consistency
- Efficient batch processing (max 100 items)
- Price change detection (only logs when price changes)
- Automatic product name updates
- Compound indexes for optimized queries

### Interceptor Analysis

The `interceptor.ts` file is a standalone script that demonstrates the crowdsourcing approach:

**Functionality:**

1. **Click Tracking**
   - Monitors "Add to Cart" and "Buy Now" buttons
   - Extracts product ID, quantity, and country
   - Sends interaction data to backend

2. **XHR Interception**
   - Intercepts all XMLHttpRequest responses
   - Searches for product data in JSON responses
   - Looks for objects with `itemId` and `price` fields
   - Recursively traverses nested objects/arrays

3. **Initial Page Data Extraction**
   - Captures `window.__FIRST_SCREEN_DATA` from Daraz
   - Waits 2 seconds for data to populate
   - Extracts product information on page load

4. **Data Processing**
   - `findItems()`: Recursively searches for product data
   - `processItems()`: Deduplicates by `itemId`
   - Merges partial data from multiple sources
   - Sends to backend via `api.sendListItems()`

**Data Flow:**
```
Daraz Page Load
    ↓
window.__FIRST_SCREEN_DATA → findItems() → processItems() → API
    ↓
XHR Responses → findItems() → processItems() → API
    ↓
User Clicks → Track Interaction → API
```

### Extension Architecture

**Components:**

1. **PriceHistoryWidget**
   - Main component rendered on Daraz product pages
   - Fetches price history from backend
   - Displays loading/error states
   - Coordinates PriceChart and PriceStats

2. **PriceChart**
   - Canvas-based chart rendering
   - Draws line graph with gradient fill
   - Shows grid lines and axis labels
   - Interactive data points

3. **PriceStats**
   - Displays current, lowest, highest, average prices
   - Calculates savings from highest price
   - Shows percentage savings

**Content Script Flow:**

1. `main.jsx` injects widget into Daraz pages
2. Finds appropriate insertion point (after product title)
3. Creates React root and renders `App`
4. `App` checks if on Daraz product page
5. Loads `crowdsourcing.js` for data collection
6. Renders `PriceHistoryWidget` if on product page

**Crowdsourcing Implementation:**

The extension implements the same interceptor logic as `interceptor.ts`:
- XHR interception for AJAX requests
- Initial page data extraction
- Click tracking for user interactions
- Batch data submission to backend

## 🔧 Technical Details

### Crowdsourcing Strategy

**Why Crowdsourcing?**
- Daraz doesn't provide official price history API
- Web scraping is unreliable and may violate ToS
- Crowdsourcing is legal (users share public data they see)
- More users = more comprehensive data

**How It Works:**

1. **Passive Collection**
   - Extension runs on all Daraz pages
   - Intercepts product data from AJAX responses
   - No additional requests to Daraz servers
   - Minimal performance impact

2. **Data Extraction**
   - Daraz loads product data via AJAX
   - Data contains arrays of products with IDs and prices
   - Extension extracts this public information
   - Sends to backend for storage

3. **Privacy Considerations**
   - Only collects public product data
   - No personal information collected
   - No tracking outside Daraz
   - Transparent to users

### Database Schema

**Price History:**
```javascript
{
  product_id: String,      // Daraz product ID
  price: Number,           // Price at this point
  updated_at: Date         // When price was observed
}
```

**Product List:**
```javascript
{
  product_id: String,      // Daraz product ID
  product_name: String,    // Product name
  price: Number,           // Current price
  updated_at: Date         // Last update time
}
```

### Price Change Detection

The backend only creates history entries when prices change:

```javascript
// Check if price has changed
if (oldPrice !== undefined && oldPrice === price) return;

// Only insert if price is different
historyToInsert.push({
  product_id: pid,
  price,
  updated_at: now
});
```

This reduces database size and improves query performance.

## 📊 Data Flow Diagram

```
┌─────────────────┐
│  Daraz Website  │
└────────┬────────┘
         │
         ├─→ Page Load → window.__FIRST_SCREEN_DATA
         │                      ↓
         │              Extension Interceptor
         │                      ↓
         └─→ AJAX Requests → XHR Interception
                                ↓
                        Extract Product Data
                                ↓
                        POST /api/v1/productpricelist
                                ↓
                        ┌───────────────┐
                        │  Backend API  │
                        └───────┬───────┘
                                ↓
                        Price Change Detection
                                ↓
                        ┌───────────────┐
                        │   MongoDB     │
                        │ - priceHistory│
                        │ - productList │
                        └───────┬───────┘
                                ↓
                        GET /api/v1/pricehistory
                                ↓
                        Extension Widget
                                ↓
                        ┌───────────────┐
                        │  Price Chart  │
                        │  Price Stats  │
                        └───────────────┘
```

## 🎨 Features

### Extension Features
- ✅ Real-time price history charts
- ✅ Price statistics (current, lowest, highest, average)
- ✅ Savings calculator
- ✅ Automatic data collection
- ✅ Works on all Daraz domains
- ✅ Clean, modern UI
- ✅ Minimal performance impact

### Backend Features
- ✅ RESTful API
- ✅ MongoDB with transactions
- ✅ Batch processing (up to 100 items)
- ✅ Price change detection
- ✅ Data validation
- ✅ Efficient indexing
- ✅ Error handling

## 🌍 Supported Regions

- 🇳🇵 **Nepal**: daraz.com.np
- 🇵🇰 **Pakistan**: daraz.pk
- 🇧🇩 **Bangladesh**: daraz.com.bd
- 🇱🇰 **Sri Lanka**: daraz.lk
- 🇲🇲 **Myanmar**: daraz.com.mm

## 🔐 Security & Privacy

**What We Collect:**
- Product IDs (public)
- Product names (public)
- Product prices (public)
- Anonymous interaction data

**What We DON'T Collect:**
- Personal information
- Login credentials
- Payment information
- Browsing history outside Daraz

## 📈 Scalability Considerations

### Current Implementation
- Batch size limited to 100 items per request
- Product names limited to 100 words
- 1 year of price history per product
- Compound indexes for fast queries

### Future Optimizations
- Implement caching layer (Redis)
- Add rate limiting
- Implement data archiving for old prices
- Add database sharding for high volume
- Implement CDN for static assets

## 🐛 Troubleshooting

### Extension Issues

**Widget not appearing:**
- Check if on Daraz product page
- Verify extension is enabled
- Check browser console for errors

**No price history:**
- Normal for new products
- Needs crowdsourced data from users
- Check backend is running

### Backend Issues

**MongoDB connection errors:**
- Verify MongoDB is running
- Check `MONGODB_URI` in `.env`
- Ensure network connectivity

**API errors:**
- Check backend logs
- Verify request format
- Check database permissions

## 🚀 Deployment

### Backend Deployment (Vercel/Railway)

```bash
# Set environment variables
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/buyhatke

# Deploy
npm run build
```

### Extension Deployment (Chrome Web Store)

1. Build production version: `npm run build`
2. Create ZIP of `dist` folder
3. Upload to Chrome Web Store
4. Submit for review

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ for smart shoppers**
