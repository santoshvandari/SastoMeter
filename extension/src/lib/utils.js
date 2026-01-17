const getProductId = () => {
    const pattern = /i\d+/g;
    const matches = window.location.pathname.match(pattern);
    if (matches) {
        const match = matches[matches.length - 1];
        // remove the i from the match
        return match.substring(1);
    }
    return "";
}

const getHostCountry = () => {
    const arr = window.location.hostname.split(".");
    const country = arr[arr.length - 1];
    if (["np", "pk", "bd", "lk"].includes(country))
        return arr[arr.length - 1];
    return "";
}

const getItemQuantity = () => {
    const quantityInput = document.getElementById('module_quantity-input');
    if (quantityInput) {
        const inputElem = quantityInput.querySelector('input');
        if (inputElem) {
            return parseInt(inputElem.value);
        }
    }
    return NaN;
}

const isExtension = () => {
    try{
        return chrome.runtime !== undefined;
    }
    catch (err){
        return true;
    }
}

const isProd = () => {
    try{
        return isExtension() && ('update_url' in chrome.runtime.getManifest());
    }
    catch (err){
        return true;
    }
}

const getPrice = () => {
    try {
        const priceElem = document.getElementsByClassName("pdp-price")[0];
        if (!priceElem) return NaN;
        if (!priceElem.textContent) return NaN;
        const price = parseInt(
            priceElem.textContent
                .replace("Rs.", "")
                .replace("৳", "")
                .replaceAll(",", "")
                .trim()
        );
        return price;
    }
    catch (err) {
        return NaN;
    }
}

const asleep = (delay) => {
    return new Promise(resolve => setTimeout(resolve, delay));
}

export {
    getProductId,
    getHostCountry,
    getPrice,
    isExtension,
    isProd,
    getItemQuantity,
    asleep
}

export const isDigit = (value) => {
    return /^\d+$/.test(String(value));
}

export const formatPrice = (price, currency = 'Rs.') => {
    if (typeof price !== 'number') {
        price = parseFloat(price);
    }
    
    if (isNaN(price)) return 'N/A';
    
    return `${currency} ${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export const formatDate = (date) => {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

export const calculatePriceStats = (priceHistory) => {
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

export const isDarazProductPage = () => {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    
    return (hostname.includes('daraz.') && pathname.includes('/products/'));
}
