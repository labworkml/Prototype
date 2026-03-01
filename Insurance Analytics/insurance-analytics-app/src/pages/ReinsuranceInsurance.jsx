import { useNavigate } from "react-router-dom";
import "../styles/analytics.css";

export default function ReinsuranceInsurance() {
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
        <span className="breadcrumb-current">Reinsurance</span>
      </div>

      <div className="analytics-container">
        <h1 className="analytics-title">📦 Reinsurance</h1>
        <p style={{ color: "#6b7280", fontSize: "18px", marginBottom: "40px" }}>
          Reinsurance handbook statistics and detailed analytics
        </p>
      </div>
    </div>
  );
}
