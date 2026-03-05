import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart2,
  BarChart3,
  Building2,
  FileText,
  Globe,
  Handshake,
  LineChart as LineChartIcon,
  MapPin,
  RefreshCw,
  Shield,
  Shuffle,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import { db } from "../firebase/firebaseConfig";
import { getInsurerTrend, getSectorAggregate } from "../services/lifeAgentsService";
import "../styles/life-insurance.css";

const TABS = [
  { id: "distribution-workforce", label: "Distribution Workforce", icon: Users },
  { id: "state-wise-analysis", label: "State Wise Analysis", icon: MapPin },
  { id: "intermediary-efficiency", label: "Intermediary Efficiency", icon: TrendingUp },
  {
    id: "life-business-distribution",
    label: "Life – Business Distribution",
    icon: BarChart3,
  },
  {
    id: "non-life-business-distribution",
    label: "Non-Life – Business Distribution",
    icon: Globe,
  },
];

const SUB_MODULES = {
  "distribution-workforce": [
    {
      id: "individual-agents-life",
      title: "Individual Agents of Life Insurers",
      icon: UserRound,
    },
    {
      id: "corporate-agents-life",
      title: "Corporate Agents of Life Insurers",
      icon: Building2,
    },
    {
      id: "micro-insurance-agents-life",
      title: "Micro Insurance Agents (Life)",
      icon: Shield,
    },
  ],
  "state-wise-analysis": [
    {
      id: "distribution-individual-agents-life",
      title: "Distribution of Individual Agents of Life Insurers",
      icon: MapPin,
    },
    {
      id: "registered-brokers",
      title: "Number of Registered Brokers",
      icon: Handshake,
    },
    {
      id: "insurance-marketing-firms",
      title: "Number of Insurance Marketing Firms",
      icon: Building2,
    },
  ],
  "intermediary-efficiency": [
    {
      id: "avg-policies-sold",
      title: "Average Number of Individual Policies Sold",
      icon: BarChart2,
    },
    {
      id: "avg-new-business-premium",
      title: "Average New Business Premium Income",
      icon: LineChartIcon,
    },
    {
      id: "avg-premium-per-policy",
      title: "Average Premium Income per Policy",
      icon: TrendingUp,
    },
  ],
  "life-business-distribution": [
    {
      id: "individual-new-business",
      title: "Individual New Business",
      icon: FileText,
    },
    {
      id: "insurer-wise-individual-new-business",
      title: "Insurer-wise Individual New Business",
      icon: BarChart3,
    },
    {
      id: "group-new-business",
      title: "Group New Business",
      icon: Users,
    },
    {
      id: "insurer-wise-group-new-business",
      title: "Insurer-wise Group New Business",
      icon: BarChart2,
    },
  ],
  "non-life-business-distribution": [
    {
      id: "general-insurance-business",
      title: "General Insurance Business",
      icon: Globe,
    },
    {
      id: "health-insurance-business",
      title: "Health Insurance Business",
      icon: Shield,
    },
  ],
};

export default function IntermediariesInsurance() {
  const [activeTab, setActiveTab] = useState("distribution-workforce");
  const [selectedModule, setSelectedModule] = useState("individual-agents-life");

  const [agentInsurerOptions, setAgentInsurerOptions] = useState(["All Insurers"]);
  const [selectedAgentInsurer, setSelectedAgentInsurer] = useState("All Insurers");
  const [selectedAgentSector, setSelectedAgentSector] = useState("Both");
  const [rawData, setRawData] = useState([]);
  const [data, setData] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [agentsError, setAgentsError] = useState("");
  const [showTimelinePicker, setShowTimelinePicker] = useState(false);
  const [timelineStartYear, setTimelineStartYear] = useState("");
  const [timelineEndYear, setTimelineEndYear] = useState("");

  const [selectedInsurer, setSelectedInsurer] = useState("All Insurers");
  const [selectedFinancialYear, setSelectedFinancialYear] = useState("2024-25");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSegment, setSelectedSegment] = useState("All");
  const [selectedState, setSelectedState] = useState("All");
  const [selectedMetric, setSelectedMetric] = useState("All");

  const isIndividualAgentsView =
    activeTab === "distribution-workforce" && selectedModule === "individual-agents-life";

  useEffect(() => {
    const fetchInsurers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "life_individual_agents"));
        const insurerNames = Array.from(
          new Set(
            snapshot.docs
              .map((item) => String(item.data()?.insurer || "").trim())
              .filter(Boolean)
          )
        ).sort((first, second) => first.localeCompare(second));

        setAgentInsurerOptions(["All Insurers", ...insurerNames]);
      } catch (error) {
        console.error("Failed to fetch insurer options:", error);
      }
    };

    fetchInsurers();
  }, []);

  useEffect(() => {
    const loadDefaultTrend = async () => {
      if (!isIndividualAgentsView) {
        return;
      }

      setAgentsLoading(true);
      setAgentsError("");

      try {
        const result = await getSectorAggregate("Both");
        setRawData(result);
      } catch (error) {
        console.error("Failed to load default agents trend:", error);
        setAgentsError("Unable to load data.");
        setRawData([]);
        setData([]);
      } finally {
        setAgentsLoading(false);
      }
    };

    loadDefaultTrend();
  }, [isIndividualAgentsView]);

  useEffect(() => {
    if (rawData.length === 0) {
      setTimelineStartYear("");
      setTimelineEndYear("");
      setData([]);
      return;
    }

    const yearValues = rawData
      .map((item) => Number(item.year))
      .filter((year) => Number.isFinite(year))
      .sort((first, second) => first - second);

    const minimumYear = String(yearValues[0]);
    const maximumYear = String(yearValues[yearValues.length - 1]);

    const effectiveStart = timelineStartYear || minimumYear;
    const effectiveEnd = timelineEndYear || maximumYear;

    if (!timelineStartYear) {
      setTimelineStartYear(minimumYear);
    }

    if (!timelineEndYear) {
      setTimelineEndYear(maximumYear);
    }

    const startYear = Number(effectiveStart);
    const endYear = Number(effectiveEnd);

    const filteredData = rawData.filter((item) => {
      const itemYear = Number(item.year);
      return itemYear >= startYear && itemYear <= endYear;
    });

    setData(filteredData);
  }, [rawData, timelineStartYear, timelineEndYear]);

  const timelineYearOptions = useMemo(
    () => rawData.map((item) => Number(item.year)).filter((year) => Number.isFinite(year)),
    [rawData]
  );

  const filterConfig = useMemo(
    () => [
      {
        label: "Select Insurer",
        options: ["All Insurers", "Life Insurers", "General Insurers"],
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
        options: ["All", "Individual", "Corporate"],
        value: selectedCategory,
        onChange: setSelectedCategory,
      },
      {
        label: "Segment",
        options: ["All", "Life", "Non-Life", "Health"],
        value: selectedSegment,
        onChange: setSelectedSegment,
      },
      {
        label: "State",
        options: ["All", "Andhra Pradesh", "Karnataka", "Maharashtra", "Tamil Nadu"],
        value: selectedState,
        onChange: setSelectedState,
      },
      {
        label: "Metric",
        options: ["All", "Count", "Premium", "Average"],
        value: selectedMetric,
        onChange: setSelectedMetric,
      },
    ],
    [
      selectedInsurer,
      selectedFinancialYear,
      selectedCategory,
      selectedSegment,
      selectedState,
      selectedMetric,
    ]
  );

  const selectedSubModuleTitle =
    SUB_MODULES[activeTab]?.find((module) => module.id === selectedModule)?.title || "Overview";

  const handleResetFilters = () => {
    if (isIndividualAgentsView) {
      setSelectedAgentInsurer("All Insurers");
      setSelectedAgentSector("Both");
      setShowTimelinePicker(false);
      setAgentsError("");
      return;
    }

    setSelectedInsurer("All Insurers");
    setSelectedFinancialYear("2024-25");
    setSelectedCategory("All");
    setSelectedSegment("All");
    setSelectedState("All");
    setSelectedMetric("All");
  };

  const handleApplyFilters = async () => {
    if (!isIndividualAgentsView) {
      return;
    }

    setAgentsLoading(true);
    setAgentsError("");

    try {
      const result =
        selectedAgentInsurer !== "All Insurers"
          ? await getInsurerTrend(selectedAgentInsurer)
          : await getSectorAggregate(selectedAgentSector);

      setRawData(result);
    } catch (error) {
      console.error("Failed to apply individual agents filters:", error);
      setAgentsError("Unable to load data for selected filters.");
      setRawData([]);
      setData([]);
    } finally {
      setAgentsLoading(false);
    }
  };

  const handleExportData = async () => {
    if (!isIndividualAgentsView || data.length === 0) {
      return;
    }

    const activeFilters = [
      { label: "Select Insurer", value: selectedAgentInsurer },
      { label: "Sector", value: selectedAgentSector },
    ];

    const dataRows = data.map((row) => [row.year, Number(row.agents || 0).toLocaleString("en-IN")]);

    const exportRows = [
      ["Sub Module", selectedSubModuleTitle],
      [],
      ["Applied Filters", "Value"],
      ...activeFilters.map((filter) => [filter.label, formatFieldValue(filter.value)]),
      [],
      ["Year", "Agents"],
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
                setSelectedModule(
                  tab.id === "distribution-workforce" ? "individual-agents-life" : null
                );
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
            {isIndividualAgentsView ? (
              <>
                <FilterSelect
                  label="Select Insurer"
                  options={agentInsurerOptions}
                  value={selectedAgentInsurer}
                  onChange={setSelectedAgentInsurer}
                />
                <FilterSelect
                  label="Sector"
                  options={["Both", "Public", "Private"]}
                  value={selectedAgentSector}
                  onChange={setSelectedAgentSector}
                  disabled={selectedAgentInsurer !== "All Insurers"}
                />
                <button
                  type="button"
                  className="data-export-btn"
                  onClick={handleApplyFilters}
                  title="Apply Filters"
                >
                  Apply Filters
                </button>
              </>
            ) : (
              filterConfig.map((filter) => (
                <FilterSelect
                  key={filter.label}
                  label={filter.label}
                  options={filter.options}
                  value={filter.value}
                  onChange={filter.onChange}
                />
              ))
            )}
          </div>
        </div>

        <div className="life-data-panel card">
          <div className="panel-header">
            <div className="panel-icon-badge">
              <BarChart3 size={14} strokeWidth={2} />
            </div>
            <h3 className="panel-title section-title">Data Panel</h3>
            {isIndividualAgentsView && (
              <button
                type="button"
                className="data-export-btn"
                onClick={() => setShowTimelinePicker((previous) => !previous)}
                title="Select Timeline"
              >
                Select Timeline
              </button>
            )}
            <button
              type="button"
              className="data-export-btn panel-action-btn"
              onClick={handleExportData}
              title="Export to Excel"
            >
              Export to Excel
            </button>
          </div>
          <div className="panel-body">
            {isIndividualAgentsView ? (
              agentsLoading ? (
                <p className="panel-placeholder">Loading data...</p>
              ) : agentsError ? (
                <p className="panel-placeholder">{agentsError}</p>
              ) : data.length > 0 ? (
                <>
                  {showTimelinePicker && timelineYearOptions.length > 0 && (
                    <div className="timeline-filter-row">
                      <div className="timeline-field">
                        <label className="filter-label label-text">From</label>
                        <select
                          className="filter-select timeline-select"
                          value={timelineStartYear}
                          onChange={(event) => {
                            const nextStartYear = event.target.value;
                            setTimelineStartYear(nextStartYear);

                            if (timelineEndYear && Number(nextStartYear) > Number(timelineEndYear)) {
                              setTimelineEndYear(nextStartYear);
                            }
                          }}
                        >
                          {timelineYearOptions.map((year) => (
                            <option key={`start-${year}`} value={String(year)}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="timeline-field">
                        <label className="filter-label label-text">To</label>
                        <select
                          className="filter-select timeline-select"
                          value={timelineEndYear}
                          onChange={(event) => {
                            const nextEndYear = event.target.value;
                            setTimelineEndYear(nextEndYear);

                            if (timelineStartYear && Number(nextEndYear) < Number(timelineStartYear)) {
                              setTimelineStartYear(nextEndYear);
                            }
                          }}
                        >
                          {timelineYearOptions.map((year) => (
                            <option key={`end-${year}`} value={String(year)}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                  <div className="data-table-container">
                    <table className="segment-data-table">
                      <thead>
                        <tr>
                          <th className="col-year">Year</th>
                          <th className="col-value">Agents</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((item) => (
                          <tr key={item.year}>
                            <td className="col-year">{item.year}</td>
                            <td className="col-value">{Number(item.agents || 0).toLocaleString("en-IN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="panel-placeholder">No data found for selected filters.</p>
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
            {isIndividualAgentsView ? (
              agentsLoading ? (
                <p className="panel-placeholder">Loading visualization...</p>
              ) : agentsError ? (
                <p className="panel-placeholder">{agentsError}</p>
              ) : data.length > 0 ? (
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={data} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
                      <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.22)" />
                      <XAxis dataKey="year" tickLine={false} axisLine={false} stroke="var(--text-secondary)" />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        stroke="var(--text-secondary)"
                        tickFormatter={(value) => Number(value).toLocaleString("en-IN")}
                      />
                      <Tooltip
                        formatter={(value) => Number(value).toLocaleString("en-IN")}
                        contentStyle={{
                          backgroundColor: "var(--bg-surface-solid)",
                          border: "1px solid var(--border-default)",
                          borderRadius: "8px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="agents"
                        stroke="var(--accent-primary)"
                        strokeWidth={2.2}
                        dot={{ fill: "#ffffff", stroke: "var(--accent-primary)", strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="panel-placeholder">No data found for selected filters.</p>
              )
            ) : (
              <div className="chart-wrapper">
                <p className="panel-placeholder">Select filters to view analytics.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({ label, options, value, onChange, disabled = false }) {
  return (
    <div className="filter-item">
      <label className="filter-label label-text">{label}</label>
      <select
        className="filter-select"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.value)}
      >
        {options.map((opt, idx) => (
          <option key={idx}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function formatFieldValue(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
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
