import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";
import PlotComponentModule from "react-plotly.js";
import PlotlyModule from "plotly.js-dist-min";
import {
  AlertTriangle,
  BarChart2,
  BarChart3,
  Building,
  Building2,
  CheckCircle,
  CreditCard,
  Download,
  FileText,
  Globe,
  Info,
  IndianRupeeIcon,
  Landmark,
  LayoutGrid,
  Lightbulb,
  Loader2,
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

const Plot = PlotComponentModule?.default || PlotComponentModule;
const Plotly = PlotlyModule?.default || PlotlyModule;

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
    { id: "insurer-details", title: "General - Insurer Details", icon: FileText },
    { id: "state-wise-analysis", title: "State Wise : Premium - Segment Analysis", icon: MapPin },
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
  const [showInsights, setShowInsights] = useState(false);

  const [insurers, setInsurers] = useState([]);
  const [insurersLoading, setInsurersLoading] = useState(false);
  const [insurersError, setInsurersError] = useState("");
  const [selectedInsurerRegNo, setSelectedInsurerRegNo] = useState("");

  const [selectedInsurerDetails, setSelectedInsurerDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const [aumRawDocs, setAumRawDocs] = useState([]);
  const [aumLoading, setAumLoading] = useState(false);
  const [aumError, setAumError] = useState("");
  const [selectedAumInsurer, setSelectedAumInsurer] = useState("");
  const [selectedAumSector, setSelectedAumSector] = useState("");
  const [selectedInvestmentCategory, setSelectedInvestmentCategory] = useState("");
  const [appliedAumInsurer, setAppliedAumInsurer] = useState("");
  const [appliedAumSector, setAppliedAumSector] = useState("");
  const [appliedInvestmentCategory, setAppliedInvestmentCategory] = useState("");
  const [showTimelinePicker, setShowTimelinePicker] = useState(false);
  const [timelineStartYear, setTimelineStartYear] = useState("");
  const [timelineEndYear, setTimelineEndYear] = useState("");
  const [visualizationType, setVisualizationType] = useState("line");
  const [pendingVisualizationType, setPendingVisualizationType] = useState("line");
  const [showChartTypePicker, setShowChartTypePicker] = useState(false);
  const [chartGraphDiv, setChartGraphDiv] = useState(null);
  const [isExportingImage, setIsExportingImage] = useState(false);

  // Equity Share Capital state
  const [equityCapitalRawDocs, setEquityCapitalRawDocs] = useState([]);
  const [equityCapitalLoading, setEquityCapitalLoading] = useState(false);
  const [equityCapitalError, setEquityCapitalError] = useState("");
  const [selectedEscSector, setSelectedEscSector] = useState("");
  const [selectedEscInsurer, setSelectedEscInsurer] = useState("");
  const [appliedEscSector, setAppliedEscSector] = useState("");
  const [appliedEscInsurer, setAppliedEscInsurer] = useState("");

  // Gross Direct Premium state
  const [grossDirectPremiumRawDocs, setGrossDirectPremiumRawDocs] = useState([]);
  const [grossDirectPremiumLoading, setGrossDirectPremiumLoading] = useState(false);
  const [grossDirectPremiumError, setGrossDirectPremiumError] = useState("");
  const [selectedGdpInsurer, setSelectedGdpInsurer] = useState("");
  const [appliedGdpInsurer, setAppliedGdpInsurer] = useState("");

  // Premium Segment Analysis state
  const [segmentGdpRawDocs, setSegmentGdpRawDocs] = useState([]);
  const [segmentGdpLoading, setSegmentGdpLoading] = useState(false);
  const [segmentGdpError, setSegmentGdpError] = useState("");
  const [selectedSegmentInsurer, setSelectedSegmentInsurer] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("");
  const [appliedSegmentInsurer, setAppliedSegmentInsurer] = useState("");
  const [appliedSegment, setAppliedSegment] = useState("");

  // State-wise Premium Segment GDP state
  const [stateSegmentGdpRawDocs, setStateSegmentGdpRawDocs] = useState([]);
  const [stateSegmentGdpLoading, setStateSegmentGdpLoading] = useState(false);
  const [stateSegmentGdpError, setStateSegmentGdpError] = useState("");
  const [selectedStateGdpState, setSelectedStateGdpState] = useState("");
  const [selectedStateGdpSegment, setSelectedStateGdpSegment] = useState("");
  const [appliedStateGdpState, setAppliedStateGdpState] = useState("");
  const [appliedStateGdpSegment, setAppliedStateGdpSegment] = useState("");

  // Number of Issued Policies state
  const [issuedPoliciesRawDocs, setIssuedPoliciesRawDocs] = useState([]);
  const [issuedPoliciesLoading, setIssuedPoliciesLoading] = useState(false);
  const [issuedPoliciesError, setIssuedPoliciesError] = useState("");
  const [selectedIssuedInsurerType, setSelectedIssuedInsurerType] = useState("");
  const [appliedIssuedInsurerType, setAppliedIssuedInsurerType] = useState("");

  // Solvency Ratio state
  const [solvencyRawDocs, setSolvencyRawDocs] = useState([]);
  const [solvencyLoading, setSolvencyLoading] = useState(false);
  const [solvencyError, setSolvencyError] = useState("");
  const [selectedSolvencySector, setSelectedSolvencySector] = useState("");
  const [selectedSolvencyInsurer, setSelectedSolvencyInsurer] = useState("");
  const [appliedSolvencySector, setAppliedSolvencySector] = useState("");
  const [appliedSolvencyInsurer, setAppliedSolvencyInsurer] = useState("");

  // Operational Analysis state
  const [operationalRawDocs, setOperationalRawDocs] = useState([]);
  const [operationalLoading, setOperationalLoading] = useState(false);
  const [operationalError, setOperationalError] = useState("");
  const [selectedOperationalSector, setSelectedOperationalSector] = useState("");
  const [selectedOperationalInsurer, setSelectedOperationalInsurer] = useState("");
  const [selectedOperationalSegment, setSelectedOperationalSegment] = useState("");
  const [selectedOperationalMetric, setSelectedOperationalMetric] = useState("");
  const [appliedOperationalSector, setAppliedOperationalSector] = useState("");
  const [appliedOperationalInsurer, setAppliedOperationalInsurer] = useState("");
  const [appliedOperationalSegment, setAppliedOperationalSegment] = useState("");
  const [appliedOperationalMetric, setAppliedOperationalMetric] = useState("");

  const isInsurerDetailsView =
    activeTab === "market-overview" && selectedModule === "insurer-details";
  const isAumInsurerWiseView =
    activeTab === "financials" && selectedModule === "aum-insurer-wise";
  const isEquityCapitalView =
    activeTab === "financials" && selectedModule === "equity-share-capital";
  const isGrossDirectPremiumView =
    activeTab === "insurer-performance" && selectedModule === "gross-direct-premium";
  const isPremiumSegmentAnalysisView =
    activeTab === "insurer-performance" && selectedModule === "premium-segment-analysis";
  const isStatewisePremiumSegmentView =
    activeTab === "market-overview" && selectedModule === "state-wise-analysis";
  const isIssuedPoliciesView =
    activeTab === "market-overview" && selectedModule === "issued-policies";
  const isSolvencyRatioView =
    activeTab === "market-overview" && selectedModule === "solvency-ratio";
  const isOperationalAnalysisView =
    activeTab === "claims-risk" && selectedModule === "underwriting-experience";

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

  useEffect(() => {
    if (!isAumInsurerWiseView || aumRawDocs.length > 0) {
      return;
    }

    const fetchAumDocs = async () => {
      setAumLoading(true);
      setAumError("");

      try {
        const snapshot = await getDocs(collection(db, "sheet47_aum_insurerwise"));
        const documents = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setAumRawDocs(documents);
      } catch (error) {
        console.error("Failed to fetch AUM insurer-wise data:", error);
        setAumError("Unable to load AUM insurer-wise data.");
        setAumRawDocs([]);
      } finally {
        setAumLoading(false);
      }
    };

    fetchAumDocs();
  }, [isAumInsurerWiseView, aumRawDocs.length]);

  useEffect(() => {
    if (!isAumInsurerWiseView) {
      return;
    }

    setSelectedAumInsurer("");
    setSelectedInvestmentCategory("");
    setShowChartTypePicker(false);
    setShowTimelinePicker(false);
    setPendingVisualizationType(visualizationType);
  }, [isAumInsurerWiseView, selectedAumSector]);

  // Fetch Equity Capital Data
  useEffect(() => {
    if (!isEquityCapitalView || equityCapitalRawDocs.length > 0) {
      return;
    }

    const fetchEquityCapitalDocs = async () => {
      setEquityCapitalLoading(true);
      setEquityCapitalError("");

      try {
        const snapshot = await getDocs(collection(db, "Sheet48_Equity_Share_Capital_NonLife_db"));
        const documents = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setEquityCapitalRawDocs(documents);
      } catch (error) {
        console.error("Failed to fetch Equity Capital data:", error);
        setEquityCapitalError("Unable to load Equity Capital data.");
        setEquityCapitalRawDocs([]);
      } finally {
        setEquityCapitalLoading(false);
      }
    };

    fetchEquityCapitalDocs();
  }, [isEquityCapitalView, equityCapitalRawDocs.length]);

  // Reset Equity Capital filters when entering the view
  useEffect(() => {
    if (!isEquityCapitalView) {
      return;
    }

    setSelectedEscSector("");
    setSelectedEscInsurer("");
    setShowChartTypePicker(false);
    setShowTimelinePicker(false);
  }, [isEquityCapitalView]);

  // Reset Equity Capital insurer when sector changes
  useEffect(() => {
    if (!isEquityCapitalView || selectedEscSector === "") {
      return;
    }

    setSelectedEscInsurer("");
  }, [selectedEscSector, isEquityCapitalView]);

  // Fetch Gross Direct Premium data
  useEffect(() => {
    if (!isGrossDirectPremiumView || grossDirectPremiumRawDocs.length > 0) {
      return;
    }

    const fetchGrossDirectPremiumDocs = async () => {
      setGrossDirectPremiumLoading(true);
      setGrossDirectPremiumError("");

      try {
        const snapshot = await getDocs(collection(db, "Sheet40_Gross_Direct_Premium_Nonlife"));
        const documents = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setGrossDirectPremiumRawDocs(documents);
      } catch (error) {
        console.error("Failed to fetch Gross Direct Premium data:", error);
        setGrossDirectPremiumError("Unable to load Gross Direct Premium data.");
        setGrossDirectPremiumRawDocs([]);
      } finally {
        setGrossDirectPremiumLoading(false);
      }
    };

    fetchGrossDirectPremiumDocs();
  }, [isGrossDirectPremiumView, grossDirectPremiumRawDocs.length]);

  // Reset Gross Direct Premium filters when entering the view
  useEffect(() => {
    if (!isGrossDirectPremiumView) {
      return;
    }

    setSelectedGdpInsurer("");
    setAppliedGdpInsurer("");
    setShowChartTypePicker(false);
    setShowTimelinePicker(false);
  }, [isGrossDirectPremiumView]);

  // Fetch Premium Segment Analysis data
  useEffect(() => {
    if (!isPremiumSegmentAnalysisView || segmentGdpRawDocs.length > 0) {
      return;
    }

    const fetchSegmentGdpDocs = async () => {
      setSegmentGdpLoading(true);
      setSegmentGdpError("");

      try {
        const snapshot = await getDocs(collection(db, "sheet41_segment_gdp_nonlife"));
        const documents = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setSegmentGdpRawDocs(documents);
      } catch (error) {
        console.error("Failed to fetch Premium Segment Analysis data:", error);
        setSegmentGdpError("Unable to load Premium Segment Analysis data.");
        setSegmentGdpRawDocs([]);
      } finally {
        setSegmentGdpLoading(false);
      }
    };

    fetchSegmentGdpDocs();
  }, [isPremiumSegmentAnalysisView, segmentGdpRawDocs.length]);

  useEffect(() => {
    if (!isPremiumSegmentAnalysisView) {
      return;
    }

    setSelectedSegmentInsurer("");
    setSelectedSegment("");
    setAppliedSegmentInsurer("");
    setAppliedSegment("");
    setShowChartTypePicker(false);
    setShowTimelinePicker(false);
  }, [isPremiumSegmentAnalysisView]);

  useEffect(() => {
    if (!isPremiumSegmentAnalysisView || !selectedSegmentInsurer) {
      return;
    }

    setSelectedSegment("");
  }, [isPremiumSegmentAnalysisView, selectedSegmentInsurer]);

  // Fetch State-wise Premium Segment GDP data
  useEffect(() => {
    if (!isStatewisePremiumSegmentView || stateSegmentGdpRawDocs.length > 0) {
      return;
    }

    const fetchStateSegmentGdpDocs = async () => {
      setStateSegmentGdpLoading(true);
      setStateSegmentGdpError("");

      try {
        const snapshot = await getDocs(collection(db, "Sheet42_state_gdp_segment"));
        const documents = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setStateSegmentGdpRawDocs(documents);
      } catch (error) {
        console.error("Failed to fetch State-wise Premium Segment GDP data:", error);
        setStateSegmentGdpError("Unable to load State-wise Premium Segment GDP data.");
        setStateSegmentGdpRawDocs([]);
      } finally {
        setStateSegmentGdpLoading(false);
      }
    };

    fetchStateSegmentGdpDocs();
  }, [isStatewisePremiumSegmentView, stateSegmentGdpRawDocs.length]);

  useEffect(() => {
    if (!isStatewisePremiumSegmentView) {
      return;
    }

    setSelectedStateGdpState("");
    setSelectedStateGdpSegment("");
    setAppliedStateGdpState("");
    setAppliedStateGdpSegment("");
    setShowChartTypePicker(false);
    setShowTimelinePicker(false);
  }, [isStatewisePremiumSegmentView]);

  useEffect(() => {
    if (!isStatewisePremiumSegmentView || !selectedStateGdpState) {
      return;
    }

    setSelectedStateGdpSegment("");
  }, [isStatewisePremiumSegmentView, selectedStateGdpState]);

  // Fetch Number of Issued Policies data
  useEffect(() => {
    if (!isIssuedPoliciesView || issuedPoliciesRawDocs.length > 0) {
      return;
    }

    const fetchIssuedPoliciesDocs = async () => {
      setIssuedPoliciesLoading(true);
      setIssuedPoliciesError("");

      try {
        const snapshot = await getDocs(
          collection(db, "Sheet43_Number_of_Policies_Issued_by_General_Insurers")
        );
        const documents = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setIssuedPoliciesRawDocs(documents);
      } catch (error) {
        console.error("Failed to fetch issued policies data:", error);
        setIssuedPoliciesError("Unable to load Number of Issued Policies data.");
        setIssuedPoliciesRawDocs([]);
      } finally {
        setIssuedPoliciesLoading(false);
      }
    };

    fetchIssuedPoliciesDocs();
  }, [isIssuedPoliciesView, issuedPoliciesRawDocs.length]);

  useEffect(() => {
    if (!isIssuedPoliciesView) {
      return;
    }

    setSelectedIssuedInsurerType("");
    setAppliedIssuedInsurerType("");
    setShowChartTypePicker(false);
    setShowTimelinePicker(false);
  }, [isIssuedPoliciesView]);

  // Fetch Solvency Ratio data
  useEffect(() => {
    if (!isSolvencyRatioView || solvencyRawDocs.length > 0) {
      return;
    }

    const fetchSolvencyDocs = async () => {
      setSolvencyLoading(true);
      setSolvencyError("");

      try {
        const snapshot = await getDocs(collection(db, "Sheet_49_Solvency_Ratio_Nonlife"));
        const documents = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setSolvencyRawDocs(documents);
      } catch (error) {
        console.error("Failed to fetch Solvency Ratio data:", error);
        setSolvencyError("Unable to load Solvency Ratio data.");
        setSolvencyRawDocs([]);
      } finally {
        setSolvencyLoading(false);
      }
    };

    fetchSolvencyDocs();
  }, [isSolvencyRatioView, solvencyRawDocs.length]);

  // Reset Solvency Ratio filters when entering the view
  useEffect(() => {
    if (!isSolvencyRatioView) {
      return;
    }

    setSelectedSolvencySector("");
    setSelectedSolvencyInsurer("");
    setAppliedSolvencySector("");
    setAppliedSolvencyInsurer("");
    setShowChartTypePicker(false);
    setShowTimelinePicker(false);
  }, [isSolvencyRatioView]);

  // Reset Solvency insurer when sector changes
  useEffect(() => {
    if (!isSolvencyRatioView) {
      return;
    }

    setSelectedSolvencyInsurer("");
    setAppliedSolvencyInsurer("");
  }, [isSolvencyRatioView, selectedSolvencySector]);

  useEffect(() => {
    if (!isOperationalAnalysisView || operationalRawDocs.length > 0) {
      return;
    }

    const fetchOperationalDocs = async () => {
      setOperationalLoading(true);
      setOperationalError("");

      try {
        const snapshot = await getDocs(collection(db, "sheet45_revised"));
        const documents = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setOperationalRawDocs(documents);
      } catch (error) {
        console.error("Failed to fetch Operational Analysis data:", error);
        setOperationalError("Unable to load Operational Analysis data.");
        setOperationalRawDocs([]);
      } finally {
        setOperationalLoading(false);
      }
    };

    fetchOperationalDocs();
  }, [isOperationalAnalysisView, operationalRawDocs.length]);

  useEffect(() => {
    if (!isOperationalAnalysisView) {
      return;
    }

    setSelectedOperationalSector("");
    setSelectedOperationalInsurer("");
    setSelectedOperationalMetric("");
    setAppliedOperationalSector("");
    setAppliedOperationalInsurer("");
    setAppliedOperationalMetric("");
    setShowChartTypePicker(false);
    setShowTimelinePicker(false);
    setTimelineStartYear("");
    setTimelineEndYear("");
  }, [isOperationalAnalysisView]);

  useEffect(() => {
    setPendingVisualizationType(visualizationType);
  }, [visualizationType]);

  const insurerOptions = useMemo(
    () => insurers.map((insurer) => ({ label: insurer.insurerName, value: insurer.regNo })),
    [insurers]
  );

  const aumInsurerOptions = useMemo(() => {
    const normalizedSector = normalizeText(selectedAumSector);

    return Array.from(
      new Set(
        aumRawDocs
          .filter((document) => {
            if (!normalizedSector) {
              return true;
            }

            return normalizeText(resolveSector(document)) === normalizedSector;
          })
          .map((document) => resolveInsurerName(document))
          .filter(Boolean)
      )
    )
      .sort((first, second) => first.localeCompare(second))
      .map((insurerName) => ({ label: insurerName, value: insurerName }));
  }, [aumRawDocs, selectedAumSector]);

  const aumSectorOptions = useMemo(() => {
    return Array.from(
      new Set(aumRawDocs.map((document) => resolveSector(document)).filter(Boolean))
    )
      .sort((first, second) => first.localeCompare(second))
      .map((sector) => ({ label: sector, value: sector }));
  }, [aumRawDocs]);

  const investmentCategoryOptions = useMemo(() => {
    const normalizedSector = normalizeText(selectedAumSector);

    return Array.from(
      new Set(
        aumRawDocs
          .filter((document) => {
            if (!normalizedSector) {
              return true;
            }

            return normalizeText(resolveSector(document)) === normalizedSector;
          })
          .map((document) => resolveInvestmentCategory(document))
          .filter(Boolean)
      )
    )
      .sort((first, second) => first.localeCompare(second))
      .map((category) => ({
        label: formatInvestmentCategoryLabel(category),
        value: category,
      }));
  }, [aumRawDocs, selectedAumSector]);

  const aumAppliedRows = useMemo(() => {
    if (!isAumInsurerWiseView || !appliedAumSector || !appliedAumInsurer || !appliedInvestmentCategory) {
      return [];
    }

    const normalizedSector = normalizeText(appliedAumSector);
    const normalizedInsurer = normalizeText(appliedAumInsurer);
    const normalizedCategory = normalizeText(appliedInvestmentCategory);
    const yearTotals = new Map();

    aumRawDocs.forEach((document) => {
      if (normalizeText(resolveSector(document)) !== normalizedSector) {
        return;
      }

      if (normalizeText(resolveInsurerName(document)) !== normalizedInsurer) {
        return;
      }

      if (normalizeText(resolveInvestmentCategory(document)) !== normalizedCategory) {
        return;
      }

      const yearLabel = resolveYearLabel(document);
      if (!yearLabel) {
        return;
      }

      const aumValue = resolveAumValue(document);
      yearTotals.set(yearLabel, (yearTotals.get(yearLabel) || 0) + aumValue);
    });

    return Array.from(yearTotals.entries())
      .map(([year, value]) => ({ year, value }))
      .sort((first, second) => resolveYearSortValue(first.year) - resolveYearSortValue(second.year));
  }, [
    isAumInsurerWiseView,
    appliedAumSector,
    appliedAumInsurer,
    appliedInvestmentCategory,
    aumRawDocs,
  ]);

  useEffect(() => {
    if (!isAumInsurerWiseView) {
      return;
    }

    if (aumAppliedRows.length === 0) {
      setTimelineStartYear("");
      setTimelineEndYear("");
      return;
    }

    const timelineYears = aumAppliedRows
      .map((row) => resolveYearSortValue(row.year))
      .filter((year) => Number.isFinite(year) && year !== Number.MAX_SAFE_INTEGER)
      .sort((first, second) => first - second);

    if (timelineYears.length === 0) {
      setTimelineStartYear("");
      setTimelineEndYear("");
      return;
    }

    const minimumYear = String(timelineYears[0]);
    const maximumYear = String(timelineYears[timelineYears.length - 1]);

    if (!timelineStartYear) {
      setTimelineStartYear(minimumYear);
    }

    if (!timelineEndYear) {
      setTimelineEndYear(maximumYear);
    }
  }, [isAumInsurerWiseView, aumAppliedRows, timelineStartYear, timelineEndYear]);

  const timelineYearOptions = useMemo(() => {
    const years = aumAppliedRows
      .map((row) => resolveYearSortValue(row.year))
      .filter((year) => Number.isFinite(year) && year !== Number.MAX_SAFE_INTEGER)
      .sort((first, second) => first - second);

    return Array.from(new Set(years));
  }, [aumAppliedRows]);

  const visibleAumRows = useMemo(() => {
    if (!aumAppliedRows.length) {
      return [];
    }

    if (!timelineStartYear || !timelineEndYear) {
      return aumAppliedRows;
    }

    const startYear = Number(timelineStartYear);
    const endYear = Number(timelineEndYear);

    return aumAppliedRows.filter((row) => {
      const rowYear = resolveYearSortValue(row.year);
      return rowYear >= startYear && rowYear <= endYear;
    });
  }, [aumAppliedRows, timelineStartYear, timelineEndYear]);

  // Equity Capital Sector Options
  const escSectorOptions = useMemo(() => {
    return Array.from(
      new Set(equityCapitalRawDocs.map((document) => resolveSector(document)).filter(Boolean))
    )
      .sort((first, second) => first.localeCompare(second))
      .map((sector) => ({ label: sector, value: sector }));
  }, [equityCapitalRawDocs]);

  // Equity Capital Insurer Options (filtered by sector)
  const escInsurerOptions = useMemo(() => {
    const normalizedSector = normalizeText(selectedEscSector);

    return Array.from(
      new Set(
        equityCapitalRawDocs
          .filter((document) => {
            if (!normalizedSector) {
              return true;
            }

            return normalizeText(resolveSector(document)) === normalizedSector;
          })
          .map((document) => resolveInsurerName(document))
          .filter(Boolean)
      )
    )
      .sort((first, second) => first.localeCompare(second))
      .map((insurerName) => ({ label: insurerName, value: insurerName }));
  }, [equityCapitalRawDocs, selectedEscSector]);

  // Equity Capital Applied Rows (filtered data to display)
  const escAppliedRows = useMemo(() => {
    if (!isEquityCapitalView || !appliedEscSector || !appliedEscInsurer) {
      return [];
    }

    const normalizedSector = normalizeText(appliedEscSector);
    const normalizedInsurer = normalizeText(appliedEscInsurer);
    const yearTotals = new Map();

    equityCapitalRawDocs.forEach((document) => {
      if (normalizeText(resolveSector(document)) !== normalizedSector) {
        return;
      }

      if (normalizeText(resolveInsurerName(document)) !== normalizedInsurer) {
        return;
      }

      const yearLabel = resolveYearLabel(document);
      if (!yearLabel) {
        return;
      }

      const equityValue = resolveEquityCapitalValue(document);
      yearTotals.set(yearLabel, (yearTotals.get(yearLabel) || 0) + equityValue);
    });

    return Array.from(yearTotals.entries())
      .map(([year, value]) => ({ year, value }))
      .sort((first, second) => resolveYearSortValue(first.year) - resolveYearSortValue(second.year));
  }, [
    isEquityCapitalView,
    appliedEscSector,
    appliedEscInsurer,
    equityCapitalRawDocs,
  ]);

  const gdpInsurerOptions = useMemo(() => {
    return Array.from(
      new Set(grossDirectPremiumRawDocs.map((document) => resolveInsurerName(document)).filter(Boolean))
    )
      .sort((first, second) => first.localeCompare(second))
      .map((insurerName) => ({ label: insurerName, value: insurerName }));
  }, [grossDirectPremiumRawDocs]);

  const gdpAppliedRows = useMemo(() => {
    if (!isGrossDirectPremiumView || !appliedGdpInsurer) {
      return [];
    }

    const normalizedInsurer = normalizeText(appliedGdpInsurer);
    const yearTotals = new Map();

    grossDirectPremiumRawDocs.forEach((document) => {
      if (normalizeText(resolveInsurerName(document)) !== normalizedInsurer) {
        return;
      }

      const yearLabel = resolveYearLabel(document);
      if (!yearLabel) {
        return;
      }

      const premiumValue = resolveGrossDirectPremiumValue(document);
      yearTotals.set(yearLabel, (yearTotals.get(yearLabel) || 0) + premiumValue);
    });

    return Array.from(yearTotals.entries())
      .map(([year, value]) => ({ year, value }))
      .sort((first, second) => resolveYearSortValue(first.year) - resolveYearSortValue(second.year));
  }, [isGrossDirectPremiumView, appliedGdpInsurer, grossDirectPremiumRawDocs]);

  const segmentInsurerOptions = useMemo(() => {
    return Array.from(
      new Set(segmentGdpRawDocs.map((document) => resolveInsurerName(document)).filter(Boolean))
    )
      .sort((first, second) => first.localeCompare(second))
      .map((insurerName) => ({ label: insurerName, value: insurerName }));
  }, [segmentGdpRawDocs]);

  const segmentOptions = useMemo(() => {
    const normalizedInsurer = normalizeText(selectedSegmentInsurer);

    return Array.from(
      new Set(
        segmentGdpRawDocs
          .filter((document) => {
            if (!normalizedInsurer) {
              return true;
            }

            return normalizeText(resolveInsurerName(document)) === normalizedInsurer;
          })
          .map((document) => resolveSegmentName(document))
          .filter(Boolean)
      )
    )
      .sort((first, second) => first.localeCompare(second))
      .map((segmentName) => ({ label: segmentName, value: segmentName }));
  }, [segmentGdpRawDocs, selectedSegmentInsurer]);

  const segmentAppliedRows = useMemo(() => {
    if (!isPremiumSegmentAnalysisView || !appliedSegmentInsurer || !appliedSegment) {
      return [];
    }

    const normalizedInsurer = normalizeText(appliedSegmentInsurer);
    const normalizedSegment = normalizeText(appliedSegment);
    const yearTotals = new Map();

    segmentGdpRawDocs.forEach((document) => {
      if (normalizeText(resolveInsurerName(document)) !== normalizedInsurer) {
        return;
      }

      if (normalizeText(resolveSegmentName(document)) !== normalizedSegment) {
        return;
      }

      const yearLabel = resolveYearLabel(document);
      if (!yearLabel) {
        return;
      }

      const segmentValue = resolveSegmentGdpValue(document);
      yearTotals.set(yearLabel, (yearTotals.get(yearLabel) || 0) + segmentValue);
    });

    return Array.from(yearTotals.entries())
      .map(([year, value]) => ({ year, value }))
      .sort((first, second) => resolveYearSortValue(first.year) - resolveYearSortValue(second.year));
  }, [isPremiumSegmentAnalysisView, appliedSegmentInsurer, appliedSegment, segmentGdpRawDocs]);

  const stateGdpStateOptions = useMemo(() => {
    return Array.from(
      new Set(stateSegmentGdpRawDocs.map((document) => resolveStateName(document)).filter(Boolean))
    )
      .sort((first, second) => first.localeCompare(second))
      .map((stateName) => ({ label: stateName, value: stateName }));
  }, [stateSegmentGdpRawDocs]);

  const stateGdpSegmentOptions = useMemo(() => {
    const normalizedState = normalizeText(selectedStateGdpState);

    return Array.from(
      new Set(
        stateSegmentGdpRawDocs
          .filter((document) => {
            if (!normalizedState) {
              return true;
            }

            return normalizeText(resolveStateName(document)) === normalizedState;
          })
          .map((document) => resolveSegmentName(document))
          .filter(Boolean)
      )
    )
      .sort((first, second) => first.localeCompare(second))
      .map((segmentName) => ({ label: segmentName, value: segmentName }));
  }, [stateSegmentGdpRawDocs, selectedStateGdpState]);

  const stateSegmentAppliedRows = useMemo(() => {
    if (!isStatewisePremiumSegmentView || !appliedStateGdpState || !appliedStateGdpSegment) {
      return [];
    }

    const normalizedState = normalizeText(appliedStateGdpState);
    const normalizedSegment = normalizeText(appliedStateGdpSegment);
    const yearTotals = new Map();

    stateSegmentGdpRawDocs.forEach((document) => {
      if (normalizeText(resolveStateName(document)) !== normalizedState) {
        return;
      }

      if (normalizeText(resolveSegmentName(document)) !== normalizedSegment) {
        return;
      }

      const yearLabel = resolveYearLabel(document);
      if (!yearLabel) {
        return;
      }

      const gdpValue = resolveStateSegmentGdpValue(document);
      yearTotals.set(yearLabel, (yearTotals.get(yearLabel) || 0) + gdpValue);
    });

    return Array.from(yearTotals.entries())
      .map(([year, value]) => ({ year, value }))
      .sort((first, second) => resolveYearSortValue(first.year) - resolveYearSortValue(second.year));
  }, [
    isStatewisePremiumSegmentView,
    appliedStateGdpState,
    appliedStateGdpSegment,
    stateSegmentGdpRawDocs,
  ]);

  const issuedPoliciesInsurerTypeOptions = useMemo(() => {
    return Array.from(
      new Set(issuedPoliciesRawDocs.map((document) => resolveInsurerType(document)).filter(Boolean))
    )
      .sort((first, second) => first.localeCompare(second))
      .map((insurerType) => ({ label: insurerType, value: insurerType }));
  }, [issuedPoliciesRawDocs]);

  const issuedPoliciesAppliedRows = useMemo(() => {
    if (!isIssuedPoliciesView || !appliedIssuedInsurerType) {
      return [];
    }

    const normalizedInsurerType = normalizeText(appliedIssuedInsurerType);
    const yearTotals = new Map();

    issuedPoliciesRawDocs.forEach((document) => {
      if (normalizeText(resolveInsurerType(document)) !== normalizedInsurerType) {
        return;
      }

      const yearLabel = resolveYearLabel(document);
      if (!yearLabel) {
        return;
      }

      const policiesValue = resolvePoliciesIssuedLakhsValue(document);
      yearTotals.set(yearLabel, (yearTotals.get(yearLabel) || 0) + policiesValue);
    });

    return Array.from(yearTotals.entries())
      .map(([year, value]) => ({ year, value }))
      .sort((first, second) => resolveYearSortValue(first.year) - resolveYearSortValue(second.year));
  }, [isIssuedPoliciesView, appliedIssuedInsurerType, issuedPoliciesRawDocs]);

  const solvencySectorOptions = useMemo(() => {
    return Array.from(
      new Set(solvencyRawDocs.map((document) => resolveSector(document)).filter(Boolean))
    )
      .sort((first, second) => first.localeCompare(second))
      .map((sector) => ({ label: sector, value: sector }));
  }, [solvencyRawDocs]);

  const solvencyInsurerOptions = useMemo(() => {
    const normalizedSector = normalizeText(selectedSolvencySector);

    return Array.from(
      new Set(
        solvencyRawDocs
          .filter((document) => {
            if (!normalizedSector) {
              return false;
            }

            return normalizeText(resolveSector(document)) === normalizedSector;
          })
          .map((document) => resolveInsurerName(document))
          .filter(Boolean)
      )
    )
      .sort((first, second) => first.localeCompare(second))
      .map((insurerName) => ({ label: insurerName, value: insurerName }));
  }, [solvencyRawDocs, selectedSolvencySector]);

  const solvencyAppliedRows = useMemo(() => {
    if (!isSolvencyRatioView || !appliedSolvencySector || !appliedSolvencyInsurer) {
      return [];
    }

    const normalizedSector = normalizeText(appliedSolvencySector);
    const normalizedInsurer = normalizeText(appliedSolvencyInsurer);
    const yearRatios = new Map();

    solvencyRawDocs.forEach((document) => {
      if (normalizeText(resolveSector(document)) !== normalizedSector) {
        return;
      }

      if (normalizeText(resolveInsurerName(document)) !== normalizedInsurer) {
        return;
      }

      const yearLabel = resolveYearLabel(document);
      if (!yearLabel) {
        return;
      }

      const ratioValue = resolveSolvencyRatioValue(document);
      yearRatios.set(yearLabel, ratioValue);
    });

    return Array.from(yearRatios.entries())
      .map(([year, value]) => ({ year, value }))
      .sort((first, second) => resolveSolvencyPeriodSortValue(first.year) - resolveSolvencyPeriodSortValue(second.year));
  }, [
    isSolvencyRatioView,
    appliedSolvencySector,
    appliedSolvencyInsurer,
    solvencyRawDocs,
  ]);

  const operationalMetricFilterLabelMap = useMemo(
    () => ({}),
    []
  );

  const operationalMetricPanelLabelMap = useMemo(
    () => ({}),
    []
  );

  const operationalSectorOptions = useMemo(() => {
    return Array.from(new Set(operationalRawDocs.map((document) => document.sector).filter(Boolean)))
      .sort((first, second) => String(first).localeCompare(String(second)))
      .map((sector) => ({ label: formatDisplayLabel(sector), value: sector }));
  }, [operationalRawDocs]);

  const operationalInsurerOptions = useMemo(() => {
    const normalizedSector = normalizeText(selectedOperationalSector);
    return Array.from(
      new Set(
        operationalRawDocs
          .filter((document) => {
            if (!normalizedSector) {
              return true;
            }

            return normalizeText(document.sector) === normalizedSector;
          })
          .map((document) => document.insurer_name)
          .filter(Boolean)
      )
    )
      .sort((first, second) => String(first).localeCompare(String(second)))
      .map((insurerName) => ({ label: formatDisplayLabel(insurerName), value: insurerName }));
  }, [operationalRawDocs, selectedOperationalSector]);

  const operationalMetricOptions = useMemo(() => {
    const normalizedSector = normalizeText(selectedOperationalSector);
    const normalizedInsurer = normalizeText(selectedOperationalInsurer);

    return Array.from(
      new Set(
        operationalRawDocs
          .filter((document) => {
            if (normalizedSector && normalizeText(document.sector) !== normalizedSector) {
              return false;
            }

            if (normalizedInsurer && normalizeText(document.insurer_name) !== normalizedInsurer) {
              return false;
            }

            return true;
          })
          .map((document) => document.metric)
          .filter(Boolean)
      )
    )
      .sort((first, second) => String(first).localeCompare(String(second)))
      .map((metric) => ({
        label: operationalMetricFilterLabelMap[metric] || metric,
        value: metric,
      }));
  }, [
    operationalRawDocs,
    selectedOperationalSector,
    selectedOperationalInsurer,
    operationalMetricFilterLabelMap,
  ]);

  const operationalAppliedRows = useMemo(() => {
    if (
      !isOperationalAnalysisView ||
      !appliedOperationalSector ||
      !appliedOperationalInsurer ||
      !appliedOperationalMetric
    ) {
      return [];
    }

    const normalizedSector = normalizeText(appliedOperationalSector);
    const normalizedInsurer = normalizeText(appliedOperationalInsurer);
    const normalizedMetric = normalizeText(appliedOperationalMetric);
    const yearTotals = new Map();

    operationalRawDocs.forEach((document) => {
      if (normalizeText(document.sector) !== normalizedSector) {
        return;
      }

      if (normalizeText(document.insurer_name) !== normalizedInsurer) {
        return;
      }

      if (normalizeText(document.metric) !== normalizedMetric) {
        return;
      }

      const yearLabel = resolveYearLabel(document);
      if (!yearLabel) {
        return;
      }

      const metricValue = Number(
        document.value ?? document.metric_value ?? document.amount ?? document.metric_amount ?? 0
      );

      if (!Number.isFinite(metricValue)) {
        return;
      }

      yearTotals.set(yearLabel, (yearTotals.get(yearLabel) || 0) + metricValue);
    });

    return Array.from(yearTotals.entries())
      .map(([year, value]) => ({ year, value }))
      .sort((first, second) => resolveYearSortValue(first.year) - resolveYearSortValue(second.year));
  }, [
    isOperationalAnalysisView,
    appliedOperationalSector,
    appliedOperationalInsurer,
    appliedOperationalMetric,
    operationalRawDocs,
  ]);

  useEffect(() => {
    if (!isOperationalAnalysisView) {
      return;
    }

    if (operationalAppliedRows.length === 0) {
      setTimelineStartYear("");
      setTimelineEndYear("");
      return;
    }

    const timelineYears = operationalAppliedRows
      .map((row) => resolveYearSortValue(row.year))
      .filter((year) => Number.isFinite(year) && year !== Number.MAX_SAFE_INTEGER)
      .sort((first, second) => first - second);

    if (timelineYears.length === 0) {
      setTimelineStartYear("");
      setTimelineEndYear("");
      return;
    }

    const minimumYear = String(timelineYears[0]);
    const maximumYear = String(timelineYears[timelineYears.length - 1]);

    if (!timelineStartYear) {
      setTimelineStartYear(minimumYear);
    }

    if (!timelineEndYear) {
      setTimelineEndYear(maximumYear);
    }
  }, [isOperationalAnalysisView, operationalAppliedRows, timelineStartYear, timelineEndYear]);

  const operationalTimelineYearOptions = useMemo(() => {
    const years = operationalAppliedRows
      .map((row) => resolveYearSortValue(row.year))
      .filter((year) => Number.isFinite(year) && year !== Number.MAX_SAFE_INTEGER)
      .sort((first, second) => first - second);

    return Array.from(new Set(years));
  }, [operationalAppliedRows]);

  const visibleOperationalRows = useMemo(() => {
    if (!operationalAppliedRows.length) {
      return [];
    }

    if (!timelineStartYear || !timelineEndYear) {
      return operationalAppliedRows;
    }

    const startYear = Number(timelineStartYear);
    const endYear = Number(timelineEndYear);

    return operationalAppliedRows.filter((row) => {
      const rowYear = resolveYearSortValue(row.year);
      return rowYear >= startYear && rowYear <= endYear;
    });
  }, [operationalAppliedRows, timelineStartYear, timelineEndYear]);

  useEffect(() => {
    if (!isEquityCapitalView) {
      return;
    }

    if (escAppliedRows.length === 0) {
      setTimelineStartYear("");
      setTimelineEndYear("");
      return;
    }

    const timelineYears = escAppliedRows
      .map((row) => resolveYearSortValue(row.year))
      .filter((year) => Number.isFinite(year) && year !== Number.MAX_SAFE_INTEGER)
      .sort((first, second) => first - second);

    if (timelineYears.length === 0) {
      setTimelineStartYear("");
      setTimelineEndYear("");
      return;
    }

    const minimumYear = String(timelineYears[0]);
    const maximumYear = String(timelineYears[timelineYears.length - 1]);

    if (!timelineStartYear) {
      setTimelineStartYear(minimumYear);
    }

    if (!timelineEndYear) {
      setTimelineEndYear(maximumYear);
    }
  }, [isEquityCapitalView, escAppliedRows, timelineStartYear, timelineEndYear]);

  useEffect(() => {
    if (!isGrossDirectPremiumView) {
      return;
    }

    if (gdpAppliedRows.length === 0) {
      setTimelineStartYear("");
      setTimelineEndYear("");
      return;
    }

    const timelineYears = gdpAppliedRows
      .map((row) => resolveYearSortValue(row.year))
      .filter((year) => Number.isFinite(year) && year !== Number.MAX_SAFE_INTEGER)
      .sort((first, second) => first - second);

    if (timelineYears.length === 0) {
      setTimelineStartYear("");
      setTimelineEndYear("");
      return;
    }

    const minimumYear = String(timelineYears[0]);
    const maximumYear = String(timelineYears[timelineYears.length - 1]);

    if (!timelineStartYear) {
      setTimelineStartYear(minimumYear);
    }

    if (!timelineEndYear) {
      setTimelineEndYear(maximumYear);
    }
  }, [isGrossDirectPremiumView, gdpAppliedRows, timelineStartYear, timelineEndYear]);

  useEffect(() => {
    if (!isPremiumSegmentAnalysisView) {
      return;
    }

    if (segmentAppliedRows.length === 0) {
      setTimelineStartYear("");
      setTimelineEndYear("");
      return;
    }

    const timelineYears = segmentAppliedRows
      .map((row) => resolveYearSortValue(row.year))
      .filter((year) => Number.isFinite(year) && year !== Number.MAX_SAFE_INTEGER)
      .sort((first, second) => first - second);

    if (timelineYears.length === 0) {
      setTimelineStartYear("");
      setTimelineEndYear("");
      return;
    }

    const minimumYear = String(timelineYears[0]);
    const maximumYear = String(timelineYears[timelineYears.length - 1]);

    if (!timelineStartYear) {
      setTimelineStartYear(minimumYear);
    }

    if (!timelineEndYear) {
      setTimelineEndYear(maximumYear);
    }
  }, [isPremiumSegmentAnalysisView, segmentAppliedRows, timelineStartYear, timelineEndYear]);

  useEffect(() => {
    if (!isStatewisePremiumSegmentView) {
      return;
    }

    if (stateSegmentAppliedRows.length === 0) {
      setTimelineStartYear("");
      setTimelineEndYear("");
      return;
    }

    const timelineYears = stateSegmentAppliedRows
      .map((row) => resolveYearSortValue(row.year))
      .filter((year) => Number.isFinite(year) && year !== Number.MAX_SAFE_INTEGER)
      .sort((first, second) => first - second);

    if (timelineYears.length === 0) {
      setTimelineStartYear("");
      setTimelineEndYear("");
      return;
    }

    const minimumYear = String(timelineYears[0]);
    const maximumYear = String(timelineYears[timelineYears.length - 1]);

    if (!timelineStartYear) {
      setTimelineStartYear(minimumYear);
    }

    if (!timelineEndYear) {
      setTimelineEndYear(maximumYear);
    }
  }, [isStatewisePremiumSegmentView, stateSegmentAppliedRows, timelineStartYear, timelineEndYear]);

  useEffect(() => {
    if (!isIssuedPoliciesView) {
      return;
    }

    if (issuedPoliciesAppliedRows.length === 0) {
      setTimelineStartYear("");
      setTimelineEndYear("");
      return;
    }

    const timelineYears = issuedPoliciesAppliedRows
      .map((row) => resolveYearSortValue(row.year))
      .filter((year) => Number.isFinite(year) && year !== Number.MAX_SAFE_INTEGER)
      .sort((first, second) => first - second);

    if (timelineYears.length === 0) {
      setTimelineStartYear("");
      setTimelineEndYear("");
      return;
    }

    const minimumYear = String(timelineYears[0]);
    const maximumYear = String(timelineYears[timelineYears.length - 1]);

    if (!timelineStartYear) {
      setTimelineStartYear(minimumYear);
    }

    if (!timelineEndYear) {
      setTimelineEndYear(maximumYear);
    }
  }, [isIssuedPoliciesView, issuedPoliciesAppliedRows, timelineStartYear, timelineEndYear]);

  useEffect(() => {
    if (!isSolvencyRatioView) {
      return;
    }

    if (solvencyAppliedRows.length === 0) {
      setTimelineStartYear("");
      setTimelineEndYear("");
      return;
    }

    const timelineYears = solvencyAppliedRows
      .map((row) => resolveYearSortValue(row.year))
      .filter((year) => Number.isFinite(year) && year !== Number.MAX_SAFE_INTEGER)
      .sort((first, second) => first - second);

    if (timelineYears.length === 0) {
      setTimelineStartYear("");
      setTimelineEndYear("");
      return;
    }

    const minimumYear = String(timelineYears[0]);
    const maximumYear = String(timelineYears[timelineYears.length - 1]);

    if (!timelineStartYear) {
      setTimelineStartYear(minimumYear);
    }

    if (!timelineEndYear) {
      setTimelineEndYear(maximumYear);
    }
  }, [isSolvencyRatioView, solvencyAppliedRows, timelineStartYear, timelineEndYear]);

  // Timeline year options for Equity Capital
  const escTimelineYearOptions = useMemo(() => {
    const years = escAppliedRows
      .map((row) => resolveYearSortValue(row.year))
      .filter((year) => Number.isFinite(year) && year !== Number.MAX_SAFE_INTEGER)
      .sort((first, second) => first - second);

    return Array.from(new Set(years));
  }, [escAppliedRows]);

  // Visible Equity Capital Rows (filtered by timeline)
  const visibleEscRows = useMemo(() => {
    if (!escAppliedRows.length) {
      return [];
    }

    if (!timelineStartYear || !timelineEndYear) {
      return escAppliedRows;
    }

    const startYear = Number(timelineStartYear);
    const endYear = Number(timelineEndYear);

    return escAppliedRows.filter((row) => {
      const rowYear = resolveYearSortValue(row.year);
      return rowYear >= startYear && rowYear <= endYear;
    });
  }, [escAppliedRows, timelineStartYear, timelineEndYear]);

  const gdpTimelineYearOptions = useMemo(() => {
    const years = gdpAppliedRows
      .map((row) => resolveYearSortValue(row.year))
      .filter((year) => Number.isFinite(year) && year !== Number.MAX_SAFE_INTEGER)
      .sort((first, second) => first - second);

    return Array.from(new Set(years));
  }, [gdpAppliedRows]);

  const visibleGdpRows = useMemo(() => {
    if (!gdpAppliedRows.length) {
      return [];
    }

    if (!timelineStartYear || !timelineEndYear) {
      return gdpAppliedRows;
    }

    const startYear = Number(timelineStartYear);
    const endYear = Number(timelineEndYear);

    return gdpAppliedRows.filter((row) => {
      const rowYear = resolveYearSortValue(row.year);
      return rowYear >= startYear && rowYear <= endYear;
    });
  }, [gdpAppliedRows, timelineStartYear, timelineEndYear]);

  const segmentTimelineYearOptions = useMemo(() => {
    const years = segmentAppliedRows
      .map((row) => resolveYearSortValue(row.year))
      .filter((year) => Number.isFinite(year) && year !== Number.MAX_SAFE_INTEGER)
      .sort((first, second) => first - second);

    return Array.from(new Set(years));
  }, [segmentAppliedRows]);

  const visibleSegmentRows = useMemo(() => {
    if (!segmentAppliedRows.length) {
      return [];
    }

    if (!timelineStartYear || !timelineEndYear) {
      return segmentAppliedRows;
    }

    const startYear = Number(timelineStartYear);
    const endYear = Number(timelineEndYear);

    return segmentAppliedRows.filter((row) => {
      const rowYear = resolveYearSortValue(row.year);
      return rowYear >= startYear && rowYear <= endYear;
    });
  }, [segmentAppliedRows, timelineStartYear, timelineEndYear]);

  const stateSegmentTimelineYearOptions = useMemo(() => {
    const years = stateSegmentAppliedRows
      .map((row) => resolveYearSortValue(row.year))
      .filter((year) => Number.isFinite(year) && year !== Number.MAX_SAFE_INTEGER)
      .sort((first, second) => first - second);

    return Array.from(new Set(years));
  }, [stateSegmentAppliedRows]);

  const visibleStateSegmentRows = useMemo(() => {
    if (!stateSegmentAppliedRows.length) {
      return [];
    }

    if (!timelineStartYear || !timelineEndYear) {
      return stateSegmentAppliedRows;
    }

    const startYear = Number(timelineStartYear);
    const endYear = Number(timelineEndYear);

    return stateSegmentAppliedRows.filter((row) => {
      const rowYear = resolveYearSortValue(row.year);
      return rowYear >= startYear && rowYear <= endYear;
    });
  }, [stateSegmentAppliedRows, timelineStartYear, timelineEndYear]);

  const issuedPoliciesTimelineYearOptions = useMemo(() => {
    const years = issuedPoliciesAppliedRows
      .map((row) => resolveYearSortValue(row.year))
      .filter((year) => Number.isFinite(year) && year !== Number.MAX_SAFE_INTEGER)
      .sort((first, second) => first - second);

    return Array.from(new Set(years));
  }, [issuedPoliciesAppliedRows]);

  const visibleIssuedPoliciesRows = useMemo(() => {
    if (!issuedPoliciesAppliedRows.length) {
      return [];
    }

    if (!timelineStartYear || !timelineEndYear) {
      return issuedPoliciesAppliedRows;
    }

    const startYear = Number(timelineStartYear);
    const endYear = Number(timelineEndYear);

    return issuedPoliciesAppliedRows.filter((row) => {
      const rowYear = resolveYearSortValue(row.year);
      return rowYear >= startYear && rowYear <= endYear;
    });
  }, [issuedPoliciesAppliedRows, timelineStartYear, timelineEndYear]);

  const solvencyTimelineYearOptions = useMemo(() => {
    const years = solvencyAppliedRows
      .map((row) => resolveYearSortValue(row.year))
      .filter((year) => Number.isFinite(year) && year !== Number.MAX_SAFE_INTEGER)
      .sort((first, second) => first - second);

    return Array.from(new Set(years));
  }, [solvencyAppliedRows]);

  const visibleSolvencyRows = useMemo(() => {
    if (!solvencyAppliedRows.length) {
      return [];
    }

    if (!timelineStartYear || !timelineEndYear) {
      return solvencyAppliedRows;
    }

    const startYear = Number(timelineStartYear);
    const endYear = Number(timelineEndYear);

    return solvencyAppliedRows.filter((row) => {
      const rowYear = resolveYearSortValue(row.year);
      return rowYear >= startYear && rowYear <= endYear;
    });
  }, [solvencyAppliedRows, timelineStartYear, timelineEndYear]);

  const filterConfig = useMemo(
    () =>
      isGrossDirectPremiumView
        ? [
            {
              label: "Select Insurer",
              options: gdpInsurerOptions,
              value: selectedGdpInsurer,
              onChange: setSelectedGdpInsurer,
              placeholder: "Select Insurer",
            },
          ]
        : isIssuedPoliciesView
        ? [
            {
              label: "Type of Insurer",
              options: issuedPoliciesInsurerTypeOptions,
              value: selectedIssuedInsurerType,
              onChange: setSelectedIssuedInsurerType,
              placeholder: "Select Type of Insurer",
            },
          ]
        : isSolvencyRatioView
        ? [
            {
              label: "Sector",
              options: solvencySectorOptions,
              value: selectedSolvencySector,
              onChange: setSelectedSolvencySector,
              placeholder: "Select Sector",
            },
            {
              label: "Select Insurer",
              options: solvencyInsurerOptions,
              value: selectedSolvencyInsurer,
              onChange: setSelectedSolvencyInsurer,
              placeholder: "Select Insurer",
            },
          ]
        : isStatewisePremiumSegmentView
        ? [
            {
              label: "Select State",
              options: stateGdpStateOptions,
              value: selectedStateGdpState,
              onChange: setSelectedStateGdpState,
              placeholder: "Select State",
            },
            {
              label: "Select Segment",
              options: stateGdpSegmentOptions,
              value: selectedStateGdpSegment,
              onChange: setSelectedStateGdpSegment,
              placeholder: "Select Segment",
            },
          ]
        : isOperationalAnalysisView
        ? [
            {
              label: "Sector",
              options: operationalSectorOptions,
              value: selectedOperationalSector,
              onChange: setSelectedOperationalSector,
              placeholder: "Select Sector",
            },
            {
              label: "Insurer Name",
              options: operationalInsurerOptions,
              value: selectedOperationalInsurer,
              onChange: setSelectedOperationalInsurer,
              placeholder: "Select Insurer",
            },
            {
              label: "Metric",
              options: operationalMetricOptions,
              value: selectedOperationalMetric,
              onChange: setSelectedOperationalMetric,
              placeholder: "Select Metric",
            },
          ]
        : isPremiumSegmentAnalysisView
        ? [
            {
              label: "Select Insurer",
              options: segmentInsurerOptions,
              value: selectedSegmentInsurer,
              onChange: setSelectedSegmentInsurer,
              placeholder: "Select Insurer",
            },
            {
              label: "Select Segment",
              options: segmentOptions,
              value: selectedSegment,
              onChange: setSelectedSegment,
              placeholder: "Select Segment",
            },
          ]
        : isAumInsurerWiseView
        ? [
            {
              label: "Sector",
              options: aumSectorOptions,
              value: selectedAumSector,
              onChange: setSelectedAumSector,
              placeholder: "Select Sector",
            },
            {
              label: "Select Insurer",
              options: aumInsurerOptions,
              value: selectedAumInsurer,
              onChange: setSelectedAumInsurer,
              placeholder: "Select Insurer",
            },
            {
              label: "Category of Investment",
              options: investmentCategoryOptions,
              value: selectedInvestmentCategory,
              onChange: setSelectedInvestmentCategory,
              placeholder: "Select Category of Investment",
            },
          ]
        : isEquityCapitalView
        ? [
            {
              label: "Select Sector",
              options: escSectorOptions,
              value: selectedEscSector,
              onChange: setSelectedEscSector,
              placeholder: "Select Sector",
            },
            {
              label: "Select Insurer",
              options: escInsurerOptions,
              value: selectedEscInsurer,
              onChange: setSelectedEscInsurer,
              placeholder: "Select Insurer",
            },
          ]
        : [
            {
              label: "Select Insurer",
              options: insurerOptions,
              value: selectedInsurerRegNo,
              onChange: setSelectedInsurerRegNo,
              placeholder: "Select Insurer",
            },
          ],
    [
      isGrossDirectPremiumView,
      gdpInsurerOptions,
      selectedGdpInsurer,
      isIssuedPoliciesView,
      issuedPoliciesInsurerTypeOptions,
      selectedIssuedInsurerType,
      isSolvencyRatioView,
      solvencySectorOptions,
      selectedSolvencySector,
      solvencyInsurerOptions,
      selectedSolvencyInsurer,
      isStatewisePremiumSegmentView,
      stateGdpStateOptions,
      selectedStateGdpState,
      stateGdpSegmentOptions,
      selectedStateGdpSegment,
      isOperationalAnalysisView,
      operationalSectorOptions,
      selectedOperationalSector,
      operationalInsurerOptions,
      selectedOperationalInsurer,
      operationalMetricOptions,
      selectedOperationalMetric,
      isPremiumSegmentAnalysisView,
      segmentInsurerOptions,
      selectedSegmentInsurer,
      segmentOptions,
      selectedSegment,
      isAumInsurerWiseView,
      isEquityCapitalView,
      aumSectorOptions,
      selectedAumSector,
      aumInsurerOptions,
      selectedAumInsurer,
      investmentCategoryOptions,
      selectedInvestmentCategory,
      escSectorOptions,
      selectedEscSector,
      escInsurerOptions,
      selectedEscInsurer,
      insurerOptions,
      selectedInsurerRegNo,
    ]
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

  const visualizationData = useMemo(() => {
    if (
      !isAumInsurerWiseView &&
      !isGrossDirectPremiumView &&
      !isPremiumSegmentAnalysisView &&
      !isStatewisePremiumSegmentView &&
      !isSolvencyRatioView &&
      !isIssuedPoliciesView &&
      !isOperationalAnalysisView
    ) {
      return [];
    }

    const rows = isGrossDirectPremiumView
      ? visibleGdpRows
      : isOperationalAnalysisView
      ? visibleOperationalRows
      : isSolvencyRatioView
      ? visibleSolvencyRows
      : isIssuedPoliciesView
      ? visibleIssuedPoliciesRows
      : isStatewisePremiumSegmentView
      ? visibleStateSegmentRows
      : isPremiumSegmentAnalysisView
      ? visibleSegmentRows
      : visibleAumRows;

    return rows
      .map((row) => ({ year: row.year, value: Number(row.value || 0) }))
      .filter((row) => row.year && Number.isFinite(row.value));
  }, [
    isAumInsurerWiseView,
    isGrossDirectPremiumView,
    isOperationalAnalysisView,
    isSolvencyRatioView,
    isIssuedPoliciesView,
    isStatewisePremiumSegmentView,
    isPremiumSegmentAnalysisView,
    visibleAumRows,
    visibleGdpRows,
    visibleOperationalRows,
    visibleSolvencyRows,
    visibleIssuedPoliciesRows,
    visibleStateSegmentRows,
    visibleSegmentRows,
  ]);

  // Equity Capital Visualization Data
  const escVisualizationData = useMemo(() => {
    if (!isEquityCapitalView) {
      return [];
    }

    return visibleEscRows
      .map((row) => ({ year: row.year, value: Number(row.value || 0) }))
      .filter((row) => row.year && Number.isFinite(row.value));
  }, [isEquityCapitalView, visibleEscRows]);

  // Combined visualization data for chart rendering
  const activeVisualizationData = useMemo(() => {
    return isAumInsurerWiseView || isGrossDirectPremiumView || isPremiumSegmentAnalysisView || isStatewisePremiumSegmentView || isIssuedPoliciesView || isOperationalAnalysisView
      ? visualizationData
      : escVisualizationData;
  }, [
    isAumInsurerWiseView,
    isGrossDirectPremiumView,
    isOperationalAnalysisView,
    isPremiumSegmentAnalysisView,
    isStatewisePremiumSegmentView,
    isIssuedPoliciesView,
    visualizationData,
    escVisualizationData,
  ]);

  const chartTitle = useMemo(() => {
    if (isAumInsurerWiseView) {
      return [
        selectedSubModuleTitle,
        appliedAumSector,
        appliedAumInsurer,
        formatInvestmentCategoryLabel(appliedInvestmentCategory),
      ]
        .filter(Boolean)
        .join(" : ");
    }

    if (isGrossDirectPremiumView) {
      return [selectedSubModuleTitle, appliedGdpInsurer].filter(Boolean).join(" : ");
    }

    if (isOperationalAnalysisView) {
      return [
        selectedSubModuleTitle,
        appliedOperationalSector,
        appliedOperationalInsurer,
        appliedOperationalMetric,
      ]
        .filter(Boolean)
        .join(" : ");
    }

    if (isSolvencyRatioView) {
      return [selectedSubModuleTitle, appliedSolvencySector, appliedSolvencyInsurer]
        .filter(Boolean)
        .join(" : ");
    }

    if (isIssuedPoliciesView) {
      return [selectedSubModuleTitle, appliedIssuedInsurerType].filter(Boolean).join(" : ");
    }

    if (isStatewisePremiumSegmentView) {
      return [selectedSubModuleTitle, appliedStateGdpState, appliedStateGdpSegment]
        .filter(Boolean)
        .join(" : ");
    }

    if (isPremiumSegmentAnalysisView) {
      return [selectedSubModuleTitle, appliedSegmentInsurer, appliedSegment]
        .filter(Boolean)
        .join(" : ");
    }

    if (isEquityCapitalView) {
      return [
        selectedSubModuleTitle,
        appliedEscSector,
        appliedEscInsurer,
      ]
        .filter(Boolean)
        .join(" : ");
    }

    return selectedSubModuleTitle;
  }, [
    isAumInsurerWiseView,
    isEquityCapitalView,
    selectedSubModuleTitle,
    appliedAumSector,
    appliedAumInsurer,
    appliedInvestmentCategory,
    isGrossDirectPremiumView,
    appliedGdpInsurer,
    isOperationalAnalysisView,
    appliedOperationalSector,
    appliedOperationalInsurer,
    appliedOperationalMetric,
    isSolvencyRatioView,
    appliedSolvencySector,
    appliedSolvencyInsurer,
    isIssuedPoliciesView,
    appliedIssuedInsurerType,
    isStatewisePremiumSegmentView,
    appliedStateGdpState,
    appliedStateGdpSegment,
    isPremiumSegmentAnalysisView,
    appliedSegmentInsurer,
    appliedSegment,
    appliedEscSector,
    appliedEscInsurer,
  ]);

  const dataLabel = useMemo(() => {
    if (isAumInsurerWiseView) {
      return "AUM";
    }
    if (isGrossDirectPremiumView) {
      return "Gross Direct Premium";
    }
    if (isOperationalAnalysisView) {
      return appliedOperationalMetric || "Underwriting Metric";
    }
    if (isSolvencyRatioView) {
      return "Solvency Ratio";
    }
    if (isIssuedPoliciesView) {
      return "No. of Policies (Lakhs)";
    }
    if (isStatewisePremiumSegmentView) {
      return "GDP";
    }
    if (isPremiumSegmentAnalysisView) {
      return "Segment GDP";
    }
    if (isEquityCapitalView) {
      return "Equity Share Capital";
    }
    return "Value";
  }, [
    isAumInsurerWiseView,
    isGrossDirectPremiumView,
    isOperationalAnalysisView,
    appliedOperationalMetric,
    isSolvencyRatioView,
    isIssuedPoliciesView,
    isStatewisePremiumSegmentView,
    isPremiumSegmentAnalysisView,
    isEquityCapitalView,
  ]);

  const plotTraces = useMemo(() => {
    const xValues = activeVisualizationData.map((item) => String(item.year));
    const yValues = activeVisualizationData.map((item) => Number(item.value || 0));

    if (visualizationType === "bar") {
      return [
        {
          type: "bar",
          name: dataLabel,
          x: xValues,
          y: yValues,
          marker: {
            color: "rgba(14, 165, 164, 0.88)",
            line: { color: "rgba(15, 118, 110, 0.95)", width: 1 },
          },
          hovertemplate: `%{x}<br>${dataLabel}: %{y:,}<extra></extra>`,
        },
      ];
    }

    if (visualizationType === "area") {
      return [
        {
          type: "scatter",
          mode: "lines+markers",
          name: dataLabel,
          x: xValues,
          y: yValues,
          line: { color: "#0ea5a4", width: 3 },
          marker: { color: "#0ea5a4", size: 8 },
          fill: "tozeroy",
          fillcolor: "rgba(14, 165, 164, 0.14)",
          hovertemplate: `%{x}<br>${dataLabel}: %{y:,}<extra></extra>`,
        },
      ];
    }

    return [
      {
        type: "scatter",
        mode: "lines+markers",
        name: dataLabel,
        x: xValues,
        y: yValues,
        line: { color: "#0ea5a4", width: 3 },
        marker: { color: "#0ea5a4", size: 8 },
        hovertemplate: `%{x}<br>${dataLabel}: %{y:,}<extra></extra>`,
      },
    ];
  }, [activeVisualizationData, visualizationType, dataLabel]);

  const yaxisTitle = useMemo(() => {
    if (isAumInsurerWiseView) {
      return "Assets under Management in Cr";
    }
    if (isGrossDirectPremiumView) {
      return "Gross Direct Premium in Cr";
    }
    if (isOperationalAnalysisView) {
      return `${appliedOperationalMetric || "Underwriting Metric"} in Cr`;
    }
    if (isSolvencyRatioView) {
      return "Solvency Ratio";
    }
    if (isIssuedPoliciesView) {
      return "No. of Policies (Lakhs)";
    }
    if (isStatewisePremiumSegmentView) {
      return "GDP in Cr";
    }
    if (isPremiumSegmentAnalysisView) {
      return "Segment GDP in Cr";
    }
    if (isEquityCapitalView) {
      return "Equity Share Capital in Cr";
    }
    return "Value";
  }, [
    isAumInsurerWiseView,
    isGrossDirectPremiumView,
    isOperationalAnalysisView,
    appliedOperationalMetric,
    isSolvencyRatioView,
    isIssuedPoliciesView,
    isStatewisePremiumSegmentView,
    isPremiumSegmentAnalysisView,
    isEquityCapitalView,
  ]);

  const plotLayout = useMemo(
    () => ({
      autosize: true,
      paper_bgcolor: "rgba(0, 0, 0, 0)",
      plot_bgcolor: "rgba(0, 0, 0, 0)",
      margin: { l: 60, r: 18, t: 82, b: 52 },
      title: {
        text: wrapChartTitle(chartTitle).text,
        x: 0.5,
        xanchor: "center",
        y: 0.96,
        yanchor: "top",
        automargin: true,
        font: {
          size: 13,
          color: "#0f172a",
          family: "Segoe UI, Arial, sans-serif",
        },
      },
      xaxis: {
        title: {
          text: "Year",
          font: { size: 12, color: "#475569" },
        },
        showgrid: true,
        gridcolor: "rgba(148, 163, 184, 0.16)",
        zeroline: false,
        tickfont: { size: 12, color: "#334155" },
      },
      yaxis: {
        title: { text: yaxisTitle, font: { size: 12, color: "#475569" } },
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
    }),
    [chartTitle, yaxisTitle]
  );

  const plotConfig = useMemo(
    () => ({
      responsive: true,
      displaylogo: false,
      toImageButtonOptions: {
        format: "png",
        filename: `${buildExportFileName(selectedSubModuleTitle, [
          { label: "Select State", value: appliedStateGdpState },
          { label: "Select Segment", value: appliedStateGdpSegment },
          { label: "Select Insurer", value: appliedSegmentInsurer },
          { label: "Select Segment", value: appliedSegment },
          { label: "Select Insurer", value: appliedGdpInsurer },
          { label: "Sector", value: appliedOperationalSector },
          { label: "Insurer Name", value: appliedOperationalInsurer },
          { label: "Metric", value: appliedOperationalMetric },
          { label: "Sector", value: appliedSolvencySector },
          { label: "Select Insurer", value: appliedSolvencyInsurer },
          { label: "Type of Insurer", value: appliedIssuedInsurerType },
          { label: "Sector", value: appliedAumSector },
          { label: "Select Insurer", value: appliedAumInsurer },
          { label: "Category", value: appliedInvestmentCategory },
        ])}_chart`,
        width: 1280,
        height: 720,
        scale: 2,
      },
      modeBarButtonsToRemove: ["select2d", "lasso2d", "toggleSpikelines", "autoScale2d"],
    }),
    [
      selectedSubModuleTitle,
      appliedStateGdpState,
      appliedStateGdpSegment,
      appliedSegmentInsurer,
      appliedSegment,
      appliedGdpInsurer,
      appliedOperationalSector,
      appliedOperationalInsurer,
      appliedOperationalMetric,
      appliedSolvencySector,
      appliedSolvencyInsurer,
      appliedIssuedInsurerType,
      appliedAumSector,
      appliedAumInsurer,
      appliedInvestmentCategory,
    ]
  );

  const handleExportImage = async () => {
    if (!chartGraphDiv || isExportingImage) {
      return;
    }

    setIsExportingImage(true);
    try {
      await Plotly.downloadImage(chartGraphDiv, {
        format: "png",
        filename: `${slugifyValue(selectedSubModuleTitle)}_chart`,
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

  const handleResetFilters = () => {
    if (isOperationalAnalysisView) {
      setSelectedOperationalSector("");
      setSelectedOperationalInsurer("");
      setSelectedOperationalMetric("");
      setAppliedOperationalSector("");
      setAppliedOperationalInsurer("");
      setAppliedOperationalMetric("");
      setShowTimelinePicker(false);
      setTimelineStartYear("");
      setTimelineEndYear("");
      setOperationalError("");
      return;
    }

    if (isStatewisePremiumSegmentView) {
      setSelectedStateGdpState("");
      setSelectedStateGdpSegment("");
      setAppliedStateGdpState("");
      setAppliedStateGdpSegment("");
      setShowTimelinePicker(false);
      setTimelineStartYear("");
      setTimelineEndYear("");
      setStateSegmentGdpError("");
      return;
    }

    if (isIssuedPoliciesView) {
      setSelectedIssuedInsurerType("");
      setAppliedIssuedInsurerType("");
      setShowTimelinePicker(false);
      setTimelineStartYear("");
      setTimelineEndYear("");
      setIssuedPoliciesError("");
      return;
    }

    if (isSolvencyRatioView) {
      setSelectedSolvencySector("");
      setSelectedSolvencyInsurer("");
      setAppliedSolvencySector("");
      setAppliedSolvencyInsurer("");
      setShowTimelinePicker(false);
      setTimelineStartYear("");
      setTimelineEndYear("");
      setSolvencyError("");
      return;
    }

    if (isPremiumSegmentAnalysisView) {
      setSelectedSegmentInsurer("");
      setSelectedSegment("");
      setAppliedSegmentInsurer("");
      setAppliedSegment("");
      setShowTimelinePicker(false);
      setTimelineStartYear("");
      setTimelineEndYear("");
      setSegmentGdpError("");
      return;
    }

    if (isGrossDirectPremiumView) {
      setSelectedGdpInsurer("");
      setAppliedGdpInsurer("");
      setShowTimelinePicker(false);
      setTimelineStartYear("");
      setTimelineEndYear("");
      setGrossDirectPremiumError("");
      return;
    }

    if (isAumInsurerWiseView) {
      setSelectedAumSector("");
      setSelectedAumInsurer("");
      setSelectedInvestmentCategory("");
      setAppliedAumSector("");
      setAppliedAumInsurer("");
      setAppliedInvestmentCategory("");
      setShowTimelinePicker(false);
      setTimelineStartYear("");
      setTimelineEndYear("");
      setAumError("");
      return;
    }

    if (isEquityCapitalView) {
      setSelectedEscSector("");
      setSelectedEscInsurer("");
      setAppliedEscSector("");
      setAppliedEscInsurer("");
      setShowTimelinePicker(false);
      setTimelineStartYear("");
      setTimelineEndYear("");
      setEquityCapitalError("");
      return;
    }

    setSelectedInsurerRegNo("");
    setSelectedInsurerDetails(null);
    setDetailsError("");
  };

  const handleApplyFilters = () => {
    if (isStatewisePremiumSegmentView) {
      setAppliedStateGdpState(selectedStateGdpState);
      setAppliedStateGdpSegment(selectedStateGdpSegment);
      setShowTimelinePicker(false);
      setTimelineStartYear("");
      setTimelineEndYear("");
      return;
    }

    if (isOperationalAnalysisView) {
      setAppliedOperationalSector(selectedOperationalSector);
      setAppliedOperationalInsurer(selectedOperationalInsurer);
      setAppliedOperationalMetric(selectedOperationalMetric);
      setShowTimelinePicker(false);
      setTimelineStartYear("");
      setTimelineEndYear("");
      return;
    }
    if (isPremiumSegmentAnalysisView) {
      setAppliedSegmentInsurer(selectedSegmentInsurer);
      setAppliedSegment(selectedSegment);
      setShowTimelinePicker(false);
      setTimelineStartYear("");
      setTimelineEndYear("");
      return;
    }

    if (isGrossDirectPremiumView) {
      setAppliedGdpInsurer(selectedGdpInsurer);
      setShowTimelinePicker(false);
      setTimelineStartYear("");
      setTimelineEndYear("");
      return;
    }

    if (isIssuedPoliciesView) {
      setAppliedIssuedInsurerType(selectedIssuedInsurerType);
      setShowTimelinePicker(false);
      setTimelineStartYear("");
      setTimelineEndYear("");
      return;
    }

    if (isSolvencyRatioView) {
      setAppliedSolvencySector(selectedSolvencySector);
      setAppliedSolvencyInsurer(selectedSolvencyInsurer);
      setShowTimelinePicker(false);
      setTimelineStartYear("");
      setTimelineEndYear("");
      return;
    }

    if (isAumInsurerWiseView) {
      setAppliedAumSector(selectedAumSector);
      setAppliedAumInsurer(selectedAumInsurer);
      setAppliedInvestmentCategory(selectedInvestmentCategory);
      setShowTimelinePicker(false);
      setTimelineStartYear("");
      setTimelineEndYear("");
      return;
    }

    if (isEquityCapitalView) {
      setAppliedEscSector(selectedEscSector);
      setAppliedEscInsurer(selectedEscInsurer);
      setShowTimelinePicker(false);
      setTimelineStartYear("");
      setTimelineEndYear("");
      return;
    }
  };

  const handleExportData = async () => {
    if (isStatewisePremiumSegmentView) {
      if (!appliedStateGdpState || !appliedStateGdpSegment || visibleStateSegmentRows.length === 0) {
        return;
      }

      const activeFilters = [
        { label: "Select State", value: appliedStateGdpState },
        { label: "Select Segment", value: appliedStateGdpSegment },
      ];

      const dataRows = visibleStateSegmentRows.map((row) => [
        row.year,
        Number(row.value || 0).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      ]);

      const exportRows = [
        ["Sub Module", selectedSubModuleTitle],
        [],
        ["Applied Filters", "Value"],
        ...activeFilters.map((filter) => [filter.label, formatFieldValue(filter.value)]),
        [],
        ["Year", "GDP (Rs. Crore)"],
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
      return;
    }

    if (isPremiumSegmentAnalysisView) {
      if (!appliedSegmentInsurer || !appliedSegment || visibleSegmentRows.length === 0) {
        return;
      }

      const activeFilters = [
        { label: "Select Insurer", value: appliedSegmentInsurer },
        { label: "Select Segment", value: appliedSegment },
      ];

      const dataRows = visibleSegmentRows.map((row) => [
        row.year,
        Number(row.value || 0).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      ]);

      const exportRows = [
        ["Sub Module", selectedSubModuleTitle],
        [],
        ["Applied Filters", "Value"],
        ...activeFilters.map((filter) => [filter.label, formatFieldValue(filter.value)]),
        [],
        ["Year", "Segment GDP (Rs. Crore)"],
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
      return;
    }

    if (isGrossDirectPremiumView) {
      if (!appliedGdpInsurer || visibleGdpRows.length === 0) {
        return;
      }

      const activeFilters = [{ label: "Select Insurer", value: appliedGdpInsurer }];

      const dataRows = visibleGdpRows.map((row) => [
        row.year,
        Number(row.value || 0).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      ]);

      const exportRows = [
        ["Sub Module", selectedSubModuleTitle],
        [],
        ["Applied Filters", "Value"],
        ...activeFilters.map((filter) => [filter.label, formatFieldValue(filter.value)]),
        [],
        ["Year", "Gross Direct Premium (Rs. Crore)"],
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
      return;
    }

    if (isIssuedPoliciesView) {
      if (!appliedIssuedInsurerType || visibleIssuedPoliciesRows.length === 0) {
        return;
      }

      const activeFilters = [{ label: "Type of Insurer", value: appliedIssuedInsurerType }];

      const dataRows = visibleIssuedPoliciesRows.map((row) => [
        row.year,
        Number(row.value || 0).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      ]);

      const exportRows = [
        ["Sub Module", selectedSubModuleTitle],
        [],
        ["Applied Filters", "Value"],
        ...activeFilters.map((filter) => [filter.label, formatFieldValue(filter.value)]),
        [],
        ["Year", "No. of Policies (Lakhs)"],
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
      return;
    }

    if (isSolvencyRatioView) {
      if (!appliedSolvencySector || !appliedSolvencyInsurer || visibleSolvencyRows.length === 0) {
        return;
      }

      const activeFilters = [
        { label: "Sector", value: appliedSolvencySector },
        { label: "Select Insurer", value: appliedSolvencyInsurer },
      ];

      const dataRows = visibleSolvencyRows.map((row) => [
        row.year,
        Number(row.value || 0).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      ]);

      const exportRows = [
        ["Sub Module", selectedSubModuleTitle],
        [],
        ["Applied Filters", "Value"],
        ...activeFilters.map((filter) => [filter.label, formatFieldValue(filter.value)]),
        [],
        ["Year", "Solvency Ratio"],
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
      return;
    }

    if (isOperationalAnalysisView) {
      if (
        !appliedOperationalSector ||
        !appliedOperationalInsurer ||
        !appliedOperationalMetric ||
        visibleOperationalRows.length === 0
      ) {
        return;
      }

      const activeFilters = [
        { label: "Sector", value: appliedOperationalSector },
        { label: "Insurer Name", value: appliedOperationalInsurer },
        {
          label: "Metric",
          value: operationalMetricFilterLabelMap[appliedOperationalMetric] || appliedOperationalMetric,
        },
      ];

      const dataRows = visibleOperationalRows.map((row) => [
        row.year,
        Number(row.value || 0).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      ]);

      const exportRows = [
        ["Sub Module", selectedSubModuleTitle],
        [],
        ["Applied Filters", "Value"],
        ...activeFilters.map((filter) => [filter.label, formatFieldValue(filter.value)]),
        [],
        ["Year", `${operationalMetricPanelLabelMap[appliedOperationalMetric] || appliedOperationalMetric} (₹ Cr)`],
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
      return;
    }

    if (isAumInsurerWiseView) {
      if (!appliedAumInsurer || !appliedInvestmentCategory || visibleAumRows.length === 0) {
        return;
      }

      const activeFilters = [
        { label: "Sector", value: appliedAumSector },
        { label: "Select Insurer", value: appliedAumInsurer },
        { label: "Category of Investment", value: appliedInvestmentCategory },
      ];

      const dataRows = visibleAumRows.map((row) => [
        row.year,
        Number(row.value || 0).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      ]);

      const exportRows = [
        ["Sub Module", selectedSubModuleTitle],
        [],
        ["Applied Filters", "Value"],
        ...activeFilters.map((filter) => [filter.label, formatFieldValue(filter.value)]),
        [],
        ["Year", "AUM"],
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
      return;
    }

    if (isEquityCapitalView) {
      if (!appliedEscInsurer || visibleEscRows.length === 0) {
        return;
      }

      const activeFilters = [
        { label: "Select Sector", value: appliedEscSector },
        { label: "Select Insurer", value: appliedEscInsurer },
      ];

      const dataRows = visibleEscRows.map((row) => [
        row.year,
        Number(row.value || 0).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      ]);

      const exportRows = [
        ["Sub Module", selectedSubModuleTitle],
        [],
        ["Applied Filters", "Value"],
        ...activeFilters.map((filter) => [filter.label, formatFieldValue(filter.value)]),
        [],
        ["Year", "Equity Share Capital (₹ Crore)"],
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
      return;
    }

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

  const getTabAccent = (tabId) => {
    const tabAccents = {
      "market-overview": "#0ea5a4",
      "insurer-performance": "#0284c7",
      "claims-risk": "#f97316",
      financials: "#6366f1",
      distribution: "#14b8a6",
      grievances: "#ef4444",
    };
    return tabAccents[tabId] || "#0ea5a4";
  };

  return (
    <div className="life-insurance-viewport general-theme">
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
                placeholder={filter.placeholder}
              />
            ))}
            {isAumInsurerWiseView && (
              <button
                type="button"
                className="data-export-btn"
                onClick={handleApplyFilters}
                disabled={!selectedAumSector || !selectedAumInsurer || !selectedInvestmentCategory}
                title="Apply Filters"
              >
                Apply Filters
              </button>
            )}
            {isGrossDirectPremiumView && (
              <button
                type="button"
                className="data-export-btn"
                onClick={handleApplyFilters}
                disabled={!selectedGdpInsurer}
                title="Apply Filters"
              >
                Apply Filters
              </button>
            )}
            {isIssuedPoliciesView && (
              <button
                type="button"
                className="data-export-btn"
                onClick={handleApplyFilters}
                disabled={!selectedIssuedInsurerType}
                title="Apply Filters"
              >
                Apply Filters
              </button>
            )}
            {isStatewisePremiumSegmentView && (
              <button
                type="button"
                className="data-export-btn"
                onClick={handleApplyFilters}
                disabled={!selectedStateGdpState || !selectedStateGdpSegment}
                title="Apply Filters"
              >
                Apply Filters
              </button>
            )}
            {isSolvencyRatioView && (
              <button
                type="button"
                className="data-export-btn"
                onClick={handleApplyFilters}
                disabled={!selectedSolvencySector || !selectedSolvencyInsurer}
                title="Apply Filters"
              >
                Apply Filters
              </button>
            )}
            {isPremiumSegmentAnalysisView && (
              <button
                type="button"
                className="data-export-btn"
                onClick={handleApplyFilters}
                disabled={!selectedSegmentInsurer || !selectedSegment}
                title="Apply Filters"
              >
                Apply Filters
              </button>
            )}
            {isOperationalAnalysisView && (
              <button
                type="button"
                className="data-export-btn"
                onClick={handleApplyFilters}
                disabled={
                  !selectedOperationalSector ||
                  !selectedOperationalInsurer ||
                  !selectedOperationalMetric
                }
                title="Apply Filters"
              >
                Apply Filters
              </button>
            )}
            {isEquityCapitalView && (
              <button
                type="button"
                className="data-export-btn"
                onClick={handleApplyFilters}
                disabled={!selectedEscSector || !selectedEscInsurer}
                title="Apply Filters"
              >
                Apply Filters
              </button>
            )}
            {insurersLoading && !isAumInsurerWiseView && !isEquityCapitalView && !isGrossDirectPremiumView && !isIssuedPoliciesView && !isPremiumSegmentAnalysisView && !isStatewisePremiumSegmentView && (
              <p className="panel-placeholder">Loading insurers...</p>
            )}
            {insurersError && !insurersLoading && !isAumInsurerWiseView && !isEquityCapitalView && !isGrossDirectPremiumView && !isIssuedPoliciesView && !isPremiumSegmentAnalysisView && !isStatewisePremiumSegmentView && (
              <p className="panel-placeholder">{insurersError}</p>
            )}
            {aumLoading && isAumInsurerWiseView && (
              <p className="panel-placeholder">Loading filters...</p>
            )}
            {aumError && !aumLoading && isAumInsurerWiseView && (
              <p className="panel-placeholder">{aumError}</p>
            )}
            {grossDirectPremiumLoading && isGrossDirectPremiumView && (
              <p className="panel-placeholder">Loading filters...</p>
            )}
            {grossDirectPremiumError && !grossDirectPremiumLoading && isGrossDirectPremiumView && (
              <p className="panel-placeholder">{grossDirectPremiumError}</p>
            )}
            {issuedPoliciesLoading && isIssuedPoliciesView && (
              <p className="panel-placeholder">Loading filters...</p>
            )}
            {issuedPoliciesError && !issuedPoliciesLoading && isIssuedPoliciesView && (
              <p className="panel-placeholder">{issuedPoliciesError}</p>
            )}
            {segmentGdpLoading && isPremiumSegmentAnalysisView && (
              <p className="panel-placeholder">Loading filters...</p>
            )}
            {segmentGdpError && !segmentGdpLoading && isPremiumSegmentAnalysisView && (
              <p className="panel-placeholder">{segmentGdpError}</p>
            )}
            {stateSegmentGdpLoading && isStatewisePremiumSegmentView && (
              <p className="panel-placeholder">Loading filters...</p>
            )}
            {stateSegmentGdpError && !stateSegmentGdpLoading && isStatewisePremiumSegmentView && (
              <p className="panel-placeholder">{stateSegmentGdpError}</p>
            )}
            {solvencyLoading && isSolvencyRatioView && (
              <p className="panel-placeholder">Loading filters...</p>
            )}
            {solvencyError && !solvencyLoading && isSolvencyRatioView && (
              <p className="panel-placeholder">{solvencyError}</p>
            )}
            {operationalLoading && isOperationalAnalysisView && (
              <p className="panel-placeholder">Loading filters...</p>
            )}
            {operationalError && !operationalLoading && isOperationalAnalysisView && (
              <p className="panel-placeholder">{operationalError}</p>
            )}
            {equityCapitalLoading && isEquityCapitalView && (
              <p className="panel-placeholder">Loading filters...</p>
            )}
            {equityCapitalError && !equityCapitalLoading && isEquityCapitalView && (
              <p className="panel-placeholder">{equityCapitalError}</p>
            )}
          </div>
        </div>

        <div className="life-data-panel card">
          <div className="panel-header">
            <div className="panel-icon-badge">
              <BarChart3 size={14} strokeWidth={2} />
            </div>
            <h3 className="panel-title section-title">Data Panel</h3>
            {isAumInsurerWiseView && (
              <button
                type="button"
                className="data-export-btn"
                onClick={() => setShowTimelinePicker((previous) => !previous)}
                title="Select Timeline"
                disabled={visibleAumRows.length === 0}
              >
                Select Timeline
              </button>
            )}
            {isGrossDirectPremiumView && (
              <button
                type="button"
                className="data-export-btn"
                onClick={() => setShowTimelinePicker((previous) => !previous)}
                title="Select Timeline"
                disabled={gdpAppliedRows.length === 0}
              >
                Select Timeline
              </button>
            )}
            {isIssuedPoliciesView && (
              <button
                type="button"
                className="data-export-btn"
                onClick={() => setShowTimelinePicker((previous) => !previous)}
                title="Select Timeline"
                disabled={issuedPoliciesAppliedRows.length === 0}
              >
                Select Timeline
              </button>
            )}
            {isSolvencyRatioView && (
              <button
                type="button"
                className="data-export-btn"
                onClick={() => setShowTimelinePicker((previous) => !previous)}
                title="Select Timeline"
                disabled={solvencyAppliedRows.length === 0}
              >
                Select Timeline
              </button>
            )}
            {isPremiumSegmentAnalysisView && (
              <button
                type="button"
                className="data-export-btn"
                onClick={() => setShowTimelinePicker((previous) => !previous)}
                title="Select Timeline"
                disabled={segmentAppliedRows.length === 0}
              >
                Select Timeline
              </button>
            )}
            {isStatewisePremiumSegmentView && (
              <button
                type="button"
                className="data-export-btn"
                onClick={() => setShowTimelinePicker((previous) => !previous)}
                title="Select Timeline"
                disabled={stateSegmentAppliedRows.length === 0}
              >
                Select Timeline
              </button>
            )}
            {isOperationalAnalysisView && (
              <button
                type="button"
                className="data-export-btn"
                onClick={() => setShowTimelinePicker((previous) => !previous)}
                title="Select Timeline"
                disabled={operationalAppliedRows.length === 0}
              >
                Select Timeline
              </button>
            )}
            {isEquityCapitalView && (
              <button
                type="button"
                className="data-export-btn"
                onClick={() => setShowTimelinePicker((previous) => !previous)}
                title="Select Timeline"
                disabled={escAppliedRows.length === 0}
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
          <div className={`panel-body ${isInsurerDetailsView ? "panel-body-details" : ""}`}>
            {isInsurerDetailsView ? (
              detailsLoading ? (
                <PanelState variant="loading" message="Loading insurer details..." />
              ) : detailsError ? (
                <PanelState variant="error" message={detailsError} />
              ) : !selectedInsurerRegNo ? (
                <PanelState
                  variant="empty"
                  message="Select an insurer to view details."
                  hint="Results will appear here after selecting an insurer."
                />
              ) : insurerDetailRows.length > 0 ? (
                <div className="data-fields-list">
                  {insurerDetailRows.map((row) => (
                    <DataRow key={row.label} label={row.label} value={row.value} />
                  ))}
                </div>
              ) : (
                <PanelState
                  variant="empty"
                  message="Select an insurer to view details."
                  hint="Results will appear here after selecting an insurer."
                />
              )
            ) : isAumInsurerWiseView ? (
              aumLoading ? (
                <PanelState variant="loading" message="Loading data..." />
              ) : aumError ? (
                <PanelState variant="error" message={aumError} />
              ) : !appliedAumSector || !appliedAumInsurer || !appliedInvestmentCategory ? (
                <PanelState
                  variant="empty"
                  message="Select filters and click Apply Filters to view data."
                  hint="You can adjust filters and re-apply to refresh results."
                />
              ) : visibleAumRows.length > 0 ? (
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
                        <tr>
                          <th className="col-year">Year</th>
                          <th className="col-value">
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                justifyContent: "center",
                              }}
                            >
                              <IndianRupeeIcon size={14} strokeWidth={2.2} />
                              Assets under Management in Cr
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleAumRows.map((row) => (
                          <tr key={row.year}>
                            <td className="col-year">
                              <span className="year-badge">{row.year}</span>
                            </td>
                            <td className="col-value">
                              <span className="value-amount">
                                {Number(row.value || 0).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
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
                  message="No data found for selected filters."
                  hint="You can adjust filters and re-apply to refresh results."
                />
              )
            ) : isGrossDirectPremiumView ? (
              grossDirectPremiumLoading ? (
                <PanelState variant="loading" message="Loading data..." />
              ) : grossDirectPremiumError ? (
                <PanelState variant="error" message={grossDirectPremiumError} />
              ) : !appliedGdpInsurer ? (
                <PanelState
                  variant="empty"
                  message="Select insurer and click Apply Filters to view data."
                  hint="You can adjust filters and re-apply to refresh results."
                />
              ) : visibleGdpRows.length > 0 ? (
                <>
                  {showTimelinePicker && gdpTimelineYearOptions.length > 0 && (
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
                          {gdpTimelineYearOptions.map((year) => (
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
                          {gdpTimelineYearOptions.map((year) => (
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
                        <tr>
                          <th className="col-year">Year</th>
                          <th className="col-value">
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
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleGdpRows.map((row) => (
                          <tr key={row.year}>
                            <td className="col-year">
                              <span className="year-badge">{row.year}</span>
                            </td>
                            <td className="col-value">
                              <span className="value-amount">
                                {Number(row.value || 0).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
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
                  message="No data found for selected insurer."
                  hint="You can adjust filters and re-apply to refresh results."
                />
              )
            ) : isIssuedPoliciesView ? (
              issuedPoliciesLoading ? (
                <PanelState variant="loading" message="Loading data..." />
              ) : issuedPoliciesError ? (
                <PanelState variant="error" message={issuedPoliciesError} />
              ) : !appliedIssuedInsurerType ? (
                <PanelState
                  variant="empty"
                  message="Select Type of Insurer and click Apply Filters to view data."
                  hint="You can adjust filters and re-apply to refresh results."
                />
              ) : visibleIssuedPoliciesRows.length > 0 ? (
                <>
                  {showTimelinePicker && issuedPoliciesTimelineYearOptions.length > 0 && (
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
                          {issuedPoliciesTimelineYearOptions.map((year) => (
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
                          {issuedPoliciesTimelineYearOptions.map((year) => (
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
                        <tr>
                          <th className="col-year">Year</th>
                          <th className="col-value">No. of Policies (Lakhs)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleIssuedPoliciesRows.map((row) => (
                          <tr key={row.year}>
                            <td className="col-year">
                              <span className="year-badge">{row.year}</span>
                            </td>
                            <td className="col-value">
                              <span className="value-amount">
                                {Number(row.value || 0).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
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
                  message="No data found for selected Type of Insurer."
                  hint="You can adjust filters and re-apply to refresh results."
                />
              )
            ) : isSolvencyRatioView ? (
              solvencyLoading ? (
                <PanelState variant="loading" message="Loading data..." />
              ) : solvencyError ? (
                <PanelState variant="error" message={solvencyError} />
              ) : !appliedSolvencySector || !appliedSolvencyInsurer ? (
                <PanelState
                  variant="empty"
                  message="Select filters and click Apply Filters to view data."
                  hint="Insurer options are shown based on selected sector."
                />
              ) : visibleSolvencyRows.length > 0 ? (
                <>
                  {showTimelinePicker && solvencyTimelineYearOptions.length > 0 && (
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
                          {solvencyTimelineYearOptions.map((year) => (
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
                          {solvencyTimelineYearOptions.map((year) => (
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
                        <tr>
                          <th className="col-year">Date</th>
                          <th className="col-value">Solvency Ratio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleSolvencyRows.map((row) => (
                          <tr key={row.year}>
                            <td className="col-year">
                              <span className="year-badge">{row.year}</span>
                            </td>
                            <td className="col-value">
                              <span className="value-amount">
                                {Number(row.value || 0).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
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
                  message="No data found for selected filters."
                  hint="You can change sector or insurer to refresh results."
                />
              )
            ) : isPremiumSegmentAnalysisView ? (
              segmentGdpLoading ? (
                <PanelState variant="loading" message="Loading data..." />
              ) : segmentGdpError ? (
                <PanelState variant="error" message={segmentGdpError} />
              ) : !appliedSegmentInsurer || !appliedSegment ? (
                <PanelState
                  variant="empty"
                  message="Select filters and click Apply Filters to view data."
                  hint="You can adjust filters and re-apply to refresh results."
                />
              ) : visibleSegmentRows.length > 0 ? (
                <>
                  {showTimelinePicker && segmentTimelineYearOptions.length > 0 && (
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
                          {segmentTimelineYearOptions.map((year) => (
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
                          {segmentTimelineYearOptions.map((year) => (
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
                        <tr>
                          <th className="col-year">Year</th>
                          <th className="col-value">
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                justifyContent: "center",
                              }}
                            >
                              <IndianRupeeIcon size={14} strokeWidth={2.2} />
                              Segment GDP in Cr
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleSegmentRows.map((row) => (
                          <tr key={row.year}>
                            <td className="col-year">
                              <span className="year-badge">{row.year}</span>
                            </td>
                            <td className="col-value">
                              <span className="value-amount">
                                {Number(row.value || 0).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
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
                  message="No data found for selected filters."
                  hint="You can adjust filters and re-apply to refresh results."
                />
              )
            ) : isOperationalAnalysisView ? (
              operationalLoading ? (
                <PanelState variant="loading" message="Loading data..." />
              ) : operationalError ? (
                <PanelState variant="error" message={operationalError} />
              ) : !appliedOperationalSector ||
                !appliedOperationalInsurer ||
                !appliedOperationalMetric ? (
                <PanelState
                  variant="empty"
                  message="Select filters and click Apply Filters to view data."
                  hint="You can adjust filters and re-apply to refresh results."
                />
              ) : visibleOperationalRows.length > 0 ? (
                <>
                  {showTimelinePicker && operationalTimelineYearOptions.length > 0 && (
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
                          {operationalTimelineYearOptions.map((year) => (
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
                          {operationalTimelineYearOptions.map((year) => (
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
                        <tr>
                          <th className="col-year">Year</th>
                          <th className="col-value">
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                justifyContent: "center",
                              }}
                            >
                              <IndianRupeeIcon size={14} strokeWidth={2.2} />
                              {(operationalMetricPanelLabelMap[appliedOperationalMetric] || appliedOperationalMetric)} in Cr
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleOperationalRows.map((row) => (
                          <tr key={row.year}>
                            <td className="col-year">
                              <span className="year-badge">{row.year}</span>
                            </td>
                            <td className="col-value">
                              <span className="value-amount">
                                {Number(row.value || 0).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
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
                  message="No data found for selected filters."
                  hint="You can adjust filters and re-apply to refresh results."
                />
              )
            ) : isStatewisePremiumSegmentView ? (
              stateSegmentGdpLoading ? (
                <PanelState variant="loading" message="Loading data..." />
              ) : stateSegmentGdpError ? (
                <PanelState variant="error" message={stateSegmentGdpError} />
              ) : !appliedStateGdpState || !appliedStateGdpSegment ? (
                <PanelState
                  variant="empty"
                  message="Select filters and click Apply Filters to view data."
                  hint="You can adjust filters and re-apply to refresh results."
                />
              ) : visibleStateSegmentRows.length > 0 ? (
                <>
                  {showTimelinePicker && stateSegmentTimelineYearOptions.length > 0 && (
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
                          {stateSegmentTimelineYearOptions.map((year) => (
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
                          {stateSegmentTimelineYearOptions.map((year) => (
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
                        <tr>
                          <th className="col-year">Year</th>
                          <th className="col-value">
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                justifyContent: "center",
                              }}
                            >
                              <IndianRupeeIcon size={14} strokeWidth={2.2} />
                              GDP in Cr
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleStateSegmentRows.map((row) => (
                          <tr key={row.year}>
                            <td className="col-year">
                              <span className="year-badge">{row.year}</span>
                            </td>
                            <td className="col-value">
                              <span className="value-amount">
                                {Number(row.value || 0).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
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
                  message="No data found for selected filters."
                  hint="You can adjust filters and re-apply to refresh results."
                />
              )
            ) : isEquityCapitalView ? (
              equityCapitalLoading ? (
                <PanelState variant="loading" message="Loading data..." />
              ) : equityCapitalError ? (
                <PanelState variant="error" message={equityCapitalError} />
              ) : !appliedEscSector || !appliedEscInsurer ? (
                <PanelState
                  variant="empty"
                  message="Select filters and click Apply Filters to view data."
                  hint="You can adjust filters and re-apply to refresh results."
                />
              ) : escAppliedRows.length > 0 ? (
                <>
                  {showTimelinePicker && escTimelineYearOptions.length > 0 && (
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
                          {escTimelineYearOptions.map((year) => (
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
                          {escTimelineYearOptions.map((year) => (
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
                        <tr>
                          <th className="col-year">Year</th>
                          <th className="col-value">
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                justifyContent: "center",
                              }}
                            >
                              <CreditCard size={14} strokeWidth={2.2} />
                              Equity Share Capital in Cr
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleEscRows.map((row) => (
                          <tr key={row.year}>
                            <td className="col-year">
                              <span className="year-badge">{row.year}</span>
                            </td>
                            <td className="col-value">
                              <span className="value-amount">
                                {Number(row.value || 0).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
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
                  message="No data found for selected filters."
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
            {(isAumInsurerWiseView || isGrossDirectPremiumView || isIssuedPoliciesView || isSolvencyRatioView || isPremiumSegmentAnalysisView || isStatewisePremiumSegmentView || isOperationalAnalysisView || isEquityCapitalView) &&
              activeVisualizationData.length > 0 && (
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
            {isAumInsurerWiseView || isGrossDirectPremiumView || isIssuedPoliciesView || isSolvencyRatioView || isPremiumSegmentAnalysisView || isStatewisePremiumSegmentView || isOperationalAnalysisView ? (
              (isGrossDirectPremiumView
                ? grossDirectPremiumLoading
                : isOperationalAnalysisView
                ? operationalLoading
                : isSolvencyRatioView
                ? solvencyLoading
                : isIssuedPoliciesView
                ? issuedPoliciesLoading
                : isStatewisePremiumSegmentView
                ? stateSegmentGdpLoading
                : isPremiumSegmentAnalysisView
                ? segmentGdpLoading
                : aumLoading) ? (
                <PanelState
                  variant="loading"
                  message="Loading visualization"
                  hint="Rendering chart for selected filters."
                />
              ) : (isGrossDirectPremiumView
                ? grossDirectPremiumError
                : isOperationalAnalysisView
                ? operationalError
                : isSolvencyRatioView
                ? solvencyError
                : isIssuedPoliciesView
                ? issuedPoliciesError
                : isStatewisePremiumSegmentView
                ? stateSegmentGdpError
                : isPremiumSegmentAnalysisView
                ? segmentGdpError
                : aumError) ? (
                <PanelState
                  variant="error"
                  message={
                    isGrossDirectPremiumView
                      ? grossDirectPremiumError
                      : isOperationalAnalysisView
                      ? operationalError
                      : isSolvencyRatioView
                      ? solvencyError
                      : isIssuedPoliciesView
                      ? issuedPoliciesError
                      : isStatewisePremiumSegmentView
                      ? stateSegmentGdpError
                      : isPremiumSegmentAnalysisView
                      ? segmentGdpError
                      : aumError
                  }
                />
              ) : activeVisualizationData.length > 0 ? (
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
                  message={(() => {
                    const hasFilterSelection = isGrossDirectPremiumView
                      ? Boolean(appliedGdpInsurer)
                      : isOperationalAnalysisView
                      ? Boolean(appliedOperationalSector && appliedOperationalInsurer && appliedOperationalMetric)
                      : isSolvencyRatioView
                      ? Boolean(appliedSolvencySector && appliedSolvencyInsurer)
                      : isIssuedPoliciesView
                      ? Boolean(appliedIssuedInsurerType)
                      : isStatewisePremiumSegmentView
                      ? Boolean(appliedStateGdpState && appliedStateGdpSegment)
                      : isPremiumSegmentAnalysisView
                      ? Boolean(appliedSegmentInsurer && appliedSegment)
                      : Boolean(appliedAumSector && appliedAumInsurer && appliedInvestmentCategory);

                    return hasFilterSelection
                      ? "No data found for selected filters."
                      : "Select filters and click Apply Filters to view visualization.";
                  })()}
                  hint="Try widening the timeline or changing filters."
                />
              )
            ) : isEquityCapitalView ? (
              equityCapitalLoading ? (
                <PanelState
                  variant="loading"
                  message="Loading visualization"
                  hint="Rendering chart for selected filters."
                />
              ) : equityCapitalError ? (
                <PanelState variant="error" message={equityCapitalError} />
              ) : activeVisualizationData.length > 0 ? (
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
                    !appliedEscSector || !appliedEscInsurer
                      ? "Select filters and click Apply Filters to view visualization."
                      : "No data found for selected filters."
                  }
                  hint="Try changing filters."
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
              </>
            )}
          </div>

          {showInsights && (
            <div className="panel-body insights-panel-body">
              <div className="chart-wrapper">
                <PanelState
                  variant="empty"
                  message="Select filters to view insights."
                  hint="Insights will appear here after applying filters."
                />
              </div>
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

function FilterSelect({ label, options, value, onChange, placeholder = "Select" }) {
  return (
    <div className="filter-item">
      <label className="filter-label label-text">{label}</label>
      <select
        className="filter-select"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      >
        <option value="">--------</option>
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

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function resolveInsurerName(document) {
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

function resolveInvestmentCategory(document) {
  const candidates = [
    document?.category_of_investment,
    document?.investment_category,
    document?.category,
    document?.category_name,
    document?.investment_type,
    document?.investment,
  ];

  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (value) {
      return value;
    }
  }

  return "";
}

function resolveSegmentName(document) {
  const candidates = [
    document?.segment,
    document?.segment_name,
    document?.segmentName,
    document?.business_segment,
    document?.line_of_business,
    document?.lob,
    document?.type_of_business,
    document?.category,
  ];

  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (value) {
      return value;
    }
  }

  return "";
}

function resolveStateName(document) {
  const candidates = [
    document?.state,
    document?.state_name,
    document?.stateName,
    document?.region,
    document?.location,
  ];

  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (value) {
      return value;
    }
  }

  return "";
}

function resolveSector(document) {
  const candidates = [document?.sector, document?.insurer_sector, document?.type_of_sector];

  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (value) {
      return value;
    }
  }

  return "";
}

function resolveInsurerType(document) {
  const candidates = [
    document?.insurer_type,
    document?.type_of_insurer,
    document?.insurerType,
    document?.insurer_category,
  ];

  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (value) {
      return value;
    }
  }

  return "";
}

function resolveYearLabel(document) {
  const candidates = [
    document?.year,
    document?.financial_year,
    document?.financialYear,
    document?.fy,
    document?.date,
    document?.as_on_date,
    document?.asOnDate,
    document?.reporting_date,
    document?.reportingDate,
    document?.period,
    document?.month,
    document?.month_year,
    document?.monthYear,
    document?.quarter,
    document?.qtr,
    document?.date_of_reporting,
    document?.dateOfReporting,
    document?.timestamp,
    document?.created_at,
    document?.updated_at,
  ];

  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined || candidate === "") {
      continue;
    }

    // Firestore Timestamp instance with toDate().
    if (candidate && typeof candidate.toDate === "function") {
      const dateValue = candidate.toDate();
      if (dateValue instanceof Date && !Number.isNaN(dateValue.getTime())) {
        return dateValue.toLocaleDateString("en-GB");
      }
    }

    // Serialized timestamp object shape: { seconds, nanoseconds }.
    if (
      typeof candidate === "object" &&
      Number.isFinite(candidate?.seconds)
    ) {
      const dateValue = new Date(candidate.seconds * 1000);
      if (!Number.isNaN(dateValue.getTime())) {
        return dateValue.toLocaleDateString("en-GB");
      }
    }

    if (candidate instanceof Date && !Number.isNaN(candidate.getTime())) {
      return candidate.toLocaleDateString("en-GB");
    }

    const yearValue = String(candidate).trim();
    if (yearValue) {
      return yearValue;
    }
  }

  return "";
}

function resolveAumValue(document) {
  const preferredFields = [
    "aum",
    "aum_in_crore",
    "aum_in_crores",
    "assets_under_management",
    "assets_under_management_aum",
    "amount",
    "value",
  ];

  for (const fieldName of preferredFields) {
    const parsedValue = parseNumericFieldValue(document?.[fieldName]);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  for (const [fieldName, fieldValue] of Object.entries(document || {})) {
    if (!/aum|asset/i.test(fieldName)) {
      continue;
    }

    const parsedValue = parseNumericFieldValue(fieldValue);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  return 0;
}

function resolveGrossDirectPremiumValue(document) {
  const preferredFields = [
    "gross_direct_premium",
    "gross_direct_premium_in_cr",
    "gross_direct_premium_in_crore",
    "gross_direct_premium_in_crores",
    "gdp",
    "premium",
    "amount",
    "value",
  ];

  for (const fieldName of preferredFields) {
    const parsedValue = parseNumericFieldValue(document?.[fieldName]);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  for (const [fieldName, fieldValue] of Object.entries(document || {})) {
    if (!/gross|direct|premium|gdp/i.test(fieldName)) {
      continue;
    }

    const parsedValue = parseNumericFieldValue(fieldValue);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  return 0;
}

function resolveSegmentGdpValue(document) {
  const preferredFields = [
    "segment_gdp",
    "segment_gdp_in_cr",
    "segment_gdp_in_crore",
    "segment_gdp_in_crores",
    "segment_premium",
    "gross_direct_premium",
    "gdp",
    "premium",
    "amount",
    "value",
  ];

  for (const fieldName of preferredFields) {
    const parsedValue = parseNumericFieldValue(document?.[fieldName]);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  for (const [fieldName, fieldValue] of Object.entries(document || {})) {
    if (!/segment|premium|gdp/i.test(fieldName)) {
      continue;
    }

    const parsedValue = parseNumericFieldValue(fieldValue);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  return 0;
}

function resolveStateSegmentGdpValue(document) {
  const preferredFields = [
    "state_gdp_segment",
    "state_segment_gdp",
    "state_gdp",
    "segment_gdp",
    "gdp",
    "premium",
    "amount",
    "value",
  ];

  for (const fieldName of preferredFields) {
    const parsedValue = parseNumericFieldValue(document?.[fieldName]);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  for (const [fieldName, fieldValue] of Object.entries(document || {})) {
    if (!/state|segment|premium|gdp/i.test(fieldName)) {
      continue;
    }

    const parsedValue = parseNumericFieldValue(fieldValue);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  return 0;
}

function resolveEquityCapitalValue(document) {
  const preferredFields = [
    "equity_share_capital",
    "equity_capital",
    "equity_share_capital_in_crore",
    "equity_share_capital_in_crores",
    "equity_in_crore",
    "equity_in_crores",
    "amount",
    "value",
  ];

  for (const fieldName of preferredFields) {
    const parsedValue = parseNumericFieldValue(document?.[fieldName]);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  for (const [fieldName, fieldValue] of Object.entries(document || {})) {
    if (!/equity|capital/i.test(fieldName)) {
      continue;
    }

    const parsedValue = parseNumericFieldValue(fieldValue);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  return 0;
}

function resolveSolvencyRatioValue(document) {
  const preferredFields = [
    "solvency_ratio",
    "solvency_ratio_pct",
    "solvency_ratio_percent",
    "solvency_margin_ratio",
    "ratio",
    "value",
  ];

  for (const fieldName of preferredFields) {
    const parsedValue = parseNumericFieldValue(document?.[fieldName]);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  for (const [fieldName, fieldValue] of Object.entries(document || {})) {
    if (!/solvency|ratio/i.test(fieldName)) {
      continue;
    }

    const parsedValue = parseNumericFieldValue(fieldValue);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  return 0;
}

function resolveSolvencyPeriodSortValue(periodLabel) {
  const label = String(periodLabel || "").trim().toLowerCase();
  if (!label) {
    return Number.MAX_SAFE_INTEGER;
  }

  const yearMatch4 = label.match(/\b(19|20)\d{2}\b/);
  const yearMatch2 = label.match(/\b\d{2}\b/);
  const parsedYear = yearMatch4
    ? Number(yearMatch4[0])
    : yearMatch2
    ? 2000 + Number(yearMatch2[0])
    : Number.NaN;

  let monthNumber = null;
  const monthMatchers = [
    { regex: /\bjan(?:uary)?\b/, month: 1 },
    { regex: /\bfeb(?:ruary)?\b/, month: 2 },
    { regex: /\bmar(?:ch)?\b/, month: 3 },
    { regex: /\bapr(?:il)?\b/, month: 4 },
    { regex: /\bmay\b/, month: 5 },
    { regex: /\bjun(?:e)?\b/, month: 6 },
    { regex: /\bjul(?:y)?\b/, month: 7 },
    { regex: /\baug(?:ust)?\b/, month: 8 },
    { regex: /\bsep(?:t|tember)?\b/, month: 9 },
    { regex: /\boct(?:ober)?\b/, month: 10 },
    { regex: /\bnov(?:ember)?\b/, month: 11 },
    { regex: /\bdec(?:ember)?\b/, month: 12 },
  ];

  for (const matcher of monthMatchers) {
    if (matcher.regex.test(label)) {
      monthNumber = matcher.month;
      break;
    }
  }

  if (monthNumber === null) {
    const quarterMatch = label.match(/\bq([1-4])\b/);
    if (quarterMatch) {
      const quarter = Number(quarterMatch[1]);
      // Financial-year quarter sequence expected by user: Mar, Jun, Sep, Dec.
      monthNumber = quarter * 3;
    }
  }

  if (!Number.isFinite(parsedYear)) {
    return Number.MAX_SAFE_INTEGER;
  }

  if (!Number.isFinite(monthNumber)) {
    return parsedYear * 100;
  }

  return parsedYear * 100 + monthNumber;
}

function resolvePoliciesIssuedLakhsValue(document) {
  const preferredFields = [
    "policies_issued_lakhs",
    "number_of_policies_issued_lakhs",
    "no_of_policies_issued_lakhs",
    "policies_issued",
    "number_of_policies_issued",
    "no_of_policies_issued",
    "policies",
    "value",
    "amount",
  ];

  for (const fieldName of preferredFields) {
    const parsedValue = parseNumericFieldValue(document?.[fieldName]);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  for (const [fieldName, fieldValue] of Object.entries(document || {})) {
    if (!/polic|issue/i.test(fieldName)) {
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
    const normalized = value.replace(/,/g, "").trim();
    if (!normalized) {
      return null;
    }

    const parsedValue = Number(normalized);
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

function formatInvestmentCategoryLabel(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function formatDisplayLabel(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (!word) {
        return word;
      }

      // Keep acronyms and mixed-case words intact (e.g., ICICI, SBI, HDFC ERGO).
      if (word === word.toUpperCase() || /[A-Z]/.test(word.slice(1))) {
        return word;
      }

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
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
    lineCount: Math.max(lines.length, 1),
  };
}
