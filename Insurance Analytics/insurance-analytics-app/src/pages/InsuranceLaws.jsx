import { useNavigate } from "react-router-dom";
import "../styles/module-page.css";

export default function InsuranceLaws() {
  const navigate = useNavigate();

  return (
    <div className="module-page-wrapper">
      <div className="module-page-header">
        <button className="module-back-btn" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>
        <h1 className="module-page-title">Insurance Laws & Regulations</h1>
        <p className="module-page-subtitle">Compliance guidelines and regulatory requirements for insurance operations</p>
      </div>

      <div className="module-page-container">
        <div className="laws-grid">
          <LawCard 
            title="Data Protection" 
            status="Compliant" 
            regulation="GDPR, CCPA"
          />
          <LawCard 
            title="Consumer Protection" 
            status="Compliant" 
            regulation="Fair Claims"
          />
          <LawCard 
            title="Solvency Requirements" 
            status="Compliant" 
            regulation="RBC Standards"
          />
          <LawCard 
            title="Transparency Standards" 
            status="Compliant" 
            regulation="Disclosure Rules"
          />
        </div>

        <div className="content-section card">
          <h2>Regulatory Framework</h2>
          <div className="regulation-list">
            <RegulationItem 
              title="Insurance Act 2023" 
              description="Comprehensive framework governing insurance operations and consumer protection"
            />
            <RegulationItem 
              title="Data Privacy Regulations" 
              description="Requirements for handling sensitive customer information and claims data"
            />
            <RegulationItem 
              title="Anti-Fraud Compliance" 
              description="Mandatory procedures for detecting and preventing insurance fraud"
            />
            <RegulationItem 
              title="Rate Filing Requirements" 
              description="Guidelines for actuarial analysis and premium rate submissions"
            />
          </div>
        </div>

        <div className="content-section card">
          <h2>Compliance Checklist</h2>
          <div className="checklist">
            <ChecklistItem label="Annual compliance audit completed" />
            <ChecklistItem label="Customer dispute resolution process in place" />
            <ChecklistItem label="Fraud detection system operational" />
            <ChecklistItem label="Data security protocols updated" />
            <ChecklistItem label="Staff training current" />
            <ChecklistItem label="Regulatory filing deadlines met" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LawCard({ title, status, regulation }) {
  return (
    <div className="law-card card">
      <div className="law-card-title">{title}</div>
      <div className="law-card-status">{status}</div>
      <div className="law-card-regulation">{regulation}</div>
    </div>
  );
}

function RegulationItem({ title, description }) {
  return (
    <div className="regulation-item card">
      <div className="regulation-title">{title}</div>
      <div className="regulation-description">{description}</div>
    </div>
  );
}

function ChecklistItem({ label }) {
  return (
    <div className="checklist-item">
      <span className="checklist-check">✓</span>
      <span>{label}</span>
    </div>
  );
}
