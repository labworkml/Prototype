import {
  BookText,
  Scale,
  FileStack,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import "../styles/analytics.css";

export default function InsuranceLaws() {
  const modules = [
    {
      id: "acts",
      title: "Acts",
      icon: BookText,
      color: "#0ea5e9",
      bg: "rgba(14,165,233,0.1)",
      description: "Primary insurance acts and statutory provisions.",
    },
    {
      id: "regulations",
      title: "Regulations",
      icon: Scale,
      color: "#14b8a6",
      bg: "rgba(20,184,166,0.1)",
      description: "Regulatory framework and compliance regulations.",
    },
    {
      id: "master-circular",
      title: "Master Circular",
      icon: FileStack,
      color: "#6366f1",
      bg: "rgba(99,102,241,0.1)",
      description: "Consolidated circulars and supervisory directions.",
    },
    {
      id: "guidelines",
      title: "Guidelines",
      icon: ScrollText,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.1)",
      description: "Operational and governance guidelines for insurers.",
    },
    {
      id: "insurance-core-principles",
      title: "Insurance Core Principles",
      icon: ShieldCheck,
      color: "#ef4444",
      bg: "rgba(239,68,68,0.1)",
      description: "Core principles for prudential supervision and stability.",
    },
  ];

  return (
    <div className="analytics-wrapper">
      <div className="analytics-container">
        <h1 className="analytics-title">Insurance Laws</h1>

        <div className="modules-container">
          <div className="modules-grid">
            {modules.map((module) => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModuleCard({ module }) {
  const IconComponent = module.icon;

  return (
    <div className="module-card card">
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
