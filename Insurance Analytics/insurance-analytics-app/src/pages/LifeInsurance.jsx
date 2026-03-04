import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";
import {
  LineChart,
  BarChart,
  AreaChart,
  PieChart as RechartsPieChart,
  Line,
  Bar,
  Area,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { 
  BarChart3, TrendingUp, AlertTriangle, DollarSign, Globe, Shield,
  FileText, PieChart, MapPin, Files, CheckCircle, Building2,
  Banknote, BarChart2, Link2, CreditCard, TrendingDown, Sprout,
  Zap, Clock, Search, Calendar, Gem, Pin, Users, Briefcase,
  Shuffle, Building, Network, Phone, Scale, RefreshCw,
  IndianRupeeIcon
} from "lucide-react";
import { db } from "../firebase/firebaseConfig";
import SegmentAnalysisFilters from "../components/SegmentAnalysisFilters";
import { 
  fetchSegmentPremiumData, 
  transformToTableRows, 
  transformToChartData 
} from "../firebase/segmentAnalysisService";
import "../styles/life-insurance.css";

const TABS = [
  { id: "market-overview", label: "Market Overview", icon: BarChart3 },
  { id: "insurer-performance", label: "Insurer Performance & Analysis", icon: TrendingUp },
  { id: "claims-risk", label: "Claims & Risk Analysis", icon: AlertTriangle },
  { id: "financials", label: "Financials", icon: IndianRupeeIcon},
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
  // Segment Analysis Filters
  const [segmentCategory, setSegmentCategory] = useState("");
  const [segmentType, setSegmentType] = useState("");
  const [segmentParticipation, setSegmentParticipation] = useState("");
  const [segmentPremiumType, setSegmentPremiumType] = useState("");
  const [segmentViewMode, setSegmentViewMode] = useState("amount");

  // Applied Segment Analysis Filters (trigger data fetch)
  const [appliedSegmentCategory, setAppliedSegmentCategory] = useState("");
  const [appliedSegmentType, setAppliedSegmentType] = useState("");
  const [appliedSegmentParticipation, setAppliedSegmentParticipation] = useState("");
  const [appliedSegmentPremiumType, setAppliedSegmentPremiumType] = useState("");
  const [appliedSegmentViewMode, setAppliedSegmentViewMode] = useState("amount");

  // Segment Analysis Data State
  const [segmentData, setSegmentData] = useState([]);
  const [segmentLoading, setSegmentLoading] = useState(false);
  const [segmentError, setSegmentError] = useState("");
  const [visualizationType, setVisualizationType] = useState("line"); // "line", "bar", "area", "pie"

  // Fetch Segment Analysis Data when filters are applied
  useEffect(() => {
    const fetchSegmentData = async () => {
      // Only fetch when on correct tab/module and all required filters are applied
      if (activeTab !== "market-overview" || selectedModule !== 2) {
        return;
      }

      if (!appliedSegmentCategory || !appliedSegmentType || 
          !appliedSegmentParticipation || !appliedSegmentPremiumType) {
        // Clear data if filters not fully selected
        setSegmentData([]);
        setSegmentError("");
        return;
      }

      try {
        setSegmentLoading(true);
        setSegmentError("");
        
        const data = await fetchSegmentPremiumData(
          appliedSegmentCategory,
          appliedSegmentType,
          appliedSegmentParticipation,
          appliedSegmentPremiumType
        );
        
        setSegmentData(data);
        
        if (data.length === 0) {
          setSegmentError("No data found for the selected filters.");
        }
      } catch (error) {
        console.error("Error fetching segment data:", error);
        setSegmentError("Failed to fetch data. Please try again.");
        setSegmentData([]);
      } finally {
        setSegmentLoading(false);
      }
    };

    fetchSegmentData();
  }, [
    activeTab, 
    selectedModule,
    appliedSegmentCategory, 
    appliedSegmentType, 
    appliedSegmentParticipation, 
    appliedSegmentPremiumType
  ]);

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

  const handleResetSegmentAnalysisFilters = () => {
    setSegmentCategory("");
    setSegmentType("");
    setSegmentParticipation("");
    setSegmentPremiumType("");
    setSegmentViewMode("amount");
    // Also clear applied filters
    setAppliedSegmentCategory("");
    setAppliedSegmentType("");
    setAppliedSegmentParticipation("");
    setAppliedSegmentPremiumType("");
    setAppliedSegmentViewMode("amount");
  };

  const handleApplySegmentFilters = () => {
    setAppliedSegmentCategory(segmentCategory);
    setAppliedSegmentType(segmentType);
    setAppliedSegmentParticipation(segmentParticipation);
    setAppliedSegmentPremiumType(segmentPremiumType);
    setAppliedSegmentViewMode(segmentViewMode);
  };

  const segmentChartData = useMemo(() => {
    return transformToChartData(segmentData, appliedSegmentViewMode).map((item) => ({
      year: item.year,
      value: Number(item.value) || 0,
    }));
  }, [segmentData, appliedSegmentViewMode]);

  const chartValueDomain = useMemo(() => {
    if (!segmentChartData.length) {
      return [0, 10];
    }

    const values = segmentChartData.map((item) => item.value);
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);

    if (minimum === maximum) {
      const padding = Math.max(1, Math.abs(minimum) * 0.15);
      return [Math.max(0, minimum - padding), maximum + padding];
    }

    const spread = maximum - minimum;
    return [Math.max(0, minimum - spread * 0.15), maximum + spread * 0.15];
  }, [segmentChartData]);

  const barChartValueDomain = useMemo(() => {
    if (!segmentChartData.length) {
      return [0, 10];
    }

    const maximum = Math.max(...segmentChartData.map((item) => item.value));
    const paddedMaximum = maximum <= 0 ? 10 : maximum + maximum * 0.1;

    return [0, paddedMaximum];
  }, [segmentChartData]);

  const formatChartAxisValue = (value) => {
    if (appliedSegmentViewMode === "percentage") {
      return `${Number(value).toFixed(0)}%`;
    }

    const numericValue = Number(value) || 0;

    if (Math.abs(numericValue) >= 10000000) {
      const crValue = numericValue / 10000000;
      return `${crValue.toFixed(1).replace(/\.0$/, "")}Cr`;
    }

    if (Math.abs(numericValue) >= 100000) {
      const lakhValue = numericValue / 100000;
      return `${lakhValue.toFixed(1).replace(/\.0$/, "")}L`;
    }

    return numericValue.toLocaleString("en-IN");
  };

  const formatChartTooltipValue = (value) => {
    const numericValue = Number(value) || 0;

    if (appliedSegmentViewMode === "percentage") {
      return `${numericValue.toFixed(2)}%`;
    }

    return numericValue.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleExportData = async () => {
    const isSegmentAnalysis = selectedModule === 2;

    const activeFilters = isSegmentAnalysis
      ? [
          { label: "Category", value: appliedSegmentCategory || "-" },
          { label: "Segment", value: appliedSegmentType || "-" },
          { label: "Participation", value: appliedSegmentParticipation || "-" },
          { label: "Premium Type", value: appliedSegmentPremiumType || "-" },
          {
            label: "View Mode",
            value: appliedSegmentViewMode === "percentage" ? "Percentage %" : "Amount ₹",
          },
        ]
      : filterConfig.map((filter) => ({
          label: filter.label,
          value: filter.value,
        }));

    const segmentTableRows = transformToTableRows(segmentData, appliedSegmentViewMode);
    const dataHeaderLabel =
      appliedSegmentViewMode === "percentage" ? "Percentage (%)" : "Amount in Cr (₹)";

    const dataRows = isSegmentAnalysis
      ? segmentTableRows.map((row) => [
          row.year,
          Number(row.value || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
        ])
      : displayedDataRows.map((row) => [row.label, formatFieldValue(row.value)]);

    const exportRows = [
      ["Sub Module", selectedSubModuleTitle],
      [],
      ["Applied Filters", "Value"],
      ...activeFilters.map((filter) => [filter.label, formatFieldValue(filter.value)]),
      [],
      isSegmentAnalysis ? ["Year", dataHeaderLabel] : ["Data Panel Fields", "Value"],
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
              onClick={selectedModule === 2 ? handleResetSegmentAnalysisFilters : handleResetFilters}
              aria-label="Reset filters"
              title="Reset filters"
            >
              <RefreshCw className="refresh-icon" size={18} strokeWidth={2.4} />
            </button>
          </div>
          <div className="filters-body">
            {selectedModule === 2 ? (
              <SegmentAnalysisFilters
                category={segmentCategory}
                setCategory={setSegmentCategory}
                segment={segmentType}
                setSegment={setSegmentType}
                participation={segmentParticipation}
                setParticipation={setSegmentParticipation}
                premiumType={segmentPremiumType}
                setPremiumType={setSegmentPremiumType}
                viewMode={segmentViewMode}
                setViewMode={setSegmentViewMode}
                onApply={handleApplySegmentFilters}
              />
            ) : (
              <>
                {filterConfig.map((filter) => (
                  <FilterSelect
                    key={filter.label}
                    label={filter.label}
                    options={filter.options}
                    value={filter.value}
                    onChange={filter.onChange}
                  />
                ))}
              </>
            )}
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
            ) : selectedModule === 2 ? (
              // Segment Analysis Module
              segmentLoading ? (
                <p className="panel-placeholder">Loading data...</p>
              ) : segmentError ? (
                <p className="panel-placeholder">{segmentError}</p>
              ) : segmentData.length > 0 ? (
                <div className="data-table-container">
                  <table className="segment-data-table">
                    <thead>
                      <tr>
                        <th className="col-index">#</th>
                        <th className="col-year">Year</th>
                        <th className="col-value">
                          {appliedSegmentViewMode === "amount" ? "Amount in Cr (₹)" : "Percentage (%)"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {transformToTableRows(segmentData, appliedSegmentViewMode).map((row, idx) => (
                        <tr key={idx}>
                          <td className="col-index">
                            <span className="row-number">{idx + 1}</span>
                          </td>
                          <td className="col-year">
                            <span className="year-badge">{row.year}</span>
                          </td>
                          <td className="col-value">
                            <span className="value-amount">
                              {row.value.toLocaleString('en-IN', { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 2 
                              })}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="panel-placeholder">Apply filters to view segment analysis data.</p>
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
            {selectedModule === 2 && segmentData.length > 0 && (
              <select
                value={visualizationType}
                onChange={(e) => setVisualizationType(e.target.value)}
                className="viz-type-dropdown"
              >
                <option value="line">Line Graph</option>
                <option value="bar">Bar Graph</option>
                <option value="histogram">Histogram</option>
                <option value="area">Area Graph</option>
                <option value="pie">Pie Chart</option>
              </select>
            )}
          </div>
          <div className="panel-body viz-panel-body">
            {selectedModule === 2 ? (
              // Segment Analysis Module
              segmentLoading ? (
                <p className="panel-placeholder">Loading visualization...</p>
              ) : segmentError ? (
                <p className="panel-placeholder">{segmentError}</p>
              ) : segmentData.length > 0 ? (
                <div className="chart-wrapper">
                  {visualizationType !== "pie" && segmentChartData.length > 0 && (
                    <div className="chart-value-chip">
                      {formatChartTooltipValue(segmentChartData[segmentChartData.length - 1].value)}
                    </div>
                  )}
                  {visualizationType === "line" && (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={segmentChartData} margin={{ top: 24, right: 16, left: 4, bottom: 8 }}>
                        <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.22)" />
                        <XAxis dataKey="year" tickLine={false} axisLine={false} stroke="var(--text-secondary)" />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          width={40}
                          domain={barChartValueDomain}
                          tickFormatter={formatChartAxisValue}
                          stroke="var(--text-secondary)"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--bg-surface-solid)",
                            border: "1px solid var(--border-default)",
                            borderRadius: "8px",
                          }}
                          formatter={(value) => formatChartTooltipValue(value)}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="var(--accent-primary)"
                          dot={{ fill: "#ffffff", stroke: "var(--accent-primary)", strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 5 }}
                          strokeWidth={2.2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                  {visualizationType === "bar" && (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={segmentChartData} margin={{ top: 24, right: 16, left: 4, bottom: 8 }}>
                        <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.22)" />
                        <XAxis dataKey="year" tickLine={false} axisLine={false} stroke="var(--text-secondary)" />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          width={40}
                          domain={barChartValueDomain}
                          tickFormatter={formatChartAxisValue}
                          stroke="var(--text-secondary)"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--bg-surface-solid)",
                            border: "1px solid var(--border-default)",
                            borderRadius: "8px",
                          }}
                          formatter={(value) => formatChartTooltipValue(value)}
                        />
                        <Bar
                          dataKey="value"
                          fill="var(--accent-primary)"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={34}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {visualizationType === "histogram" && (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={segmentChartData} margin={{ top: 24, right: 16, left: 4, bottom: 8 }} barCategoryGap="8%">
                        <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.22)" />
                        <XAxis dataKey="year" tickLine={false} axisLine={false} stroke="var(--text-secondary)" />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          width={40}
                          domain={chartValueDomain}
                          tickFormatter={formatChartAxisValue}
                          stroke="var(--text-secondary)"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--bg-surface-solid)",
                            border: "1px solid var(--border-default)",
                            borderRadius: "8px",
                          }}
                          formatter={(value) => formatChartTooltipValue(value)}
                        />
                        <Bar dataKey="value" fill="var(--accent-primary)" radius={[0, 0, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {visualizationType === "area" && (
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={segmentChartData} margin={{ top: 24, right: 16, left: 4, bottom: 8 }}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.22)" />
                        <XAxis dataKey="year" tickLine={false} axisLine={false} stroke="var(--text-secondary)" />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          width={40}
                          domain={chartValueDomain}
                          tickFormatter={formatChartAxisValue}
                          stroke="var(--text-secondary)"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--bg-surface-solid)",
                            border: "1px solid var(--border-default)",
                            borderRadius: "8px",
                          }}
                          formatter={(value) => formatChartTooltipValue(value)}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="var(--accent-primary)"
                          fillOpacity={1}
                          fill="url(#colorValue)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                  {visualizationType === "pie" && (
                    <ResponsiveContainer width="100%" height={250}>
                      <RechartsPieChart>
                        <Pie
                          data={segmentChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={90}
                          fill="var(--accent-primary)"
                          dataKey="value"
                        >
                          {segmentChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={[
                                "var(--accent-primary)",
                                "#3b82f6",
                                "#8b5cf6",
                                "#ec4899",
                              ][index % 4]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => formatChartTooltipValue(value)}
                          contentStyle={{
                            backgroundColor: "var(--bg-surface-solid)",
                            border: "1px solid var(--border-default)",
                            borderRadius: "8px",
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              ) : (
                <p className="panel-placeholder">Apply filters to view visualization.</p>
              )
            ) : (
              <p className="panel-placeholder">Select an insurer to view analytics.</p>
            )}
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
