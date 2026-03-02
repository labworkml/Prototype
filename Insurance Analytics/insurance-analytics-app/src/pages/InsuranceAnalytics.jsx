import { useNavigate } from "react-router-dom";
import "../styles/module-page.css";

export default function InsuranceAnalytics() {
  const navigate = useNavigate();

  return (
    <div className="module-page-wrapper">
      <div className="module-page-header">
        <button className="module-back-btn" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>
        <h1 className="module-page-title">Insurance Analytics</h1>
        <p className="module-page-subtitle">Deep dive analytics and insights into insurance trends and performance</p>
      </div>

      <div className="module-page-container">
        <div className="analytics-grid">
          <AnalyticsCard 
            title="Claims Processing Time" 
            metric="3.2 days" 
            trend="↓ 8% faster"
          />
          <AnalyticsCard 
            title="Customer Satisfaction" 
            metric="94.3%" 
            trend="↑ 2.1% higher"
          />
          <AnalyticsCard 
            title="Renewal Rate" 
            metric="87.6%" 
            trend="↑ 4.5% higher"
          />
          <AnalyticsCard 
            title="Claim Approval Rate" 
            metric="96.8%" 
            trend="↑ 1.2% higher"
          />
        </div>

        <div className="content-section card">
          <h2>Monthly Trend Analysis</h2>
          <div className="chart-placeholder">
            📈 Analytics chart with monthly trends visualization
          </div>
        </div>

        <div className="analysis-grid">
          <div className="analysis-box card">
            <h3>Claims by Category</h3>
            <ul className="analysis-list">
              <li><span className="list-label">Medical Claims:</span> 34%</li>
              <li><span className="list-label">Auto Claims:</span> 28%</li>
              <li><span className="list-label">Property Claims:</span> 22%</li>
              <li><span className="list-label">Other:</span> 16%</li>
            </ul>
          </div>
          <div className="analysis-box card">
            <h3>Top Performing Products</h3>
            <ul className="analysis-list">
              <li><span className="list-label">Premium Health Plan:</span> Growing</li>
              <li><span className="list-label">Auto Premium Plus:</span> Growing</li>
              <li><span className="list-label">Home Comprehensive:</span> Stable</li>
              <li><span className="list-label">Life Whole Plan:</span> Growing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsCard({ title, metric, trend }) {
  return (
    <div className="analytics-card card">
      <div className="analytics-card-title">{title}</div>
      <div className="analytics-card-metric">{metric}</div>
      <div className="analytics-card-trend">{trend}</div>
    </div>
  );
}
