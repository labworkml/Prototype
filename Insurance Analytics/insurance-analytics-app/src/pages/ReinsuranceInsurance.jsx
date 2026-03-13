import { useMemo, useState } from "react";
import {
  BarChart2,
  BarChart3,
  Building2,
  CheckCircle,
  FileText,
  IndianRupeeIcon,
  Landmark,
  Lightbulb,
  RefreshCw,
  Scale,
  Shield,
  Shuffle,
  TrendingUp,
} from "lucide-react";
import "../styles/life-insurance.css";

const TABS = [
  { id: "market-overview", label: "Market Overview", icon: BarChart3 },
  {
    id: "premium-underwriting",
    label: "Premium & Underwriting Analysis",
    icon: IndianRupeeIcon,
  },
  { id: "retention-capacity", label: "Retention & Capacity", icon: Shield },
  { id: "financials", label: "Financials", icon: Landmark },
];

const SUB_MODULES = {
  "market-overview": [
    { id: "reinsurers-india", title: "Reinsurers Operating in India", icon: Building2 },
    { id: "solvency-ratio", title: "Solvency Ratio", icon: CheckCircle },
  ],
  "premium-underwriting": [
    {
      id: "premium-schedule",
      title: "Premium Schedule of Reinsurers",
      icon: IndianRupeeIcon,
    },
    {
      id: "segment-wise-premium",
      title: "Segment Wise Premium on Reinsurance Accepted",
      icon: BarChart3,
    },
    { id: "operational-analysis", title: "Operational Analysis", icon: BarChart2 },
    {
      id: "underwriting-experience",
      title: "Underwriting Experience of Reinsurers",
      icon: TrendingUp,
    },
  ],
  "retention-capacity": [
    {
      id: "net-retention-non-life",
      title: "Net Retention of Non-Life Insurers, Indian Reinsurers and FRBs",
      icon: Shield,
    },
    {
      id: "net-retention-reinsurers",
      title: "Net Retention of Reinsurers and Non-Life Insurers",
      icon: Shuffle,
    },
  ],
  financials: [
    {
      id: "equity-assigned-capital",
      title: "Equity Share Capital of Reinsurers & Assigned Capital of FRBs",
      icon: Landmark,
    },
    {
      id: "policyholders-account",
      title: "Policyholders Account of Reinsurers",
      icon: FileText,
    },
    {
      id: "shareholders-account",
      title: "Shareholders Account of Reinsurers",
      icon: FileText,
    },
    { id: "balance-sheet", title: "Balance Sheet of Reinsurers", icon: FileText },
  ],
};

const BASE_METRIC_OPTIONS = ["All", "Net Earned Premium", "Incurred Claims", "Incurred Claims Ratio"];

export default function ReinsuranceInsurance() {
  const [activeTab, setActiveTab] = useState("market-overview");
  const [selectedModule, setSelectedModule] = useState(null);
  const [showInsights, setShowInsights] = useState(false);

  const [selectedReinsurer, setSelectedReinsurer] = useState("");
  const [selectedFinancialYear, setSelectedFinancialYear] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("");
  const [selectedMetric, setSelectedMetric] = useState("");

  const isOperationalAnalysis =
    activeTab === "premium-underwriting" && selectedModule === "operational-analysis";

  const metricOptions = useMemo(() => {
    if (isOperationalAnalysis) {
      return ["Net Earned Premium", "Incurred Claims", "Incurred Claims Ratio"];
    }
    return BASE_METRIC_OPTIONS;
  }, [isOperationalAnalysis]);

  const filterConfig = useMemo(
    () => [
      {
        label: "Select Reinsurer",
        options: ["All Reinsurers", "Indian Reinsurer", "FRB"],
        value: selectedReinsurer,
        onChange: setSelectedReinsurer,
      },
      {
        label: "Financial Year",
        options: ["2024-25", "2023-24", "2022-23", "2021-22"],
        value: selectedFinancialYear,
        onChange: setSelectedFinancialYear,
      },
      {
        label: "Category",
        options: ["All", "Treaty", "Facultative"],
        value: selectedCategory,
        onChange: setSelectedCategory,
      },
      {
        label: "Segment",
        options: ["All", "Fire", "Marine", "Motor", "Miscellaneous"],
        value: selectedSegment,
        onChange: setSelectedSegment,
      },
      {
        label: "Metric",
        options: metricOptions,
        value: metricOptions.includes(selectedMetric) ? selectedMetric : "",
        onChange: setSelectedMetric,
      },
    ],
    [
      selectedReinsurer,
      selectedFinancialYear,
      selectedCategory,
      selectedSegment,
      selectedMetric,
      metricOptions,
    ]
  );

  const handleResetFilters = () => {
    setSelectedReinsurer("");
    setSelectedFinancialYear("");
    setSelectedCategory("");
    setSelectedSegment("");
    setSelectedMetric("");
  };

  const handleExportData = () => {
    return;
  };

  const getTabAccent = (tabId) => {
    const tabAccents = {
      "market-overview": "#0ea5a4",
      "premium-underwriting": "#f59e0b",
      "retention-capacity": "#8b5cf6",
      financials: "#6366f1",
    };
    return tabAccents[tabId] || "#0ea5a4";
  };

  return (
    <div className="life-insurance-viewport reinsurance-theme">
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
            {isOperationalAnalysis && (
              <p className="panel-placeholder">Metric Toggle (UI placeholder)</p>
            )}
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
