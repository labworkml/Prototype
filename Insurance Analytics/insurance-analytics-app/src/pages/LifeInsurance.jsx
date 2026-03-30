import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
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
  BarChart3, TrendingUp, AlertTriangle, DollarSign, Globe, Shield, Check,
  FileText, PieChart, MapPin, Files, CheckCircle, Building2,
  Banknote, BarChart2, Link2, CreditCard, TrendingDown, Sprout,
  Zap, Clock, Search, Calendar, Gem, Pin, Users, Briefcase,
  Shuffle, Building, Network, Phone, Scale, RefreshCw,
  IndianRupeeIcon, Lightbulb, Info, Loader2
} from "lucide-react";
import { db } from "../firebase/firebaseConfig";
import SegmentAnalysisFilters from "../components/SegmentAnalysisFilters";
import { 
  fetchSegmentPremiumData, 
  transformToTableRows, 
  transformToChartData 
} from "../firebase/segmentAnalysisService";
import PlotComponentModule from "react-plotly.js";
import "../styles/life-insurance.css";

const Plot = PlotComponentModule?.default || PlotComponentModule;

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
    { id: 1, title: "Life - Insurer Basic Details", icon: FileText },
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

const STATEWISE_COLLECTIONS = {
  Individual: {
    Total: "sheet5_statewise_individual_newbusiness_life",
    "Insurer Wise": "sheet6_statewise_insurerwise_individual",
  },
  Group: {
    Total: "sheet7_statewise_group",
    "Insurer Wise": "sheet8_statewise_insurerwise_group",
  },
};

const STATEWISE_METRICS = {
  Individual: ["Policies", "Premium"],
  Group: ["Lives", "Schemes", "Premium"],
};

export default function LifeInsurance() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("market-overview");
  const [selectedModule, setSelectedModule] = useState(null);
  const [showInsights, setShowInsights] = useState(false);
  const [lifeInsurerDocs, setLifeInsurerDocs] = useState([]);
  const [selectedInsurer, setSelectedInsurer] = useState("");
  const [appliedInsurer, setAppliedInsurer] = useState("");
  const [selectedFinancialYear, setSelectedFinancialYear] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("");
  const [selectedPremiumType, setSelectedPremiumType] = useState("");
  const [insurersLoading, setInsurersLoading] = useState(false);
  const [insurersError, setInsurersError] = useState("");
  const [insurerPremiumFilterType, setInsurerPremiumFilterType] = useState("");
  const [selectedPerformanceInsurer, setSelectedPerformanceInsurer] = useState("");
  const [appliedPerformancePremiumType, setAppliedPerformancePremiumType] = useState("");
  const [appliedPerformanceInsurer, setAppliedPerformanceInsurer] = useState("");
  const [totalPremiumDocs, setTotalPremiumDocs] = useState([]);
  const [newBusinessPremiumDocs, setNewBusinessPremiumDocs] = useState([]);
  const [performancePremiumLoading, setPerformancePremiumLoading] = useState(false);
  const [performancePremiumError, setPerformancePremiumError] = useState("");
  const [showPerformanceTimelinePicker, setShowPerformanceTimelinePicker] = useState(false);
  const [performanceTimelineStartYear, setPerformanceTimelineStartYear] = useState("");
  const [performanceTimelineEndYear, setPerformanceTimelineEndYear] = useState("");
  // Segment Analysis Filters
  const [segmentCategory, setSegmentCategory] = useState("");
  const [segmentType, setSegmentType] = useState("");
  const [segmentParticipation, setSegmentParticipation] = useState("");
  const [segmentPremiumType, setSegmentPremiumType] = useState("");
  const [segmentViewMode, setSegmentViewMode] = useState("");

  // Applied Segment Analysis Filters (trigger data fetch)
  const [appliedSegmentCategory, setAppliedSegmentCategory] = useState("");
  const [appliedSegmentType, setAppliedSegmentType] = useState("");
  const [appliedSegmentParticipation, setAppliedSegmentParticipation] = useState("");
  const [appliedSegmentPremiumType, setAppliedSegmentPremiumType] = useState("");
  const [appliedSegmentViewMode, setAppliedSegmentViewMode] = useState("");

  // Segment Analysis Data State
  const [segmentData, setSegmentData] = useState([]);
  const [segmentLoading, setSegmentLoading] = useState(false);
  const [segmentError, setSegmentError] = useState("");
  const [visualizationType, setVisualizationType] = useState("line"); // "line", "bar", "area", "pie"

  // State Wise Analysis Filters
  const [stateBusinessType, setStateBusinessType] = useState("");
  const [stateSelectedState, setStateSelectedState] = useState("");
  const [stateAggregationType, setStateAggregationType] = useState("");
  const [stateSelectedInsurer, setStateSelectedInsurer] = useState("");
  const [stateMetrics, setStateMetrics] = useState([]);

  // State Wise Analysis — Applied Filters (set when user clicks Apply Filters)
  const [appliedStateBusinessType, setAppliedStateBusinessType] = useState("");
  const [appliedStateSelectedState, setAppliedStateSelectedState] = useState("");
  const [appliedStateAggregationType, setAppliedStateAggregationType] = useState("");
  const [appliedStateSelectedInsurer, setAppliedStateSelectedInsurer] = useState("");
  const [appliedStateMetrics, setAppliedStateMetrics] = useState([]);

  // State Wise Analysis — visualization controls
  const [stateWiseVisualizationType, setStateWiseVisualizationType] = useState("line");
  const [stateWisePendingVisualizationType, setStateWisePendingVisualizationType] = useState("line");
  const [stateWiseShowChartTypePicker, setStateWiseShowChartTypePicker] = useState(false);
  const [stateWiseShowTimelinePicker, setStateWiseShowTimelinePicker] = useState(false);
  const [stateWiseTimelineStartYear, setStateWiseTimelineStartYear] = useState("");
  const [stateWiseTimelineEndYear, setStateWiseTimelineEndYear] = useState("");
  const [stateWiseVisualizationMetric, setStateWiseVisualizationMetric] = useState("");
  const [stateWisePendingVisualizationMetric, setStateWisePendingVisualizationMetric] = useState("");
  const [stateWiseShowMetricPicker, setStateWiseShowMetricPicker] = useState(false);

  // State Wise Analysis Data State
  const [stateWiseDocsByCollection, setStateWiseDocsByCollection] = useState({
    sheet5_statewise_individual_newbusiness_life: [],
    sheet6_statewise_insurerwise_individual: [],
    sheet7_statewise_group: [],
    sheet8_statewise_insurerwise_group: [],
  });
  const [stateWiseLoading, setStateWiseLoading] = useState(false);
  const [stateWiseError, setStateWiseError] = useState("");

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
  const isTotalNewBusinessPremiumModule =
    activeTab === "insurer-performance" && selectedModule === 1;
  const isStateWiseAnalysisModule =
    activeTab === "market-overview" && selectedModule === 3;

  useEffect(() => {
    const allowedMetrics = STATEWISE_METRICS[stateBusinessType] || [];
    setStateMetrics((prev) => prev.filter((m) => allowedMetrics.includes(m)));
  }, [stateBusinessType]);

  useEffect(() => {
    setStateWisePendingVisualizationType(stateWiseVisualizationType);
  }, [stateWiseVisualizationType]);

  useEffect(() => {
    if (!isStateWiseAnalysisModule || appliedStateMetrics.length === 0) {
      setStateWiseVisualizationMetric("");
      setStateWisePendingVisualizationMetric("");
      setStateWiseShowMetricPicker(false);
      return;
    }
    if (stateWiseVisualizationMetric && appliedStateMetrics.includes(stateWiseVisualizationMetric)) {
      setStateWisePendingVisualizationMetric(stateWiseVisualizationMetric);
      return;
    }
    setStateWiseVisualizationMetric(appliedStateMetrics[0]);
    setStateWisePendingVisualizationMetric(appliedStateMetrics[0]);
  }, [isStateWiseAnalysisModule, appliedStateMetrics, stateWiseVisualizationMetric]);

  useEffect(() => {
    if (!isStateWiseAnalysisModule) {
      return;
    }

    const collectionName = resolveStateWiseCollectionName(
      stateBusinessType,
      stateAggregationType
    );

    if (!collectionName || (stateWiseDocsByCollection[collectionName] || []).length > 0) {
      return;
    }

    const fetchStateWiseDocs = async () => {
      setStateWiseLoading(true);
      setStateWiseError("");

      try {
        const snapshot = await getDocs(collection(db, collectionName));
        const documents = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setStateWiseDocsByCollection((previous) => ({
          ...previous,
          [collectionName]: documents,
        }));
      } catch (error) {
        console.error("Failed to fetch state wise analysis data:", error);
        setStateWiseError("Unable to load state-wise analysis data.");
      } finally {
        setStateWiseLoading(false);
      }
    };

    fetchStateWiseDocs();
  }, [
    isStateWiseAnalysisModule,
    stateBusinessType,
    stateAggregationType,
    stateWiseDocsByCollection,
  ]);

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

  useEffect(() => {
    if (!isTotalNewBusinessPremiumModule) {
      return;
    }

    setPerformancePremiumError("");

    if (!insurerPremiumFilterType) {
      return;
    }

    const isTotalPremiumSelected = insurerPremiumFilterType === "Total Premium";
    const hasCachedDocs = isTotalPremiumSelected
      ? totalPremiumDocs.length > 0
      : newBusinessPremiumDocs.length > 0;

    if (hasCachedDocs) {
      return;
    }

    const fetchPremiumDocs = async () => {
      setPerformancePremiumLoading(true);
      setPerformancePremiumError("");

      try {
        const collectionName = isTotalPremiumSelected
          ? "sheet2_total_premium_life_insurers"
          : "sheet3_new_business_premium_life_insurers";

        const snapshot = await getDocs(collection(db, collectionName));
        const documents = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        if (isTotalPremiumSelected) {
          setTotalPremiumDocs(documents);
        } else {
          setNewBusinessPremiumDocs(documents);
        }
      } catch (error) {
        console.error("Failed to fetch premium insurer data:", error);
        setPerformancePremiumError("Unable to load premium data.");

        if (isTotalPremiumSelected) {
          setTotalPremiumDocs([]);
        } else {
          setNewBusinessPremiumDocs([]);
        }
      } finally {
        setPerformancePremiumLoading(false);
      }
    };

    fetchPremiumDocs();
  }, [
    isTotalNewBusinessPremiumModule,
    insurerPremiumFilterType,
    totalPremiumDocs.length,
    newBusinessPremiumDocs.length,
  ]);

  useEffect(() => {
    if (!isTotalNewBusinessPremiumModule) {
      return;
    }

    // Keep insurer selection scoped to current premium type selection.
    setSelectedPerformanceInsurer("");
  }, [isTotalNewBusinessPremiumModule, insurerPremiumFilterType]);

  const insurerOptions = useMemo(() => {
    const names = lifeInsurerDocs
      .map((document) => document.insurer_name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    return ["All Insurers", ...names];
  }, [lifeInsurerDocs]);

  const stateWiseDraftCollectionName = useMemo(
    () => resolveStateWiseCollectionName(stateBusinessType, stateAggregationType),
    [stateBusinessType, stateAggregationType]
  );

  const stateWiseDraftDocs = useMemo(
    () => stateWiseDocsByCollection[stateWiseDraftCollectionName] || [],
    [stateWiseDocsByCollection, stateWiseDraftCollectionName]
  );

  const stateWiseAppliedCollectionName = useMemo(
    () => resolveStateWiseCollectionName(appliedStateBusinessType, appliedStateAggregationType),
    [appliedStateBusinessType, appliedStateAggregationType]
  );

  const stateWiseAppliedDocs = useMemo(
    () => stateWiseDocsByCollection[stateWiseAppliedCollectionName] || [],
    [stateWiseDocsByCollection, stateWiseAppliedCollectionName]
  );

  const stateWiseStateOptions = useMemo(() => {
    return Array.from(
      new Set(stateWiseDraftDocs.map((document) => resolveStateNameFromDoc(document)).filter(Boolean))
    ).sort((first, second) => first.localeCompare(second));
  }, [stateWiseDraftDocs]);

  const stateWiseInsurerOptions = useMemo(() => {
    return Array.from(
      new Set(stateWiseDraftDocs.map((document) => resolveInsurerNameFromDoc(document)).filter(Boolean))
    ).sort((first, second) => first.localeCompare(second));
  }, [stateWiseDraftDocs]);

  useEffect(() => {
    if (stateSelectedState && !stateWiseStateOptions.includes(stateSelectedState)) {
      setStateSelectedState("");
    }
  }, [stateSelectedState, stateWiseStateOptions]);

  useEffect(() => {
    if (stateSelectedInsurer && !stateWiseInsurerOptions.includes(stateSelectedInsurer)) {
      setStateSelectedInsurer("");
    }
  }, [stateSelectedInsurer, stateWiseInsurerOptions]);

  const stateWiseRows = useMemo(() => {
    if (
      !isStateWiseAnalysisModule ||
      !appliedStateBusinessType ||
      !appliedStateAggregationType ||
      !appliedStateSelectedState ||
      appliedStateMetrics.length === 0
    ) {
      return [];
    }

    if (appliedStateAggregationType === "Insurer Wise" && !appliedStateSelectedInsurer) {
      return [];
    }

    const normalizedState = normalizeText(appliedStateSelectedState);
    const normalizedInsurer = normalizeText(appliedStateSelectedInsurer);
    const yearData = new Map();

    appliedStateMetrics.forEach((metric) => {
      const normalizedMetric = normalizeMetricLabel(metric);
      const yearTotals = new Map();

      stateWiseAppliedDocs.forEach((document) => {
        if (normalizeText(resolveStateNameFromDoc(document)) !== normalizedState) {
          return;
        }
        if (
          appliedStateAggregationType === "Insurer Wise" &&
          normalizeText(resolveInsurerNameFromDoc(document)) !== normalizedInsurer
        ) {
          return;
        }
        const docLongMetric = resolveDocLongFormatMetric(document);
        if (docLongMetric !== null) {
          if (normalizeMetricLabel(docLongMetric) !== normalizedMetric) {
            return;
          }
          const longValue = resolveDocLongFormatValue(document);
          const yearLabel = resolveYearLabel(document) || "Overall";
          yearTotals.set(yearLabel, (yearTotals.get(yearLabel) || 0) + longValue);
          return;
        }
        const yearLabel = resolveYearLabel(document) || "Overall";
        const metricValue = resolveStateWiseMetricValue(
          document,
          appliedStateBusinessType,
          metric
        );
        yearTotals.set(yearLabel, (yearTotals.get(yearLabel) || 0) + metricValue);
      });

      yearTotals.forEach((value, year) => {
        if (!yearData.has(year)) yearData.set(year, {});
        yearData.get(year)[metric] = value;
      });
    });

    return Array.from(yearData.entries())
      .map(([year, values]) => ({ year, ...values }))
      .sort(
        (first, second) =>
          resolveYearSortValue(first.year) - resolveYearSortValue(second.year)
      );
  }, [
    isStateWiseAnalysisModule,
    appliedStateBusinessType,
    appliedStateAggregationType,
    appliedStateSelectedState,
    appliedStateSelectedInsurer,
    appliedStateMetrics,
    stateWiseAppliedDocs,
  ]);

  const stateWiseFiltersModified = useMemo(() => {
    if (!appliedStateBusinessType) return false;
    return (
      stateBusinessType !== appliedStateBusinessType ||
      stateSelectedState !== appliedStateSelectedState ||
      stateAggregationType !== appliedStateAggregationType ||
      stateSelectedInsurer !== appliedStateSelectedInsurer ||
      JSON.stringify(stateMetrics) !== JSON.stringify(appliedStateMetrics)
    );
  }, [
    stateBusinessType,
    stateSelectedState,
    stateAggregationType,
    stateSelectedInsurer,
    stateMetrics,
    appliedStateBusinessType,
    appliedStateSelectedState,
    appliedStateAggregationType,
    appliedStateSelectedInsurer,
    appliedStateMetrics,
  ]);

  const stateWiseTimelineYearOptions = useMemo(() => {
    const uniqueYears = Array.from(new Set(stateWiseRows.map((r) => r.year)));
    return uniqueYears.sort((a, b) => resolveYearSortValue(a) - resolveYearSortValue(b));
  }, [stateWiseRows]);

  useEffect(() => {
    if (!isStateWiseAnalysisModule || stateWiseRows.length === 0) {
      setStateWiseTimelineStartYear("");
      setStateWiseTimelineEndYear("");
      return;
    }
    const years = stateWiseTimelineYearOptions;
    if (!years.length) return;
    setStateWiseTimelineStartYear(years[0]);
    setStateWiseTimelineEndYear(years[years.length - 1]);
  }, [isStateWiseAnalysisModule, stateWiseRows, stateWiseTimelineYearOptions]);

  const stateWiseVisibleRows = useMemo(() => {
    if (!stateWiseRows.length) return [];
    if (!stateWiseTimelineStartYear || !stateWiseTimelineEndYear) return stateWiseRows;
    const start = resolveYearSortValue(stateWiseTimelineStartYear);
    const end = resolveYearSortValue(stateWiseTimelineEndYear);
    return stateWiseRows.filter((row) => {
      const y = resolveYearSortValue(row.year);
      return y >= start && y <= end;
    });
  }, [stateWiseRows, stateWiseTimelineStartYear, stateWiseTimelineEndYear]);

  const stateWisePlotTraces = useMemo(() => {
    const effectiveMetric = stateWiseVisualizationMetric || appliedStateMetrics[0] || "";
    const metricLabel = effectiveMetric === "Premium" ? "Premium in Cr (₹)" : effectiveMetric;
    const xValues = stateWiseVisibleRows.map((r) => String(r.year));
    const yValues = stateWiseVisibleRows.map((r) => r[effectiveMetric] ?? 0);
    if (stateWiseVisualizationType === "bar") {
      return [{
        type: "bar",
        name: metricLabel,
        x: xValues,
        y: yValues,
        marker: { color: "rgba(14, 165, 164, 0.88)", line: { color: "rgba(15, 118, 110, 0.95)", width: 1 } },
        hovertemplate: `%{x}<br>${metricLabel}: %{y:,}<extra></extra>`,
      }];
    }
    if (stateWiseVisualizationType === "area") {
      return [{
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
      }];
    }
    return [{
      type: "scatter",
      mode: "lines+markers",
      name: metricLabel,
      x: xValues,
      y: yValues,
      line: { color: "#0ea5a4", width: 3 },
      marker: { color: "#0ea5a4", size: 8 },
      hovertemplate: `%{x}<br>${metricLabel}: %{y:,}<extra></extra>`,
    }];
  }, [stateWiseVisibleRows, stateWiseVisualizationType, appliedStateMetrics, stateWiseVisualizationMetric]);

  const stateWisePlotLayout = useMemo(() => {
    const effectiveMetric = stateWiseVisualizationMetric || appliedStateMetrics[0] || "";
    const metricLabel = effectiveMetric === "Premium" ? "Premium in Cr (₹)" : effectiveMetric;
    return {
      autosize: true,
      paper_bgcolor: "rgba(0, 0, 0, 0)",
      plot_bgcolor: "rgba(0, 0, 0, 0)",
      margin: { l: 60, r: 18, t: 20, b: 52 },
      xaxis: {
        title: { text: "Year", font: { size: 12, color: "#475569" } },
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
      legend: { orientation: "h", x: 0, y: -0.16, font: { size: 14, color: "#334155" } },
      hoverlabel: { bgcolor: "#ffffff", bordercolor: "rgba(148, 163, 184, 0.4)", font: { color: "#0f172a", size: 12 } },
    };
  }, [appliedStateMetrics, stateWiseVisualizationMetric]);

  const stateWisePlotConfig = useMemo(() => ({
    responsive: true,
    displaylogo: false,
    toImageButtonOptions: { format: "png", filename: "state_wise_analysis_chart", width: 1280, height: 720, scale: 2 },
    modeBarButtonsToRemove: ["select2d", "lasso2d", "toggleSpikelines", "autoScale2d"],
  }), []);

  const selectedInsurerDocument = useMemo(() => {
    if (!showOnlyInsurerFilter || !appliedInsurer || appliedInsurer === "All Insurers") {
      return null;
    }

    return lifeInsurerDocs.find((document) => document.insurer_name === appliedInsurer) || null;
  }, [showOnlyInsurerFilter, appliedInsurer, lifeInsurerDocs]);

  const selectedSubModuleTitle =
    SUB_MODULES[activeTab]?.find((module) => module.id === selectedModule)?.title || "Overview";

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    const moduleParam = params.get("module");

    if (tabParam && Object.prototype.hasOwnProperty.call(SUB_MODULES, tabParam)) {
      setActiveTab(tabParam);
    }

    if (moduleParam !== null) {
      const parsedModule = Number(moduleParam);
      if (Number.isFinite(parsedModule)) {
        setSelectedModule(parsedModule);
      }
    }
  }, [location.search]);

  const selectedPerformancePremiumDocs = useMemo(() => {
    if (insurerPremiumFilterType === "Total Premium") {
      return totalPremiumDocs;
    }

    if (insurerPremiumFilterType === "New Business Premium") {
      return newBusinessPremiumDocs;
    }

    return [];
  }, [insurerPremiumFilterType, totalPremiumDocs, newBusinessPremiumDocs]);

  const appliedPerformancePremiumDocs = useMemo(() => {
    if (appliedPerformancePremiumType === "Total Premium") {
      return totalPremiumDocs;
    }

    if (appliedPerformancePremiumType === "New Business Premium") {
      return newBusinessPremiumDocs;
    }

    return [];
  }, [appliedPerformancePremiumType, totalPremiumDocs, newBusinessPremiumDocs]);

  const performanceInsurerOptions = useMemo(() => {
    const insurers = Array.from(
      new Set(
        selectedPerformancePremiumDocs
          .map((document) => resolveInsurerNameFromDoc(document))
          .filter(Boolean)
      )
    ).sort((first, second) => first.localeCompare(second));

    return insurers;
  }, [selectedPerformancePremiumDocs]);

  const performancePremiumRows = useMemo(() => {
    if (
      !isTotalNewBusinessPremiumModule ||
      !appliedPerformancePremiumType ||
      !appliedPerformanceInsurer
    ) {
      return [];
    }

    const yearTotals = new Map();
    const normalizedInsurer = normalizeText(appliedPerformanceInsurer);

    appliedPerformancePremiumDocs.forEach((document) => {
      if (normalizeText(resolveInsurerNameFromDoc(document)) !== normalizedInsurer) {
        return;
      }

      const year = resolveYearLabel(document);
      if (!year) {
        return;
      }

      const premiumInCrores = resolvePremiumCroresValue(document, appliedPerformancePremiumType);
      yearTotals.set(year, (yearTotals.get(year) || 0) + premiumInCrores);
    });

    return Array.from(yearTotals.entries())
      .map(([year, premiumInCrores]) => ({ year, premiumInCrores }))
      .sort(
        (first, second) => resolveYearSortValue(first.year) - resolveYearSortValue(second.year)
      );
  }, [
    isTotalNewBusinessPremiumModule,
    appliedPerformancePremiumType,
    appliedPerformanceInsurer,
    appliedPerformancePremiumDocs,
  ]);

  useEffect(() => {
    if (!isTotalNewBusinessPremiumModule || performancePremiumRows.length === 0) {
      setPerformanceTimelineStartYear("");
      setPerformanceTimelineEndYear("");
      return;
    }

    const years = performancePremiumRows
      .map((row) => resolveYearSortValue(row.year))
      .filter((year) => Number.isFinite(year) && year !== Number.MAX_SAFE_INTEGER)
      .sort((first, second) => first - second);

    if (years.length === 0) {
      setPerformanceTimelineStartYear("");
      setPerformanceTimelineEndYear("");
      return;
    }

    const minimumYear = String(years[0]);
    const maximumYear = String(years[years.length - 1]);

    if (!performanceTimelineStartYear) {
      setPerformanceTimelineStartYear(minimumYear);
    }

    if (!performanceTimelineEndYear) {
      setPerformanceTimelineEndYear(maximumYear);
    }
  }, [
    isTotalNewBusinessPremiumModule,
    performancePremiumRows,
    performanceTimelineStartYear,
    performanceTimelineEndYear,
  ]);

  const performanceTimelineYearOptions = useMemo(() => {
    const years = performancePremiumRows
      .map((row) => resolveYearSortValue(row.year))
      .filter((year) => Number.isFinite(year) && year !== Number.MAX_SAFE_INTEGER)
      .sort((first, second) => first - second);

    return Array.from(new Set(years));
  }, [performancePremiumRows]);

  const performanceVisibleRows = useMemo(() => {
    if (!performancePremiumRows.length) {
      return [];
    }

    if (!performanceTimelineStartYear || !performanceTimelineEndYear) {
      return performancePremiumRows;
    }

    const startYear = Number(performanceTimelineStartYear);
    const endYear = Number(performanceTimelineEndYear);

    return performancePremiumRows.filter((row) => {
      const rowYear = resolveYearSortValue(row.year);
      return rowYear >= startYear && rowYear <= endYear;
    });
  }, [performancePremiumRows, performanceTimelineStartYear, performanceTimelineEndYear]);

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
    setSelectedInsurer("");
    setAppliedInsurer("");
    setInsurerPremiumFilterType("");
    setSelectedPerformanceInsurer("");
    setAppliedPerformancePremiumType("");
    setAppliedPerformanceInsurer("");
    setPerformancePremiumError("");
    setShowPerformanceTimelinePicker(false);
    setPerformanceTimelineStartYear("");
    setPerformanceTimelineEndYear("");
    setSelectedFinancialYear("");
    setSelectedCategory("");
    setSelectedSegment("");
    setSelectedPremiumType("");
    setStateBusinessType("");
    setStateSelectedState("");
    setStateAggregationType("");
    setStateSelectedInsurer("");
    setStateMetrics([]);
    setAppliedStateBusinessType("");
    setAppliedStateSelectedState("");
    setAppliedStateAggregationType("");
    setAppliedStateSelectedInsurer("");
    setAppliedStateMetrics([]);
      setStateWiseVisualizationMetric("");
      setStateWisePendingVisualizationMetric("");
      setStateWiseShowMetricPicker(false);
    setStateWiseError("");
    setStateWiseVisualizationType("line");
    setStateWisePendingVisualizationType("line");
    setStateWiseShowChartTypePicker(false);
    setStateWiseShowTimelinePicker(false);
    setStateWiseTimelineStartYear("");
    setStateWiseTimelineEndYear("");
  };

  const handleResetSegmentAnalysisFilters = () => {
    setSegmentCategory("");
    setSegmentType("");
    setSegmentParticipation("");
    setSegmentPremiumType("");
    setSegmentViewMode("");
    // Also clear applied filters
    setAppliedSegmentCategory("");
    setAppliedSegmentType("");
    setAppliedSegmentParticipation("");
    setAppliedSegmentPremiumType("");
    setAppliedSegmentViewMode("");
  };

  const handleApplyFilters = () => {
    if (isStateWiseAnalysisModule) {
      setAppliedStateBusinessType(stateBusinessType);
      setAppliedStateSelectedState(stateSelectedState);
      setAppliedStateAggregationType(stateAggregationType);
      setAppliedStateSelectedInsurer(stateSelectedInsurer);
      setAppliedStateMetrics([...stateMetrics]);
      setStateWiseVisualizationMetric("");
      setStateWisePendingVisualizationMetric("");
      setStateWiseShowMetricPicker(false);
      setStateWiseTimelineStartYear("");
      setStateWiseTimelineEndYear("");
      return;
    }

    if (isTotalNewBusinessPremiumModule) {
      setAppliedPerformancePremiumType(insurerPremiumFilterType);
      setAppliedPerformanceInsurer(selectedPerformanceInsurer);
      setShowPerformanceTimelinePicker(false);
      setPerformanceTimelineStartYear("");
      setPerformanceTimelineEndYear("");
      return;
    }

    setAppliedInsurer(selectedInsurer);
  };

  const handleApplySegmentFilters = () => {
    setAppliedSegmentCategory(segmentCategory);
    setAppliedSegmentType(segmentType);
    setAppliedSegmentParticipation(segmentParticipation);
    setAppliedSegmentPremiumType(segmentPremiumType);
    setAppliedSegmentViewMode(segmentViewMode);
  };

  const handleStateMetricToggle = (metric) => {
    const isSelected = stateMetrics.includes(metric);
    if (isSelected) {
      setStateMetrics((prev) => prev.filter((m) => m !== metric));
      return;
    }
    if (stateMetrics.length >= 2) {
      return;
    }
    setStateMetrics((prev) => [...prev, metric]);
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
    const isPerformancePremiumModule = isTotalNewBusinessPremiumModule;
    const isStateWiseAnalysis = isStateWiseAnalysisModule;

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
      : isPerformancePremiumModule
      ? [
          { label: "Premium Type", value: appliedPerformancePremiumType || "-" },
          { label: "Select Insurer", value: appliedPerformanceInsurer || "-" },
        ]
      : isStateWiseAnalysis
      ? [
          { label: "Business Type", value: appliedStateBusinessType || "-" },
          { label: "State", value: appliedStateSelectedState || "-" },
          { label: "View Type", value: appliedStateAggregationType || "-" },
          {
            label: "Insurer",
            value:
              appliedStateAggregationType === "Insurer Wise"
                ? appliedStateSelectedInsurer || "-"
                : "-",
          },
          { label: "Metrics", value: appliedStateMetrics.join(", ") || "-" },
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
      : isPerformancePremiumModule
      ? performanceVisibleRows.map((row) => [
          row.year,
          Number(row.premiumInCrores || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
        ])
      : isStateWiseAnalysis
      ? stateWiseVisibleRows.map((row) => [
          row.year,
          stateMetric === "Premium"
            ? Number(row.value || 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : Number(row.value || 0).toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              }),
        ])
      : displayedDataRows.map((row) => [row.label, formatFieldValue(row.value)]);

    const exportRows = [
      ["Sub Module", selectedSubModuleTitle],
      [],
      ["Applied Filters", "Value"],
      ...activeFilters.map((filter) => [filter.label, formatFieldValue(filter.value)]),
      [],
      isSegmentAnalysis
        ? ["Year", dataHeaderLabel]
        : isPerformancePremiumModule
        ? [
            "Year",
            appliedPerformancePremiumType === "New Business Premium"
              ? "New Business Premium in Cr (₹)"
              : "Total Premium in Cr (₹)",
          ]
        : isStateWiseAnalysis
        ? ["Year", ...appliedStateMetrics.map((m) => m === "Premium" ? "Premium in Cr (₹)" : m)]
        : ["Data Panel Fields", "Value"],
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

  const getTabAccent = (tabId) => {
    const tabAccents = {
      "market-overview": "#0ea5a4",
      "insurer-performance": "#0891b2",
      "claims-risk": "#f97316",
      financials: "#6366f1",
      distribution: "#14b8a6",
      grievances: "#ef4444",
    };
    return tabAccents[tabId] || "#0ea5a4";
  };

  return (
    <div className="life-insurance-viewport life-theme">
      {/* Tab Navigation */}
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

      {/* Sub-Modules Row */}
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

      {/* Main Content Area - 3 Column Layout */}
      <div className={`life-content ${showInsights ? "insights-expanded" : "insights-collapsed"}`}>
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
            ) : isStateWiseAnalysisModule ? (
              <>
                <div className="filter-item">
                  <label className="filter-label label-text">Business Type</label>
                  <div className="premium-toggle-group">
                    {["Individual", "Group"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`premium-toggle-btn ${
                          stateBusinessType === option ? "active" : ""
                        }`}
                        onClick={() => {
                          setStateBusinessType(option);
                          setStateSelectedInsurer("");
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="filter-item">
                  <label className="filter-label label-text">Select View</label>
                  <div className="premium-toggle-group">
                    {["Total", "Insurer Wise"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`premium-toggle-btn ${
                          stateAggregationType === option ? "active" : ""
                        }`}
                        onClick={() => {
                          setStateAggregationType(option);
                          setStateSelectedInsurer("");
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {stateAggregationType === "Insurer Wise" && (
                  <FilterSelect
                    label="Select Insurer"
                    options={stateWiseInsurerOptions}
                    value={stateSelectedInsurer}
                    onChange={setStateSelectedInsurer}
                  />
                )}

                <FilterSelect
                  label="Select State"
                  options={stateWiseStateOptions}
                  value={stateSelectedState}
                  onChange={setStateSelectedState}
                />

                <div className="filter-item">
                  <label className="filter-label label-text">Metric</label>
                  <div className="premium-toggle-group">
                    {(STATEWISE_METRICS[stateBusinessType] || []).map((metricOption) => (
                      <button
                        key={metricOption}
                        type="button"
                        className={`premium-toggle-btn ${stateMetrics.includes(metricOption) ? "active" : ""}`}
                        onClick={() => handleStateMetricToggle(metricOption)}
                      >
                        <span className="metric-toggle-btn-content">
                          {metricOption}
                          {stateMetrics.includes(metricOption) && (
                            <Check size={14} strokeWidth={2.5} className="metric-check-icon" />
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="data-export-btn"
                  onClick={handleApplyFilters}
                  disabled={
                    !stateBusinessType ||
                    !stateAggregationType ||
                    !stateSelectedState ||
                    stateMetrics.length === 0 ||
                    (stateAggregationType === "Insurer Wise" && !stateSelectedInsurer)
                  }
                  title="Apply Filters"
                >
                  Apply Filters
                </button>

              </>
            ) : isTotalNewBusinessPremiumModule ? (
              <>
                <div className="filter-item">
                  <label className="filter-label label-text">Premium Type</label>
                  <div className="premium-toggle-group">
                    {["Total Premium", "New Business Premium"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`premium-toggle-btn ${
                          insurerPremiumFilterType === option ? "active" : ""
                        }`}
                        onClick={() => setInsurerPremiumFilterType(option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {insurerPremiumFilterType && (
                  <FilterSelect
                    label="Select Insurer"
                    options={performanceInsurerOptions}
                    value={selectedPerformanceInsurer}
                    onChange={setSelectedPerformanceInsurer}
                  />
                )}
                <button
                  type="button"
                  className="data-export-btn"
                  onClick={handleApplyFilters}
                  disabled={
                    !insurerPremiumFilterType ||
                    !selectedPerformanceInsurer
                  }
                  title="Apply Filters"
                >
                  Apply Filters
                </button>
              </>
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
                <button
                  type="button"
                  className="data-export-btn"
                  onClick={handleApplyFilters}
                  title="Apply Filters"
                >
                  Apply Filters
                </button>
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
            {isTotalNewBusinessPremiumModule && (
              <button
                type="button"
                className="data-export-btn"
                onClick={() => setShowPerformanceTimelinePicker((previous) => !previous)}
                title="Select Timeline"
                disabled={performanceVisibleRows.length === 0}
              >
                Select Timeline
              </button>
            )}
            {isStateWiseAnalysisModule && stateWiseVisibleRows.length > 0 && (
              <button
                type="button"
                className="data-export-btn"
                onClick={() => setStateWiseShowTimelinePicker((previous) => !previous)}
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
            ) : isTotalNewBusinessPremiumModule ? (
              performancePremiumLoading ? (
                <p className="panel-placeholder">Loading data...</p>
              ) : performancePremiumError ? (
                <p className="panel-placeholder">{performancePremiumError}</p>
              ) : !appliedPerformancePremiumType ? (
                <p className="panel-placeholder">Select Premium Type to continue.</p>
              ) : !appliedPerformanceInsurer ? (
                <p className="panel-placeholder">Select Insurer and click Apply Filters to view year-wise data.</p>
              ) : performanceVisibleRows.length > 0 ? (
                <>
                  {showPerformanceTimelinePicker && performanceTimelineYearOptions.length > 0 && (
                    <div className="timeline-filter-row">
                      <div className="timeline-field">
                        <label className="filter-label label-text">From</label>
                        <select
                          className="filter-select timeline-select"
                          value={performanceTimelineStartYear}
                          onChange={(event) => {
                            const nextStartYear = event.target.value;
                            setPerformanceTimelineStartYear(nextStartYear);

                            if (
                              performanceTimelineEndYear &&
                              Number(nextStartYear) > Number(performanceTimelineEndYear)
                            ) {
                              setPerformanceTimelineEndYear(nextStartYear);
                            }
                          }}
                        >
                          {performanceTimelineYearOptions.map((year) => (
                            <option key={`perf-start-${year}`} value={String(year)}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="timeline-field">
                        <label className="filter-label label-text">To</label>
                        <select
                          className="filter-select timeline-select"
                          value={performanceTimelineEndYear}
                          onChange={(event) => {
                            const nextEndYear = event.target.value;
                            setPerformanceTimelineEndYear(nextEndYear);

                            if (
                              performanceTimelineStartYear &&
                              Number(nextEndYear) < Number(performanceTimelineStartYear)
                            ) {
                              setPerformanceTimelineStartYear(nextEndYear);
                            }
                          }}
                        >
                          {performanceTimelineYearOptions.map((year) => (
                            <option key={`perf-end-${year}`} value={String(year)}>
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
                            {appliedPerformancePremiumType === "New Business Premium"
                              ? "New Business Premium in Cr (₹)"
                              : "Total Premium in Cr (₹)"}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {performanceVisibleRows.map((row) => (
                          <tr key={row.year}>
                            <td className="col-year">{row.year}</td>
                            <td className="col-value">
                              {Number(row.premiumInCrores || 0).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="panel-placeholder">No data found for selected insurer.</p>
              )
            ) : isStateWiseAnalysisModule ? (
              !appliedStateBusinessType || stateWiseFiltersModified ? (
                <PanelState variant="empty" message="Select filters and click Apply Filters to view state-wise analysis." hint="Choose Business Type, View, State and Metric, then click Apply Filters." />
              ) : stateWiseLoading && stateWiseAppliedDocs.length === 0 ? (
                <PanelState variant="loading" message="Loading data" hint="Please wait while state-wise data is fetched." />
              ) : stateWiseError && stateWiseAppliedDocs.length === 0 ? (
                <PanelState variant="error" message={stateWiseError} />
              ) : stateWiseVisibleRows.length > 0 ? (
                <>
                  {stateWiseShowTimelinePicker && stateWiseTimelineYearOptions.length > 0 && (
                    <div className="timeline-filter-row">
                      <div className="timeline-field">
                        <label className="filter-label label-text">From</label>
                        <select
                          className="filter-select timeline-select"
                          value={stateWiseTimelineStartYear}
                          onChange={(event) => {
                            const nextStartYear = event.target.value;
                            setStateWiseTimelineStartYear(nextStartYear);
                            if (stateWiseTimelineEndYear && resolveYearSortValue(nextStartYear) > resolveYearSortValue(stateWiseTimelineEndYear)) {
                              setStateWiseTimelineEndYear(nextStartYear);
                            }
                          }}
                        >
                          {stateWiseTimelineYearOptions.map((yearStr) => (
                            <option key={`start-${yearStr}`} value={yearStr}>{yearStr}</option>
                          ))}
                        </select>
                      </div>
                      <div className="timeline-field">
                        <label className="filter-label label-text">To</label>
                        <select
                          className="filter-select timeline-select"
                          value={stateWiseTimelineEndYear}
                          onChange={(event) => {
                            const nextEndYear = event.target.value;
                            setStateWiseTimelineEndYear(nextEndYear);
                            if (stateWiseTimelineStartYear && resolveYearSortValue(nextEndYear) < resolveYearSortValue(stateWiseTimelineStartYear)) {
                              setStateWiseTimelineStartYear(nextEndYear);
                            }
                          }}
                        >
                          {stateWiseTimelineYearOptions.map((yearStr) => (
                            <option key={`end-${yearStr}`} value={yearStr}>{yearStr}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        className="timeline-apply-btn"
                        onClick={() => setStateWiseShowTimelinePicker(false)}
                        title="Apply Timeline"
                      >
                        Apply Timeline
                      </button>
                    </div>
                  )}
                  <div className="data-table-container">
                    <table className="segment-data-table">
                      <thead>
                        <tr>
                          <th className="col-year">Year</th>
                          {appliedStateMetrics.map((metric) => (
                            <th key={metric} className="col-value">
                              {metric === "Premium" ? "Premium in Cr (₹)" : metric}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {stateWiseVisibleRows.map((row) => (
                          <tr key={row.year}>
                            <td className="col-year">
                              <span className="year-badge">{row.year}</span>
                            </td>
                            {appliedStateMetrics.map((metric) => (
                              <td key={metric} className="col-value">
                                <span className="value-amount">
                                  {metric === "Premium"
                                    ? Number(row[metric] || 0).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })
                                    : Number(row[metric] || 0).toLocaleString("en-IN", {
                                        maximumFractionDigits: 0,
                                      })}
                                </span>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <PanelState variant="empty" message="No data found for the applied filters." hint="Try adjusting your filters and applying again." />
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
            {isStateWiseAnalysisModule && appliedStateMetrics.length > 1 && stateWiseVisibleRows.length > 0 && !stateWiseFiltersModified && (
              <button
                type="button"
                className="data-export-btn"
                onClick={() => setStateWiseShowMetricPicker((prev) => !prev)}
                title="Select visualization metric"
              >
                Select Metric
              </button>
            )}
            {isStateWiseAnalysisModule && stateWiseVisibleRows.length > 0 && !stateWiseFiltersModified && (
              <button
                type="button"
                className="data-export-btn"
                onClick={() => setStateWiseShowChartTypePicker((previous) => !previous)}
                title="Select chart type"
              >
                Select Chart Type
              </button>
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
            ) : isTotalNewBusinessPremiumModule ? (
              performanceVisibleRows.length > 0 ? (
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={performanceVisibleRows} margin={{ top: 24, right: 16, left: 4, bottom: 8 }}>
                      <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.22)" />
                      <XAxis dataKey="year" tickLine={false} axisLine={false} stroke="var(--text-secondary)" />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={56}
                        tickFormatter={(value) => Number(value).toLocaleString("en-IN")}
                        stroke="var(--text-secondary)"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--bg-surface-solid)",
                          border: "1px solid var(--border-default)",
                          borderRadius: "8px",
                        }}
                        formatter={(value) =>
                          Number(value).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="premiumInCrores"
                        stroke="var(--accent-primary)"
                        dot={{ fill: "#ffffff", stroke: "var(--accent-primary)", strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5 }}
                        strokeWidth={2.2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="panel-placeholder">
                  {appliedPerformancePremiumType && appliedPerformanceInsurer
                    ? "No data found for selected insurer."
                    : "Select filters and click Apply Filters to view visualization."}
                </p>
              )
            ) : isStateWiseAnalysisModule ? (
              !appliedStateBusinessType || stateWiseFiltersModified ? (
                <PanelState variant="empty" message="Select filters and click Apply Filters to view visualization." hint="Choose Business Type, View, State and Metric, then click Apply Filters." />
              ) : stateWiseLoading && stateWiseAppliedDocs.length === 0 ? (
                <PanelState variant="loading" message="Loading visualization" hint="Please wait while data is fetched." />
              ) : stateWiseVisibleRows.length > 0 ? (
                <>
                  {stateWiseShowChartTypePicker && (
                    <div className="timeline-filter-row chart-type-picker-row">
                      <div className="timeline-field">
                        <label className="filter-label label-text">Chart Type</label>
                        <select
                          className="filter-select timeline-select"
                          value={stateWisePendingVisualizationType}
                          onChange={(event) => setStateWisePendingVisualizationType(event.target.value)}
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
                          setStateWiseVisualizationType(stateWisePendingVisualizationType);
                          setStateWiseShowChartTypePicker(false);
                        }}
                        title="Apply chart type"
                      >
                        Apply Chart Type
                      </button>
                    </div>
                  )}
                  <div className="chart-wrapper plotly-chart-wrapper">
                                      {stateWiseShowMetricPicker && appliedStateMetrics.length > 1 && (
                                        <div className="timeline-filter-row chart-type-picker-row">
                                          <div className="timeline-field">
                                            <label className="filter-label label-text">Metric</label>
                                            <select
                                              className="filter-select timeline-select"
                                              value={stateWisePendingVisualizationMetric}
                                              onChange={(e) => setStateWisePendingVisualizationMetric(e.target.value)}
                                            >
                                              {appliedStateMetrics.map((metric) => (
                                                <option key={`viz-metric-${metric}`} value={metric}>
                                                  {metric === "Premium" ? "Premium in Cr (₹)" : metric}
                                                </option>
                                              ))}
                                            </select>
                                          </div>
                                          <button
                                            type="button"
                                            className="timeline-apply-btn"
                                            onClick={() => {
                                              setStateWiseVisualizationMetric(stateWisePendingVisualizationMetric || appliedStateMetrics[0]);
                                              setStateWiseShowMetricPicker(false);
                                            }}
                                            title="Apply metric"
                                          >
                                            Apply Metric
                                          </button>
                                        </div>
                                      )}
                    <Plot
                      className="plot-component-fill"
                      data={stateWisePlotTraces}
                      layout={stateWisePlotLayout}
                      config={stateWisePlotConfig}
                      useResizeHandler
                    />
                  </div>
                </>
              ) : (
                <PanelState
                  variant="empty"
                  message="No data found for the applied filters."
                  hint="Try adjusting your filters and applying again."
                />
              )
            ) : (
              <PanelState variant="empty" message="Select an insurer to view analytics." hint="Choose a module and apply filters to get started." />
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

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeFieldKey(key) {
  return String(key || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getValueFromAliases(document, aliases) {
  const entries = Object.entries(document || {});
  const aliasKeys = aliases.map((alias) => normalizeFieldKey(alias));

  for (const [key, value] of entries) {
    if (aliasKeys.includes(normalizeFieldKey(key)) && value !== null && value !== undefined && value !== "") {
      return value;
    }
  }

  return null;
}

function resolveInsurerNameFromDoc(document) {
  const aliases = [
    "insurer",
    "insurer_name",
    "insurerName",
    "name_of_insurer",
    "insurer name",
    "insurer/office",
    "company",
    "company_name",
    "name",
  ];

  const mappedValue = getValueFromAliases(document, aliases);
  if (mappedValue !== null) {
    return String(mappedValue).trim();
  }

  const candidates = [
    document?.insurer,
    document?.insurer_name,
    document?.insurerName,
    document?.company,
    document?.company_name,
    document?.name,
  ];

  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (value) {
      return value;
    }
  }

  return "";
}

function resolveStateWiseCollectionName(businessType, aggregationType) {
  return STATEWISE_COLLECTIONS[businessType]?.[aggregationType] || "";
}

function resolveStateNameFromDoc(document) {
  const aliases = [
    "state",
    "state_name",
    "stateName",
    "state_label",
    "state/ut",
    "state_ut",
    "state ut",
    "name_of_state",
    "region",
    "region_name",
  ];

  const mappedValue = getValueFromAliases(document, aliases);
  if (mappedValue !== null) {
    return String(mappedValue).trim();
  }

  const candidates = [
    document?.state,
    document?.state_name,
    document?.stateName,
    document?.state_label,
    document?.region,
    document?.region_name,
  ];

  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (value) {
      return value;
    }
  }

  return "";
}

function resolveStateWiseMetricValue(document, businessType, metric) {
  const premiumFields = [
    "premium_in_cr",
    "premium_in_crores",
    "premium_cr",
    "premium",
    "premium in cr",
    "premium (in cr)",
    "premium (in crore)",
    "premium in crore",
    "total_premium_in_cr",
    "total_premium",
    "amount",
    "value",
  ];

  const metricFieldsByBusinessType = {
    Individual: {
      Policies: [
        "policies",
        "policy_count",
        "number_of_policies",
        "number of policies",
        "no_of_policies",
        "no. of policies",
        "individual_policies",
      ],
      Premium: premiumFields,
    },
    Group: {
      Lives: [
        "lives",
        "number_of_lives",
        "number of lives",
        "no_of_lives",
        "no. of lives",
        "group_lives",
      ],
      Schemes: [
        "schemes",
        "number_of_schemes",
        "number of schemes",
        "no_of_schemes",
        "no. of schemes",
        "group_schemes",
      ],
      Premium: premiumFields,
    },
  };

  const preferredFields = metricFieldsByBusinessType[businessType]?.[metric] || [];

  const directValue = getValueFromAliases(document, preferredFields);
  const parsedDirectValue = parseNumericFieldValue(directValue);
  if (parsedDirectValue !== null) {
    return parsedDirectValue;
  }

  for (const [fieldName, fieldValue] of Object.entries(document || {})) {
    if (!new RegExp(metric, "i").test(fieldName)) {
      continue;
    }

    const parsedValue = parseNumericFieldValue(fieldValue);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  return 0;
}

// ----- Long-format collection helpers -----
// Returns the metric name stored in the row (e.g. "policies"), or null if the
// doc does not follow the long-format pattern.
// Strips metric-name suffixes so "lives_covered" matches "lives",
// "premium_in_cr" matches "premium", etc.
function normalizeMetricLabel(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/_covered|_count|_total|_amount|_in_cr|_crores?/g, "")
    .replace(/[^a-z]/g, "");
}

function resolveDocLongFormatMetric(document) {
  const metricFieldAliases = ["metric", "measure", "indicator", "category", "type"];
  for (const alias of metricFieldAliases) {
    const raw = document?.[alias];
    if (raw !== null && raw !== undefined && raw !== "") {
      const str = String(raw).trim();
      // Only treat as a metric identifier if it looks like a label, not a number
      if (str && !/^\d/.test(str)) {
        return str;
      }
    }
  }
  return null;
}

// Returns the numeric value for a long-format row.
function resolveDocLongFormatValue(document) {
  const valueFieldAliases = ["value", "amount", "total", "count", "number", "qty", "quantity"];
  const found = getValueFromAliases(document, valueFieldAliases);
  return parseNumericFieldValue(found) ?? 0;
}
// -------------------------------------------

function resolveYearLabel(document) {
  const yearAliases = [
    "year",
    "financial_year",
    "financial year",
    "financialYear",
    "fy",
    "year_range",
    "year range",
  ];

  const mappedYearValue = getValueFromAliases(document, yearAliases);
  if (mappedYearValue !== null) {
    const mappedYear = String(mappedYearValue).trim();
    if (mappedYear) {
      return mappedYear;
    }
  }

  const candidates = [document?.year, document?.financial_year, document?.financialYear, document?.fy];

  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined || candidate === "") {
      continue;
    }

    const yearValue = String(candidate).trim();
    if (yearValue) {
      return yearValue;
    }
  }

  return "";
}

function resolvePremiumCroresValue(document, premiumType) {
  const totalPremiumFields = [
    "total_premium_in_cr",
    "total_premium_in_crores",
    "total_premium_cr",
    "total_premium",
  ];

  const newBusinessPremiumFields = [
    "new_business_premium_in_cr",
    "new_business_premium_in_crores",
    "new_business_premium_cr",
    "new_business_premium",
    "first_year_premium_in_cr",
    "first_year_premium_in_crores",
    "first_year_premium",
  ];

  const commonPremiumFields = [
    "premium_in_cr",
    "premium_in_crores",
    "premium",
    "value",
    "amount",
  ];

  const preferredFields =
    premiumType === "New Business Premium"
      ? [...newBusinessPremiumFields, ...commonPremiumFields]
      : [...totalPremiumFields, ...commonPremiumFields];

  for (const fieldName of preferredFields) {
    const parsedValue = parseNumericFieldValue(document?.[fieldName]);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  for (const [fieldName, fieldValue] of Object.entries(document || {})) {
    if (!/premium/i.test(fieldName)) {
      continue;
    }

    const parsedValue = parseNumericFieldValue(fieldValue);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  return 0;
}

function parseNumericFieldValue(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const normalized = value
      .replace(/,/g, "")
      .replace(/₹/g, "")
      .replace(/cr\.?/gi, "")
      .replace(/crore(s)?/gi, "")
      .trim();

    const numericPart = normalized.match(/-?\d+(\.\d+)?/g)?.join("") || "";
    if (!numericPart) {
      return null;
    }

    const parsedValue = Number(numericPart);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
}

function resolveYearSortValue(yearLabel) {
  const match = String(yearLabel || "").match(/\d{4}/);
  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  const parsedYear = Number(match[0]);
  return Number.isFinite(parsedYear) ? parsedYear : Number.MAX_SAFE_INTEGER;
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
