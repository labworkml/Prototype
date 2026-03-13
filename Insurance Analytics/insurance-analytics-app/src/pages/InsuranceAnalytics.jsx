import "../styles/analytics.css";

export default function InsuranceAnalytics() {
  const modules = [
    {
      id: "life",
        title: "Sector Summary",
      icon: "👨‍👩‍👧",
      description: "",
    },
    {
      id: "general",
        title: "Insurer's Profile",
      icon: "🏢",
      description: "",
    },
    {
      id: "health",
        title: "Key Performance Indicators",
      icon: "💊",
      description: "",
    },
    {
      id: "reinsurance",
        title: "Unnamed",
      icon: "📦",
      description: "",
    },
    {
      id: "intermediaries",
        title: "Distribution Analysis",
      icon: "💛",
      description: "",
    },
  ];

  return (
    <div className="analytics-wrapper">
      <div className="analytics-container">
        <h1 className="analytics-title">Analytics for Insurance Handbook Data</h1>
        <div className="modules-container">
          <div className="modules-grid">
          {modules.map((module) => (
            <div key={module.id} className="module-card" style={{ cursor: "default" }}>
              <div className="module-card-icon">
                {module.icon}
              </div>
              <h3 className="module-card-title">
                {module.title}
              </h3>
              <p className="module-card-description">{module.description || " "}</p>
            </div>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
}
