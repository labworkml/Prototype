import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { 
  BarChart3, TrendingUp, AlertTriangle, DollarSign, Globe, Shield,
  FileText, PieChart, MapPin, Files, CheckCircle, Building2,
  Banknote, BarChart2, Link2, CreditCard, TrendingDown, Sprout,
  Zap, Clock, Search, Calendar, Gem, Pin, Users, Briefcase,
  Shuffle, Building, Network, Phone, Scale, RefreshCw
} from "lucide-react";
import { db } from "../firebase/firebaseConfig";
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
  const [activeTab, setActiveTab] = useState("market-overview");
  const [selectedModule, setSelectedModule] = useState(null);
  const [lifeInsurerDocs, setLifeInsurerDocs] = useState([]);
  const [selectedInsurer, setSelectedInsurer] = useState("All Insurers");
  const [selectedFinancialYear, setSelectedFinancialYear] = useState("2024-25");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSegment, setSelectedSegment] = useState("All");
  const [selectedPremiumType, setSelectedPremiumType] = useState("Total");
  const [insurersLoading, setInsurersLoading] = useState(false);
  const [insurersError, setInsurersError] = useState("");

  const showOnlyInsurerFilter = activeTab === "market-overview" && selectedModule === 1;

  useEffect(() => {
    if (!showOnlyInsurerFilter || lifeInsurerDocs.length > 0) {
      return;
    }

    const fetchInsurers = async () => {
      setInsurersLoading(true);
      setInsurersError("");

      try {
        const snapshot = await getDocs(collection(db, "masters_lifeinsurers"));
        const documents = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));
        setLifeInsurerDocs(documents);
      } catch (error) {
        console.error("Failed to fetch life insurers:", error);
        setInsurersError("Unable to load insurers.");
      } finally {
        setInsurersLoading(false);
      }
    };

    fetchInsurers();
  }, [showOnlyInsurerFilter, lifeInsurerDocs.length]);

  const insurerOptions = useMemo(() => {
    const names = lifeInsurerDocs
      .map((document) => document.insurer_name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    return ["All Insurers", ...names];
  }, [lifeInsurerDocs]);

  const selectedInsurerDocument = useMemo(() => {
    if (!showOnlyInsurerFilter || selectedInsurer === "All Insurers") {
      return null;
    }

    return lifeInsurerDocs.find((document) => document.insurer_name === selectedInsurer) || null;
  }, [showOnlyInsurerFilter, selectedInsurer, lifeInsurerDocs]);

  const selectedSubModuleTitle =
    SUB_MODULES[activeTab]?.find((module) => module.id === selectedModule)?.title || "Overview";

  const displayedDataRows = showOnlyInsurerFilter && selectedInsurerDocument
    ? [
        { label: "Name of the Insurer", value: selectedInsurerDocument.insurer_name },
        { label: "Registration Number", value: selectedInsurerDocument.reg_no },
        { label: "Category", value: selectedInsurerDocument.category },
        { label: "Sector", value: selectedInsurerDocument.sector },
        { label: "Date of Registration", value: selectedInsurerDocument.date_of_registration },
      ]
    : [];

  const filterConfig = showOnlyInsurerFilter
    ? [{ label: "Select Insurer", options: insurerOptions, value: selectedInsurer, onChange: setSelectedInsurer }]
    : [
        {
          label: "Select Insurer",
          options: ["All Insurers", "LIC", "HDFC Life", "ICICI Prudential", "SBI Life"],
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
          options: ["All", "Linked", "Non-Linked"],
          value: selectedCategory,
          onChange: setSelectedCategory,
        },
        {
          label: "Segment",
          options: ["All", "Life", "Pension", "Health", "Annuity"],
          value: selectedSegment,
          onChange: setSelectedSegment,
        },
        {
          label: "Premium Type",
          options: ["Total", "First Year", "Renewal", "Single"],
          value: selectedPremiumType,
          onChange: setSelectedPremiumType,
        },
      ];

  const handleResetFilters = () => {
    setSelectedInsurer("All Insurers");
    setSelectedFinancialYear("2024-25");
    setSelectedCategory("All");
    setSelectedSegment("All");
    setSelectedPremiumType("Total");
  };

  const handleExportData = async () => {
    const activeFilters = filterConfig.map((filter) => ({
      label: filter.label,
      value: filter.value,
    }));

    const exportRows = [
      ["Sub Module", selectedSubModuleTitle],
      [],
      ["Applied Filters", "Value"],
      ...activeFilters.map((filter) => [filter.label, formatFieldValue(filter.value)]),
      [],
      ["Data Panel Fields", "Value"],
      ...displayedDataRows.map((row) => [row.label, formatFieldValue(row.value)]),
    ];

    const fileBaseName = buildExportFileName(selectedSubModuleTitle, activeFilters);

    try {
      const xlsxModuleName = "xlsx";
      const XLSX = await import(/* @vite-ignore */ xlsxModuleName);
      const worksheet = XLSX.utils.aoa_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
      XLSX.writeFile(workbook, `${fileBaseName}.xlsx`);
      return;
    } catch (error) {
      const csvContent = exportRows
        .map((row) => row.map(escapeCsvValue).join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${fileBaseName}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="life-insurance-viewport">
      {/* Tab Navigation */}
      <div className="life-tabs">
        {TABS.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              className={`life-tab ${activeTab === tab.id ? "active" : ""}`}
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
              <span className="submodule-name card-title">{module.title}</span>
            </div>
          );
        })}
      </div>

      {/* Main Content Area - 3 Column Layout */}
      <div className="life-content">
        {/* Left: Filters Panel */}
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

        {/* Center: Data Panel */}
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
          <div className={`panel-body ${showOnlyInsurerFilter ? "panel-body-details" : ""}`}>
            {showOnlyInsurerFilter ? (
              insurersLoading ? (
                <p className="panel-placeholder">Loading insurers...</p>
              ) : insurersError ? (
                <p className="panel-placeholder">{insurersError}</p>
              ) : selectedInsurerDocument ? (
                <div className="data-fields-list">
                  {displayedDataRows.map((row) => (
                    <DataRow key={row.label} label={row.label} value={row.value} />
                  ))}
                </div>
              ) : (
                <p className="panel-placeholder">Select an insurer to view details.</p>
              )
            ) : (
              <p className="panel-placeholder">Select an insurer to view analytics.</p>
            )}
          </div>
        </div>

        {/* Right: Visualization Panel */}
        <div className="life-viz-panel card">
          <div className="panel-header">
            <div className="panel-icon-badge">
              <TrendingUp size={14} strokeWidth={2} />
            </div>
            <h3 className="panel-title section-title">Visualization Panel</h3>
          </div>
          <div className="panel-body">
            <p className="panel-placeholder">Select an insurer to view analytics.</p>
          </div>
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
        {options.map((opt, idx) => (
          <option key={idx}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function DataRow({ label, value }) {
  return (
    <div className="data-field-row">
      <span className="data-field-name">{label}</span>
      <span className="data-field-value">{formatFieldValue(value)}</span>
    </div>
  );
}

function formatFieldValue(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (value && typeof value.toDate === "function") {
    return value.toDate().toLocaleString();
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function buildExportFileName(subModuleTitle, filters) {
  const filterPart = filters
    .filter((filter) => filter.value && filter.value !== "All" && filter.value !== "All Insurers")
    .map((filter) => `${slugifyValue(filter.label)}-${slugifyValue(String(filter.value))}`)
    .join("_");

  const modulePart = slugifyValue(subModuleTitle);
  const datePart = new Date().toISOString().slice(0, 10);

  return [modulePart, filterPart, datePart].filter(Boolean).join("_");
}

function slugifyValue(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function escapeCsvValue(value) {
  const stringValue = value === undefined ? "" : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
}
