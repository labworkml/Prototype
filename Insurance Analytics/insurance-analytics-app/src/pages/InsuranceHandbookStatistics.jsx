import { useNavigate } from "react-router-dom";
import "../styles/analytics.css";

export default function InsuranceHandbookStatistics() {
  const navigate = useNavigate();

  const modules = [
    {
      id: "life",
      title: "Life",
      icon: "👨‍👩‍👧",
      description: "Life insurance handbook statistics",
    },
    {
      id: "general",
      title: "General",
      icon: "🏢",
      description: "General insurance handbook statistics.",
    },
    {
      id: "health",
      title: "Health",
      icon: "💊",
      description: "Health insurance handbook statistics.",
    },
    {
      id: "reinsurance",
      title: "Reinsurance",
      icon: "📦",
      description: "Reinsurance handbook statistics.",
    },
    {
      id: "intermediaries",
      title: "Intermediaries",
      icon: "💛",
      description: "Intermediaries handbook statistics.",
    },
  ];

  return (
    <div className="analytics-wrapper">
      <div className="analytics-container">
        {/* Main Title */}
        <h1 className="analytics-title">Insurance Handbook Statistics</h1>

        {/* Modules Grid */}
        <div className="modules-container">
          <div className="modules-grid">
            {modules.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                onClick={() => navigate(`/dashboard/handbook/${module.id}`)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModuleCard({ module, onClick }) {
  return (
    <div className="module-card card" onClick={onClick}>
      <div className="module-card-icon">{module.icon}</div>
      <h3 className="module-card-title">{module.title}</h3>
      <p className="module-card-description">{module.description}</p>
    </div>
  );
}
