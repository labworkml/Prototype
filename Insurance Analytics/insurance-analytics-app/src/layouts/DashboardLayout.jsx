import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import "../styles/navbar.css";

const BREADCRUMB_LABELS = {
  dashboard: "Dashboard",
  handbook: "Insurance Handbook",
  life: "Life",
  general: "General",
  health: "Health",
  reinsurance: "Reinsurance",
  intermediaries: "Intermediaries",
  summary: "Summary of Indian Insurance Sector",
  analytics: "Insurance Analytics",
  laws: "Insurance Laws",
};

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const userEmail = auth.currentUser?.email || "user@company.com";

  const breadcrumbItems = getBreadcrumbItems(location.pathname);
  const isDashboardRoot = location.pathname === "/dashboard";

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="app-container">
      <header className="navbar">
        <div className="navbar-breadcrumb">
          {!isDashboardRoot && breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;

            return (
              <div key={item.path} className="navbar-crumb-item">
                {index === 0 && breadcrumbItems.length > 1 ? (
                  <span className="navbar-crumb-arrow">←</span>
                ) : null}
                {isLast ? (
                  <span className="navbar-crumb-current">{item.label}</span>
                ) : (
                  <button className="navbar-crumb-link" onClick={() => navigate(item.path)}>
                    {item.label}
                  </button>
                )}
                {!isLast ? <span className="navbar-crumb-separator">›</span> : null}
              </div>
            );
          })}
        </div>
        <div className="navbar-actions">
          <span className="navbar-user">{userEmail}</span>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

function getBreadcrumbItems(pathname) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return [{ label: "Dashboard", path: "/dashboard" }];
  }

  const items = [];
  let currentPath = "";

  segments.forEach((segment) => {
    currentPath += `/${segment}`;
    items.push({
      label: BREADCRUMB_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
      path: currentPath,
    });
  });

  return items;
}
