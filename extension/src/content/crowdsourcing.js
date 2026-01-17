// @ts-nocheck
import API from '../lib/api';
import { getProductId, getHostCountry, getPrice } from '../lib/utils';

const api = new API();

// This needs to be set because the extension is injected via a script tag.
// isExtension will return false.
api.setProd(true);

const processItems = (items) => {
    // remove duplicates
    const uniqueItems = [];
    const itemIds = new Set();
    for (const item of items){
        if (!itemIds.has(item.itemId)){
            uniqueItems.push(item);
            itemIds.add(item.itemId);
        }
    }
    return uniqueItems;
}

const findItems = (data, parent="ROOT") => {
    const items = [];
    // Check if data is object
    if (!data || typeof data !== 'object') return items;

    for (const key of Object.getOwnPropertyNames(data)){
        if (!data[key]) continue;
        
        if (Array.isArray(data[key]) && data[key].length > 0){
            const condition = (item) => item.hasOwnProperty("itemId") && 
                                        (item.hasOwnProperty("price") || item.hasOwnProperty("itemDiscountPrice") || item.hasOwnProperty("itemPrice") || item.hasOwnProperty("originalPrice") || item.hasOwnProperty("priceShow"));
            
            if (data[key].some(condition)){
                    // Filter based on condition density
                    const valid_items = data[key].filter(condition);
                    const invalid_count = data[key].length - valid_items.length;
                    
                    if (valid_items.length > invalid_count){
                        items.push(...valid_items);
                    }
                }
            else {
                items.push(...findItems(data[key], `${parent} -> ${key}`));
            }
        }
        else if (typeof data[key] === "object"){
            items.push(...findItems(data[key], `${parent} -> ${key}`));
        }
    }
    return items;
}


let oldXHROpen = window.XMLHttpRequest.prototype.open;
window.XMLHttpRequest.prototype.open = function() {
    this.addEventListener("load", async function() {
        const responseBody = this.responseText;
        try{
            // Verify if response is JSON
            const data = JSON.parse(responseBody);
            
            const items = findItems(data);
            if (items.length > 0) {
                const processedItems = processItems(items);
                await api.sendListItems(processedItems);
            }
        }
        catch (err){
            // Ignore non-JSON responses
        }
    });
    return oldXHROpen.apply(this, arguments);
};

function callWhenBodyIsReady(callback) {
    if (document.body) {
        callback();
    } else {
        const observer = new MutationObserver(function() {
            if (document.body) {
                observer.disconnect();
                callback();
            }
        });
        observer.observe(document.documentElement, { childList: true });
    }
}

const asleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

callWhenBodyIsReady(async () => {
    const win = window;

    // 1. Try __FIRST_SCREEN_DATA scanning
    await asleep(2000);
    
    if (win.__FIRST_SCREEN_DATA) {
        const items = findItems(win.__FIRST_SCREEN_DATA);
        if (items.length > 0){
            try{
                const processedItems = processItems(items);
                await api.sendListItems(processedItems);
            }
            catch (err){
                console.error('[BuyHatke] Error processing First Screen Data:', err);
            }
        }
    }

    // 2. Explicitly scan DOM for current product (as User requested for individual product page)
    const pid = getProductId();
    if (pid) {
        // Retry getting price if DOM is slow
        let retries = 3;
        let domPrice = NaN;
        while(retries > 0 && isNaN(domPrice)) {
            domPrice = getPrice();
            if (isNaN(domPrice)) await asleep(500);
            retries--;
        }

        if (!isNaN(domPrice)) {
            // Try to find title
             const titleElem = document.querySelector('.pdp-mod-product-badge-title') || 
                               document.querySelector('.pdp-product-title') ||
                               document.querySelector('h1.pdp-title'); // Standard Daraz title class
             
             const title = titleElem ? titleElem.textContent.trim() : "Current Product";
             
             const domItem = {
                 itemId: pid,
                 price: domPrice,
                 title: title
             };

             await api.sendListItems([domItem]);
        }
    }
});
