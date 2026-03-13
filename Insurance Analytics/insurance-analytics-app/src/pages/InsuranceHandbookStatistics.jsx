import { useNavigate } from "react-router-dom";
import {
  HeartPulse,
  Building2,
  Activity,
  RefreshCcw,
  Network,
  BookOpen,
  TrendingUp,
  Globe,
} from "lucide-react";
import "../styles/analytics.css";

export default function InsuranceHandbookStatistics() {
  const navigate = useNavigate();

  const modules = [
    {
      id: "life",
      title: "Life",
      icon: HeartPulse,
      color: "#ef4444",
      bg: "rgba(239,68,68,0.1)",
      description: "Life insurance handbook statistics",
    },
    {
      id: "general",
      title: "General",
      icon: Building2,
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.1)",
      description: "General insurance handbook statistics.",
    },
    {
      id: "health",
      title: "Health",
      icon: Activity,
      color: "#10b981",
      bg: "rgba(16,185,129,0.1)",
      description: "Health insurance handbook statistics.",
    },
    {
      id: "reinsurance",
      title: "Reinsurance",
      icon: RefreshCcw,
      color: "#8b5cf6",
      bg: "rgba(139,92,246,0.1)",
      description: "Reinsurance handbook statistics.",
    },
    {
      id: "intermediaries",
      title: "Intermediaries",
      icon: Network,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.1)",
      description: "Intermediaries handbook statistics.",
    },
    {
      id: "summary",
      title: "Summary of Indian Insurance Sector",
      icon: BookOpen,
      color: "#0ea5e9",
      bg: "rgba(14,165,233,0.1)",
      description: "Overview and summary of the Indian insurance sector.",
    },
    {
      id: "kpi",
      title: "Insurer's Key Performance Indicators",
      icon: TrendingUp,
      color: "#14b8a6",
      bg: "rgba(20,184,166,0.1)",
      description: "Key performance indicators for insurers.",
    },
    {
      id: "macro",
      title: "Macro Economic Indicators",
      icon: Globe,
      color: "#6366f1",
      bg: "rgba(99,102,241,0.1)",
      description: "Macro economic indicators relevant to insurance.",
    },
  ];

  return (
    <div className="analytics-wrapper">
      <div className="analytics-container">
        {/* Main Title */}
        <h1 className="analytics-title">Analytics for Insurance Statistics</h1>

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
  const IconComponent = module.icon;
  return (
    <div className="module-card card" onClick={onClick}>
      <div
        className="module-card-icon"
        style={{
          background: module.bg,
          borderRadius: "14px",
          width: "52px",
          height: "52px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconComponent size={26} strokeWidth={1.75} color={module.color} />
      </div>
      <h3 className="module-card-title">{module.title}</h3>
      <p className="module-card-description">{module.description}</p>
    </div>
  );
}
