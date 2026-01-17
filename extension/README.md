# SastoMeter - Daraz Price Tracker Extension

A browser extension that tracks price history on Daraz (Nepal, Pakistan, Bangladesh, Sri Lanka, Myanmar) and helps you save money through crowdsourced price data.

## Features

### 📊 Price History Chart
- **Visual Price Tracking**: Beautiful canvas-based chart showing price trends over time
- **Historical Data**: View up to 1 year of price history
- **Interactive Display**: Gradient fills, grid lines, and data points for easy reading

### 💰 Price Statistics
- **Current Price**: See the latest price
- **Lowest Price**: Know when the product was cheapest
- **Highest Price**: Understand the price range
- **Average Price**: Get the mean price over time
- **Savings Calculator**: See how much you save from the highest price

### 🤝 Crowdsourcing
- **Automatic Data Collection**: Extension automatically captures product prices while you browse
- **XHR Interception**: Intercepts AJAX requests to extract product data
- **Initial Page Data**: Captures data from Daraz's `__FIRST_SCREEN_DATA`
- **Batch Processing**: Efficiently sends data to backend in batches
- **Privacy-Focused**: Only collects product IDs, names, and prices

### 🎯 User Interaction Tracking
- **Add to Cart**: Tracks when users add items to cart
- **Buy Now**: Tracks purchase intent
- **Quantity Tracking**: Records item quantities

## Architecture

### Frontend (Extension)
```
extension/
├── src/
│   ├── components/
│   │   ├── PriceChart.jsx          # Canvas-based price chart
│   │   ├── PriceStats.jsx          # Price statistics display
│   │   └── PriceHistoryWidget.jsx  # Main widget component
│   ├── content/
│   │   ├── main.jsx                # Content script entry
│   │   ├── crowdsourcing.js        # Data collection interceptor
│   │   └── views/
│   │       └── App.jsx             # Content script app
│   ├── lib/
│   │   ├── api.js                  # API client
│   │   └── utils.js                # Utility functions
│   └── popup/
│       └── App.jsx                 # Extension popup
└── manifest.config.js              # Extension manifest
```

### Backend (Next.js API)
```
backend/
├── src/
│   ├── app/
│   │   └── api/
│   │       └── v1/
│   │           ├── pricehistory/    # GET price history
│   │           └── productpricelist/ # POST crowdsourced data
│   ├── models/
│   │   ├── priceHistory.js         # Price history schema
│   │   └── productList.js          # Product list schema
│   └── lib/
│       └── dbconnect.js            # MongoDB connection
```

## Installation

### Prerequisites
- Node.js 18+ and npm
- MongoDB database
- Chrome/Edge browser (Manifest V3 compatible)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/sastometer
# Or use MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sastometer
```

4. Start the backend:
```bash
npm run dev
```

The backend will run on `http://localhost:3000`

### Extension Setup

1. Navigate to extension directory:
```bash
cd extension
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_API_URL=http://localhost:3000
```

4. Build the extension:
```bash
npm run build
```

Or run in development mode:
```bash
npm run dev
```

### Load Extension in Browser

1. Open Chrome/Edge and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/dist` folder

## Usage

1. **Visit a Daraz Product Page**
   - Go to any product page on Daraz (e.g., `https://www.daraz.com.np/products/...`)
   
2. **View Price History**
   - The extension will automatically inject a price history widget
   - Widget shows price chart and statistics
   - If no data is available, it will show a message

3. **Crowdsourcing**
   - Extension automatically collects price data while you browse
   - Data is sent to backend and stored in MongoDB
   - The more users, the better the data!

## API Endpoints

### GET `/api/v1/pricehistory?id={productId}`
Fetch price history for a product.

**Response:**
```json
{
  "data": {
    "prices_history": [
      {
        "product_id": "123456",
        "price": 1500,
        "updated_at": "2026-01-15T10:30:00Z"
      }
    ]
  }
}
```

### POST `/api/v1/productpricelist`
Submit crowdsourced product data.

**Request:**
```json
[
  {
    "product_id": "123456",
    "product_name": "Sample Product",
    "price": 1500
  }
]
```

**Response:**
```json
{
  "message": "Success",
  "processed": 1,
  "updates": 1
}
```

## How Crowdsourcing Works

1. **XHR Interception**
   - Extension intercepts all XMLHttpRequest responses
   - Searches for product data with `itemId` and `price` fields
   - Extracts and processes valid items

2. **Initial Page Data**
   - Captures `window.__FIRST_SCREEN_DATA` from Daraz
   - Extracts product information on page load
   - Sends to backend for storage

3. **Data Processing**
   - Deduplicates items by `itemId`
   - Merges partial data from multiple sources
   - Only creates history entries when prices change

4. **Backend Storage**
   - Uses MongoDB transactions for consistency
   - Stores in `price_history_temp` collection
   - Maintains current prices in `product_list_temp`

## Supported Daraz Domains

- 🇳🇵 Nepal: `daraz.com.np`
- 🇵🇰 Pakistan: `daraz.pk`
- 🇧🇩 Bangladesh: `daraz.com.bd`
- 🇱🇰 Sri Lanka: `daraz.lk`
- 🇲🇲 Myanmar: `daraz.com.mm`

## Development

### Extension Development
```bash
cd extension
npm run dev
```

This runs Vite in watch mode. Changes will automatically rebuild.

### Backend Development
```bash
cd backend
npm run dev
```

Next.js will run with hot reload enabled.

## Technologies Used

### Extension
- **React 19**: UI framework
- **Vite**: Build tool
- **CRXJS**: Chrome extension plugin for Vite
- **Canvas API**: For rendering price charts

### Backend
- **Next.js 14**: API framework
- **MongoDB**: Database
- **Mongoose**: ODM for MongoDB

## Privacy & Data Collection

This extension collects:
- ✅ Product IDs (public data)
- ✅ Product names (public data)
- ✅ Product prices (public data)
- ✅ Anonymous interaction data (add to cart, buy now)

This extension does NOT collect:
- ❌ Personal information
- ❌ Browsing history outside Daraz
- ❌ Payment information
- ❌ Login credentials

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Troubleshooting

### Extension not showing on Daraz
- Make sure you're on a product page (URL contains `/products/`)
- Check browser console for errors
- Verify extension is enabled in `chrome://extensions/`

### No price history available
- This is normal for new products
- Extension needs time to collect data
- More users = more data = better history

### Backend connection issues
- Verify backend is running on `http://localhost:3000`
- Check `.env` file has correct `VITE_API_URL`
- Check CORS settings if using different domains

### MongoDB connection errors
- Verify MongoDB is running
- Check `MONGODB_URI` in backend `.env`
- Ensure database user has proper permissions

## Future Enhancements

- [ ] Price drop alerts
- [ ] Email notifications
- [ ] Price prediction using ML
- [ ] Comparison with other products
- [ ] Export price history as CSV
- [ ] Dark mode support
- [ ] Multi-language support
- [ ] Browser notifications

## Support

For issues and questions, please open an issue on GitHub.

---

**Made with ❤️ for smart shoppers**
