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

  const isInsurerDetailsView =
    activeTab === "market-overview" && selectedModule === "insurer-details";
  const isAumInsurerWiseView =
    activeTab === "financials" && selectedModule === "aum-insurer-wise";

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
    if (!isAumInsurerWiseView || aumAppliedRows.length === 0) {
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

  const filterConfig = useMemo(
    () =>
      isAumInsurerWiseView
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
      isAumInsurerWiseView,
      aumSectorOptions,
      selectedAumSector,
      aumInsurerOptions,
      selectedAumInsurer,
      investmentCategoryOptions,
      selectedInvestmentCategory,
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
    if (!isAumInsurerWiseView) {
      return [];
    }

    return visibleAumRows
      .map((row) => ({ year: row.year, value: Number(row.value || 0) }))
      .filter((row) => row.year && Number.isFinite(row.value));
  }, [isAumInsurerWiseView, visibleAumRows]);

  const chartTitle = useMemo(() => {
    if (!isAumInsurerWiseView) {
      return selectedSubModuleTitle;
    }

    return [
      selectedSubModuleTitle,
      appliedAumSector,
      appliedAumInsurer,
      formatInvestmentCategoryLabel(appliedInvestmentCategory),
    ]
      .filter(Boolean)
      .join(" : ");
  }, [
    isAumInsurerWiseView,
    selectedSubModuleTitle,
    appliedAumSector,
    appliedAumInsurer,
    appliedInvestmentCategory,
  ]);

  const plotTraces = useMemo(() => {
    const xValues = visualizationData.map((item) => String(item.year));
    const yValues = visualizationData.map((item) => Number(item.value || 0));

    if (visualizationType === "bar") {
      return [
        {
          type: "bar",
          name: "AUM",
          x: xValues,
          y: yValues,
          marker: {
            color: "rgba(14, 165, 164, 0.88)",
            line: { color: "rgba(15, 118, 110, 0.95)", width: 1 },
          },
          hovertemplate: "%{x}<br>AUM: %{y:,}<extra></extra>",
        },
      ];
    }

    if (visualizationType === "area") {
      return [
        {
          type: "scatter",
          mode: "lines+markers",
          name: "AUM",
          x: xValues,
          y: yValues,
          line: { color: "#0ea5a4", width: 3 },
          marker: { color: "#0ea5a4", size: 8 },
          fill: "tozeroy",
          fillcolor: "rgba(14, 165, 164, 0.14)",
          hovertemplate: "%{x}<br>AUM: %{y:,}<extra></extra>",
        },
      ];
    }

    return [
      {
        type: "scatter",
        mode: "lines+markers",
        name: "AUM",
        x: xValues,
        y: yValues,
        line: { color: "#0ea5a4", width: 3 },
        marker: { color: "#0ea5a4", size: 8 },
        hovertemplate: "%{x}<br>AUM: %{y:,}<extra></extra>",
      },
    ];
  }, [visualizationData, visualizationType]);

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
        title: { text: "Assets under Management in Cr", font: { size: 12, color: "#475569" } },
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
    [chartTitle]
  );

  const plotConfig = useMemo(
    () => ({
      responsive: true,
      displaylogo: false,
      toImageButtonOptions: {
        format: "png",
        filename: `${buildExportFileName(selectedSubModuleTitle, [
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
    [selectedSubModuleTitle, appliedAumSector, appliedAumInsurer, appliedInvestmentCategory]
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

    setSelectedInsurerRegNo("");
    setSelectedInsurerDetails(null);
    setDetailsError("");
  };

  const handleApplyFilters = () => {
    if (isAumInsurerWiseView) {
      setAppliedAumSector(selectedAumSector);
      setAppliedAumInsurer(selectedAumInsurer);
      setAppliedInvestmentCategory(selectedInvestmentCategory);
      setShowTimelinePicker(false);
      setTimelineStartYear("");
      setTimelineEndYear("");
      return;
    }
  };

  const handleExportData = async () => {
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
            {insurersLoading && !isAumInsurerWiseView && (
              <p className="panel-placeholder">Loading insurers...</p>
            )}
            {insurersError && !insurersLoading && !isAumInsurerWiseView && (
              <p className="panel-placeholder">{insurersError}</p>
            )}
            {aumLoading && isAumInsurerWiseView && (
              <p className="panel-placeholder">Loading filters...</p>
            )}
            {aumError && !aumLoading && isAumInsurerWiseView && (
              <p className="panel-placeholder">{aumError}</p>
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
            {isAumInsurerWiseView && visualizationData.length > 0 && (
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
            {isAumInsurerWiseView ? (
              aumLoading ? (
                <PanelState
                  variant="loading"
                  message="Loading visualization"
                  hint="Rendering chart for selected filters."
                />
              ) : aumError ? (
                <PanelState variant="error" message={aumError} />
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
                    !appliedAumSector || !appliedAumInsurer || !appliedInvestmentCategory
                      ? "Select filters and click Apply Filters to view visualization."
                      : "No data found for selected filters."
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
