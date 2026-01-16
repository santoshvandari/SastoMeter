import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './views/App.jsx'

console.log('[BuyHatke] Content script loaded')

// Wait for the page to be ready before injecting
const injectWidget = () => {
  // Create container for our widget
  const container = document.createElement('div')
  container.id = 'buyhatke-price-tracker'
  container.style.cssText = 'width: 100%; max-width: 100%; z-index: 999;'
  
  // Try to find a good insertion point on Daraz product pages
  // Typically insert after the product title or before reviews section
  const productContainer = document.querySelector('.pdp-product-title') || 
                          document.querySelector('.pdp-mod-product-badge-wrapper') ||
                          document.querySelector('.pdp-block__main-information') ||
                          document.querySelector('.pdp-block') ||
                          document.querySelector('#module_product_title_1') ||
                          document.body;
  
  if (productContainer && productContainer !== document.body) {
    // Insert after the product info section
    productContainer.parentNode.insertBefore(container, productContainer.nextSibling);
  } else {
    // Fallback: append to body
    document.body.appendChild(container);
  }
  
  // Render the React app
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(injectWidget, 1000); // Wait a bit for Daraz to render
  });
} else {
  setTimeout(injectWidget, 1000);
}

