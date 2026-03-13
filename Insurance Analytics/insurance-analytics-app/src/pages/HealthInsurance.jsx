import { useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Building2,
  FileText,
  Globe,
  LayoutGrid,
  Lightbulb,
  MapPin,
  RefreshCw,
  Shield,
  Shuffle,
  Stethoscope,
  TrendingUp,
} from "lucide-react";
import "../styles/life-insurance.css";

const TABS = [
  { id: "business-volume", label: "Business Volume", icon: BarChart3 },
  { id: "claims", label: "Claims", icon: TrendingUp },
  { id: "state-wise-analysis", label: "State Wise Analysis", icon: MapPin },
  {
    id: "health-products-riders",
    label: "Health Products & Riders by Life Insurers",
    icon: Shield,
  },
  { id: "healthcare-network", label: "Healthcare Network", icon: Globe },
];

const SUB_MODULES = {
  "business-volume": [
    { id: "health", title: "Health", icon: Activity },
    { id: "personal-accident", title: "Personal Accident", icon: Shield },
    { id: "overseas-travel", title: "Overseas Travel", icon: Globe },
    { id: "domestic-travel", title: "Domestic Travel", icon: MapPin },
  ],
  claims: [
    { id: "health", title: "Health", icon: Activity },
    { id: "personal-accident", title: "Personal Accident", icon: Shield },
    { id: "overseas-travel", title: "Overseas Travel", icon: Globe },
    { id: "domestic-travel", title: "Domestic Travel", icon: MapPin },
    { id: "claims-development", title: "Claims Development", icon: TrendingUp },
    { id: "claim-settlement", title: "Claim Settlement", icon: FileText },
  ],
  "state-wise-analysis": [
    { id: "health", title: "Health", icon: Activity },
    { id: "individual-health", title: "Individual Health", icon: Stethoscope },
    { id: "personal-accident", title: "Personal Accident", icon: Shield },
    { id: "overseas-travel", title: "Overseas Travel", icon: Globe },
    { id: "domestic-travel", title: "Domestic Travel", icon: MapPin },
  ],
  "health-products-riders": [
    { id: "products-new", title: "Products – New Business", icon: LayoutGrid },
    { id: "products-renewal", title: "Products – Renewal Business", icon: BarChart3 },
    { id: "riders-new", title: "Riders – New Business", icon: Shield },
    { id: "riders-renewal", title: "Riders – Renewal Business", icon: Building2 },
  ],
  "healthcare-network": [
    { id: "network-hospitals", title: "Network Hospitals (TPA)", icon: Building2 },
    { id: "network-providers", title: "Network Providers (State-wise)", icon: MapPin },
  ],
};

export default function HealthInsurance() {
  const [activeTab, setActiveTab] = useState("business-volume");
  const [selectedModule, setSelectedModule] = useState(null);
  const [showInsights, setShowInsights] = useState(false);

  const [selectedInsurer, setSelectedInsurer] = useState("");
  const [selectedFinancialYear, setSelectedFinancialYear] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("");
  const [selectedMetric, setSelectedMetric] = useState("");
  const [selectedState, setSelectedState] = useState("");

  const filterConfig = useMemo(
    () => [
      {
        label: "Select Insurer",
        options: ["All Insurers", "Public Sector", "Private Sector"],
        value: selectedInsurer,
        onChange: setSelectedInsurer,
      },
      {
        label: "Financial Year",
        options: ["2024-25", "2023-24", "2022-23", "2021-22"],
        value: selectedFinancialYear,
        onChange: setSelectedFinancialYear,
      },
      {
        label: "Category",
        options: ["All", "Retail", "Group"],
        value: selectedCategory,
        onChange: setSelectedCategory,
      },
      {
        label: "Segment",
        options: ["All", "Health", "Personal Accident", "Travel"],
        value: selectedSegment,
        onChange: setSelectedSegment,
      },
      {
        label: "Metric",
        options: ["All", "Premium", "Claims", "Growth"],
        value: selectedMetric,
        onChange: setSelectedMetric,
      },
      {
        label: "State",
        options: ["All", "Andhra Pradesh", "Karnataka", "Maharashtra", "Tamil Nadu"],
        value: selectedState,
        onChange: setSelectedState,
      },
    ],
    [
      selectedInsurer,
      selectedFinancialYear,
      selectedCategory,
      selectedSegment,
      selectedMetric,
      selectedState,
    ]
  );

  const handleResetFilters = () => {
    setSelectedInsurer("");
    setSelectedFinancialYear("");
    setSelectedCategory("");
    setSelectedSegment("");
    setSelectedMetric("");
    setSelectedState("");
  };

  const handleExportData = () => {
    return;
  };

  const getTabAccent = (tabId) => {
    const tabAccents = {
      "business-volume": "#06b6d4",
      claims: "#0ea5a4",
      "state-wise-analysis": "#3b82f6",
      "health-products-riders": "#8b5cf6",
      "healthcare-network": "#14b8a6",
    };
    return tabAccents[tabId] || "#0ea5a4";
  };

  return (
    <div className="life-insurance-viewport health-theme">
      <div className="life-tabs">
        {TABS.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              className={`life-tab ${activeTab === tab.id ? "active" : ""}`}
              data-tab={tab.id}
              style={{ "--tab-accent": getTabAccent(tab.id) }}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedModule(null);
              }}
            >
              <IconComponent className="life-tab-icon" size={16} strokeWidth={2} />
              <span className="life-tab-label label-text">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div
        className={`life-submodules submodules-${activeTab}`}
        style={{ "--tab-accent": getTabAccent(activeTab) }}
      >
        {SUB_MODULES[activeTab]?.map((module) => {
          const IconComponent = module.icon;
          return (
            <div
              key={module.id}
              className={`life-submodule ${selectedModule === module.id ? "selected" : ""}`}
              data-module={module.id}
              onClick={() => setSelectedModule(module.id)}
            >
              <div className="submodule-icon">
                <IconComponent size={20} strokeWidth={2} />
              </div>
              <span className="submodule-name card-title">{module.title}</span>
            </div>
          );
        })}
      </div>

      <div className={`life-content ${showInsights ? "insights-expanded" : "insights-collapsed"}`}>
        <div className="life-filters card">
          <div className="panel-header">
            <div className="panel-icon-badge">
              <Shuffle size={14} strokeWidth={2} />
            </div>
            <h3 className="panel-title section-title">Filters</h3>
            <button
              type="button"
              className="filter-refresh-btn"
              onClick={handleResetFilters}
              aria-label="Reset filters"
              title="Reset filters"
            >
              <RefreshCw className="refresh-icon" size={18} strokeWidth={2.4} />
            </button>
          </div>
          <div className="filters-body">
            {filterConfig.map((filter) => (
              <FilterSelect
                key={filter.label}
                label={filter.label}
                options={filter.options}
                value={filter.value}
                onChange={filter.onChange}
              />
            ))}
          </div>
        </div>

        <div className="life-data-panel card">
          <div className="panel-header">
            <div className="panel-icon-badge">
              <BarChart3 size={14} strokeWidth={2} />
            </div>
            <h3 className="panel-title section-title">Data Panel</h3>
            <button
              type="button"
              className="data-export-btn"
              onClick={handleExportData}
              title="Export to Excel"
            >
              Export to Excel
            </button>
          </div>
          <div className="panel-body">
            <div className="data-table-container">
              <p className="panel-placeholder">Select filters to view analytics.</p>
            </div>
          </div>
        </div>

        <div className="life-viz-panel card">
          <div className="panel-header">
            <div className="panel-icon-badge">
              <TrendingUp size={14} strokeWidth={2} />
            </div>
            <h3 className="panel-title section-title">Visualization Panel</h3>
          </div>
          <div className="panel-body viz-panel-body">
            <div className="chart-wrapper">
              <p className="panel-placeholder">Select filters to view analytics.</p>
            </div>
          </div>
        </div>

        <div className={`life-insights-panel card ${showInsights ? "" : "collapsed"}`}>
          <div className={`panel-header insights-panel-header ${showInsights ? "" : "collapsed"}`}>
            <button
              type="button"
              className="insights-toggle-btn"
              onClick={() => setShowInsights((previous) => !previous)}
              aria-label={showInsights ? "Collapse insights panel" : "Expand insights panel"}
              title={showInsights ? "Collapse insights" : "Expand insights"}
            >
              {showInsights ? "<<" : (
                <span className="insights-collapsed-strip visible">
                  <Lightbulb size={28} strokeWidth={2.5} className="insights-collapsed-icon" />
                  <span className="insights-collapsed-label visible">Insights</span>
                  <span className="insights-collapsed-arrow visible">&gt;&gt;</span>
                </span>
              )}
            </button>

            {showInsights && (
              <>
                <div className="panel-icon-badge">
                  <Lightbulb size={14} strokeWidth={2} />
                </div>
                <h3 className="panel-title section-title">Insights</h3>
              </>
            )}
          </div>

          {showInsights && (
            <div className="panel-body insights-panel-body">
              <div className="chart-wrapper">
                <p className="panel-placeholder">Select filters to view insights.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSelect({ label, options, value, onChange }) {
  return (
    <div className="filter-item">
      <label className="filter-label label-text">{label}</label>
      <select
        className="filter-select"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      >
        <option value="">Select</option>
        {options.map((opt, idx) => (
          <option key={idx} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
