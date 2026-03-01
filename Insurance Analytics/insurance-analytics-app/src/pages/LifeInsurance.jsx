import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { 
  BarChart3, TrendingUp, AlertTriangle, DollarSign, Globe, Shield,
  FileText, PieChart, MapPin, Files, CheckCircle, Building2,
  Banknote, BarChart2, Link2, CreditCard, TrendingDown, Sprout,
  Zap, Clock, Search, Calendar, Gem, Pin, Users, Briefcase,
  Shuffle, Building, Network, Phone, Scale, Heart
} from "lucide-react";
import "../styles/life-insurance.css";

const TABS = [
  { id: "market-overview", label: "Market Overview", icon: BarChart3 },
  { id: "insurer-performance", label: "Insurer Performance & Analysis", icon: TrendingUp },
  { id: "claims-risk", label: "Claims & Risk Analysis", icon: AlertTriangle },
  { id: "financials", label: "Financials", icon: DollarSign },
  { id: "distribution", label: "Distribution", icon: Globe },
  { id: "grievances", label: "Grievances & Policyholder Protection", icon: Shield },
];

const SUB_MODULES = {
  "market-overview": [
    { id: 1, title: "Insurer Basic Details", icon: FileText },
    { id: 2, title: "Total Premium — Segment Analysis", icon: PieChart },
    { id: 3, title: "State Wise Analysis", icon: MapPin },
    { id: 4, title: "Number of Individual Policies", icon: Files },
    { id: 5, title: "Solvency Ratio", icon: CheckCircle },
    { id: 6, title: "Assets Under Management (AUM)", icon: Building2 },
  ],
  "insurer-performance": [
    { id: 1, title: "Total & New Business Premium", icon: Banknote },
    { id: 2, title: "Inforce Individual Business", icon: BarChart2 },
    { id: 3, title: "Premium Analysis — Linked vs Non-Linked", icon: Link2 },
    { id: 4, title: "Commission Analysis", icon: CreditCard },
    { id: 5, title: "Persistency & Lapses", icon: TrendingDown },
    { id: 6, title: "Rural & Social Sector Obligations", icon: Sprout },
  ],
  "claims-risk": [
    { id: 1, title: "Death Claims Analysis", icon: Zap },
    { id: 2, title: "Duration Wise Settlement", icon: Clock },
    { id: 3, title: "Micro Insurance Death Claims", icon: Search },
    { id: 4, title: "Micro Insurance Duration Settlement", icon: Calendar },
  ],
  financials: [
    { id: 1, title: "AUM — Insurer Wise", icon: Gem },
    { id: 2, title: "Equity Share Capital", icon: Pin },
    { id: 3, title: "Policyholder Accounts", icon: Users },
    { id: 4, title: "Shareholder Accounts", icon: Briefcase },
    { id: 5, title: "Balance Sheet", icon: FileText },
  ],
  distribution: [
    { id: 1, title: "Commission Distribution", icon: Shuffle },
    { id: 2, title: "State Wise Offices", icon: Building },
    { id: 3, title: "Region Wise Offices", icon: Network },
  ],
  grievances: [
    { id: 1, title: "Status of Grievances", icon: Phone },
    { id: 2, title: "Ombudsman Performance", icon: Scale },
  ],
};

export default function LifeInsurance() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("market-overview");
  const [selectedModule, setSelectedModule] = useState(null);

  return (
    <div className="life-insurance-viewport">
      {/* Breadcrumb Navigation */}
      <div className="life-breadcrumb">
        <button className="breadcrumb-link" onClick={() => navigate("/dashboard")}>
          ← Dashboard
        </button>
        <span className="breadcrumb-separator">›</span>
        <button className="breadcrumb-link" onClick={() => navigate("/dashboard/handbook")}>
          Insurance Handbook
        </button>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">Life</span>
      </div>

      {/* Page Title */}
      <div className="life-header">
        <div className="life-title-wrapper">
          <div className="life-icon-badge">
            <Heart className="life-icon" size={20} strokeWidth={2} />
          </div>
          <h1 className="life-title">Life Insurance</h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="life-tabs">
        {TABS.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              className={`life-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <IconComponent className="life-tab-icon" size={16} strokeWidth={2} />
              <span className="life-tab-label">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-Modules Row */}
      <div className="life-submodules">
        {SUB_MODULES[activeTab]?.map((module) => {
          const IconComponent = module.icon;
          return (
            <div
              key={module.id}
              className={`life-submodule ${selectedModule === module.id ? "selected" : ""}`}
              onClick={() => setSelectedModule(module.id)}
            >
              <div className="submodule-icon">
                <IconComponent size={20} strokeWidth={2} />
              </div>
              <span className="submodule-name">{module.title}</span>
            </div>
          );
        })}
      </div>

      {/* Main Content Area - 3 Column Layout */}
      <div className="life-content">
        {/* Left: Filters Panel */}
        <div className="life-filters">
          <div className="panel-header">
            <div className="panel-icon-badge">
              <Shuffle size={14} strokeWidth={2} />
            </div>
            <h3 className="panel-title">Filters</h3>
          </div>
          <div className="filters-body">
            <FilterSelect label="Select Insurer" options={["All Insurers", "LIC", "HDFC Life", "ICICI Prudential", "SBI Life"]} />
            <FilterSelect label="Financial Year" options={["2024-25", "2023-24", "2022-23", "2021-22"]} />
            <FilterSelect label="Category" options={["All", "Linked", "Non-Linked"]} />
            <FilterSelect label="Segment" options={["All", "Life", "Pension", "Health", "Annuity"]} />
            <FilterSelect label="Premium Type" options={["Total", "First Year", "Renewal", "Single"]} />
          </div>
        </div>

        {/* Center: Data Panel */}
        <div className="life-data-panel">
          <div className="panel-header">
            <div className="panel-icon-badge">
              <BarChart3 size={14} strokeWidth={2} />
            </div>
            <h3 className="panel-title">Data Panel</h3>
          </div>
          <div className="panel-body">
            <p className="panel-placeholder">Select an insurer to view analytics.</p>
          </div>
        </div>

        {/* Right: Visualization Panel */}
        <div className="life-viz-panel">
          <div className="panel-header">
            <div className="panel-icon-badge">
              <TrendingUp size={14} strokeWidth={2} />
            </div>
            <h3 className="panel-title">Visualization Panel</h3>
          </div>
          <div className="panel-body">
            <p className="panel-placeholder">Select an insurer to view analytics.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({ label, options }) {
  return (
    <div className="filter-item">
      <label className="filter-label">{label}</label>
      <select className="filter-select">
        {options.map((opt, idx) => (
          <option key={idx}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
