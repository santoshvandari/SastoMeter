// Hardcode URL to ensure availability in MAIN world (injected script)
const API_BASE_URL = 'http://localhost:3000/api/v1/';

class API {
    constructor() {
        this.baseUrl = API_BASE_URL;

        // Ensure baseUrl ends with /
        if (!this.baseUrl.endsWith('/')) {
            this.baseUrl += '/';
        }
    }

    async sendListItems(items) {
        try {
            const payload = items.map(item => {
                // Expanded price field support
                let rawPrice = item.price || item.itemDiscountPrice || item.itemPrice || item.originalPrice || item.priceShow || item.salePrice;
                let finalPrice = 0;

                // Handle price objects (some items have price as {priceNumber: 289})
                if (typeof rawPrice === 'object' && rawPrice !== null) {
                    rawPrice = rawPrice.priceNumber || rawPrice.price;
                }
                
                if (typeof rawPrice === 'number') {
                    finalPrice = Math.floor(rawPrice);
                } else if (typeof rawPrice === 'string') {
                    // Remove non-digit characters (except dot for decimal check, though we want int)
                    // Common formats: "Rs. 1,200", "1,200.00"
                    const digits = rawPrice.replace(/[^\d.]/g, '');
                    finalPrice = parseInt(digits, 10); // Parse as integer
                }

                // Clean Product ID (ensure digits only)
                const rawId = item.itemId || item.nid || "";
                let cleanProductId = String(rawId).replace(/[^\d]/g, '');

                // Extract image URL
                const imageUrl = item.image || item.itemImage || item.imageUrl || '';
                
                // Extract and fix item URL (add https: if relative)
                let itemLink = item.itemUrl || item.link || item.itemLink || item.url || '';
                if (itemLink && itemLink.startsWith('//')) {
                    itemLink = 'https:' + itemLink;
                }

                return {
                    product_id: cleanProductId,
                    price: finalPrice,
                    product_name: item.name || item.itemName || item.title || 'Unknown Product',
                    image: imageUrl,
                    link: itemLink
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

    async getRecommendations(productId) {
        try {
            const url = `${this.baseUrl}recommendation?id=${productId}`;

            const response = await fetch(url);

            if (!response.ok) {
                console.error('[BuyHatke API] Failed to fetch recommendations:', response.status, response.statusText);
                return null;
            }

            const data = await response.json();

            return data.recommended_products || [];
        } catch (error) {
            console.error('[BuyHatke API] Error fetching recommendations:', error);
            return null;
        }
    }
}

export default API;
