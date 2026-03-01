import { useNavigate } from "react-router-dom";
import "../styles/analytics.css";

export default function GeneralInsurance() {
  const navigate = useNavigate();

  return (
    <div className="analytics-wrapper">
      {/* Breadcrumb Navigation */}
      <div className="analytics-breadcrumb">
        <button className="breadcrumb-link" onClick={() => navigate("/dashboard")}>
          ← Dashboard
        </button>
        <span className="breadcrumb-separator">›</span>
        <button className="breadcrumb-link" onClick={() => navigate("/dashboard/handbook")}>
          Insurance Handbook
        </button>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">General Insurance</span>
      </div>

      <div className="analytics-container">
        <h1 className="analytics-title">🏢 General Insurance</h1>
        <p style={{ color: "#6b7280", fontSize: "18px", marginBottom: "40px" }}>
          General insurance handbook statistics and detailed analytics
        </p>
      </div>
    </div>
  );
}
