import "./index.css";

export default function App() {
  return (
    <div className="container">
      <header className="header">
        <div className="logo-area">
          <h1 className="title">BuyHatke Price History</h1>
        </div>
      </header>
      <main className="content">
        <div className="active-status">
          <span className="status-dot"></span>
          Price Tracking Active
        </div>

        <p className="description">
          Visit any Daraz product page to view the detailed price history chart
          directly on the page.
        </p>

        <div className="coming-soon-card">
          <h3>Coming Soon</h3>
          <ul className="coming-soon-list">
            <li>Automatic Coupons</li>
            <li>Product Suggestions</li>
            <li>Drod Price Alerts</li>
          </ul>
        </div>
      </main>
      <footer className="footer">
        <small>v{chrome.runtime.getManifest().version}</small>
      </footer>
    </div>
  );
}
