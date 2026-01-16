import { useEffect, useState } from 'react';
import PriceHistoryWidget from '../../components/PriceHistoryWidget';
import { isDarazProductPage } from '../../lib/utils';

function App() {
  const [isDarazProduct, setIsDarazProduct] = useState(false);

  useEffect(() => {
    // Check if we're on a Daraz product page
    setIsDarazProduct(isDarazProductPage());

    // Initialize crowdsourcing interceptor
    import('../crowdsourcing.js').then(() => {
      console.log('[BuyHatke] Content script initialized');
    }).catch(err => {
      console.error('[BuyHatke] Failed to load crowdsourcing:', err);
    });
  }, []);

  if (!isDarazProduct) {
    return null;
  }

  return <PriceHistoryWidget />;
}

export default App;

