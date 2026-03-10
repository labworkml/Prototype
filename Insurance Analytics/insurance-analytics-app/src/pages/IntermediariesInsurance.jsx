import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";
import PlotComponentModule from "react-plotly.js";
import PlotlyModule from "plotly.js-dist-min";
import {
  BarChart2,
  BarChart3,
  Building2,
  Download,
  FileText,
  Globe,
  Handshake,
  Info,
  IndianRupeeIcon,
  LineChart as LineChartIcon,
  Loader2,
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
  getLifeBusinessChannels,
  getLifeBusinessInsurers,
  getLifeBusinessInsurerChannelData,
  getLifeBusinessYearwiseData,
  getNonLifeBusinessChannels,
  getNonLifeBusinessSegments,
  getNonLifeBusinessYearwiseData,
  getDefaultNonLifeGeneralCollectionName,
  getDefaultNonLifeHealthCollectionName,
  getHealthBusinessChannels,
  getHealthBusinessCategories,
  getHealthBusinessMetrics,
  getHealthBusinessYearwiseData,
} from "../services/lifeAgentsService";
import "../styles/life-insurance.css";

const Plot = PlotComponentModule?.default || PlotComponentModule;
const Plotly = PlotlyModule?.default || PlotlyModule;

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

const LIFE_BUSINESS_DISTRIBUTION_MODULE_CONFIG = {
  "Channel-wise - Business": {
    requiresBusinessType: true,
    metricLabel: "Value",
  },
  "Insurer-wise - Business": {
    requiresBusinessType: true,
    requiresBusinessTypeInsurer: true,
    metricLabel: "Premium (Crore)",
  },
};

const NON_LIFE_BUSINESS_DISTRIBUTION_MODULE_CONFIG = {
  "general-insurance-business": {
    collectionName: getDefaultNonLifeGeneralCollectionName(),
    requiresSegmentChannel: true,
    metricLabel: "Value",
  },
  "health-insurance-business": {
    collectionName: getDefaultNonLifeHealthCollectionName(),
    requiresHealthChannelCategoryMetric: true,
    metricLabel: "Value",
  },
};

const LIFE_BUSINESS_TYPES = ["Individual New Business", "Group New Business"];

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
      id: "Channel-wise - Business",
      title: "Channel-wise - Business",
      icon: FileText,
    },
    {
      id: "Insurer-wise - Business",
      title: "Insurer-wise - Business",
      icon: BarChart3,
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
  const [visualizationType, setVisualizationType] = useState("line");
  const [pendingVisualizationType, setPendingVisualizationType] = useState("line");
  const [showChartTypePicker, setShowChartTypePicker] = useState(false);
  const [chartGraphDiv, setChartGraphDiv] = useState(null);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );

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
  const [selectedLifeBusinessType, setSelectedLifeBusinessType] = useState("");
  const [selectedLifeBusinessChannel, setSelectedLifeBusinessChannel] = useState("");
  const [selectedLifeBusinessInsurer, setSelectedLifeBusinessInsurer] = useState("");
  const [selectedLifeBusinessMetric, setSelectedLifeBusinessMetric] = useState("");
  const [lifeBusinessChannelOptions, setLifeBusinessChannelOptions] = useState([]);
  const [lifeBusinessInsurerOptions, setLifeBusinessInsurerOptions] = useState([]);
  const [selectedNonLifeSegment, setSelectedNonLifeSegment] = useState("");
  const [selectedNonLifeChannel, setSelectedNonLifeChannel] = useState("");
  const [nonLifeSegmentOptions, setNonLifeSegmentOptions] = useState([]);
  const [nonLifeChannelOptions, setNonLifeChannelOptions] = useState([]);
  const [selectedHealthChannel, setSelectedHealthChannel] = useState("");
  const [selectedHealthCategory, setSelectedHealthCategory] = useState("");
  const [selectedHealthMetric, setSelectedHealthMetric] = useState("");
  const [healthChannelOptions, setHealthChannelOptions] = useState([]);
  const [healthCategoryOptions, setHealthCategoryOptions] = useState([]);
  const [healthMetricOptions, setHealthMetricOptions] = useState([]);

  const distributionAgentModuleConfig =
    activeTab === "distribution-workforce"
      ? DISTRIBUTION_AGENT_MODULE_CONFIG[selectedModule] || null
      : activeTab === "intermediary-efficiency"
      ? INTERMEDIARY_EFFICIENCY_MODULE_CONFIG[selectedModule] || null
      : activeTab === "state-wise-analysis"
      ? STATE_WISE_MODULE_CONFIG[selectedModule] || null
      : activeTab === "life-business-distribution"
      ? LIFE_BUSINESS_DISTRIBUTION_MODULE_CONFIG[selectedModule] || null
      : activeTab === "non-life-business-distribution"
      ? NON_LIFE_BUSINESS_DISTRIBUTION_MODULE_CONFIG[selectedModule] || null
      : null;

  const isDistributionAgentsView = Boolean(distributionAgentModuleConfig);

  useEffect(() => {
    if (!isDistributionAgentsView) {
      return;
    }

    setSelectedAgentInsurer("");
    setSelectedAgentSector("");
    setSelectedAgentType("");
    setSelectedStatewiseInsurer("");
    setSelectedStatewiseState("");
    setSelectedLifeBusinessType("");
    setSelectedLifeBusinessChannel("");
    setSelectedLifeBusinessInsurer("");
    setSelectedLifeBusinessMetric("");
    setSelectedNonLifeSegment("");
    setSelectedNonLifeChannel("");
    setSelectedHealthChannel("");
    setSelectedHealthCategory("");
    setSelectedHealthMetric("");
    setLifeBusinessInsurerOptions([]);
    setLifeBusinessChannelOptions([]);
    setNonLifeSegmentOptions([]);
    setNonLifeChannelOptions([]);
    setHealthChannelOptions([]);
    setHealthCategoryOptions([]);
    setHealthMetricOptions([]);
    setShowTimelinePicker(false);
    setShowChartTypePicker(false);
    setAgentsError("");
    setRawData([]);
    setData([]);
  }, [distributionAgentModuleConfig?.collectionName, isDistributionAgentsView]);

  useEffect(() => {
    setPendingVisualizationType(visualizationType);
  }, [visualizationType]);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchInsurers = async () => {
      if (!distributionAgentModuleConfig) {
        return;
      }

      if (distributionAgentModuleConfig.requiresBusinessType) {
        setAgentInsurerOptions(["All Insurers"]);
        return;
      }

      if (!distributionAgentModuleConfig.collectionName) {
        setAgentInsurerOptions(["All Insurers"]);
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

  useEffect(() => {
    if (
      !distributionAgentModuleConfig?.requiresBusinessType ||
      distributionAgentModuleConfig?.requiresBusinessTypeInsurer
    ) {
      setLifeBusinessChannelOptions([]);
      return;
    }

    if (!selectedLifeBusinessType) {
      setLifeBusinessChannelOptions([]);
      return;
    }

    const fetchChannels = async () => {
      try {
        const channels = await getLifeBusinessChannels(selectedLifeBusinessType);
        setLifeBusinessChannelOptions(channels);
      } catch (error) {
        console.error("Failed to fetch life business channels:", error);
        setLifeBusinessChannelOptions([]);
      }
    };

    fetchChannels();
  }, [distributionAgentModuleConfig, selectedLifeBusinessType]);

  useEffect(() => {
    if (!distributionAgentModuleConfig?.requiresBusinessTypeInsurer) {
      setLifeBusinessInsurerOptions([]);
      return;
    }

    if (!selectedLifeBusinessType) {
      setLifeBusinessInsurerOptions([]);
      return;
    }

    const fetchInsurers = async () => {
      try {
        const insurers = await getLifeBusinessInsurers(selectedLifeBusinessType);
        setLifeBusinessInsurerOptions(insurers);
      } catch (error) {
        console.error("Failed to fetch insurer-wise life business insurers:", error);
        setLifeBusinessInsurerOptions([]);
      }
    };

    fetchInsurers();
  }, [distributionAgentModuleConfig, selectedLifeBusinessType]);

  // Fetch insurers and states for state-wise analysis
  useEffect(() => {
    if (!distributionAgentModuleConfig?.requiresSegmentChannel) {
      setNonLifeSegmentOptions([]);
      return;
    }

    const fetchSegments = async () => {
      try {
        const segments = await getNonLifeBusinessSegments(distributionAgentModuleConfig.collectionName);
        setNonLifeSegmentOptions(segments);
      } catch (error) {
        console.error("Failed to fetch non-life business segments:", error);
        setNonLifeSegmentOptions([]);
      }
    };

    fetchSegments();
  }, [distributionAgentModuleConfig]);

  useEffect(() => {
    if (!distributionAgentModuleConfig?.requiresSegmentChannel) {
      setNonLifeChannelOptions([]);
      return;
    }

    if (!selectedNonLifeSegment) {
      setNonLifeChannelOptions([]);
      return;
    }

    const fetchChannels = async () => {
      try {
        const channels = await getNonLifeBusinessChannels(
          distributionAgentModuleConfig.collectionName,
          selectedNonLifeSegment
        );
        setNonLifeChannelOptions(channels);
      } catch (error) {
        console.error("Failed to fetch non-life business channels:", error);
        setNonLifeChannelOptions([]);
      }
    };

    fetchChannels();
  }, [distributionAgentModuleConfig, selectedNonLifeSegment]);

  useEffect(() => {
    if (!distributionAgentModuleConfig?.requiresHealthChannelCategoryMetric) {
      setHealthChannelOptions([]);
      return;
    }

    const fetchHealthChannels = async () => {
      try {
        const channels = await getHealthBusinessChannels(distributionAgentModuleConfig.collectionName);
        setHealthChannelOptions(channels);
      } catch (error) {
        console.error("Failed to fetch health business channels:", error);
        setHealthChannelOptions([]);
      }
    };

    fetchHealthChannels();
  }, [distributionAgentModuleConfig]);

  useEffect(() => {
    if (!distributionAgentModuleConfig?.requiresHealthChannelCategoryMetric) {
      setHealthCategoryOptions([]);
      return;
    }

    if (!selectedHealthChannel) {
      setHealthCategoryOptions([]);
      return;
    }

    const fetchHealthCategories = async () => {
      try {
        const categories = await getHealthBusinessCategories(
          distributionAgentModuleConfig.collectionName,
          selectedHealthChannel
        );
        setHealthCategoryOptions(categories);
      } catch (error) {
        console.error("Failed to fetch health business categories:", error);
        setHealthCategoryOptions([]);
      }
    };

    fetchHealthCategories();
  }, [distributionAgentModuleConfig, selectedHealthChannel]);

  useEffect(() => {
    if (!distributionAgentModuleConfig?.requiresHealthChannelCategoryMetric) {
      setHealthMetricOptions([]);
      return;
    }

    if (!selectedHealthChannel || !selectedHealthCategory) {
      setHealthMetricOptions([]);
      return;
    }

    const fetchHealthMetrics = async () => {
      try {
        const metrics = await getHealthBusinessMetrics(
          distributionAgentModuleConfig.collectionName,
          selectedHealthChannel,
          selectedHealthCategory
        );
        setHealthMetricOptions(metrics);
      } catch (error) {
        console.error("Failed to fetch health business metrics:", error);
        setHealthMetricOptions([]);
      }
    };

    fetchHealthMetrics();
  }, [distributionAgentModuleConfig, selectedHealthChannel, selectedHealthCategory]);

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

  const visualizationData = useMemo(() => {
    if (distributionAgentModuleConfig?.requiresBusinessTypeInsurer) {
      return data
        .map((item) => ({
          year: item.channel,
          value: toNumericValue(item.premium_crore),
        }))
        .filter((item) => item.year && Number.isFinite(item.value));
    }

    return data
      .map((item) => ({
        year: item.year,
        value: toNumericValue(item.agents),
      }))
      .filter((item) => Number.isFinite(item.value));
  }, [data, distributionAgentModuleConfig]);

  const selectedSubModuleTitle =
    SUB_MODULES[activeTab]?.find((module) => module.id === selectedModule)?.title || "Overview";

  const metricLabel = distributionAgentModuleConfig?.requiresBusinessTypeInsurer
    ? "Premium (Crore)"
    : distributionAgentModuleConfig?.requiresBusinessType
    ? getLifeBusinessMetricLabel(selectedLifeBusinessMetric) || "Value"
    : distributionAgentModuleConfig?.requiresHealthChannelCategoryMetric
    ? getHealthMetricLabel(selectedHealthMetric, healthMetricOptions) || "Value"
    : distributionAgentModuleConfig?.metricLabel || "Agents";

  const chartTitle = useMemo(() => {
    const titleSegments = [selectedSubModuleTitle];

    if (distributionAgentModuleConfig?.requiresInsurerAndState) {
      if (selectedStatewiseInsurer) {
        titleSegments.push(selectedStatewiseInsurer);
      }
      if (selectedStatewiseState) {
        titleSegments.push(selectedStatewiseState);
      }
    } else if (distributionAgentModuleConfig?.requiresStateOnly) {
      if (selectedStatewiseState) {
        titleSegments.push(selectedStatewiseState);
      }
    } else {
      if (distributionAgentModuleConfig?.requiresBusinessType) {
        if (selectedLifeBusinessType) {
          titleSegments.push(selectedLifeBusinessType);
        }

        if (distributionAgentModuleConfig?.requiresBusinessTypeInsurer && selectedLifeBusinessInsurer) {
          titleSegments.push(selectedLifeBusinessInsurer);
        }

        if (!distributionAgentModuleConfig?.requiresBusinessTypeInsurer && selectedLifeBusinessChannel) {
          titleSegments.push(selectedLifeBusinessChannel);
        }

        if (!distributionAgentModuleConfig?.requiresBusinessTypeInsurer && selectedLifeBusinessMetric) {
          titleSegments.push(getLifeBusinessMetricLabel(selectedLifeBusinessMetric));
        }
      } else if (distributionAgentModuleConfig?.requiresSegmentChannel) {
        if (selectedNonLifeSegment) {
          titleSegments.push(selectedNonLifeSegment);
        }

        if (selectedNonLifeChannel) {
          titleSegments.push(selectedNonLifeChannel);
        }
      } else if (distributionAgentModuleConfig?.requiresHealthChannelCategoryMetric) {
        if (selectedHealthChannel) {
          titleSegments.push(selectedHealthChannel);
        }

        if (selectedHealthCategory) {
          titleSegments.push(selectedHealthCategory);
        }

        if (selectedHealthMetric) {
          titleSegments.push(getHealthMetricLabel(selectedHealthMetric, healthMetricOptions));
        }
      }

      if (distributionAgentModuleConfig?.requiresAgentType && selectedAgentType) {
        titleSegments.push(selectedAgentType);
      }

      if (selectedAgentInsurer && selectedAgentInsurer !== "All Insurers") {
        titleSegments.push(selectedAgentInsurer);
      }

      if (selectedAgentSector && selectedAgentSector !== "Both") {
        titleSegments.push(selectedAgentSector);
      }
    }

    return titleSegments.filter(Boolean).join(" : ");
  }, [
    selectedSubModuleTitle,
    distributionAgentModuleConfig,
    selectedStatewiseInsurer,
    selectedStatewiseState,
    selectedLifeBusinessType,
    selectedLifeBusinessInsurer,
    selectedLifeBusinessChannel,
    selectedLifeBusinessMetric,
    selectedNonLifeSegment,
    selectedNonLifeChannel,
    selectedHealthChannel,
    selectedHealthCategory,
    selectedHealthMetric,
    healthMetricOptions,
    selectedAgentType,
    selectedAgentInsurer,
    selectedAgentSector,
  ]);

  const chartExportFileName = useMemo(
    () =>
      `${buildExportFileName(selectedSubModuleTitle, [
        { label: "module", value: selectedSubModuleTitle },
      ])}_chart`,
    [selectedSubModuleTitle]
  );

  const formattedChartTitle = useMemo(() => {
    const wrappedTitle = wrapChartTitle(chartTitle);
    const titleLength = String(chartTitle || "").length;

    const isSmallViewport = viewportWidth < 768;
    const isMediumViewport = viewportWidth >= 768 && viewportWidth < 1200;

    let baseFontSize = isSmallViewport ? 12 : isMediumViewport ? 13 : 14;

    if (wrappedTitle.lineCount === 1) {
      baseFontSize += 1;
    }

    if (titleLength > 80) {
      baseFontSize -= 1;
    }

    const fontSize = Math.max(11, baseFontSize);
    const topMargin = wrappedTitle.lineCount === 2 ? (isSmallViewport ? 84 : 90) : isSmallViewport ? 70 : 76;

    return {
      text: wrappedTitle.text,
      fontSize,
      topMargin,
    };
  }, [chartTitle, viewportWidth]);

  const plotTraces = useMemo(() => {
    const xValues = visualizationData.map((item) => String(item.year));
    const yValues = visualizationData.map((item) => toNumericValue(item.value));

    if (visualizationType === "bar") {
      return [
        {
          type: "bar",
          name: metricLabel,
          x: xValues,
          y: yValues,
          marker: {
            color: "rgba(14, 165, 164, 0.88)",
            line: { color: "rgba(15, 118, 110, 0.95)", width: 1 },
          },
          hovertemplate: `%{x}<br>${metricLabel}: %{y:,}<extra></extra>`,
        },
      ];
    }

    if (visualizationType === "area") {
      return [
        {
          type: "scatter",
          mode: "lines+markers",
          name: metricLabel,
          x: xValues,
          y: yValues,
          line: { color: "#0ea5a4", width: 3 },
          marker: { color: "#0ea5a4", size: 8 },
          fill: "tozeroy",
          fillcolor: "rgba(14, 165, 164, 0.14)",
          hovertemplate: `%{x}<br>${metricLabel}: %{y:,}<extra></extra>`,
        },
      ];
    }

    return [
      {
        type: "scatter",
        mode: "lines+markers",
        name: metricLabel,
        x: xValues,
        y: yValues,
        line: { color: "#0ea5a4", width: 3 },
        marker: { color: "#0ea5a4", size: 8 },
        hovertemplate: `%{x}<br>${metricLabel}: %{y:,}<extra></extra>`,
      },
    ];
  }, [visualizationData, visualizationType, metricLabel]);

  const plotLayout = useMemo(
    () => ({
      autosize: true,
      paper_bgcolor: "rgba(0, 0, 0, 0)",
      plot_bgcolor: "rgba(0, 0, 0, 0)",
      margin: { l: 60, r: 18, t: formattedChartTitle.topMargin, b: 52 },
      title: {
        text: formattedChartTitle.text,
        x: 0.5,
        xanchor: "center",
        y: 0.96,
        yanchor: "top",
        automargin: true,
        font: {
          size: formattedChartTitle.fontSize,
          color: "#0f172a",
          family: "Segoe UI, Arial, sans-serif",
        },
      },
      xaxis: {
        title: {
          text: distributionAgentModuleConfig?.requiresBusinessTypeInsurer ? "Channel" : "Year",
          font: { size: 12, color: "#475569" },
        },
        showgrid: true,
        gridcolor: "rgba(148, 163, 184, 0.16)",
        zeroline: false,
        tickfont: { size: 12, color: "#334155" },
      },
      yaxis: {
        title: { text: metricLabel, font: { size: 12, color: "#475569" } },
        showgrid: true,
        gridcolor: "rgba(148, 163, 184, 0.16)",
        zeroline: false,
        tickfont: { size: 12, color: "#334155" },
        separatethousands: true,
      },
      legend: {
        orientation: "h",
        x: 0,
        y: -0.16,
        font: { size: 14, color: "#334155" },
      },
      hoverlabel: {
        bgcolor: "#ffffff",
        bordercolor: "rgba(148, 163, 184, 0.4)",
        font: { color: "#0f172a", size: 12 },
      },
    }),
    [formattedChartTitle, metricLabel, distributionAgentModuleConfig]
  );

  const plotConfig = useMemo(
    () => ({
      responsive: true,
      displaylogo: false,
      toImageButtonOptions: {
        format: "png",
        filename: chartExportFileName,
        width: 1280,
        height: 720,
        scale: 2,
      },
      modeBarButtonsToRemove: ["select2d", "lasso2d", "toggleSpikelines", "autoScale2d"],
    }),
    [chartExportFileName]
  );

  const handleExportImage = async () => {
    if (!chartGraphDiv || isExportingImage) {
      return;
    }

    setIsExportingImage(true);
    try {
      await Plotly.downloadImage(chartGraphDiv, {
        format: "png",
        filename: chartExportFileName,
        width: 1280,
        height: 720,
        scale: 2,
      });
    } catch (error) {
      console.error("Failed to export chart image:", error);
    } finally {
      setIsExportingImage(false);
    }
  };

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

  const hasDistributionFilterSelection = distributionAgentModuleConfig?.requiresInsurerAndState
    ? Boolean(selectedStatewiseInsurer && selectedStatewiseState)
    : distributionAgentModuleConfig?.requiresStateOnly
    ? Boolean(selectedStatewiseState)
    : distributionAgentModuleConfig?.requiresBusinessTypeInsurer
    ? Boolean(selectedLifeBusinessType && selectedLifeBusinessInsurer)
    : distributionAgentModuleConfig?.requiresBusinessType
    ? Boolean(selectedLifeBusinessType && selectedLifeBusinessChannel && selectedLifeBusinessMetric)
    : distributionAgentModuleConfig?.requiresSegmentChannel
    ? Boolean(selectedNonLifeSegment && selectedNonLifeChannel)
    : distributionAgentModuleConfig?.requiresHealthChannelCategoryMetric
    ? Boolean(selectedHealthChannel && selectedHealthCategory && selectedHealthMetric)
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
      setSelectedLifeBusinessType("");
      setSelectedLifeBusinessChannel("");
      setSelectedLifeBusinessInsurer("");
      setSelectedLifeBusinessMetric("");
      setSelectedNonLifeSegment("");
      setSelectedNonLifeChannel("");
      setSelectedHealthChannel("");
      setSelectedHealthCategory("");
      setSelectedHealthMetric("");
      setLifeBusinessChannelOptions([]);
      setLifeBusinessInsurerOptions([]);
      setNonLifeSegmentOptions([]);
      setNonLifeChannelOptions([]);
      setHealthChannelOptions([]);
      setHealthCategoryOptions([]);
      setHealthMetricOptions([]);
      setShowTimelinePicker(false);
      setShowChartTypePicker(false);
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

    if (distributionAgentModuleConfig?.requiresBusinessType) {
      if (distributionAgentModuleConfig?.requiresBusinessTypeInsurer) {
        if (!selectedLifeBusinessType) {
          setAgentsError("Please select a business type.");
          setRawData([]);
          setData([]);
          return;
        }

        if (!selectedLifeBusinessInsurer) {
          setAgentsError("Please select an insurer.");
          setRawData([]);
          setData([]);
          return;
        }

        setAgentsLoading(true);
        setAgentsError("");

        try {
          const result = await getLifeBusinessInsurerChannelData(
            selectedLifeBusinessType,
            selectedLifeBusinessInsurer
          );
          setRawData(result);
        } catch (error) {
          console.error("Failed to apply insurer-wise life business filters:", error);
          setAgentsError("Unable to load data for selected filters.");
          setRawData([]);
          setData([]);
        } finally {
          setAgentsLoading(false);
        }

        return;
      }

      if (!selectedLifeBusinessType) {
        setAgentsError("Please select a business type.");
        setRawData([]);
        setData([]);
        return;
      }

      if (!selectedLifeBusinessChannel) {
        setAgentsError("Please select a channel.");
        setRawData([]);
        setData([]);
        return;
      }

      if (!selectedLifeBusinessMetric) {
        setAgentsError("Please select a metric.");
        setRawData([]);
        setData([]);
        return;
      }

      setAgentsLoading(true);
      setAgentsError("");

      try {
        const result = await getLifeBusinessYearwiseData(
          selectedLifeBusinessType,
          selectedLifeBusinessChannel,
          selectedLifeBusinessMetric
        );
        setRawData(result);
      } catch (error) {
        console.error("Failed to apply life business filters:", error);
        setAgentsError("Unable to load data for selected filters.");
        setRawData([]);
        setData([]);
      } finally {
        setAgentsLoading(false);
      }

      return;
    }

    if (distributionAgentModuleConfig?.requiresSegmentChannel) {
      if (!selectedNonLifeSegment) {
        setAgentsError("Please select a segment.");
        setRawData([]);
        setData([]);
        return;
      }

      if (!selectedNonLifeChannel) {
        setAgentsError("Please select a channel.");
        setRawData([]);
        setData([]);
        return;
      }

      setAgentsLoading(true);
      setAgentsError("");

      try {
        const result = await getNonLifeBusinessYearwiseData(
          distributionAgentModuleConfig.collectionName,
          selectedNonLifeSegment,
          selectedNonLifeChannel
        );
        setRawData(result);
      } catch (error) {
        console.error("Failed to apply non-life business filters:", error);
        setAgentsError("Unable to load data for selected filters.");
        setRawData([]);
        setData([]);
      } finally {
        setAgentsLoading(false);
      }

      return;
    }

    if (distributionAgentModuleConfig?.requiresHealthChannelCategoryMetric) {
      if (!selectedHealthChannel) {
        setAgentsError("Please select a channel.");
        setRawData([]);
        setData([]);
        return;
      }

      if (!selectedHealthCategory) {
        setAgentsError("Please select a category.");
        setRawData([]);
        setData([]);
        return;
      }

      if (!selectedHealthMetric) {
        setAgentsError("Please select a metric.");
        setRawData([]);
        setData([]);
        return;
      }

      setAgentsLoading(true);
      setAgentsError("");

      try {
        const result = await getHealthBusinessYearwiseData(
          distributionAgentModuleConfig.collectionName,
          selectedHealthChannel,
          selectedHealthCategory,
          selectedHealthMetric
        );
        setRawData(result);
      } catch (error) {
        console.error("Failed to apply health business filters:", error);
        setAgentsError("Unable to load data for selected filters.");
        setRawData([]);
        setData([]);
      } finally {
        setAgentsLoading(false);
      }

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
    const metricLabel = distributionAgentModuleConfig?.requiresBusinessTypeInsurer
      ? "Premium (Crore)"
      : distributionAgentModuleConfig?.requiresBusinessType
      ? getLifeBusinessMetricLabel(selectedLifeBusinessMetric) || "Value"
      : distributionAgentModuleConfig?.metricLabel || "Agents";

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
      : distributionAgentModuleConfig?.requiresBusinessTypeInsurer
      ? [
          { label: "Business Type", value: selectedLifeBusinessType },
          { label: "Insurer", value: selectedLifeBusinessInsurer },
        ]
      : distributionAgentModuleConfig?.requiresBusinessType
      ? [
          { label: "Business Type", value: selectedLifeBusinessType },
          { label: "Channel", value: selectedLifeBusinessChannel },
          { label: "Metric", value: getLifeBusinessMetricLabel(selectedLifeBusinessMetric) },
        ]
      : distributionAgentModuleConfig?.requiresSegmentChannel
      ? [
          { label: "Segment", value: selectedNonLifeSegment },
          { label: "Channel", value: selectedNonLifeChannel },
        ]
      : distributionAgentModuleConfig?.requiresHealthChannelCategoryMetric
      ? [
          { label: "Channel", value: selectedHealthChannel },
          { label: "Category", value: selectedHealthCategory },
          { label: "Metric", value: getHealthMetricLabel(selectedHealthMetric, healthMetricOptions) },
        ]
      : [
          ...(distributionAgentModuleConfig?.requiresAgentType 
            ? [{ label: "Agent Type", value: selectedAgentType }] 
            : []),
          { label: "Select Insurer", value: selectedAgentInsurer },
          { label: "Sector", value: selectedAgentSector },
        ];

    const dataRows = distributionAgentModuleConfig?.requiresBusinessTypeInsurer
      ? data.map((row) => {
          if (selectedLifeBusinessType === "Individual New Business") {
            return [
              row.channel,
              Number(row.premium_crore || 0).toLocaleString("en-IN"),
              Number(row.policies || 0).toLocaleString("en-IN"),
            ];
          }

          return [
            row.channel,
            Number(row.premium_crore || 0).toLocaleString("en-IN"),
            Number(row.lives_covered || 0).toLocaleString("en-IN"),
            Number(row.scheme || 0).toLocaleString("en-IN"),
          ];
        })
      : data.map((row) => [row.year, Number(row.agents || 0).toLocaleString("en-IN")]);

    const exportHeader = distributionAgentModuleConfig?.requiresBusinessTypeInsurer
      ? selectedLifeBusinessType === "Individual New Business"
        ? ["Channel", "Premium (Crore)", "Policies"]
        : ["Channel", "Premium (Crore)", "Lives Covered", "Schemes"]
      : ["Year", metricLabel];

    const exportRows = [
      ["Sub Module", selectedSubModuleTitle],
      [],
      ["Applied Filters", "Value"],
      ...activeFilters.map((filter) => [filter.label, formatFieldValue(filter.value)]),
      [],
      exportHeader,
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
                {distributionAgentModuleConfig?.requiresBusinessType ? (
                  <>
                    <div className="filter-item">
                      <label className="filter-label label-text">Business Type</label>
                      <div className="premium-toggle-group">
                        {LIFE_BUSINESS_TYPES.map((businessType) => (
                          <button
                            key={businessType}
                            type="button"
                            className={`premium-toggle-btn ${
                              selectedLifeBusinessType === businessType ? "active" : ""
                            }`}
                            onClick={() => {
                              setSelectedLifeBusinessType(businessType);
                              setSelectedLifeBusinessInsurer("");
                              setSelectedLifeBusinessChannel("");
                              setSelectedLifeBusinessMetric("");
                              setAgentsError("");
                              setRawData([]);
                              setData([]);
                            }}
                          >
                            {businessType}
                          </button>
                        ))}
                      </div>
                    </div>

                    {distributionAgentModuleConfig?.requiresBusinessTypeInsurer ? (
                      selectedLifeBusinessType && (
                        <FilterSelect
                          label="Select Insurer"
                          options={lifeBusinessInsurerOptions}
                          value={selectedLifeBusinessInsurer}
                          onChange={(nextInsurer) => {
                            setSelectedLifeBusinessInsurer(nextInsurer);
                            setAgentsError("");
                            setRawData([]);
                            setData([]);
                          }}
                        />
                      )
                    ) : (
                      <>
                        {selectedLifeBusinessType && (
                          <FilterSelect
                            label="Channel"
                            options={lifeBusinessChannelOptions}
                            value={selectedLifeBusinessChannel}
                            onChange={(nextChannel) => {
                              setSelectedLifeBusinessChannel(nextChannel);
                              setSelectedLifeBusinessMetric("");
                              setAgentsError("");
                              setRawData([]);
                              setData([]);
                            }}
                          />
                        )}

                        {selectedLifeBusinessChannel && (
                          <div className="filter-item">
                            <label className="filter-label label-text">Metric</label>
                            <div className="premium-toggle-group">
                              {(selectedLifeBusinessType === "Individual New Business"
                                ? ["policies", "premium_crore"]
                                : ["lives_covered", "premium_crore", "scheme"]
                              ).map((metric) => (
                                <button
                                  key={metric}
                                  type="button"
                                  className={`premium-toggle-btn ${
                                    selectedLifeBusinessMetric === metric ? "active" : ""
                                  }`}
                                  onClick={() => {
                                    setSelectedLifeBusinessMetric(metric);
                                    setAgentsError("");
                                    setRawData([]);
                                    setData([]);
                                  }}
                                >
                                  {getLifeBusinessMetricLabel(metric)}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : distributionAgentModuleConfig?.requiresSegmentChannel ? (
                  <>
                    <FilterSelect
                      label="Select Segment"
                      options={nonLifeSegmentOptions}
                      value={selectedNonLifeSegment}
                      onChange={(nextSegment) => {
                        setSelectedNonLifeSegment(nextSegment);
                        setSelectedNonLifeChannel("");
                        setAgentsError("");
                        setRawData([]);
                        setData([]);
                      }}
                    />
                    <FilterSelect
                      label="Select Channel"
                      options={nonLifeChannelOptions}
                      value={selectedNonLifeChannel}
                      onChange={(nextChannel) => {
                        setSelectedNonLifeChannel(nextChannel);
                        setAgentsError("");
                        setRawData([]);
                        setData([]);
                      }}
                      disabled={!selectedNonLifeSegment}
                    />
                  </>
                ) : distributionAgentModuleConfig?.requiresHealthChannelCategoryMetric ? (
                  <>
                    <FilterSelect
                      label="Select Channel"
                      options={healthChannelOptions}
                      value={selectedHealthChannel}
                      onChange={(nextChannel) => {
                        setSelectedHealthChannel(nextChannel);
                        setSelectedHealthCategory("");
                        setSelectedHealthMetric("");
                        setAgentsError("");
                        setRawData([]);
                        setData([]);
                      }}
                    />
                    <FilterSelect
                      label="Select Category"
                      options={healthCategoryOptions}
                      value={selectedHealthCategory}
                      onChange={(nextCategory) => {
                        setSelectedHealthCategory(nextCategory);
                        setSelectedHealthMetric("");
                        setAgentsError("");
                        setRawData([]);
                        setData([]);
                      }}
                      disabled={!selectedHealthChannel}
                    />
                    <FilterSelect
                      label="Select Metric"
                      options={healthMetricOptions}
                      value={selectedHealthMetric}
                      onChange={(nextMetric) => {
                        setSelectedHealthMetric(nextMetric);
                        setAgentsError("");
                        setRawData([]);
                        setData([]);
                      }}
                      disabled={!selectedHealthCategory}
                    />
                  </>
                ) : distributionAgentModuleConfig?.requiresInsurerAndState ? (
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
            {isDistributionAgentsView && !distributionAgentModuleConfig?.requiresBusinessTypeInsurer && (
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
                <PanelState
                  variant="loading"
                  message="Loading data"
                  hint="Please wait while filters are applied."
                />
              ) : agentsError ? (
                <PanelState variant="error" message={agentsError} />
              ) : data.length > 0 ? (
                <>
                  {!distributionAgentModuleConfig?.requiresBusinessTypeInsurer &&
                    showTimelinePicker &&
                    timelineYearOptions.length > 0 && (
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
                      <button
                        type="button"
                        className="timeline-apply-btn"
                        onClick={() => setShowTimelinePicker(false)}
                        title="Apply Timeline"
                      >
                        Apply Timeline
                      </button>
                    </div>
                  )}
                  <div className="data-table-container">
                    <table className="segment-data-table">
                      <thead>
                        {distributionAgentModuleConfig?.requiresBusinessTypeInsurer ? (
                          <tr>
                            <th className="col-year">Channel</th>
                            <th className="col-value">Premium (Crore)</th>
                            {selectedLifeBusinessType === "Individual New Business" ? (
                              <th className="col-value">Policies</th>
                            ) : (
                              <>
                                <th className="col-value">Lives Covered</th>
                                <th className="col-value">Schemes</th>
                              </>
                            )}
                          </tr>
                        ) : (
                          <tr>
                            <th className="col-year">Year</th>
                            <th className="col-value">
                              {distributionAgentModuleConfig?.requiresSegmentChannel ? (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    justifyContent: "center",
                                  }}
                                >
                                  <IndianRupeeIcon size={14} strokeWidth={2.2} />
                                  Gross Direct Premium in Cr
                                </span>
                              ) : (
                                metricLabel
                              )}
                            </th>
                          </tr>
                        )}
                      </thead>
                      <tbody>
                        {distributionAgentModuleConfig?.requiresBusinessTypeInsurer
                          ? data.map((item) => (
                              <tr key={item.channel}>
                                <td className="col-year">
                                  <span className="year-badge">{item.channel}</span>
                                </td>
                                <td className="col-value">
                                  <span className="value-amount">
                                    {formatNumberForDisplay(item.premium_crore)}
                                  </span>
                                </td>
                                {selectedLifeBusinessType === "Individual New Business" ? (
                                  <td className="col-value">
                                    <span className="value-amount">
                                      {formatNumberForDisplay(item.policies)}
                                    </span>
                                  </td>
                                ) : (
                                  <>
                                    <td className="col-value">
                                      <span className="value-amount">
                                        {formatNumberForDisplay(item.lives_covered)}
                                      </span>
                                    </td>
                                    <td className="col-value">
                                      <span className="value-amount">
                                        {formatNumberForDisplay(item.scheme)}
                                      </span>
                                    </td>
                                  </>
                                )}
                              </tr>
                            ))
                          : data.map((item) => (
                              <tr key={item.year}>
                                <td className="col-year">
                                  <span className="year-badge">{item.year}</span>
                                </td>
                                <td className="col-value">
                                  <span className="value-amount">
                                    {formatNumberForDisplay(item.agents)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <PanelState
                  variant="empty"
                  message={
                    hasDistributionFilterSelection
                      ? "No data found for selected filters."
                      : distributionAgentModuleConfig?.requiresStateOnly
                      ? "Select a state to view year-wise data."
                      : distributionAgentModuleConfig?.requiresBusinessType
                      ? distributionAgentModuleConfig?.requiresBusinessTypeInsurer
                        ? "Choose business type and insurer, then click Apply Filters."
                        : "Choose business type, channel and metric, then click Apply Filters."
                      : distributionAgentModuleConfig?.requiresSegmentChannel
                      ? "Choose segment and channel, then click Apply Filters."
                      : distributionAgentModuleConfig?.requiresHealthChannelCategoryMetric
                      ? "Choose channel, category and metric, then click Apply Filters."
                      : "Select filters and click Apply Filters to view data."
                  }
                  hint="You can adjust filters and re-apply to refresh results."
                />
              )
            ) : (
              <div className="data-table-container">
                <PanelState
                  variant="empty"
                  message="Select filters to view analytics."
                  hint="Results will appear here after applying filters."
                />
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
            {isDistributionAgentsView && visualizationData.length > 0 && (
              <>
                <button
                  type="button"
                  className="data-export-btn"
                  onClick={() => setShowChartTypePicker((previous) => !previous)}
                  title="Select chart type"
                >
                  Select Chart Type
                </button>
                <button
                  type="button"
                  className="data-export-btn panel-action-btn viz-export-btn"
                  onClick={handleExportImage}
                  disabled={isExportingImage}
                  title="Export chart as image"
                >
                  <Download size={14} strokeWidth={2.2} />
                  {isExportingImage ? "Exporting..." : "Export Image"}
                </button>
              </>
            )}
          </div>
          <div className="panel-body viz-panel-body">
            {isDistributionAgentsView ? (
              agentsLoading ? (
                <PanelState
                  variant="loading"
                  message="Loading visualization"
                  hint="Rendering chart for selected filters."
                />
              ) : agentsError ? (
                <PanelState variant="error" message={agentsError} />
              ) : visualizationData.length > 0 ? (
                <>
                  {showChartTypePicker && (
                    <div className="timeline-filter-row chart-type-picker-row">
                      <div className="timeline-field">
                        <label className="filter-label label-text">Chart Type</label>
                        <select
                          className="filter-select timeline-select"
                          value={pendingVisualizationType}
                          onChange={(event) => setPendingVisualizationType(event.target.value)}
                        >
                          <option value="line">Line Chart</option>
                          <option value="area">Area Chart</option>
                          <option value="bar">Bar Chart</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        className="timeline-apply-btn"
                        onClick={() => {
                          setVisualizationType(pendingVisualizationType);
                          setShowChartTypePicker(false);
                        }}
                        title="Apply chart type"
                      >
                        Apply Chart Type
                      </button>
                    </div>
                  )}
                  <div className="chart-wrapper plotly-chart-wrapper">
                    <Plot
                      data={plotTraces}
                      layout={plotLayout}
                      config={plotConfig}
                      style={{ width: "100%", height: "100%" }}
                      useResizeHandler
                      onInitialized={(_, graphDiv) => setChartGraphDiv(graphDiv)}
                      onUpdate={(_, graphDiv) => setChartGraphDiv(graphDiv)}
                    />
                  </div>
                </>
              ) : (
                <PanelState
                  variant="empty"
                  message={
                    hasDistributionFilterSelection
                      ? "No data found for selected filters."
                      : distributionAgentModuleConfig?.requiresStateOnly
                      ? "Select a state to view visualization."
                      : distributionAgentModuleConfig?.requiresBusinessType
                      ? distributionAgentModuleConfig?.requiresBusinessTypeInsurer
                        ? "Choose business type and insurer, then click Apply Filters."
                        : "Choose business type, channel and metric, then click Apply Filters."
                      : distributionAgentModuleConfig?.requiresSegmentChannel
                      ? "Choose segment and channel, then click Apply Filters."
                      : distributionAgentModuleConfig?.requiresHealthChannelCategoryMetric
                      ? "Choose channel, category and metric, then click Apply Filters."
                      : "Select filters and click Apply Filters to view visualization."
                  }
                  hint="Try widening the timeline or changing filters."
                />
              )
            ) : (
              <div className="chart-wrapper">
                <PanelState
                  variant="empty"
                  message="Select filters to view analytics."
                  hint="Chart will appear here once data is available."
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PanelState({ variant = "empty", message, hint = "" }) {
  const icon =
    variant === "loading" ? (
      <Loader2 className="panel-state-icon spinning" size={20} strokeWidth={2.2} />
    ) : (
      <Info className="panel-state-icon" size={20} strokeWidth={2.2} />
    );

  return (
    <div className={`panel-state panel-state-${variant}`}>
      {icon}
      <p className="panel-placeholder">{message}</p>
      {hint ? <p className="panel-state-hint">{hint}</p> : null}
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
        {options.map((opt, idx) => {
          const optionValue = typeof opt === "string" ? opt : opt?.value;
          const optionLabel = typeof opt === "string" ? opt : opt?.label || opt?.value;

          if (!optionValue) {
            return null;
          }

          return (
            <option key={`${optionValue}-${idx}`} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
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

function formatNumberForDisplay(value) {
  return toNumericValue(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getLifeBusinessMetricLabel(metric) {
  if (metric === "premium_crore") {
    return "Premium (Crore)";
  }

  if (metric === "lives_covered") {
    return "Lives Covered";
  }

  if (metric === "policies") {
    return "Policies";
  }

  if (metric === "scheme") {
    return "Scheme";
  }

  return "";
}

function getHealthMetricLabel(metricValue, metricOptions) {
  if (!metricValue) {
    return "";
  }

  const matchedMetric = (metricOptions || []).find((option) => option?.value === metricValue);
  return matchedMetric?.label || metricValue;
}

function wrapChartTitle(title) {
  const safeTitle = String(title || "").trim();
  if (!safeTitle) {
    return { text: "", lineCount: 1 };
  }

  const segments = safeTitle.split(" : ").filter(Boolean);
  const maxLineLength = 80;
  const maxLines = 2;
  const lines = [];
  let currentLine = "";

  for (const segment of segments) {
    const nextValue = currentLine ? `${currentLine} : ${segment}` : segment;

    if (nextValue.length <= maxLineLength || !currentLine) {
      currentLine = nextValue;
      continue;
    }

    lines.push(currentLine);
    currentLine = segment;

    if (lines.length === maxLines - 1) {
      break;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  const consumedLength = lines.join(" : ").length;
  const hasRemainingText = safeTitle.length > consumedLength;

  if (hasRemainingText && lines.length > 0) {
    lines[lines.length - 1] = `${lines[lines.length - 1]} ...`;
  }

  return {
    text: lines.join("<br>"),
    lineCount: lines.length || 1,
  };
}
