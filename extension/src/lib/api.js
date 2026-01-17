// Hardcode URL to ensure availability in MAIN world (injected script)
const API_BASE_URL = 'http://localhost:3000/api/v1/';

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
            const payload = items.map(item => {
                let rawPrice = item.price || item.itemDiscountPrice || item.itemPrice;
                let finalPrice = 0;

                if (typeof rawPrice === 'number') {
                    finalPrice = Math.floor(rawPrice);
                } else if (typeof rawPrice === 'string') {
                    // Remove non-digit characters (except dot for decimal check, though we want int)
                    // Common formats: "Rs. 1,200", "1,200.00"
                    const digits = rawPrice.replace(/[^\d.]/g, '');
                    finalPrice = parseInt(digits, 10); // Parse as integer
                }
                
                // Clean Product ID (ensure digits only)
                // Use undefined check for itemId
                const rawId = item.itemId || "";
                let cleanProductId = String(rawId).replace(/[^\d]/g, '');

                return {
                    product_id: cleanProductId,
                    price: finalPrice,
                    product_name: item.name || item.itemName || item.title || 'Unknown Product'
                };
            }).filter(p => !isNaN(p.price) && p.price > 0 && p.product_id && /^\d+$/.test(p.product_id)); // Strict filter

            if (payload.length === 0) {
                 console.log('[BuyHatke API] No valid items to send after filtering');
                 return null;
            }

            console.log('[BuyHatke API] Sending payload:', payload.length, 'items');

            const response = await fetch(`${this.baseUrl}productpricelist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                console.error('Failed to send items:', response.statusText);
                return null;
            }

            const result = await response.json();
            console.log('[BuyHatke API] Sent successfully. Response:', result);
            return result;
        } catch (error) {
            console.error('Error sending list items:', error);
            return null;
        }
    }

    async getPriceHistory(productId) {
        try {
            const url = `${this.baseUrl}pricehistory?id=${productId}`;
            console.log('[BuyHatke API] Fetching price history from:', url);
            
            // Add credentials include for consistency, though GET usually doesn't need it if public
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
}

export default API;
