import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "../styles/dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  const modules = [
    {
      id: 1,
      title: "Dashboard for Insurance Handbook Statistics",
      icon: "📚",
      color: "#4A90E2",
    },
    {
      id: 2,
      title: "Analytics for Insurance Handbook Statistics",
      icon: "📊",
      color: "#50C878",
    },
    {
      id: 3,
      title: "Insurance Knowledge Repository",
      icon: "⚖️",
      color: "#FF6B6B",
    },
  ];

  return (
    <div className="dashboard-wrapper">
      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* Modules Section Header */}
          <div className="modules-header">
            <h2 className="modules-title">Modules</h2>
            <p className="modules-subtitle">Select a module to get started</p>
          </div>

          {/* Modules Grid */}
          <div className="modules-grid">
            {modules.map((module) => (
              <ModuleCard key={module.id} module={module} navigate={navigate} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function ModuleCard({ module, navigate }) {
  const [isHovered, setIsHovered] = useState(false);

  const getModuleRoute = (moduleId) => {
    const routes = {
      1: "/dashboard/handbook",
      2: "/dashboard/analytics",
      3: "/dashboard/laws",
    };
    return routes[moduleId] || "/dashboard";
  };

  const handleModuleClick = () => {
    navigate(getModuleRoute(module.id));
  };

  return (
    <div
      className="module-card card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleModuleClick}
      style={{
        transform: isHovered ? "translateY(-6px)" : "translateY(0)",
        cursor: "pointer",
      }}
    >
      <div className="module-icon">{module.icon}</div>
      <h3 className="module-title">{module.title}</h3>
    </div>
  );
}


