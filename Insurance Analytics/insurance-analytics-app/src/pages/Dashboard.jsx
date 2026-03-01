import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "../styles/dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  // Get current user email
  const currentUser = auth.currentUser;
  const userEmail = currentUser?.email || "user@company.com";

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setLoading(false);
    }
  };

  const modules = [
    {
      id: 1,
      title: "Insurance Handbook Statistics",
      icon: "📚",
      color: "#4A90E2",
    },
    {
      id: 2,
      title: "Insurance Analytics",
      icon: "📊",
      color: "#50C878",
    },
    {
      id: 3,
      title: "Insurance Laws",
      icon: "⚖️",
      color: "#FF6B6B",
    },
  ];

  return (
    <div className="dashboard-wrapper">
      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-header-container">
          <h1 className="dashboard-welcome">Welcome</h1>
          <div className="dashboard-header-right">
            <span className="user-email">{userEmail}</span>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="logout-btn"
            >
              {loading ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </header>

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
      className="module-card"
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


