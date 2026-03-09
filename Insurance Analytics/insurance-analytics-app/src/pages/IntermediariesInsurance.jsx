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
import {
  getCorporateInsurerTrend,
  getCorporateSectorAggregate,
  getInsurerTrend,
  getMicroInsuranceInsurerTrend,
  getMicroInsuranceSectorAggregate,
  getSectorAggregate,
  getAvgPoliciesInsurerTrend,
  getAvgPoliciesSectorAggregate,
  getAvgPremiumInsurerTrend,
  getAvgPremiumSectorAggregate,
  getAvgPremiumPerPolicyInsurerTrend,
  getAvgPremiumPerPolicySectorAggregate,
  getStatewiseInsurers,
  getStatewiseStates,
  getStatewiseData,
  getRegisteredBrokersStates,
  getRegisteredBrokersData,
  getImfStates,
  getImfData,
} from "../services/lifeAgentsService";
import "../styles/life-insurance.css";

const DISTRIBUTION_AGENT_MODULE_CONFIG = {
  "individual-agents-life": {
    collectionName: "life_individual_agents",
    getInsurerTrend,
    getSectorAggregate,
  },
  "corporate-agents-life": {
    collectionName: "corporate_agents_life_insurers",
    getInsurerTrend: getCorporateInsurerTrend,
    getSectorAggregate: getCorporateSectorAggregate,
  },
  "micro-insurance-agents-life": {
    collectionName: "Microinsurance_agents_life_insurers",
    getInsurerTrend: getMicroInsuranceInsurerTrend,
    getSectorAggregate: getMicroInsuranceSectorAggregate,
  },
};

const INTERMEDIARY_EFFICIENCY_MODULE_CONFIG = {
  "avg-policies-sold": {
    collectionName: "avg_individual_policies_agents",
    getInsurerTrend: getAvgPoliciesInsurerTrend,
    getSectorAggregate: getAvgPoliciesSectorAggregate,
    requiresAgentType: true,
    metricLabel: "Policies",
  },
  "avg-new-business-premium": {
    collectionName: "avg_new_business_premium_income_per_agent",
    getInsurerTrend: getAvgPremiumInsurerTrend,
    getSectorAggregate: getAvgPremiumSectorAggregate,
    requiresAgentType: true,
    metricLabel: "Amount in Lakhs",
  },
  "avg-premium-per-policy": {
    collectionName: "avg_premium_income_per_policy_per_agent",
    getInsurerTrend: getAvgPremiumPerPolicyInsurerTrend,
    getSectorAggregate: getAvgPremiumPerPolicySectorAggregate,
    requiresAgentType: true,
    metricLabel: "Amount in Rupees",
  },
};

const STATE_WISE_MODULE_CONFIG = {
  "distribution-individual-agents-life": {
    collectionName: "life_agents_statewise",
    getInsurers: getStatewiseInsurers,
    getStates: getStatewiseStates,
    getData: getStatewiseData,
    requiresInsurerAndState: true,
    metricLabel: "Agents",
  },
  "registered-brokers": {
    collectionName: "sheet97_statewise_registered_brokers",
    getStates: getRegisteredBrokersStates,
    getData: getRegisteredBrokersData,
    requiresStateOnly: true,
    metricLabel: "Registered Brokers",
  },
  "insurance-marketing-firms": {
    collectionName: "sheet98_statewise_number_of_imfs",
    getStates: getImfStates,
    getData: getImfData,
    requiresStateOnly: true,
    metricLabel: "Insurance Marketing Firms",
  },
};

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
      title: "Average Number of Individual Policies Sold per Agent",
      icon: BarChart2,
    },
    {
      id: "avg-new-business-premium",
      title: "Average New Business Premium Income per Agent",
      icon: LineChartIcon,
    },
    {
      id: "avg-premium-per-policy",
      title: "Average Premium Income per Policy per Agent",
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
  const [selectedAgentInsurer, setSelectedAgentInsurer] = useState("");
  const [selectedAgentSector, setSelectedAgentSector] = useState("");
  const [selectedAgentType, setSelectedAgentType] = useState("");
  const [rawData, setRawData] = useState([]);
  const [data, setData] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [agentsError, setAgentsError] = useState("");
  const [showTimelinePicker, setShowTimelinePicker] = useState(false);
  const [timelineStartYear, setTimelineStartYear] = useState("");
  const [timelineEndYear, setTimelineEndYear] = useState("");

  const [selectedInsurer, setSelectedInsurer] = useState("");
  const [selectedFinancialYear, setSelectedFinancialYear] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedMetric, setSelectedMetric] = useState("");

  // State-wise analysis states
  const [statewiseInsurerOptions, setStatewiseInsurerOptions] = useState([]);
  const [statewiseStateOptions, setStatewiseStateOptions] = useState([]);
  const [selectedStatewiseInsurer, setSelectedStatewiseInsurer] = useState("");
  const [selectedStatewiseState, setSelectedStatewiseState] = useState("");

  const distributionAgentModuleConfig =
    activeTab === "distribution-workforce"
      ? DISTRIBUTION_AGENT_MODULE_CONFIG[selectedModule] || null
      : activeTab === "intermediary-efficiency"
      ? INTERMEDIARY_EFFICIENCY_MODULE_CONFIG[selectedModule] || null
      : activeTab === "state-wise-analysis"
      ? STATE_WISE_MODULE_CONFIG[selectedModule] || null
      : null;

  const isDistributionAgentsView = Boolean(distributionAgentModuleConfig);

  useEffect(() => {
    if (!isDistributionAgentsView) {
      return;
    }

    setSelectedAgentInsurer("");
    setSelectedAgentSector("");
    setSelectedAgentType("");
    setShowTimelinePicker(false);
    setAgentsError("");
    setRawData([]);
    setData([]);
  }, [distributionAgentModuleConfig?.collectionName, isDistributionAgentsView]);

  useEffect(() => {
    const fetchInsurers = async () => {
      if (!distributionAgentModuleConfig) {
        return;
      }

      // For modules that require agent type selection, wait until an agent type is selected
      if (distributionAgentModuleConfig.requiresAgentType && !selectedAgentType) {
        setAgentInsurerOptions(["All Insurers"]);
        return;
      }

      try {
        const collectionRef = collection(db, distributionAgentModuleConfig.collectionName);
        const snapshot = await getDocs(collectionRef);

        const relevantDocuments = distributionAgentModuleConfig.requiresAgentType
          ? snapshot.docs.filter((item) => matchesAgentType(item.data(), selectedAgentType))
          : snapshot.docs;

        const insurerNames = Array.from(
          new Set(
            relevantDocuments
              .map((item) => resolveInsurerName(item.data()))
              .filter(Boolean)
          )
        ).sort((first, second) => first.localeCompare(second));

        setAgentInsurerOptions(["All Insurers", ...insurerNames]);
      } catch (error) {
        console.error("Failed to fetch insurer options:", error);
      }
    };

    fetchInsurers();
  }, [distributionAgentModuleConfig, selectedAgentType]);

  // Fetch insurers and states for state-wise analysis
  useEffect(() => {
    const fetchStatewiseOptions = async () => {
      if (
        !distributionAgentModuleConfig?.requiresInsurerAndState &&
        !distributionAgentModuleConfig?.requiresStateOnly
      ) {
        setStatewiseInsurerOptions([]);
        setStatewiseStateOptions([]);
        return;
      }

      try {
        if (distributionAgentModuleConfig?.requiresInsurerAndState) {
          const [insurers, states] = await Promise.all([
            distributionAgentModuleConfig.getInsurers(),
            distributionAgentModuleConfig.getStates(),
          ]);

          setStatewiseInsurerOptions(insurers);
          setStatewiseStateOptions(states);
          return;
        }

        const states = await distributionAgentModuleConfig.getStates();
        setStatewiseInsurerOptions([]);
        setStatewiseStateOptions(states);
      } catch (error) {
        console.error("Failed to fetch statewise options:", error);
        setStatewiseInsurerOptions([]);
        setStatewiseStateOptions([]);
      }
    };

    fetchStatewiseOptions();
  }, [
    activeTab,
    selectedModule,
    distributionAgentModuleConfig?.requiresInsurerAndState,
    distributionAgentModuleConfig?.requiresStateOnly,
  ]);

  useEffect(() => {
    if (!distributionAgentModuleConfig?.requiresStateOnly) {
      return;
    }

    if (!selectedStatewiseState) {
      setRawData([]);
      setData([]);
      setAgentsError("");
      return;
    }

    const fetchStateOnlyData = async () => {
      setAgentsLoading(true);
      setAgentsError("");

      try {
        const result = await distributionAgentModuleConfig.getData(selectedStatewiseState);
        setRawData(result);
      } catch (error) {
        console.error("Failed to fetch state-only data:", error);
        setAgentsError("Unable to load data for selected state.");
        setRawData([]);
        setData([]);
      } finally {
        setAgentsLoading(false);
      }
    };

    fetchStateOnlyData();
  }, [distributionAgentModuleConfig, selectedStatewiseState]);

  useEffect(() => {
    if (rawData.length === 0) {
      setTimelineStartYear("");
      setTimelineEndYear("");
      setData([]);
      return;
    }

    // Extract numeric years from all formats
    const yearValues = rawData
      .map((item) => {
        const yearValue = item.year;
        
        // Try direct numeric conversion
        const numericYear = Number(yearValue);
        if (Number.isFinite(numericYear)) {
          return numericYear;
        }
        
        // Extract first 4-digit year from strings like "2020-21"
        const yearString = String(yearValue || "");
        const match = yearString.match(/\d{4}/);
        if (match) {
          return Number(match[0]);
        }
        
        return null;
      })
      .filter((year) => year !== null && Number.isFinite(year))
      .sort((first, second) => first - second);

    // If no valid years found, show all data without filtering
    if (yearValues.length === 0) {
      setTimelineStartYear("");
      setTimelineEndYear("");
      setData(rawData);
      return;
    }

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
      const yearValue = item.year;
      
      // Try direct numeric conversion
      let itemYear = Number(yearValue);
      
      // If not numeric, extract from financial year format
      if (!Number.isFinite(itemYear)) {
        const yearString = String(yearValue || "");
        const match = yearString.match(/\d{4}/);
        if (match) {
          itemYear = Number(match[0]);
        }
      }
      
      return Number.isFinite(itemYear) && itemYear >= startYear && itemYear <= endYear;
    });

    setData(filteredData);
  }, [rawData, timelineStartYear, timelineEndYear]);

  const timelineYearOptions = useMemo(() => {
    return rawData
      .map((item) => {
        const yearValue = item.year;
        
        // Try direct numeric conversion first
        const numericYear = Number(yearValue);
        if (Number.isFinite(numericYear)) {
          return numericYear;
        }
        
        // Extract first 4-digit year from strings like "2020-21" or "2020-2021"
        const yearString = String(yearValue || "");
        const match = yearString.match(/\d{4}/);
        if (match) {
          return Number(match[0]);
        }
        
        return null;
      })
      .filter((year) => year !== null && Number.isFinite(year));
  }, [rawData]);

  const visualizationData = useMemo(
    () =>
      data
        .map((item) => ({
          year: item.year,
          value: toNumericValue(item.agents),
        }))
        .filter((item) => Number.isFinite(item.value)),
    [data]
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

  const hasDistributionFilterSelection = distributionAgentModuleConfig?.requiresInsurerAndState
    ? Boolean(selectedStatewiseInsurer && selectedStatewiseState)
    : distributionAgentModuleConfig?.requiresStateOnly
    ? Boolean(selectedStatewiseState)
    : distributionAgentModuleConfig?.requiresAgentType
    ? Boolean(selectedAgentType && (selectedAgentInsurer || selectedAgentSector))
    : Boolean(selectedAgentInsurer || selectedAgentSector);

  const handleResetFilters = () => {
    if (isDistributionAgentsView) {
      setSelectedAgentType("");
      setSelectedAgentInsurer("");
      setSelectedAgentSector("");
      setSelectedStatewiseInsurer("");
      setSelectedStatewiseState("");
      setShowTimelinePicker(false);
      setAgentsError("");
      setRawData([]);
      setData([]);
      return;
    }

    setSelectedInsurer("");
    setSelectedFinancialYear("");
    setSelectedCategory("");
    setSelectedSegment("");
    setSelectedState("");
    setSelectedMetric("");
  };

  const handleApplyFilters = async () => {
    if (!isDistributionAgentsView) {
      return;
    }

    // Handle state-wise analysis
    if (distributionAgentModuleConfig?.requiresInsurerAndState) {
      if (!selectedStatewiseInsurer || !selectedStatewiseState) {
        setAgentsError("Please select both Insurer and State.");
        setRawData([]);
        setData([]);
        return;
      }

      setAgentsLoading(true);
      setAgentsError("");

      try {
        const result = await distributionAgentModuleConfig.getData(
          selectedStatewiseInsurer,
          selectedStatewiseState
        );
        setRawData(result);
      } catch (error) {
        console.error("Failed to apply statewise filters:", error);
        setAgentsError("Unable to load data for selected filters.");
        setRawData([]);
        setData([]);
      } finally {
        setAgentsLoading(false);
      }
      return;
    }

    if (distributionAgentModuleConfig?.requiresStateOnly) {
      return;
    }

    if (distributionAgentModuleConfig?.requiresAgentType && !selectedAgentType) {
      setAgentsError("Please select an agent type first.");
      setRawData([]);
      setData([]);
      return;
    }

    if (!selectedAgentInsurer && !selectedAgentSector) {
      setAgentsError("Select at least one filter and click Apply Filters.");
      setRawData([]);
      setData([]);
      return;
    }

    setAgentsLoading(true);
    setAgentsError("");

    try {
      let result;
      if (selectedAgentInsurer && selectedAgentInsurer !== "All Insurers") {
        result = distributionAgentModuleConfig.requiresAgentType
          ? await distributionAgentModuleConfig.getInsurerTrend(selectedAgentInsurer, selectedAgentType)
          : await distributionAgentModuleConfig.getInsurerTrend(selectedAgentInsurer);
      } else {
        result = distributionAgentModuleConfig.requiresAgentType
          ? await distributionAgentModuleConfig.getSectorAggregate(selectedAgentSector || "Both", selectedAgentType)
          : await distributionAgentModuleConfig.getSectorAggregate(selectedAgentSector || "Both");
      }

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
    const metricLabel = distributionAgentModuleConfig?.metricLabel || "Agents";

    if (!isDistributionAgentsView || data.length === 0) {
      return;
    }

    const activeFilters = distributionAgentModuleConfig?.requiresInsurerAndState
      ? [
          { label: "Insurer", value: selectedStatewiseInsurer },
          { label: "State", value: selectedStatewiseState },
        ]
      : distributionAgentModuleConfig?.requiresStateOnly
      ? [{ label: "Select State", value: selectedStatewiseState }]
      : [
          ...(distributionAgentModuleConfig?.requiresAgentType 
            ? [{ label: "Agent Type", value: selectedAgentType }] 
            : []),
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
      ["Year", metricLabel],
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
                if (tab.id === "distribution-workforce") {
                  setSelectedModule("individual-agents-life");
                } else if (tab.id === "intermediary-efficiency") {
                  setSelectedModule("avg-policies-sold");
                } else if (tab.id === "state-wise-analysis") {
                  setSelectedModule("distribution-individual-agents-life");
                } else {
                  setSelectedModule(null);
                }
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
            {isDistributionAgentsView ? (
              <>
                {distributionAgentModuleConfig?.requiresInsurerAndState ? (
                  <>
                    <FilterSelect
                      label="Select Insurer"
                      options={statewiseInsurerOptions}
                      value={selectedStatewiseInsurer}
                      onChange={setSelectedStatewiseInsurer}
                    />
                    <FilterSelect
                      label="Select State"
                      options={statewiseStateOptions}
                      value={selectedStatewiseState}
                      onChange={setSelectedStatewiseState}
                    />
                  </>
                ) : distributionAgentModuleConfig?.requiresStateOnly ? (
                  <FilterSelect
                    label="Select State"
                    options={statewiseStateOptions}
                    value={selectedStatewiseState}
                    onChange={setSelectedStatewiseState}
                  />
                ) : (
                  <>
                    {distributionAgentModuleConfig?.requiresAgentType && (
                      <FilterSelect
                        label="Select Agent"
                        options={["Individual Agent", "Corporate Agent"]}
                        value={selectedAgentType}
                        onChange={setSelectedAgentType}
                      />
                    )}
                    <FilterSelect
                      label="Select Insurer"
                      options={agentInsurerOptions}
                      value={selectedAgentInsurer}
                      onChange={setSelectedAgentInsurer}
                      disabled={distributionAgentModuleConfig?.requiresAgentType && !selectedAgentType}
                    />
                    <FilterSelect
                      label="Sector"
                      options={["Both", "Public", "Private"]}
                      value={selectedAgentSector}
                      onChange={setSelectedAgentSector}
                      disabled={
                        (distributionAgentModuleConfig?.requiresAgentType && !selectedAgentType) ||
                        Boolean(selectedAgentInsurer && selectedAgentInsurer !== "All Insurers")
                      }
                    />
                  </>
                )}
                {!distributionAgentModuleConfig?.requiresStateOnly && (
                  <button
                    type="button"
                    className="data-export-btn"
                    onClick={handleApplyFilters}
                    disabled={!hasDistributionFilterSelection}
                    title="Apply Filters"
                  >
                    Apply Filters
                  </button>
                )}
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
            {isDistributionAgentsView && (
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
            {isDistributionAgentsView ? (
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
                          <th className="col-value">
                            {distributionAgentModuleConfig?.metricLabel || "Agents"}
                          </th>
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
                <p className="panel-placeholder">
                  {hasDistributionFilterSelection
                    ? "No data found for selected filters."
                    : distributionAgentModuleConfig?.requiresStateOnly
                    ? "Select State to view year-wise data."
                    : "Select filters and click Apply Filters to view data."}
                </p>
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
            {isDistributionAgentsView ? (
              agentsLoading ? (
                <p className="panel-placeholder">Loading visualization...</p>
              ) : agentsError ? (
                <p className="panel-placeholder">{agentsError}</p>
              ) : visualizationData.length > 0 ? (
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={320}>
                    <RechartsLineChart
                      data={visualizationData}
                      margin={{ top: 16, right: 16, left: 8, bottom: 8 }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.22)" />
                      <XAxis dataKey="year" tickLine={false} axisLine={false} stroke="var(--text-secondary)" />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        stroke="var(--text-secondary)"
                        tickFormatter={(value) => toNumericValue(value).toLocaleString("en-IN")}
                      />
                      <Tooltip
                        formatter={(value) => toNumericValue(value).toLocaleString("en-IN")}
                        contentStyle={{
                          backgroundColor: "var(--bg-surface-solid)",
                          border: "1px solid var(--border-default)",
                          borderRadius: "8px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="var(--accent-primary)"
                        strokeWidth={2.2}
                        dot={{ fill: "#ffffff", stroke: "var(--accent-primary)", strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="panel-placeholder">
                  {hasDistributionFilterSelection
                    ? "No data found for selected filters."
                    : distributionAgentModuleConfig?.requiresStateOnly
                    ? "Select State to view visualization."
                    : "Select filters and click Apply Filters to view visualization."}
                </p>
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
        <option value="">--------</option>
        {options.map((opt, idx) => (
          <option key={idx} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function matchesAgentType(data, selectedAgentType) {
  if (!selectedAgentType) {
    return true;
  }

  const normalizedSelectedAgentType = normalizeAgentType(selectedAgentType);

  const candidateValues = [
    data?.agent_type,
    data?.agentType,
    data?.agent,
    data?.agent_category,
    data?.category,
    data?.type,
  ].filter((value) => value !== undefined && value !== null && value !== "");

  if (candidateValues.length === 0) {
    return false;
  }

  return candidateValues.some((value) => normalizeAgentType(value) === normalizedSelectedAgentType);
}

function normalizeAgentType(value) {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.includes("corporate")) {
    return "corporate";
  }

  if (normalized.includes("individual")) {
    return "individual";
  }

  return normalized;
}

function resolveInsurerName(data) {
  const candidates = [
    data?.insurer,
    data?.insurer_name,
    data?.insurerName,
    data?.company,
    data?.company_name,
    data?.name,
  ];

  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (value) {
      return value;
    }
  }

  return "";
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

function toNumericValue(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = String(value).replace(/,/g, "").trim();
  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
