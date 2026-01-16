/**
 * Extract product ID from Daraz URL
 * Daraz product URLs can have these patterns:
 * - https://www.daraz.com.np/products/...-i{productId}.html
 * - https://www.daraz.com.np/products/...-i{productId}-s{skuId}.html
 * 
 * This implementation searches for i[digits] pattern in pathname and takes the last match
 */
export function getProductId() {
    const pattern = /i\d+/g;
    const matches = window.location.pathname.match(pattern);
    
    if (matches && matches.length > 0) {
        const match = matches[matches.length - 1];
        // Remove the 'i' prefix from the match
        return match.substring(1);
    }
    
    return null;
}

/**
 * Get host country from URL
 * Examples: daraz.com.np (Nepal), daraz.pk (Pakistan), daraz.com.bd (Bangladesh)
 */
export function getHostCountry() {
    const hostname = window.location.hostname;
    
    if (hostname.includes('daraz.com.np')) return 'np';
    if (hostname.includes('daraz.pk')) return 'pk';
    if (hostname.includes('daraz.com.bd')) return 'bd';
    if (hostname.includes('daraz.lk')) return 'lk';
    if (hostname.includes('daraz.com.mm')) return 'mm';
    
    return 'unknown';
}

/**
 * Get item quantity from the page
 */
export function getItemQuantity() {
    try {
        // Try to find quantity input field
        const quantityInput = document.querySelector('input[type="number"]');
        if (quantityInput && quantityInput.value) {
            return parseInt(quantityInput.value, 10);
        }
        
        // Default to 1 if not found
        return 1;
    } catch (error) {
        console.error('Error getting quantity:', error);
        return 1;
    }
}

/**
 * Check if value is a valid digit string
 */
export function isDigit(value) {
    return /^\d+$/.test(String(value));
}

/**
 * Format price with currency
 */
export function formatPrice(price, currency = 'Rs.') {
    if (typeof price !== 'number') {
        price = parseFloat(price);
    }
    
    if (isNaN(price)) return 'N/A';
    
    return `${currency} ${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * Format date for display
 */
export function formatDate(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Calculate price statistics
 */
export function calculatePriceStats(priceHistory) {
    if (!priceHistory || priceHistory.length === 0) {
        return {
            current: 0,
            lowest: 0,
            highest: 0,
            average: 0
        };
    }
    
    const prices = priceHistory.map(item => item.price);
    const current = prices[prices.length - 1];
    const lowest = Math.min(...prices);
    const highest = Math.max(...prices);
    const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    return {
        current,
        lowest,
        highest,
        average: Math.round(average * 100) / 100
    };
}

/**
 * Check if current page is a Daraz product page
 */
export function isDarazProductPage() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    
    return (hostname.includes('daraz.') && pathname.includes('/products/'));
}
