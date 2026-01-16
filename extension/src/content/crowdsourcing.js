import API from '../lib/api';
import { getProductId, getHostCountry, getItemQuantity } from '../lib/utils';

const api = new API();
api.setProd(true);

/**
 * Crowdsourcing Interceptor for Daraz
 * This script intercepts product data from Daraz and sends it to the backend for crowdsourcing
 */

// Track user interactions (Add to Cart, Buy Now)
document.addEventListener('click', (event) => {
    const productId = getProductId();
    const hostcountry = getHostCountry();

    if (!productId || !hostcountry) return;

    const button = event.target.closest('button');

    if (button) {
        const buttonText = button.textContent?.toLowerCase().replace(/\s/g, '');
        
        if (buttonText === 'addtocart') {
            const quantity = getItemQuantity();
            api.ingestClick({
                type: 'addtocart',
                id: productId,
                hostcountry,
                quantity,
            });
        } else if (buttonText === 'buynow') {
            const quantity = getItemQuantity();
            api.ingestClick({
                type: 'buynow',
                id: productId,
                hostcountry,
                quantity,
            });
        }
    }
});

/**
 * Find items with price data in nested objects/arrays
 */
const findItems = (data, parent = 'ROOT') => {
    const items = [];

    for (const key of Object.getOwnPropertyNames(data)) {
        if (!data[key]) continue;

        if (Array.isArray(data[key]) && data[key].length > 0) {
            const condition = (item) => 
                item.hasOwnProperty('itemId') && 
                (item.hasOwnProperty('price') || item.hasOwnProperty('itemDiscountPrice'));

            if (data[key].some(condition)) {
                if (data[key].filter(condition).length > data[key].filter(item => !condition(item)).length) {
                    const validItems = data[key].filter(condition);
                    console.log('[BuyHatke]', key, 'Found items:', validItems);
                    items.push(...validItems);
                }
            } else {
                items.push(...findItems(data[key], `${parent} -> ${key}`));
            }
        } else if (typeof data[key] === 'object') {
            items.push(...findItems(data[key], `${parent} -> ${key}`));
        }
    }
    
    return items;
};

/**
 * Process and deduplicate items
 */
const processItems = (items) => {
    console.log('[BuyHatke] Processing items:', items);
    
    // Remove duplicates by merging items with same itemId
    const uniqueItems = items.reduce((acc, item) => {
        const existingItem = acc.find((i) => i.itemId === item.itemId);
        
        if (existingItem) {
            Object.keys(item).forEach(key => {
                if (existingItem[key] === undefined) {
                    existingItem[key] = item[key];
                }
            });
        } else {
            acc.push(item);
        }
        
        return acc;
    }, []);

    if (uniqueItems.length !== items.length) {
        console.log(`[BuyHatke] Duplicate items found | ${items.length} -> ${uniqueItems.length}`);
    }

    return uniqueItems;
};

/**
 * Intercept XMLHttpRequest to capture AJAX responses
 */
const oldXHROpen = window.XMLHttpRequest.prototype.open;
window.XMLHttpRequest.prototype.open = function() {
    this.addEventListener('load', async function() {
        const responseBody = this.responseText;

        try {
            const url = this.responseURL;
            
            if (url.includes('ajax=true')) {
                console.log('[BuyHatke] Intercepted AJAX request:', url);
            }

            const data = JSON.parse(responseBody);
            const items = findItems(data);
            const processedItems = processItems(items);

            if (items.length > 0) {
                await api.sendListItems(processedItems);
                console.log('[BuyHatke] Sent', processedItems.length, 'items to backend');
            }
        } catch (err) {
            // Silently fail for non-JSON responses
        }
    });
    
    return oldXHROpen.apply(this, arguments);
};

/**
 * Wait for document.body to be ready
 */
function callWhenBodyIsReady(callback) {
    if (document.body) {
        callback();
    } else {
        const observer = new MutationObserver((_, observerInstance) => {
            if (document.body) {
                callback();
                observerInstance.disconnect();
            }
        });

        observer.observe(document.documentElement, { childList: true, subtree: true });
    }
}

/**
 * Extract initial page data from window.__FIRST_SCREEN_DATA
 */
const asleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

callWhenBodyIsReady(async () => {
    const win = window;

    // Wait for Daraz to populate __FIRST_SCREEN_DATA
    await asleep(2000);
    
    console.log('[BuyHatke] Checking for initial screen data...');

    if (!win.__FIRST_SCREEN_DATA) {
        console.log('[BuyHatke] No initial screen data found');
        return;
    }

    const items = findItems(win.__FIRST_SCREEN_DATA);
    
    if (items.length > 0) {
        try {
            const processedItems = processItems(items);
            await api.sendListItems(processedItems);
            console.log('[BuyHatke] Sent initial', processedItems.length, 'items to backend');
        } catch (err) {
            console.error('[BuyHatke] Error sending initial items:', err);
        }
    }
});

console.log('[BuyHatke] Crowdsourcing interceptor initialized');
