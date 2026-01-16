import { useState, useEffect } from 'react';
import API from '../lib/api';
import { getProductId, isDarazProductPage } from '../lib/utils';
import PriceChart from './PriceChart';

const api = new API();

/**
 * PriceHistoryWidget - Main widget component that displays on Daraz product pages
 */
export default function PriceHistoryWidget() {
    const [priceHistory, setPriceHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isVisible, setIsVisible] = useState(true);
    const [productId, setProductId] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState(12); // Default to 12 months

    // Fetch price history function
    const fetchPriceHistory = async (pid) => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('[BuyHatke Widget] Fetching price history for product:', pid);
            
            const history = await api.getPriceHistory(pid);
            
            console.log('[BuyHatke Widget] Received price history:', history);
            
            if (history && history.length > 0) {
                setPriceHistory(history);
                setError(null);
                console.log('[BuyHatke Widget] Successfully loaded', history.length, 'price points');
            } else {
                setError('No price history available yet. Check back later!');
                console.log('[BuyHatke Widget] No price history found for product:', pid);
            }
        } catch (err) {
            console.error('[BuyHatke Widget] Error fetching price history:', err);
            setError('Failed to load price history. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Only show on Daraz product pages
        if (!isDarazProductPage()) {
            console.log('[BuyHatke Widget] Not a Daraz product page, hiding widget');
            setIsVisible(false);
            return;
        }

        const pid = getProductId();
        console.log('[BuyHatke Widget] Detected product ID:', pid);
        
        if (!pid) {
            console.error('[BuyHatke Widget] Product ID not found in URL');
            setError('Product ID not found in URL');
            setLoading(false);
            return;
        }

        setProductId(pid);
        fetchPriceHistory(pid);
    }, []);

    // Refresh handler
    const handleRefresh = () => {
        if (productId) {
            console.log('[BuyHatke Widget] Refreshing price history');
            fetchPriceHistory(productId);
        }
    };

    // Filter price history by selected period
    const getFilteredHistory = () => {
        if (!priceHistory || priceHistory.length === 0) return [];
        
        const now = new Date();
        const monthsAgo = new Date();
        monthsAgo.setMonth(now.getMonth() - selectedPeriod);
        
        const filtered = priceHistory.filter(item => {
            const itemDate = new Date(item.updated_at);
            return itemDate >= monthsAgo;
        });
        
        // If no data in selected period, show last entry extended to current date
        if (filtered.length === 0) {
            const lastEntry = priceHistory[priceHistory.length - 1];
            return [
                lastEntry,
                {
                    price: lastEntry.price,
                    updated_at: now.toISOString()
                }
            ];
        }
        
        return filtered;
    };

    const filteredHistory = getFilteredHistory();

    if (!isVisible) {
        return null;
    }

    const periods = [
        { label: '1M', value: 1 },
        { label: '2M', value: 2 },
        { label: '3M', value: 3 },
        { label: '6M', value: 6 },
        { label: '9M', value: 9 },
        { label: '12M', value: 12 },
    ];

    return (
        <div style={styles.widget}>
            <div style={styles.header}>
                <h2 style={styles.title}>Price History</h2>
            </div>

            <div style={styles.content}>
                {loading && (
                    <div style={styles.loadingContainer}>
                        <div style={styles.spinner}></div>
                        <p style={styles.loadingText}>Loading...</p>
                    </div>
                )}

                {!loading && priceHistory.length > 0 && (
                    <>
                        <div style={styles.periodTabs}>
                            {periods.map(period => (
                                <button
                                    key={period.value}
                                    style={{
                                        ...styles.periodTab,
                                        ...(selectedPeriod === period.value ? styles.periodTabActive : {})
                                    }}
                                    onClick={() => setSelectedPeriod(period.value)}
                                >
                                    {period.label}
                                </button>
                            ))}
                        </div>
                        <PriceChart priceHistory={filteredHistory} width={600} height={300} />
                    </>
                )}
                
                {!loading && priceHistory.length === 0 && (
                    <div style={styles.noDataContainer}>
                        <p style={styles.noDataText}>No price history found</p>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    widget: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        marginBottom: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    header: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '14px 18px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        margin: 0,
        fontSize: '16px',
        fontWeight: '600',
        color: '#ffffff',
        textAlign: 'center',
    },
    content: {
        padding: '18px',
    },
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '4px solid #f3f4f6',
        borderTop: '4px solid #667eea',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
    loadingText: {
        marginTop: '16px',
        color: '#6b7280',
        fontSize: '14px',
    },
    periodTabs: {
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
        padding: '4px',
        backgroundColor: '#f3f4f6',
        borderRadius: '8px',
        flexWrap: 'wrap',
    },
    periodTab: {
        flex: 1,
        padding: '8px 12px',
        border: 'none',
        background: 'transparent',
        color: '#6b7280',
        fontSize: '13px',
        fontWeight: '500',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        minWidth: '50px',
    },
    periodTabActive: {
        background: '#ffffff',
        color: '#667eea',
        fontWeight: '600',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    },
    noDataContainer: {
        padding: '30px',
        textAlign: 'center',
        color: '#6b7280',
    },
    noDataText: {
        fontSize: '15px',
        fontWeight: '500',
    },
};
