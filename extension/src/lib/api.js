// Hardcode URL to ensure availability in MAIN world (injected script)
const API_BASE_URL = 'http://localhost:3000/api/v1/';

class API {
    constructor() {
        this.baseUrl = API_BASE_URL;
        this.isProd = false;
        
        // Ensure baseUrl ends with /
        if (!this.baseUrl.endsWith('/')) {
            this.baseUrl += '/';
        }
    }

    setProd(value) {
        this.isProd = value;
    }

    async sendListItems(items) {
        try {
            const payload = items.map(item => {
                // Expanded price field support
                let rawPrice = item.price || item.itemDiscountPrice || item.itemPrice || item.originalPrice || item.priceShow;
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
                const rawId = item.itemId || "";
                let cleanProductId = String(rawId).replace(/[^\d]/g, '');

                return {
                    product_id: cleanProductId,
                    price: finalPrice,
                    product_name: item.name || item.itemName || item.title || 'Unknown Product'
                };
            }).filter(p => !isNaN(p.price) && p.price > 0 && p.product_id && /^\d+$/.test(p.product_id)); // Strict filter

            if (payload.length === 0) {
                 return null;
            }

            const response = await fetch(`${this.baseUrl}productpricelist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // credentials: 'include', // Removed to avoid CORS issues
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                console.error('Failed to send items:', response.statusText);
                return null;
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error sending list items:', error);
            return null;
        }
    }

    async getPriceHistory(productId) {
        try {
            const url = `${this.baseUrl}pricehistory?id=${productId}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                console.error('[BuyHatke API] Failed to fetch price history:', response.status, response.statusText);
                return null;
            }

            const data = await response.json();
            
            const priceHistory = data.data?.prices_history || [];
            
            return priceHistory;
        } catch (error) {
            console.error('[BuyHatke API] Error fetching price history:', error);
            return null;
        }
    }
}

export default API;
