import {useState, useEffect} from "react";
import API from "../lib/api";
import {getProductId, isDarazProductPage} from "../lib/utils";
import PriceChart from "./PriceChart";
import RecommendedProducts from "./RecommendedProducts";

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
  const [selectedPeriod, setSelectedPeriod] = useState(1); // Default to 1 month
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(true);

  // Fetch price history function
  const fetchPriceHistory = async (pid) => {
    try {
      setLoading(true);
      setError(null);

      const history = await api.getPriceHistory(pid);

      if (history && history.length > 0) {
        setPriceHistory(history);
        setError(null);
      } else {
        setError("No price history available yet. Check back later!");
  
      }
    } catch (err) {
      console.error("[BuyHatke Widget] Error fetching price history:", err);
      setError("Failed to load price history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only show on Daraz product pages
    if (!isDarazProductPage()) {
      setIsVisible(false);
      return;
    }

    const pid = getProductId();

    if (!pid) {
      console.error("[BuyHatke Widget] Product ID not found in URL");
      setError("Product ID not found in URL");
      setLoading(false);
      return;
    }

    setProductId(pid);
    fetchPriceHistory(pid);
    
    // Fetch recommendations
    fetchRecommendations(pid);
  }, []);

  // Fetch recommendations function
  const fetchRecommendations = async (pid) => {
    try {
      setLoadingRecs(true);
      const recs = await api.getRecommendations(pid);
      
      if (recs && recs.length > 0) {
        setRecommendations(recs);
      }
    } catch (err) {
      console.error("[BuyHatke Widget] Error fetching recommendations:", err);
    } finally {
      setLoadingRecs(false);
    }
  };

  // Filter price history by selected period
  const getFilteredHistory = () => {
    if (!priceHistory || priceHistory.length === 0) return [];

    const now = new Date();
    const monthsAgo = new Date();
    monthsAgo.setMonth(now.getMonth() - selectedPeriod);

    const filtered = priceHistory.filter((item) => {
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
          updated_at: now.toISOString(),
        },
      ];
    }

    return filtered;
  };

  const filteredHistory = getFilteredHistory();

  if (!isVisible) {
    return null;
  }

  const periods = [
    {label: "1M", value: 1},
    {label: "2M", value: 2},
    {label: "3M", value: 3},
    {label: "6M", value: 6},
    {label: "9M", value: 9},
    {label: "12M", value: 12},
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
              {periods.map((period) => (
                <button
                  key={period.value}
                  style={{
                    ...styles.periodTab,
                    ...(selectedPeriod === period.value
                      ? styles.periodTabActive
                      : {}),
                  }}
                  onClick={() => setSelectedPeriod(period.value)}
                >
                  {period.label}
                </button>
              ))}
            </div>
            <PriceChart
              priceHistory={filteredHistory}
              width={600}
              height={300}
            />
          </>
        )}

        {!loading && priceHistory.length === 0 && (
          <div style={styles.noDataContainer}>
            <p style={styles.noDataText}>No price history available</p>
            <p style={{fontSize: '12px', marginTop: '4px'}}>We'll start tracking this product now!</p>
          </div>
        )}
      </div>
      
      {/* Recommended Products Section */}
      <RecommendedProducts 
        recommendations={recommendations} 
        loading={loadingRecs} 
      />
    </div>
  );
}

const styles = {
  widget: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
    marginBottom: "20px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "14px 18px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
  },
  content: {
    padding: "18px",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #f3f4f6",
    borderTop: "4px solid #667eea",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    marginTop: "16px",
    color: "#6b7280",
    fontSize: "14px",
  },
  periodTabs: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
    padding: "4px",
    backgroundColor: "#f3f4f6",
    borderRadius: "8px",
    flexWrap: "wrap",
  },
  periodTab: {
    flex: 1,
    padding: "8px 12px",
    border: "none",
    background: "transparent",
    color: "#6b7280",
    fontSize: "13px",
    fontWeight: "500",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s",
    minWidth: "50px",
  },
  periodTabActive: {
    background: "#ffffff",
    color: "#667eea",
    fontWeight: "600",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  noDataContainer: {
    padding: "30px",
    textAlign: "center",
    color: "#6b7280",
  },
  noDataText: {
    fontSize: "15px",
    fontWeight: "500",
  },
};
