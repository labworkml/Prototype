import { useNavigate } from "react-router-dom";
import {
  BookOpenText,
  Scale,
  FileText,
  ArrowUpRight,
} from "lucide-react";
import "../styles/dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  const modules = [
    {
      id: 1,
      title: "Analytics for Insurance Sector",
      subtitle: "Explore insurance statistics",
      icon: BookOpenText,
      accent: "teal",
    },
    {
      id: 3,
      title: "Knowledge Repository",
      subtitle: "Reference for Insurance laws, regulations and compliance",
      icon: Scale,
      accent: "amber",
    },
  ];

  const quickLinks = [
    {
      id: "life-basic-details",
      label: "Life - Insurer Basic Details",
      route: "/dashboard/handbook/life?tab=market-overview&module=1",
      icon: FileText,
      accent: "teal",
    },
    {
      id: "general-insurer-details",
      label: "General - Insurer Details",
      route: "/dashboard/handbook/general",
      icon: Scale,
      accent: "amber",
    },
  ];

  return (
    <div className="dashboard-wrapper">
      <main className="dashboard-main">
        <div className="dashboard-container">
          <div className="dashboard-hero">
            <h1 className="dashboard-hero-title">Insurance Analytics Platform</h1>
            <p className="dashboard-hero-subtitle">
              Explore data, insights and regulatory provisions for the Indian  insurance sector.
            </p>
          </div>

          <section className="dashboard-section">
            <h2 className="section-title dashboard-section-title modules-title">Modules</h2>
            <div className="modules-grid">
              {modules.map((module) => (
                <ModuleCard key={module.id} module={module} navigate={navigate} />
              ))}
            </div>
          </section>

          <section className="dashboard-section">
            <h2 className="section-title dashboard-section-title quicklinks-title">Quick Links</h2>
            <div className="quicklinks-grid">
              {quickLinks.map((item) => (
                <QuickLinkCard key={item.id} item={item} navigate={navigate} />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function ModuleCard({ module, navigate }) {
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
      className={`module-card card ${module.accent}`}
      onClick={handleModuleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleModuleClick();
        }
      }}
    >
      <div className="module-icon" aria-hidden="true">
        <module.icon size={25} strokeWidth={1.9} />
      </div>
      <div className="module-content">
        <h3 className="module-title">{module.title}</h3>
        <p className="module-description">{module.subtitle}</p>
      </div>
    </div>
  );
}

function QuickLinkCard({ item, navigate }) {
  const IconComponent = item.icon;
  const handleNavigate = () => navigate(item.route);

  return (
    <div
      className={`quicklink-card ${item.accent}`}
      onClick={handleNavigate}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleNavigate();
        }
      }}
    >
      <div className="quicklink-icon-wrap" aria-hidden="true">
        <div className="quicklink-icon">
          <IconComponent size={19} strokeWidth={2} />
        </div>
      </div>
      <div className="quicklink-content">
        <h3 className="quicklink-label">{item.label}</h3>
      </div>
      <ArrowUpRight className="quicklink-arrow" size={16} strokeWidth={2.2} />
    </div>
  );
}


