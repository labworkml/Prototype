import { useEffect, useMemo, useRef, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";
import PlotComponentModule from "react-plotly.js";
import {
  BarChart2,
  BarChart3,
  Building2,
  Check,
  FileText,
  Globe,
  Handshake,
  Info,
  Lightbulb,
  IndianRupeeIcon,
  LineChart as LineChartIcon,
  Loader2,
  MapPin,
  RefreshCw,
  Shield,
  Shuffle,
  Trash2,
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
  getLifeBusinessInsurerYears,
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
import { askAI, generateInsights } from "../services/aiService";
import "../styles/life-insurance.css";

const Plot = PlotComponentModule?.default || PlotComponentModule;

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
    metricLabel: "Number of Agents",
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
  {
    id: "distribution-workforce",
    label: "Distribution Workforce",
    icon: Users,
    accent: "#06b6d4",
  },
  {
    id: "state-wise-analysis",
    label: "State Wise Analysis",
    icon: MapPin,
    accent: "#3b82f6",
  },
  {
    id: "intermediary-efficiency",
    label: "Intermediary Efficiency",
    icon: TrendingUp,
    accent: "#0ea5a4",
  },
  {
    id: "life-business-distribution",
    label: "Life – Business Distribution",
    icon: BarChart3,
    accent: "#8b5cf6",
  },
  {
    id: "non-life-business-distribution",
    label: "Non-Life – Business Distribution",
    icon: Globe,
    accent: "#f59e0b",
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
  const [showInsights, setShowInsights] = useState(false);
  const [visualizationType, setVisualizationType] = useState("line");
  const [pendingVisualizationType, setPendingVisualizationType] = useState("line");
  const [selectedLifeBusinessVisualizationMetric, setSelectedLifeBusinessVisualizationMetric] = useState("");
  const [pendingLifeBusinessVisualizationMetric, setPendingLifeBusinessVisualizationMetric] = useState("");
  const [showChartTypePicker, setShowChartTypePicker] = useState(false);
  const [showMetricPicker, setShowMetricPicker] = useState(false);
  const [selectedHealthVisualizationMetric, setSelectedHealthVisualizationMetric] = useState("");
  const [pendingHealthVisualizationMetric, setPendingHealthVisualizationMetric] = useState("");
  const [showHealthMetricPicker, setShowHealthMetricPicker] = useState(false);
  const [insightsQuestion, setInsightsQuestion] = useState("");
  const [aiMessages, setAiMessages] = useState([]);
  const [isAILoading, setIsAILoading] = useState(false);
  const insightsGenerationRef = useRef(0);

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
  const [selectedLifeBusinessYear, setSelectedLifeBusinessYear] = useState("");
  const [selectedLifeBusinessMetrics, setSelectedLifeBusinessMetrics] = useState([]);
  const [lifeBusinessChannelOptions, setLifeBusinessChannelOptions] = useState([]);
  const [lifeBusinessInsurerOptions, setLifeBusinessInsurerOptions] = useState([]);
  const [lifeBusinessYearOptions, setLifeBusinessYearOptions] = useState([]);
  const [selectedNonLifeSegment, setSelectedNonLifeSegment] = useState("");
  const [selectedNonLifeChannel, setSelectedNonLifeChannel] = useState("");
  const [nonLifeSegmentOptions, setNonLifeSegmentOptions] = useState([]);
  const [nonLifeChannelOptions, setNonLifeChannelOptions] = useState([]);
  const [selectedHealthChannel, setSelectedHealthChannel] = useState("");
  const [selectedHealthCategory, setSelectedHealthCategory] = useState("");
  const [selectedHealthMetrics, setSelectedHealthMetrics] = useState([]);
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
  const isLifeBusinessChannelwiseView = Boolean(
    distributionAgentModuleConfig?.requiresBusinessType &&
      !distributionAgentModuleConfig?.requiresBusinessTypeInsurer
  );
  const selectedLifeBusinessMetric = selectedLifeBusinessMetrics[0] || "";

  const availableLifeBusinessMetrics =
    selectedLifeBusinessType === "Individual New Business"
      ? ["policies", "premium_crore"]
      : ["lives_covered", "premium_crore", "scheme"];

  const effectiveVisualizationMetric =
    isLifeBusinessChannelwiseView && selectedLifeBusinessVisualizationMetric
      ? selectedLifeBusinessVisualizationMetric
      : selectedLifeBusinessMetric;

  const handleLifeBusinessMetricToggle = (metric) => {
    const isSelected = selectedLifeBusinessMetrics.includes(metric);

    if (isSelected) {
      setSelectedLifeBusinessMetrics((previous) => previous.filter((item) => item !== metric));
      setAgentsError("");
      setRawData([]);
      setData([]);
      return;
    }

    if (selectedLifeBusinessMetrics.length >= 2) {
      setAgentsError("Please select up to 2 metrics.");
      return;
    }

    setSelectedLifeBusinessMetrics((previous) => [...previous, metric]);
    setAgentsError("");
    setRawData([]);
    setData([]);
  };

  const isHealthBusinessView = Boolean(distributionAgentModuleConfig?.requiresHealthChannelCategoryMetric);
  const selectedHealthMetric = selectedHealthMetrics[0] || "";
  const effectiveHealthVisualizationMetric =
    isHealthBusinessView && selectedHealthVisualizationMetric
      ? selectedHealthVisualizationMetric
      : selectedHealthMetrics[0] || "";

  const handleHealthMetricToggle = (metric) => {
    const isSelected = selectedHealthMetrics.includes(metric);

    if (isSelected) {
      setSelectedHealthMetrics((prev) => prev.filter((m) => m !== metric));
      setAgentsError("");
      setRawData([]);
      setData([]);
      return;
    }

    if (selectedHealthMetrics.length >= 2) {
      setAgentsError("Please select up to 2 metrics.");
      return;
    }

    setSelectedHealthMetrics((prev) => [...prev, metric]);
    setAgentsError("");
    setRawData([]);
    setData([]);
  };

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
    setSelectedLifeBusinessYear("");
    setSelectedLifeBusinessMetrics([]);
    setSelectedNonLifeSegment("");
    setSelectedNonLifeChannel("");
    setSelectedHealthChannel("");
    setSelectedHealthCategory("");
    setSelectedHealthMetrics([]);
    setSelectedHealthVisualizationMetric("");
    setPendingHealthVisualizationMetric("");
    setShowHealthMetricPicker(false);
    setLifeBusinessInsurerOptions([]);
    setLifeBusinessChannelOptions([]);
    setLifeBusinessYearOptions([]);
    setNonLifeSegmentOptions([]);
    setNonLifeChannelOptions([]);
    setHealthChannelOptions([]);
    setHealthCategoryOptions([]);
    setHealthMetricOptions([]);
    setShowTimelinePicker(false);
    setShowChartTypePicker(false);
    setShowMetricPicker(false);
    setSelectedLifeBusinessVisualizationMetric("");
    setPendingLifeBusinessVisualizationMetric("");
    setAgentsError("");
    setRawData([]);
    setData([]);
    setAiMessages([]);
  }, [distributionAgentModuleConfig?.collectionName, isDistributionAgentsView]);

  useEffect(() => {
    setPendingVisualizationType(visualizationType);
  }, [visualizationType]);

  useEffect(() => {
    if (!isLifeBusinessChannelwiseView) {
      setSelectedLifeBusinessVisualizationMetric("");
      setPendingLifeBusinessVisualizationMetric("");
      setShowMetricPicker(false);
      return;
    }

    if (selectedLifeBusinessMetrics.length === 0) {
      setSelectedLifeBusinessVisualizationMetric("");
      setPendingLifeBusinessVisualizationMetric("");
      setShowMetricPicker(false);
      return;
    }

    if (
      selectedLifeBusinessVisualizationMetric &&
      selectedLifeBusinessMetrics.includes(selectedLifeBusinessVisualizationMetric)
    ) {
      setPendingLifeBusinessVisualizationMetric(selectedLifeBusinessVisualizationMetric);
      return;
    }

    const firstMetric = selectedLifeBusinessMetrics[0];
    setSelectedLifeBusinessVisualizationMetric(firstMetric);
    setPendingLifeBusinessVisualizationMetric(firstMetric);
  }, [
    isLifeBusinessChannelwiseView,
    selectedLifeBusinessMetrics,
    selectedLifeBusinessVisualizationMetric,
  ]);

  useEffect(() => {
    if (!isHealthBusinessView) {
      setSelectedHealthVisualizationMetric("");
      setPendingHealthVisualizationMetric("");
      setShowHealthMetricPicker(false);
      return;
    }

    if (selectedHealthMetrics.length === 0) {
      setSelectedHealthVisualizationMetric("");
      setPendingHealthVisualizationMetric("");
      setShowHealthMetricPicker(false);
      return;
    }

    if (
      selectedHealthVisualizationMetric &&
      selectedHealthMetrics.includes(selectedHealthVisualizationMetric)
    ) {
      setPendingHealthVisualizationMetric(selectedHealthVisualizationMetric);
      return;
    }

    const firstMetric = selectedHealthMetrics[0];
    setSelectedHealthVisualizationMetric(firstMetric);
    setPendingHealthVisualizationMetric(firstMetric);
  }, [
    isHealthBusinessView,
    selectedHealthMetrics,
    selectedHealthVisualizationMetric,
  ]);

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

  useEffect(() => {
    if (!distributionAgentModuleConfig?.requiresBusinessTypeInsurer) {
      setLifeBusinessYearOptions([]);
      setSelectedLifeBusinessYear("");
      return;
    }

    if (!selectedLifeBusinessType || !selectedLifeBusinessInsurer) {
      setLifeBusinessYearOptions([]);
      setSelectedLifeBusinessYear("");
      return;
    }

    const fetchYears = async () => {
      try {
        const years = await getLifeBusinessInsurerYears(
          selectedLifeBusinessType,
          selectedLifeBusinessInsurer
        );
        setLifeBusinessYearOptions(years);
      } catch (error) {
        console.error("Failed to fetch insurer-wise life business years:", error);
        setLifeBusinessYearOptions([]);
        setSelectedLifeBusinessYear("");
      }
    };

    fetchYears();
  }, [
    distributionAgentModuleConfig,
    selectedLifeBusinessType,
    selectedLifeBusinessInsurer,
  ]);

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

    if (
      selectedModule === "registered-brokers" ||
      selectedModule === "insurance-marketing-firms"
    ) {
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
  }, [distributionAgentModuleConfig, selectedStatewiseState, selectedModule]);

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
          value:
            selectedLifeBusinessType === "Group New Business"
              ? toNumericValue(item.lives_covered)
              : toNumericValue(item.premium_crore),
        }))
        .filter((item) => item.year && Number.isFinite(item.value));
    }

    if (isLifeBusinessChannelwiseView && effectiveVisualizationMetric) {
      return data
        .map((item) => ({
          year: item.year,
          value: toNumericValue(item[effectiveVisualizationMetric]),
        }))
        .filter((item) => Number.isFinite(item.value));
    }

    if (isHealthBusinessView && effectiveHealthVisualizationMetric) {
      return data
        .map((item) => ({
          year: item.year,
          value: toNumericValue(item[effectiveHealthVisualizationMetric]),
        }))
        .filter((item) => Number.isFinite(item.value));
    }

    return data
      .map((item) => ({
        year: item.year,
        value: getDistributionMetricValue(item, selectedModule),
      }))
      .filter((item) => Number.isFinite(item.value));
  }, [
    data,
    distributionAgentModuleConfig,
    selectedModule,
    selectedLifeBusinessType,
    isLifeBusinessChannelwiseView,
    effectiveVisualizationMetric,
    isHealthBusinessView,
    effectiveHealthVisualizationMetric,
  ]);

  const selectedSubModuleTitle =
    SUB_MODULES[activeTab]?.find((module) => module.id === selectedModule)?.title || "Overview";

  const metricLabel = distributionAgentModuleConfig?.requiresBusinessTypeInsurer
    ? "Premium (Crore)"
    : distributionAgentModuleConfig?.requiresBusinessType
    ? getLifeBusinessMetricLabel(selectedLifeBusinessMetric) || "Value"
    : distributionAgentModuleConfig?.requiresHealthChannelCategoryMetric
    ? getHealthMetricLabel(selectedHealthMetric, healthMetricOptions) || "Value"
    : distributionAgentModuleConfig?.metricLabel || "Agents";

  const chartMetricLabel =
    isLifeBusinessChannelwiseView && effectiveVisualizationMetric
      ? getLifeBusinessMetricLabel(effectiveVisualizationMetric) || "Value"
      : isHealthBusinessView && effectiveHealthVisualizationMetric
      ? getHealthMetricLabel(effectiveHealthVisualizationMetric, healthMetricOptions) || "Value"
      : metricLabel;

  const chartExportFileName = useMemo(
    () =>
      `${buildExportFileName(selectedSubModuleTitle, [
        { label: "module", value: selectedSubModuleTitle },
      ])}_chart`,
    [selectedSubModuleTitle]
  );

  const plotTraces = useMemo(() => {
    const xValues = visualizationData.map((item) => String(item.year));
    const yValues = visualizationData.map((item) => toNumericValue(item.value));

    if (visualizationType === "bar") {
      return [
        {
          type: "bar",
          name: chartMetricLabel,
          x: xValues,
          y: yValues,
          marker: {
            color: "rgba(14, 165, 164, 0.88)",
            line: { color: "rgba(15, 118, 110, 0.95)", width: 1 },
          },
          hovertemplate: `%{x}<br>${chartMetricLabel}: %{y:,}<extra></extra>`,
        },
      ];
    }

    if (visualizationType === "area") {
      return [
        {
          type: "scatter",
          mode: "lines+markers",
          name: chartMetricLabel,
          x: xValues,
          y: yValues,
          line: { color: "#0ea5a4", width: 3 },
          marker: { color: "#0ea5a4", size: 8 },
          fill: "tozeroy",
          fillcolor: "rgba(14, 165, 164, 0.14)",
          hovertemplate: `%{x}<br>${chartMetricLabel}: %{y:,}<extra></extra>`,
        },
      ];
    }

    return [
      {
        type: "scatter",
        mode: "lines+markers",
        name: chartMetricLabel,
        x: xValues,
        y: yValues,
        line: { color: "#0ea5a4", width: 3 },
        marker: { color: "#0ea5a4", size: 8 },
        hovertemplate: `%{x}<br>${chartMetricLabel}: %{y:,}<extra></extra>`,
      },
    ];
  }, [visualizationData, visualizationType, chartMetricLabel]);

  const plotLayout = useMemo(
    () => ({
      autosize: true,
      paper_bgcolor: "rgba(0, 0, 0, 0)",
      plot_bgcolor: "rgba(0, 0, 0, 0)",
      margin: { l: 60, r: 18, t: 20, b: 52 },
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
        title: { text: chartMetricLabel, font: { size: 12, color: "#475569" } },
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
    [chartMetricLabel, distributionAgentModuleConfig]
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
    ? Boolean(selectedLifeBusinessType && selectedLifeBusinessInsurer && selectedLifeBusinessYear)
    : distributionAgentModuleConfig?.requiresBusinessType
    ? Boolean(
        selectedLifeBusinessType &&
          selectedLifeBusinessChannel &&
          selectedLifeBusinessMetrics.length > 0
      )
    : distributionAgentModuleConfig?.requiresSegmentChannel
    ? Boolean(selectedNonLifeSegment && selectedNonLifeChannel)
    : distributionAgentModuleConfig?.requiresHealthChannelCategoryMetric
    ? Boolean(selectedHealthChannel && selectedHealthCategory && selectedHealthMetrics.length > 0)
    : distributionAgentModuleConfig?.requiresAgentType
    ? Boolean(selectedAgentType && (selectedAgentInsurer || selectedAgentSector))
    : Boolean(selectedAgentInsurer || selectedAgentSector);

  const insightsContextMessage = useMemo(() => {
    if (!isDistributionAgentsView) {
      return "Use this panel to ask questions about the selected insurance analytics data.";
    }

    const rangeStart = timelineStartYear || timelineYearOptions[0];
    const rangeEnd = timelineEndYear || timelineYearOptions[timelineYearOptions.length - 1];
    const hasRange = Boolean(rangeStart && rangeEnd);
    const hasInsurer = Boolean(selectedStatewiseInsurer || selectedLifeBusinessInsurer || selectedAgentInsurer);
    const insurerName =
      selectedStatewiseInsurer ||
      selectedLifeBusinessInsurer ||
      (selectedAgentInsurer && selectedAgentInsurer !== "All Insurers" ? selectedAgentInsurer : "");
    const regionName = selectedStatewiseState || "";

    const detailParts = [selectedSubModuleTitle];
    if (hasInsurer) {
      detailParts.push(`for ${insurerName}`);
    }
    if (regionName) {
      detailParts.push(`in ${regionName}`);
    }
    if (hasRange) {
      detailParts.push(`from ${rangeStart} to ${rangeEnd}`);
    }

    return `This data shows ${detailParts.join(" ")}.`;
  }, [
    isDistributionAgentsView,
    selectedSubModuleTitle,
    selectedStatewiseInsurer,
    selectedLifeBusinessInsurer,
    selectedAgentInsurer,
    selectedStatewiseState,
    timelineStartYear,
    timelineEndYear,
    timelineYearOptions,
  ]);

  // Auto-generate insights whenever visualization data changes while insights are visible.
  useEffect(() => {
    if (!showInsights || !isDistributionAgentsView || visualizationData.length === 0) return;

    const stats = analyzeDataLocally(visualizationData);

    // Build filter summary
    const filterParts = [];
    if (selectedAgentType) filterParts.push(`Agent Type: ${selectedAgentType}`);
    if (selectedAgentInsurer && selectedAgentInsurer !== "All Insurers") filterParts.push(`Insurer: ${selectedAgentInsurer}`);
    if (selectedAgentSector) filterParts.push(`Sector: ${selectedAgentSector}`);
    if (selectedStatewiseInsurer) filterParts.push(`Insurer: ${selectedStatewiseInsurer}`);
    if (selectedStatewiseState) filterParts.push(`State: ${selectedStatewiseState}`);
    if (selectedLifeBusinessType) filterParts.push(`Business Type: ${selectedLifeBusinessType}`);
    if (selectedLifeBusinessChannel) filterParts.push(`Channel: ${selectedLifeBusinessChannel}`);
    if (selectedLifeBusinessInsurer) filterParts.push(`Life Insurer: ${selectedLifeBusinessInsurer}`);
    if (selectedLifeBusinessYear) {
      filterParts.push(`Year: ${selectedLifeBusinessYear}`);
    }
    if (selectedNonLifeSegment) filterParts.push(`Segment: ${selectedNonLifeSegment}`);
    if (selectedNonLifeChannel) filterParts.push(`Non-Life Channel: ${selectedNonLifeChannel}`);
    if (selectedHealthChannel) filterParts.push(`Health Channel: ${selectedHealthChannel}`);
    if (selectedHealthCategory) filterParts.push(`Health Category: ${selectedHealthCategory}`);
    const filterSummary = filterParts.length > 0 ? `Applied Filters: ${filterParts.join(" | ")}\n` : "";

    // Structured summary — AI only interprets, never recalculates
    const context =
      `Dataset: ${selectedSubModuleTitle}\nMetric: ${metricLabel}\n${filterSummary}` +
      `Start value: ${stats.startValue} (${stats.startYear})\n` +
      `End value: ${stats.endValue} (${stats.endYear})\n` +
      `Minimum: ${stats.minValue} (${stats.minYear})\n` +
      `Maximum: ${stats.maxValue} (${stats.maxYear})\n` +
      `Overall growth: ${stats.growthPct}%\n` +
      `Trend: ${stats.trend}\n` +
      (stats.sharpDrop ? `Notable drop: ${stats.sharpDrop}\n` : "") +
      (stats.sharpRise ? `Notable rise: ${stats.sharpRise}\n` : "");

    // Increment generation counter — stale async responses will be ignored
    const generation = ++insightsGenerationRef.current;
    setAiMessages([]);
    setIsAILoading(true);

    generateInsights(context)
      .then((text) => {
        if (generation !== insightsGenerationRef.current) return;
        setAiMessages([{ role: "assistant", text: text || "No insights could be generated for this dataset.", isAutoInsight: true }]);
      })
      .catch((err) => {
        if (generation !== insightsGenerationRef.current) return;
        console.error("Auto insights error:", err);
        const isQuota = String(err?.message || "").includes("429") || String(err?.message || "").toLowerCase().includes("quota");
        setAiMessages([{ role: "assistant", text: isQuota
          ? "AI quota exceeded. Please wait a moment and try refreshing."
          : "Could not generate insights. Please try again.", isAutoInsight: true }]);
      })
      .finally(() => {
        if (generation === insightsGenerationRef.current) setIsAILoading(false);
      });
  }, [visualizationData, showInsights]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (showInsights) {
      return;
    }

    // Invalidate any in-flight auto-generation requests while panel is collapsed.
    insightsGenerationRef.current += 1;
    setIsAILoading(false);
  }, [showInsights]);

  const handleAskInsightsQuestion = async () => {
    console.log("Ask button clicked");
    if (isAILoading) return;
    const trimmedQuestion = insightsQuestion.trim();
    if (!trimmedQuestion) {
      return;
    }

    // ── Hybrid Intelligence: answer deterministic questions locally ──
    if (visualizationData.length > 0) {
      const stats = analyzeDataLocally(visualizationData);
      const q = trimmedQuestion.toLowerCase();

      const isHighest   = /highest|maximum|max|peak|top/.test(q);
      const isLowest    = /lowest|minimum|min|bottom|least/.test(q);
      const isGrowth    = /growth|change|increase|decrease|grown|fell|rise|drop/.test(q);
      const isTrend     = /\btrend\b|direction|overall|pattern/.test(q);
      const isStart     = /\bstart|\bfirst|\bearliest|\bbegin/.test(q);
      const isEnd       = /\bend\b|\blast\b|\blatest|\brecent|\bcurrent/.test(q);

      const localAnswer =
        isHighest && isLowest
          ? `Highest: ${stats.maxValue} in ${stats.maxYear}.\nLowest: ${stats.minValue} in ${stats.minYear}.`
          : isHighest
          ? `The highest value is ${stats.maxValue}, recorded in ${stats.maxYear}.`
          : isLowest
          ? `The lowest value is ${stats.minValue}, recorded in ${stats.minYear}.`
          : isGrowth
          ? `Overall change from ${stats.startYear} to ${stats.endYear}: ${stats.growthPct}% (${stats.startValue} → ${stats.endValue}).`
          : isTrend
          ? `The overall trend is ${stats.trend}. Values moved from ${stats.startValue} (${stats.startYear}) to ${stats.endValue} (${stats.endYear}).`
          : isStart
          ? `The starting value is ${stats.startValue} in ${stats.startYear}.`
          : isEnd
          ? `The latest value is ${stats.endValue} in ${stats.endYear}.`
          : null;

      if (localAnswer) {
        setAiMessages((prev) => [
          ...prev,
          { role: "user", text: trimmedQuestion },
          { role: "assistant", text: localAnswer },
        ]);
        setInsightsQuestion("");
        return; // ← no Gemini call needed
      }
    }

    // ── Fall through to Gemini for interpretive questions ──
    try {
      setIsAILoading(true);

      const stats = visualizationData.length > 0 ? analyzeDataLocally(visualizationData) : null;

      const filterParts = [];
      if (selectedAgentType) filterParts.push(`Agent Type: ${selectedAgentType}`);
      if (selectedAgentInsurer && selectedAgentInsurer !== "All Insurers") filterParts.push(`Insurer: ${selectedAgentInsurer}`);
      if (selectedAgentSector) filterParts.push(`Sector: ${selectedAgentSector}`);
      if (selectedStatewiseState) filterParts.push(`State: ${selectedStatewiseState}`);
      if (selectedStatewiseInsurer) filterParts.push(`Insurer: ${selectedStatewiseInsurer}`);
      if (selectedLifeBusinessType) filterParts.push(`Business Type: ${selectedLifeBusinessType}`);
      if (selectedLifeBusinessChannel) filterParts.push(`Channel: ${selectedLifeBusinessChannel}`);
      if (selectedLifeBusinessInsurer) filterParts.push(`Life Insurer: ${selectedLifeBusinessInsurer}`);
      if (selectedLifeBusinessYear) {
        filterParts.push(`Year: ${selectedLifeBusinessYear}`);
      }
      if (selectedNonLifeSegment) filterParts.push(`Segment: ${selectedNonLifeSegment}`);
      if (selectedNonLifeChannel) filterParts.push(`Non-Life Channel: ${selectedNonLifeChannel}`);
      if (selectedHealthChannel) filterParts.push(`Health Channel: ${selectedHealthChannel}`);
      if (selectedHealthCategory) filterParts.push(`Health Category: ${selectedHealthCategory}`);
      const filterSummary = filterParts.length > 0 ? filterParts.join(" | ") : "No filters applied";

      const context = stats
        ? `Dataset: ${selectedSubModuleTitle}\nMetric: ${metricLabel}\nActive Filters: ${filterSummary}\n` +
          `Start: ${stats.startValue} (${stats.startYear}), End: ${stats.endValue} (${stats.endYear})\n` +
          `Min: ${stats.minValue} (${stats.minYear}), Max: ${stats.maxValue} (${stats.maxYear})\n` +
          `Growth: ${stats.growthPct}%, Trend: ${stats.trend}`
        : `Dataset: ${selectedSubModuleTitle}\nMetric: ${metricLabel}\nActive Filters: ${filterSummary}`;

      const aiResponse = await askAI(trimmedQuestion, context);

      setAiMessages((prev) => [
        ...prev,
        { role: "user", text: trimmedQuestion },
        { role: "assistant", text: aiResponse },
      ]);
      setInsightsQuestion("");
    } catch (error) {
      console.error("Error calling AI service:", error);
      const isQuota = String(error?.message || "").includes("429") || String(error?.message || "").toLowerCase().includes("quota");
      setAiMessages((prev) => [
        ...prev,
        { role: "user", text: trimmedQuestion },
        { role: "assistant", text: isQuota
          ? "AI quota exceeded. Please wait a moment before asking again."
          : "Sorry, I encountered an error processing your question. Please try again." },
      ]);
      setInsightsQuestion("");
    } finally {
      setIsAILoading(false);
    }
  };

  const handleClearInsightsChat = () => {
    setAiMessages([]);
    setInsightsQuestion("");
  };

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
      setSelectedLifeBusinessYear("");
      setSelectedLifeBusinessMetrics([]);
      setSelectedNonLifeSegment("");
      setSelectedNonLifeChannel("");
      setSelectedHealthChannel("");
      setSelectedHealthCategory("");
      setSelectedHealthMetrics([]);
      setSelectedHealthVisualizationMetric("");
      setPendingHealthVisualizationMetric("");
      setShowHealthMetricPicker(false);
      setLifeBusinessChannelOptions([]);
      setLifeBusinessInsurerOptions([]);
      setLifeBusinessYearOptions([]);
      setNonLifeSegmentOptions([]);
      setNonLifeChannelOptions([]);
      setHealthChannelOptions([]);
      setHealthCategoryOptions([]);
      setHealthMetricOptions([]);
      setShowTimelinePicker(false);
      setShowChartTypePicker(false);
      setShowMetricPicker(false);
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

    setAiMessages([]);

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

        if (!selectedLifeBusinessYear) {
          setAgentsError("Please select a year.");
          setRawData([]);
          setData([]);
          return;
        }

        setAgentsLoading(true);
        setAgentsError("");

        try {
          const result = await getLifeBusinessInsurerChannelData(
            selectedLifeBusinessType,
            selectedLifeBusinessInsurer,
            selectedLifeBusinessYear
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

      if (selectedLifeBusinessMetrics.length === 0) {
        setAgentsError("Please select at least one metric.");
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
          selectedLifeBusinessMetrics
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

      if (selectedHealthMetrics.length === 0) {
        setAgentsError("Please select a metric.");
        setRawData([]);
        setData([]);
        return;
      }

      setAgentsLoading(true);
      setAgentsError("");

      try {
        const metricResults = await Promise.all(
          selectedHealthMetrics.map((metric) =>
            getHealthBusinessYearwiseData(
              distributionAgentModuleConfig.collectionName,
              selectedHealthChannel,
              selectedHealthCategory,
              metric
            )
          )
        );

        // Merge per-metric results by year into one row per year
        const mergedByYear = new Map();
        selectedHealthMetrics.forEach((metric, idx) => {
          metricResults[idx].forEach((row) => {
            if (!mergedByYear.has(row.year)) {
              mergedByYear.set(row.year, { year: row.year });
            }
            mergedByYear.get(row.year)[metric] = row.agents;
          });
        });

        const merged = Array.from(mergedByYear.values());
        setRawData(merged);
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
      if (!selectedStatewiseState) {
        setAgentsError("Please select a state.");
        setRawData([]);
        setData([]);
        return;
      }

      setAgentsLoading(true);
      setAgentsError("");

      try {
        const result = await distributionAgentModuleConfig.getData(selectedStatewiseState);
        setRawData(result);
      } catch (error) {
        console.error("Failed to apply state-only filters:", error);
        setAgentsError("Unable to load data for selected state.");
        setRawData([]);
        setData([]);
      } finally {
        setAgentsLoading(false);
      }

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
          { label: "Year", value: selectedLifeBusinessYear },
        ]
      : distributionAgentModuleConfig?.requiresBusinessType
      ? [
          { label: "Business Type", value: selectedLifeBusinessType },
          { label: "Channel", value: selectedLifeBusinessChannel },
          {
            label: "Metric",
            value: selectedLifeBusinessMetrics.map((metric) => getLifeBusinessMetricLabel(metric)).join(", "),
          },
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
          {
            label: "Metric",
            value: selectedHealthMetrics.map((m) => getHealthMetricLabel(m, healthMetricOptions)).join(", "),
          },
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
            row.year || selectedLifeBusinessYear,
            row.channel,
            Number(row.lives_covered || 0).toLocaleString("en-IN"),
            Number(row.premium_crore || 0).toLocaleString("en-IN"),
            Number(row.scheme || 0).toLocaleString("en-IN"),
          ];
        })
      : distributionAgentModuleConfig?.requiresBusinessType &&
        !distributionAgentModuleConfig?.requiresBusinessTypeInsurer &&
        selectedLifeBusinessMetrics.length > 0
      ? data.map((row) => [
          row.year,
          ...selectedLifeBusinessMetrics.map((metric) =>
            ["policies", "lives_covered", "scheme"].includes(metric)
              ? toNumericValue(row[metric]).toLocaleString("en-IN", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })
              : formatNumberForDisplay(row[metric])
          ),
        ])
      : distributionAgentModuleConfig?.requiresHealthChannelCategoryMetric &&
        selectedHealthMetrics.length > 0
      ? data.map((row) => [
          row.year,
          ...selectedHealthMetrics.map((metric) =>
            isHealthMetricInteger(metric, healthMetricOptions)
              ? Number(row[metric] || 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })
              : formatNumberForDisplay(row[metric])
          ),
        ])
      : data.map((row) => [
          row.year,
          getDistributionMetricValue(row, selectedModule).toLocaleString("en-IN"),
        ]);

    const exportHeader = distributionAgentModuleConfig?.requiresBusinessTypeInsurer
      ? selectedLifeBusinessType === "Individual New Business"
        ? ["Channel", "Premium (Crore)", "Policies"]
        : ["Year", "Channel", "Premium (Crore)", "Lives Covered", "Schemes"]
      : distributionAgentModuleConfig?.requiresBusinessType &&
        !distributionAgentModuleConfig?.requiresBusinessTypeInsurer &&
        selectedLifeBusinessMetrics.length > 0
      ? ["Year", ...selectedLifeBusinessMetrics.map((metric) => getLifeBusinessMetricLabel(metric))]
      : distributionAgentModuleConfig?.requiresHealthChannelCategoryMetric &&
        selectedHealthMetrics.length > 0
      ? ["Year", ...selectedHealthMetrics.map((m) => getHealthMetricLabel(m, healthMetricOptions))]
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
    <div className="life-insurance-viewport intermediaries-theme">
      <div className="life-tabs">
        {TABS.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              className={`life-tab ${activeTab === tab.id ? "active" : ""}`}
              data-tab={tab.id}
              style={{ "--tab-accent": tab.accent }}
              onClick={() => {
                setActiveTab(tab.id);
                const firstModuleId = SUB_MODULES[tab.id]?.[0]?.id || null;
                setSelectedModule(firstModuleId);
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
        style={{ "--tab-accent": TABS.find((tab) => tab.id === activeTab)?.accent || "#0ea5a4" }}
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
                              setSelectedLifeBusinessYear("");
                              setSelectedLifeBusinessChannel("");
                              setSelectedLifeBusinessMetrics([]);
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
                            setSelectedLifeBusinessYear("");
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
                              setSelectedLifeBusinessMetrics([]);
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
                              {availableLifeBusinessMetrics.map((metric) => (
                                <button
                                  key={metric}
                                  type="button"
                                  className={`premium-toggle-btn ${
                                    selectedLifeBusinessMetrics.includes(metric) ? "active" : ""
                                  }`}
                                  onClick={() => handleLifeBusinessMetricToggle(metric)}
                                >
                                  <span className="metric-toggle-btn-content">
                                    {getLifeBusinessMetricLabel(metric)}
                                    {selectedLifeBusinessMetrics.includes(metric) && (
                                      <Check size={14} strokeWidth={2.5} className="metric-check-icon" />
                                    )}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {distributionAgentModuleConfig?.requiresBusinessTypeInsurer &&
                      selectedLifeBusinessInsurer && (
                      <FilterSelect
                        label="Select Year"
                        options={lifeBusinessYearOptions}
                        value={selectedLifeBusinessYear}
                        onChange={(nextYear) => {
                          setSelectedLifeBusinessYear(nextYear);
                          setAgentsError("");
                          setRawData([]);
                          setData([]);
                        }}
                      />
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
                        setSelectedHealthMetrics([]);
                        setSelectedHealthVisualizationMetric("");
                        setPendingHealthVisualizationMetric("");
                        setShowHealthMetricPicker(false);
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
                        setSelectedHealthMetrics([]);
                        setSelectedHealthVisualizationMetric("");
                        setPendingHealthVisualizationMetric("");
                        setShowHealthMetricPicker(false);
                        setAgentsError("");
                        setRawData([]);
                        setData([]);
                      }}
                      disabled={!selectedHealthChannel}
                    />
                    {selectedHealthCategory && healthMetricOptions.length > 0 && (
                      <div className="filter-item">
                        <label className="filter-label label-text">Metric</label>
                        <div className="premium-toggle-group">
                          {healthMetricOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              className={`premium-toggle-btn ${
                                selectedHealthMetrics.includes(option.value) ? "active" : ""
                              }`}
                              onClick={() => handleHealthMetricToggle(option.value)}
                            >
                              <span className="metric-toggle-btn-content">
                                {option.label}
                                {selectedHealthMetrics.includes(option.value) && (
                                  <Check size={14} strokeWidth={2.5} className="metric-check-icon" />
                                )}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
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
                {(selectedModule === "registered-brokers" ||
                  selectedModule === "insurance-marketing-firms" ||
                  !distributionAgentModuleConfig?.requiresStateOnly) && (
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
                            {isLifeBusinessChannelwiseView && selectedLifeBusinessMetrics.length > 0
                              ? selectedLifeBusinessMetrics.map((metric) => (
                                  <th key={`metric-${metric}`} className="col-value">
                                    {getLifeBusinessMetricLabel(metric)}
                                  </th>
                                ))
                              : isHealthBusinessView && selectedHealthMetrics.length > 0
                              ? selectedHealthMetrics.map((metric) => (
                                  <th key={`hmetric-${metric}`} className="col-value">
                                    {getHealthMetricLabel(metric, healthMetricOptions)}
                                  </th>
                                ))
                              : (
                                <th className="col-value">
                                  {distributionAgentModuleConfig?.requiresSegmentChannel ? (
                                    <span
                                      className="metric-heading-inline"
                                    >
                                      <IndianRupeeIcon size={14} strokeWidth={2.2} />
                                      Gross Direct Premium in Cr
                                    </span>
                                  ) : (
                                    metricLabel
                                  )}
                                </th>
                              )}
                          </tr>
                        )}
                      </thead>
                      <tbody>
                        {distributionAgentModuleConfig?.requiresBusinessTypeInsurer
                          ? data.map((item) => (
                              <tr key={`${item.channel}-${item.year || selectedLifeBusinessYear}`}>
                                <td className="col-year">
                                  <span className="year-badge">{item.channel}</span>
                                </td>
                                <td className="col-value">
                                  <span className="value-amount">
                                    {selectedLifeBusinessType === "Individual New Business"
                                      ? formatNumberForDisplay(item.premium_crore)
                                      : formatNumberForDisplay(item.lives_covered)}
                                  </span>
                                </td>
                                {selectedLifeBusinessType === "Individual New Business" ? (
                                  <td className="col-value">
                                    <span className="value-amount">
                                      {toNumericValue(item.policies).toLocaleString("en-IN", {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0,
                                      })}
                                    </span>
                                  </td>
                                ) : (
                                  <>
                                    <td className="col-value">
                                      <span className="value-amount">
                                        {toNumericValue(item.premium_crore).toLocaleString("en-IN", {
                                          minimumFractionDigits: 0,
                                          maximumFractionDigits: 0,
                                        })}
                                      </span>
                                    </td>
                                    <td className="col-value">
                                      <span className="value-amount">
                                        {toNumericValue(item.scheme).toLocaleString("en-IN", {
                                          minimumFractionDigits: 0,
                                          maximumFractionDigits: 0,
                                        })}
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
                                {isLifeBusinessChannelwiseView && selectedLifeBusinessMetrics.length > 0 ? (
                                  selectedLifeBusinessMetrics.map((metric) => (
                                    <td key={`${item.year}-${metric}`} className="col-value">
                                      <span className="value-amount">
                                        {["policies", "lives_covered", "scheme"].includes(metric)
                                          ? toNumericValue(item[metric]).toLocaleString("en-IN", {
                                              minimumFractionDigits: 0,
                                              maximumFractionDigits: 0,
                                            })
                                          : formatNumberForDisplay(item[metric])}
                                      </span>
                                    </td>
                                  ))
                                ) : isHealthBusinessView && selectedHealthMetrics.length > 0 ? (
                                  selectedHealthMetrics.map((metric) => (
                                    <td key={`${item.year}-hmetric-${metric}`} className="col-value">
                                      <span className="value-amount">
                                        {isHealthMetricInteger(metric, healthMetricOptions)
                                          ? Number(item[metric] || 0).toLocaleString("en-IN", {
                                              minimumFractionDigits: 0,
                                              maximumFractionDigits: 0,
                                            })
                                          : formatNumberForDisplay(item[metric])}
                                      </span>
                                    </td>
                                  ))
                                ) : (
                                  <td className="col-value">
                                    <span className="value-amount">
                                      {activeTab === "distribution-workforce" ||
                                      selectedModule === "distribution-individual-agents-life" ||
                                      selectedModule === "registered-brokers" ||
                                      selectedModule === "insurance-marketing-firms" ||
                                      (distributionAgentModuleConfig?.requiresHealthChannelCategoryMetric &&
                                        isHealthMetricInteger(selectedHealthMetric, healthMetricOptions))
                                        ? getDistributionMetricValue(item, selectedModule).toLocaleString("en-IN", {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0,
                                          })
                                        : formatNumberForDisplay(getDistributionMetricValue(item, selectedModule))}
                                    </span>
                                  </td>
                                )}
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
                        ? "Choose business type, insurer and year, then click Apply Filters."
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
              <button
                type="button"
                className="data-export-btn"
                onClick={() => setShowChartTypePicker((previous) => !previous)}
                title="Select chart type"
              >
                Select Chart Type
              </button>
            )}
            {isDistributionAgentsView &&
              isLifeBusinessChannelwiseView &&
              selectedLifeBusinessMetrics.length > 1 &&
              visualizationData.length > 0 && (
              <button
                type="button"
                className="data-export-btn"
                onClick={() => setShowMetricPicker((previous) => !previous)}
                title="Select visualization metric"
              >
                Select Metric
              </button>
            )}
            {isDistributionAgentsView &&
              isHealthBusinessView &&
              selectedHealthMetrics.length > 1 &&
              visualizationData.length > 0 && (
              <button
                type="button"
                className="data-export-btn"
                onClick={() => setShowHealthMetricPicker((previous) => !previous)}
                title="Select visualization metric"
              >
                Select Metric
              </button>
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
                  {showMetricPicker &&
                    isLifeBusinessChannelwiseView &&
                    selectedLifeBusinessMetrics.length > 1 && (
                    <div className="timeline-filter-row chart-type-picker-row">
                      <div className="timeline-field">
                        <label className="filter-label label-text">Metric</label>
                        <select
                          className="filter-select timeline-select"
                          value={pendingLifeBusinessVisualizationMetric}
                          onChange={(event) =>
                            setPendingLifeBusinessVisualizationMetric(event.target.value)
                          }
                        >
                          {selectedLifeBusinessMetrics.map((metric) => (
                            <option key={`viz-metric-${metric}`} value={metric}>
                              {getLifeBusinessMetricLabel(metric)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        className="timeline-apply-btn"
                        onClick={() => {
                          setSelectedLifeBusinessVisualizationMetric(
                            pendingLifeBusinessVisualizationMetric || selectedLifeBusinessMetrics[0]
                          );
                          setShowMetricPicker(false);
                        }}
                        title="Apply metric"
                      >
                        Apply Metric
                      </button>
                    </div>
                  )}
                  {showHealthMetricPicker &&
                    isHealthBusinessView &&
                    selectedHealthMetrics.length > 1 && (
                    <div className="timeline-filter-row chart-type-picker-row">
                      <div className="timeline-field">
                        <label className="filter-label label-text">Metric</label>
                        <select
                          className="filter-select timeline-select"
                          value={pendingHealthVisualizationMetric}
                          onChange={(event) =>
                            setPendingHealthVisualizationMetric(event.target.value)
                          }
                        >
                          {selectedHealthMetrics.map((metric) => (
                            <option key={`health-viz-metric-${metric}`} value={metric}>
                              {getHealthMetricLabel(metric, healthMetricOptions)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        className="timeline-apply-btn"
                        onClick={() => {
                          setSelectedHealthVisualizationMetric(
                            pendingHealthVisualizationMetric || selectedHealthMetrics[0]
                          );
                          setShowHealthMetricPicker(false);
                        }}
                        title="Apply metric"
                      >
                        Apply Metric
                      </button>
                    </div>
                  )}
                  <div className="chart-wrapper plotly-chart-wrapper">
                    <Plot
                      className="plot-component-fill"
                      data={plotTraces}
                      layout={plotLayout}
                      config={plotConfig}
                      useResizeHandler
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
                        ? "Choose business type, insurer and year, then click Apply Filters."
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
                <div className="panel-header-actions">
                  <button
                    type="button"
                    className="data-export-btn"
                    onClick={handleClearInsightsChat}
                    disabled={isAILoading || (aiMessages.length === 0 && !insightsQuestion.trim())}
                    title="Clear conversation"
                  >
                    <Trash2 size={13} strokeWidth={2} style={{ marginRight: 5 }} />
                    Clear Chat
                  </button>
                </div>
              </>
            )}
          </div>

          {showInsights && (
            <div className="panel-body insights-panel-body">
              <InsightsAssistantPanel
                contextMessage={insightsContextMessage}
                messages={aiMessages}
                isLoading={isAILoading}
                question={insightsQuestion}
                onQuestionChange={setInsightsQuestion}
                onAsk={handleAskInsightsQuestion}
              />
            </div>
          )}
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

function InsightsAssistantPanel({ contextMessage, messages = [], isLoading = false, question, onQuestionChange, onAsk }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onAsk?.();
  };

  return (
    <div className="insights-chat-layout">
      <div className="insights-context-box">
        <p className="insights-context-text">{contextMessage}</p>
      </div>

      <div className="insights-messages-area" role="log" aria-live="polite">
        {isLoading && messages.length === 0 ? (
          <div className="insights-empty-state">
            <Loader2 className="insights-loading-spinner" size={18} strokeWidth={2} />
            <p className="insights-messages-placeholder" style={{ marginTop: 8 }}>Generating insights…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="insights-empty-state">
            <p className="insights-messages-placeholder">Ask a question about this data.</p>
          </div>
        ) : (
          <div className="insights-messages-list">
            {messages.map((msg, idx) =>
              msg.isAutoInsight ? (
                <div key={idx} className="insights-autoinsight-block">
                  {msg.text
                    .split("\n")
                    .filter((line) => line.trim())
                    .map((line, i) => (
                      <div key={i} className={`insights-insight-card insights-insight-card--${(i % 3) + 1}`}>
                        <p className="insights-insight-text">{line.replace(/^[•*\-]\s*/, "")}</p>
                      </div>
                    ))}
                </div>
              ) : (
                <div key={idx} className={`insights-bubble-row insights-bubble-row--${msg.role}`}>
                  {msg.role === "assistant" && (
                    <div className="insights-avatar insights-avatar--assistant">
                      <Lightbulb size={12} strokeWidth={2.5} />
                    </div>
                  )}
                  <div className={`insights-bubble insights-bubble--${msg.role}`}>
                    <p className="insights-bubble-text">{msg.text}</p>
                  </div>
                  {msg.role === "user" && (
                    <div className="insights-avatar insights-avatar--user">
                      <UserRound size={12} strokeWidth={2.5} />
                    </div>
                  )}
                </div>
              )
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form className="insights-input-row" onSubmit={handleSubmit}>
        <input
          type="text"
          className="insights-question-input"
          placeholder="Type your question..."
          value={question}
          onChange={(event) => onQuestionChange?.(event.target.value)}
        />
        <button type="submit" className="insights-ask-btn">
          Ask
        </button>
      </form>
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

// ── Local analytics engine ─────────────────────────────────────────────────
// Computes all deterministic stats in JS so Gemini only needs to interpret,
// never recalculate. Reduces token usage by ~85% and prevents hallucinations.
function analyzeDataLocally(data) {
  const points = data.filter((d) => Number.isFinite(Number(d.value)));
  if (points.length === 0) {
    return { startValue: 0, endValue: 0, startYear: "", endYear: "", minValue: 0, maxValue: 0, minYear: "", maxYear: "", growthPct: "0.00", trend: "flat", sharpDrop: null, sharpRise: null };
  }

  const values = points.map((d) => Number(d.value));
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const minPoint = points[values.indexOf(minValue)];
  const maxPoint = points[values.indexOf(maxValue)];

  const startValue = values[0];
  const endValue   = values[values.length - 1];
  const startYear  = String(points[0].year);
  const endYear    = String(points[points.length - 1].year);

  const growthPct = startValue !== 0
    ? (((endValue - startValue) / Math.abs(startValue)) * 100).toFixed(2)
    : "N/A";

  const trend =
    endValue > startValue * 1.05 ? "upward" :
    endValue < startValue * 0.95 ? "downward" : "relatively flat";

  // Detect sharpest single-period drop / rise (>15%)
  let sharpDrop = null;
  let sharpRise = null;
  for (let i = 1; i < points.length; i++) {
    const prev = Number(points[i - 1].value);
    const curr = Number(points[i].value);
    if (prev === 0) continue;
    const pct = ((curr - prev) / Math.abs(prev)) * 100;
    if (pct <= -15) sharpDrop = `${Math.abs(pct).toFixed(0)}% drop between ${points[i - 1].year} and ${points[i].year}`;
    if (pct >= 15)  sharpRise = `${pct.toFixed(0)}% rise between ${points[i - 1].year} and ${points[i].year}`;
  }

  return {
    startValue: Number(startValue.toFixed(2)),
    endValue:   Number(endValue.toFixed(2)),
    startYear,
    endYear,
    minValue:   Number(minValue.toFixed(2)),
    maxValue:   Number(maxValue.toFixed(2)),
    minYear:    String(minPoint.year),
    maxYear:    String(maxPoint.year),
    growthPct,
    trend,
    sharpDrop,
    sharpRise,
  };
}
// ──────────────────────────────────────────────────────────────────────────

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

function getDistributionMetricValue(row, moduleId) {
  if (!row) {
    return 0;
  }

  if (moduleId === "avg-policies-sold") {
    const candidates = [
      row.agents,
      row.policies,
      row.avg_policies,
      row.average_policies,
      row.policies_sold,
      row.individual_policies,
      row.no_of_policies,
      row.number_of_policies,
      row.policy_count,
      row.value,
    ];

    for (const candidate of candidates) {
      if (candidate !== null && candidate !== undefined && candidate !== "") {
        return toNumericValue(candidate);
      }
    }

    return 0;
  }

  if (moduleId === "avg-new-business-premium") {
    const candidates = [
      row.agents,
      row.premium,
      row.avg_premium,
      row.average_premium,
      row.new_business_premium,
      row.new_business_premium_income,
      row.amount,
      row.value,
    ];

    for (const candidate of candidates) {
      if (candidate !== null && candidate !== undefined && candidate !== "") {
        return toNumericValue(candidate);
      }
    }

    return 0;
  }

  if (moduleId === "avg-premium-per-policy") {
    const candidates = [
      row.agents,
      row.premium_per_policy,
      row.avg_premium_per_policy,
      row.average_premium_per_policy,
      row.amount,
      row.value,
    ];

    for (const candidate of candidates) {
      if (candidate !== null && candidate !== undefined && candidate !== "") {
        return toNumericValue(candidate);
      }
    }

    return 0;
  }

  return toNumericValue(row.agents ?? row.value ?? row.count ?? row.number ?? 0);
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

function isHealthMetricInteger(metricValue, metricOptions) {
  const metricLabel = getHealthMetricLabel(metricValue, metricOptions).toLowerCase();

  return /claims|claim count|no of|number of|count|policies|lives|persons|covered/i.test(metricLabel) &&
    !/premium|amount|incurred|ratio|average|crore|lakhs|lakhs?/i.test(metricLabel);
}
