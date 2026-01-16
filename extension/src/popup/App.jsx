import { useState, useEffect } from 'react';

export default function App() {
  const [stats, setStats] = useState({ products: 0, active: false });

  useEffect(() => {
    // Check if we're on a Daraz page
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url?.includes('daraz.')) {
        setStats({ ...stats, active: true });
      }
    });
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>📊</div>
        <h1 style={styles.title}>BuyHatke</h1>
        <p style={styles.subtitle}>Daraz Price Tracker</p>
      </div>

      <div style={styles.content}>
        {stats.active ? (
          <div style={styles.activeCard}>
            <div style={styles.statusIcon}>✅</div>
            <h2 style={styles.statusTitle}>Active on this page</h2>
            <p style={styles.statusText}>
              Price tracking is enabled. Visit a product page to see price history!
            </p>
          </div>
        ) : (
          <div style={styles.inactiveCard}>
            <div style={styles.statusIcon}>ℹ️</div>
            <h2 style={styles.statusTitle}>Visit Daraz</h2>
            <p style={styles.statusText}>
              Go to any Daraz product page to see price history and statistics.
            </p>
          </div>
        )}

        <div style={styles.features}>
          <h3 style={styles.featuresTitle}>Features</h3>
          <ul style={styles.featuresList}>
            <li style={styles.featureItem}>📈 Price history charts</li>
            <li style={styles.featureItem}>💰 Savings calculator</li>
            <li style={styles.featureItem}>📊 Price statistics</li>
            <li style={styles.featureItem}>🤝 Crowdsourced data</li>
          </ul>
        </div>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Supported regions: Nepal, Pakistan, Bangladesh, Sri Lanka, Myanmar
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '320px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#ffffff',
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '24px',
    textAlign: 'center',
    color: '#ffffff',
  },
  logo: {
    fontSize: '48px',
    marginBottom: '8px',
  },
  title: {
    margin: '0 0 4px 0',
    fontSize: '24px',
    fontWeight: 'bold',
  },
  subtitle: {
    margin: 0,
    fontSize: '14px',
    opacity: 0.9,
  },
  content: {
    padding: '20px',
  },
  activeCard: {
    backgroundColor: '#dcfce7',
    border: '1px solid #86efac',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center',
    marginBottom: '20px',
  },
  inactiveCard: {
    backgroundColor: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center',
    marginBottom: '20px',
  },
  statusIcon: {
    fontSize: '32px',
    marginBottom: '8px',
  },
  statusTitle: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
  },
  statusText: {
    margin: 0,
    fontSize: '13px',
    color: '#6b7280',
    lineHeight: '1.5',
  },
  features: {
    marginBottom: '20px',
  },
  featuresTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827',
  },
  featuresList: {
    margin: 0,
    padding: '0 0 0 20px',
    listStyle: 'none',
  },
  featureItem: {
    fontSize: '13px',
    color: '#374151',
    marginBottom: '8px',
    lineHeight: '1.5',
  },
  footer: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '16px',
  },
  footerText: {
    margin: 0,
    fontSize: '11px',
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: '1.5',
  },
};
