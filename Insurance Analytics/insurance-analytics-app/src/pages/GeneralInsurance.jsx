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
    { id: "insurer-details", title: "Insurer Details", icon: FileText },
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
      isStatewisePremiumSegmentView,
      stateGdpStateOptions,
      selectedStateGdpState,
      stateGdpSegmentOptions,
      selectedStateGdpSegment,
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
    if (!isAumInsurerWiseView && !isGrossDirectPremiumView && !isPremiumSegmentAnalysisView && !isStatewisePremiumSegmentView) {
      return [];
    }

    const rows = isGrossDirectPremiumView
      ? visibleGdpRows
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
    isStatewisePremiumSegmentView,
    isPremiumSegmentAnalysisView,
    visibleAumRows,
    visibleGdpRows,
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
    return isAumInsurerWiseView || isGrossDirectPremiumView || isPremiumSegmentAnalysisView || isStatewisePremiumSegmentView
      ? visualizationData
      : escVisualizationData;
  }, [
    isAumInsurerWiseView,
    isGrossDirectPremiumView,
    isPremiumSegmentAnalysisView,
    isStatewisePremiumSegmentView,
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
            {insurersLoading && !isAumInsurerWiseView && !isEquityCapitalView && !isGrossDirectPremiumView && !isPremiumSegmentAnalysisView && !isStatewisePremiumSegmentView && (
              <p className="panel-placeholder">Loading insurers...</p>
            )}
            {insurersError && !insurersLoading && !isAumInsurerWiseView && !isEquityCapitalView && !isGrossDirectPremiumView && !isPremiumSegmentAnalysisView && !isStatewisePremiumSegmentView && (
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
            {(isAumInsurerWiseView || isGrossDirectPremiumView || isPremiumSegmentAnalysisView || isStatewisePremiumSegmentView || isEquityCapitalView) &&
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
            {isAumInsurerWiseView || isGrossDirectPremiumView || isPremiumSegmentAnalysisView || isStatewisePremiumSegmentView ? (
              (isGrossDirectPremiumView
                ? grossDirectPremiumLoading
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

function resolveYearLabel(document) {
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
    lineCount: lines.length || 1,
  };
}
