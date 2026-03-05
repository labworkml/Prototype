import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";
import {
  AlertTriangle,
  BarChart2,
  BarChart3,
  Building,
  Building2,
  CheckCircle,
  CreditCard,
  FileText,
  Globe,
  IndianRupeeIcon,
  Landmark,
  LayoutGrid,
  MapPin,
  PieChart,
  RefreshCw,
  Scale,
  Shield,
  Shuffle,
  TrendingUp,
  Users,
} from "lucide-react";
import { db } from "../firebase/firebaseConfig";
import "../styles/life-insurance.css";

const TABS = [
  { id: "market-overview", label: "Market Overview", icon: BarChart3 },
  { id: "insurer-performance", label: "Insurer Performance & Analysis", icon: TrendingUp },
  { id: "claims-risk", label: "Claims & Risk Analysis", icon: AlertTriangle },
  { id: "financials", label: "Financials", icon: IndianRupeeIcon },
  { id: "distribution", label: "Distribution", icon: Globe },
  { id: "grievances", label: "Grievances & Policyholder Protection", icon: Shield },
];

const SUB_MODULES = {
  "market-overview": [
    { id: "insurer-details", title: "Insurer Details", icon: FileText },
    { id: "state-wise-analysis", title: "State Wise Analysis", icon: MapPin },
    { id: "issued-policies", title: "Number of Issued Policies", icon: LayoutGrid },
    { id: "aum", title: "Assets Under Management (AUM)", icon: Building2 },
    { id: "solvency-ratio", title: "Solvency Ratio", icon: CheckCircle },
  ],
  "insurer-performance": [
    { id: "gross-direct-premium", title: "Gross Direct Premium", icon: IndianRupeeIcon },
    { id: "premium-segment-analysis", title: "Premium – Segment Analysis", icon: PieChart },
    { id: "operational-analysis", title: "Operational Analysis", icon: BarChart2 },
    {
      id: "rural-social-sector",
      title: "Rural and Social Sector Obligations",
      icon: Users,
    },
  ],
  "claims-risk": [
    { id: "underwriting-experience", title: "Underwriting Experience", icon: Shuffle },
    { id: "status-of-claims", title: "Status of Claims", icon: FileText },
  ],
  financials: [
    { id: "aum-insurer-wise", title: "Assets Under Management – Insurer Wise", icon: Building2 },
    { id: "equity-share-capital", title: "Equity Share Capital", icon: CreditCard },
    { id: "policyholder-accounts", title: "Policyholder Accounts", icon: Users },
    { id: "shareholder-accounts", title: "Shareholder Accounts", icon: Landmark },
    { id: "balance-sheet", title: "Balance Sheet", icon: FileText },
  ],
  distribution: [
    { id: "state-wise-office-distribution", title: "State Wise Distribution of Offices", icon: Building },
  ],
  grievances: [
    { id: "status-of-grievances", title: "Status of Grievances", icon: AlertTriangle },
    { id: "ombudsman-performance", title: "Performance of Ombudsman", icon: Scale },
  ],
};

export default function GeneralInsurance() {
  const [activeTab, setActiveTab] = useState("market-overview");
  const [selectedModule, setSelectedModule] = useState("insurer-details");

  const [insurers, setInsurers] = useState([]);
  const [insurersLoading, setInsurersLoading] = useState(false);
  const [insurersError, setInsurersError] = useState("");
  const [selectedInsurerRegNo, setSelectedInsurerRegNo] = useState("");

  const [selectedInsurerDetails, setSelectedInsurerDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const isInsurerDetailsView =
    activeTab === "market-overview" && selectedModule === "insurer-details";

  useEffect(() => {
    const fetchInsurers = async () => {
      setInsurersLoading(true);
      setInsurersError("");

      try {
        const snapshot = await getDocs(collection(db, "master_nonlife_insurers"));
        const mappedInsurers = snapshot.docs
          .map((item) => {
            const data = item.data();
            return {
              regNo: String(data.reg_no ?? item.id ?? "").trim(),
              insurerName: String(data.insurer_name ?? "").trim(),
            };
          })
          .filter((item) => item.regNo && item.insurerName)
          .sort((first, second) => first.insurerName.localeCompare(second.insurerName));

        setInsurers(mappedInsurers);
      } catch (error) {
        console.error("Failed to fetch non-life insurers:", error);
        setInsurersError("Unable to load insurers.");
      } finally {
        setInsurersLoading(false);
      }
    };

    fetchInsurers();
  }, []);

  useEffect(() => {
    const fetchSelectedInsurer = async () => {
      if (!selectedInsurerRegNo) {
        setSelectedInsurerDetails(null);
        setDetailsError("");
        return;
      }

      setDetailsLoading(true);
      setDetailsError("");

      try {
        const insurerReference = doc(db, "master_nonlife_insurers", selectedInsurerRegNo);
        const insurerSnapshot = await getDoc(insurerReference);

        if (!insurerSnapshot.exists()) {
          setSelectedInsurerDetails(null);
          setDetailsError("Insurer details not found.");
          return;
        }

        setSelectedInsurerDetails(insurerSnapshot.data());
      } catch (error) {
        console.error("Failed to fetch insurer details:", error);
        setSelectedInsurerDetails(null);
        setDetailsError("Unable to load insurer details.");
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchSelectedInsurer();
  }, [selectedInsurerRegNo]);

  const insurerOptions = useMemo(
    () => insurers.map((insurer) => ({ label: insurer.insurerName, value: insurer.regNo })),
    [insurers]
  );

  const filterConfig = useMemo(
    () => [
      {
        label: "Select Insurer",
        options: insurerOptions,
        value: selectedInsurerRegNo,
        onChange: setSelectedInsurerRegNo,
      },
    ],
    [insurerOptions, selectedInsurerRegNo]
  );

  const insurerDetailRows = useMemo(() => {
    if (!selectedInsurerDetails) {
      return [];
    }

    return [
      { label: "Insurer Name", value: selectedInsurerDetails.insurer_name },
      {
        label: "Registration Number",
        value: selectedInsurerDetails.reg_no ?? selectedInsurerRegNo,
      },
      {
        label: "Date of Registration",
        value: selectedInsurerDetails.date_of_registration,
      },
      { label: "Sector", value: selectedInsurerDetails.sector },
      { label: "Category", value: selectedInsurerDetails.category },
      {
        label: "Foreign Partners / Investors",
        value: getForeignPartnersValue(selectedInsurerDetails),
      },
    ];
  }, [selectedInsurerDetails, selectedInsurerRegNo]);

  const selectedSubModuleTitle =
    SUB_MODULES[activeTab]?.find((module) => module.id === selectedModule)?.title || "Overview";

  const handleResetFilters = () => {
    setSelectedInsurerRegNo("");
    setSelectedInsurerDetails(null);
    setDetailsError("");
  };

  const handleExportData = async () => {
    if (!isInsurerDetailsView || !selectedInsurerRegNo || insurerDetailRows.length === 0) {
      return;
    }

    const selectedInsurerOption = insurerOptions.find(
      (insurer) => insurer.value === selectedInsurerRegNo
    );

    const activeFilters = [
      {
        label: "Select Insurer",
        value: selectedInsurerOption?.label || "-",
      },
    ];

    const dataRows = insurerDetailRows.map((row) => [row.label, formatFieldValue(row.value)]);

    const exportRows = [
      ["Sub Module", selectedSubModuleTitle],
      [],
      ["Applied Filters", "Value"],
      ...activeFilters.map((filter) => [filter.label, formatFieldValue(filter.value)]),
      [],
      ["Data Panel Fields", "Value"],
      ...dataRows,
    ];

    const fileBaseName = buildExportFileName(selectedSubModuleTitle, activeFilters);

    try {
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
      <div className="life-tabs">
        {TABS.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              className={`life-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedModule(tab.id === "market-overview" ? "insurer-details" : null);
              }}
            >
              <IconComponent className="life-tab-icon" size={16} strokeWidth={2} />
              <span className="life-tab-label label-text">{tab.label}</span>
            </button>
          );
        })}
      </div>

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

      <div className="life-content">
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
            {insurersLoading && <p className="panel-placeholder">Loading insurers...</p>}
            {insurersError && !insurersLoading && (
              <p className="panel-placeholder">{insurersError}</p>
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
          <div className={`panel-body ${isInsurerDetailsView ? "panel-body-details" : ""}`}>
            {isInsurerDetailsView ? (
              detailsLoading ? (
                <p className="panel-placeholder">Loading insurer details...</p>
              ) : detailsError ? (
                <p className="panel-placeholder">{detailsError}</p>
              ) : !selectedInsurerRegNo ? (
                <p className="panel-placeholder">Select an insurer to view details.</p>
              ) : insurerDetailRows.length > 0 ? (
                <div className="data-fields-list">
                  {insurerDetailRows.map((row) => (
                    <DataRow key={row.label} label={row.label} value={row.value} />
                  ))}
                </div>
              ) : (
                <p className="panel-placeholder">Select an insurer to view details.</p>
              )
            ) : (
              <div className="data-table-container">
                <p className="panel-placeholder">Select filters to view analytics.</p>
              </div>
            )}
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
        <option value="">Select insurer</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
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
    return value.toDate().toLocaleDateString("en-IN");
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ") || "-";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function getForeignPartnersValue(insurerDetails) {
  return (
    insurerDetails.foreign_partners_or_investors ??
    insurerDetails.foreign_partners_investors ??
    insurerDetails.foreign_partners_investor ??
    insurerDetails.foreign_partners ??
    insurerDetails.foreign_investors ??
    insurerDetails.foreign_partner ??
    insurerDetails.foreign_partner_investor ??
    "-"
  );
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
