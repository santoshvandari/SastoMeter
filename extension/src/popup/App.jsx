import "./index.css";

export default function App() {
  return (
    <div className="container">
      <header className="header">
        <div className="logo-area">
          <h1 className="title">BuyHatke Price Tracker</h1>
        </div>
      </header>

      <main className="content">
        <div className="active-status">
          <span className="status-dot"></span>
          Extension Active
        </div>

        <p className="description">
          Visit any Daraz product page to see price history and product
          recommendations.
        </p>

        <div className="features-card">
          <h3>Current Features</h3>
          <ul className="features-list">
            <li>Price History Charts</li>
            <li>Similar Products (Lower Price)</li>
          </ul>
        </div>

        <div className="coming-soon-card">
          <h3>Coming Soon</h3>
          <ul className="coming-soon-list">
            <li>Automatic Coupons</li>
            <li>Price Drop Alerts</li>
          </ul>
        </div>
      </main>
      <footer className="footer">
        <small>v{chrome.runtime.getManifest().version}</small>
      </footer>
    </div>
  );
}
