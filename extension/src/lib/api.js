const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1/';

console.log('[BuyHatke API] Initializing with base URL:', API_BASE_URL);

class API {
    constructor() {
        this.baseUrl = API_BASE_URL;
        this.isProd = false;
        
        // Ensure baseUrl ends with /
        if (!this.baseUrl.endsWith('/')) {
            this.baseUrl += '/';
        }
        
        console.log('[BuyHatke API] Base URL configured:', this.baseUrl);
    }

    setProd(value) {
        this.isProd = value;
    }

    async sendListItems(items) {
        try {
            const payload = items.map(item => ({
                product_id: String(item.itemId),
                price: Number(item.price || item.itemDiscountPrice || item.itemPrice),
                product_name: item.name || item.itemName || item.title || 'Unknown Product'
            }));

            // const response = await fetch(`${this.baseUrl}productpricelist`, {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify(payload)
            // });

            // if (!response.ok) {
            //     console.error('Failed to send items:', response.statusText);
            //     return null;
            // }

            // return await response.json();
        } catch (error) {
            console.error('Error sending list items:', error);
            return null;
        }
    }

    async getPriceHistory(productId) {
        try {
            const url = `${this.baseUrl}pricehistory?id=${productId}`;
            console.log('[BuyHatke API] Fetching price history from:', url);
            
            const response = await fetch(url);
            
            console.log('[BuyHatke API] Response status:', response.status, response.statusText);

            if (!response.ok) {
                console.error('[BuyHatke API] Failed to fetch price history:', response.status, response.statusText);
                return null;
            }

            const data = await response.json();
            console.log('[BuyHatke API] Received data:', data);
            
            const priceHistory = data.data?.prices_history || [];
            console.log('[BuyHatke API] Extracted price history:', priceHistory.length, 'items');
            
            return priceHistory;
        } catch (error) {
            console.log('[BuyHatke API] Error fetching price history:', error);
            console.log('[BuyHatke API] Error details:', error.message, error.stack);
            return null;
        }
    }

    async ingestClick(data) {
        try {
            // This can be extended to track user interactions
            console.log('Click tracked:', data);
            // You can add an endpoint for click tracking if needed
        } catch (error) {
            console.error('Error tracking click:', error);
        }
    }
}

export default API;
