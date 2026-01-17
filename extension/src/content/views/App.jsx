import { useEffect, useState } from 'react';
import PriceHistoryWidget from '../../components/PriceHistoryWidget';
import { isDarazProductPage } from '../../lib/utils';

function App() {
  const [isDarazProduct, setIsDarazProduct] = useState(false);

  useEffect(() => {
    // Check if we're on a Daraz product page
    setIsDarazProduct(isDarazProductPage());
  }, []);

  if (!isDarazProduct) {
    return null;
  }

  return <PriceHistoryWidget />;
}

export default App;

