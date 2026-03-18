import { useState, useEffect, useMemo } from "react";
import PlotComponentModule from "react-plotly.js";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import * as XLSX from "xlsx";

const Plot = PlotComponentModule?.default || PlotComponentModule;
import {
  Activity,
  AlertCircle,
  BarChart2,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronRight,
  DollarSign,
  FileText,
  Globe,
  Handshake,
  IndianRupee,
  Info,
  Layers,
  MessageSquare,
  Network,
  PieChart,
  RefreshCw,
  Shuffle,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import "../styles/life-insurance.css";
import "../styles/summary-insurance.css";

/* ─── Data ───────────────────────────────────────────── */
const SECTIONS = [
  {
    id: "industry-profile",
    title: "Industry Profile",
    icon: Building2,
    accent: "#0ea5e9",
    bg: "rgba(14,165,233,0.12)",
    metrics: [
      { id: "num-companies",       title: "No. of Companies",                    icon: Building2,   desc: "Total registered insurers in India" },
      { id: "ins-penetration",     title: "Insurance Penetration",                  icon: Globe,       desc: "Premium as a % of GDP" },
      { id: "ins-density",         title: "Insurance Density",                      icon: Activity,    desc: "Per capita premium (USD)" },
      { id: "market-share-psu",    title: "Market Share of PSUs",                   icon: PieChart,    desc: "Public sector market share" },
      { id: "num-reinsurers",      title: "No. of Foreign Reinsurer's Branches",   icon: Layers,      desc: "Active FRBs" },
    ],
  },
  {
    id: "business-performance",
    title: "Business Performance",
    icon: TrendingUp,
    accent: "#10b981",
    bg: "rgba(16,185,129,0.12)",
    metrics: [
      { id: "new-policies",        title: "No. of New Policies Issued",          icon: FileText,    desc: "New policies across Life & Non-Life" },
      { id: "total-premium",       title: "Total Premium",                          icon: IndianRupee, desc: "Life + Non-Life combined premium" },
      { id: "num-offices",         title: "No. of Offices of Insurers",             icon: Building2,   desc: "Pan-India branch network" },
      { id: "life-premium",        title: "Life – Total Premium",                   icon: IndianRupee, desc: "Life insurance total premium" },
      { id: "general-premium",     title: "General – Total Premium",                icon: IndianRupee, desc: "General insurance total premium" },
      { id: "life-policies",       title: "Life – No. of Policies Issued",          icon: Briefcase,   desc: "New life insurance policies issued" },
      { id: "general-policies",    title: "General – No. of Policies Issued",       icon: Briefcase,   desc: "New general insurance policies issued" },
    ],
  },
  {
    id: "financials",
    title: "Financials",
    icon: IndianRupee,
    accent: "#8b5cf6",
    bg: "rgba(139,92,246,0.12)",
    metrics: [
      { id: "aum",                 title: "Assets under Management",                icon: BarChart2,   desc: "Total AUM of insurance sector" },
      { id: "commission",          title: "Commission Expenses",                    icon: DollarSign,  desc: "Commission paid to agents & intermediaries" },
      { id: "opex",                title: "Operating Expenses",                     icon: Briefcase,   desc: "Total operating expenditure" },
      { id: "pat",                 title: "Profit after Tax",                       icon: TrendingUp,  desc: "Net profit after tax (industry-wide)" },
      { id: "paid-up-capital",     title: "Paid Up Capital",                        icon: Building2,   desc: "Total paid-up capital of insurers" },
    ],
  },
  {
    id: "intermediaries",
    title: "Intermediaries",
    icon: Network,
    accent: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    metrics: [
      { id: "num-agents",          title: "No. of Agents (Individual + Micro)",  icon: Users,       desc: "Individual & micro-insurance agents" },
      { id: "num-brokers",         title: "No. of Brokers",                      icon: Handshake,   desc: "Registered insurance brokers" },
      { id: "num-imfs",            title: "No. of IMFs",                         icon: Network,     desc: "Insurance Marketing Firms (IRDAI)" },
      { id: "num-corp-agents",     title: "No. of Corporate Agents",             icon: Building2,   desc: "Licensed corporate agent entities" },
    ],
  },
  {
    id: "redressal",
    title: "Redressal of Consumer Grievances",
    icon: MessageSquare,
    accent: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
    metrics: [
      { id: "grievances-reported", title: "No. of Grievances Reported",                          icon: AlertCircle,   desc: "Total policyholder grievances reported" },
      { id: "grievances-resolved", title: "No. of Grievances Resolved",                          icon: CheckCircle2,  desc: "Grievances resolved by insurers" },
      { id: "complaints-ombudsmen",title: "No. of Complaints Reported with the Ombudsmen",       icon: FileText,      desc: "Escalated to Insurance Ombudsmen" },
      { id: "disposed-ombudsmen",  title: "No. of Complaints Disposed by Ombudsmen",             icon: UserCheck,     desc: "Adjudicated / disposed by Ombudsmen" },
    ],
  },
];

const YEAR_OPTIONS = ["2023-24", "2022-23", "2021-22", "2020-21", "2019-20", "2018-19", "2017-18"];
const SECTOR_OPTIONS = ["Life", "General", "Health", "Reinsurance"];
const INSURER_TYPE_OPTIONS = ["All Insurers", "Public Sector", "Private Sector", "Foreign"];

/* ─── Component ─────────────────────────────────────── */
export default function SummaryInsuranceSector() {
  const [activeModal, setActiveModal] = useState(null); // { metric, section }
  const [summary1Docs, setSummary1Docs] = useState([]);

  useEffect(() => {
    getDocs(collection(db, "summary_1"))
      .then((snap) => setSummary1Docs(snap.docs.map((d) => d.data())))
      .catch((err) => console.error("summary_1 fetch error:", err));
  }, []);

  const numCompaniesRows = useMemo(() => {
    return summary1Docs
      .filter((d) => d.metric === "number_insurance_companies")
      .map((d) => ({ year: String(d.year), value: d.value }))
      .sort((a, b) => String(b.year).localeCompare(String(a.year)));
  }, [summary1Docs]);

  const numCompaniesLatestValue = numCompaniesRows.length > 0 ? numCompaniesRows[0].value : null;

  // ─── NC (No. of Companies) timeline / chart type state ───
  const [showNCTimelinePicker, setShowNCTimelinePicker] = useState(false);
  const [ncTimelineStartYear, setNCTimelineStartYear] = useState("");
  const [ncTimelineEndYear, setNCTimelineEndYear] = useState("");
  const [ncVisualizationType, setNCVisualizationType] = useState("bar");
  const [ncPendingVisualizationType, setNCPendingVisualizationType] = useState("bar");
  const [showNCChartTypePicker, setShowNCChartTypePicker] = useState(false);

  const ncTimelineYearOptions = useMemo(
    () => [...numCompaniesRows].map((r) => r.year).sort(),
    [numCompaniesRows]
  );

  // Auto-initialise timeline bounds when data loads
  useEffect(() => {
    if (ncTimelineYearOptions.length === 0) return;
    setNCTimelineStartYear(ncTimelineYearOptions[0]);
    setNCTimelineEndYear(ncTimelineYearOptions[ncTimelineYearOptions.length - 1]);
  }, [ncTimelineYearOptions]);

  const ncVisibleRows = useMemo(() => {
    if (!ncTimelineStartYear || !ncTimelineEndYear) return numCompaniesRows;
    return numCompaniesRows.filter(
      (r) => r.year >= ncTimelineStartYear && r.year <= ncTimelineEndYear
    );
  }, [numCompaniesRows, ncTimelineStartYear, ncTimelineEndYear]);

  const ncPlotTraces = useMemo(() => {
    const sorted = [...ncVisibleRows].sort((a, b) => a.year.localeCompare(b.year));
    const x = sorted.map((r) => r.year);
    const y = sorted.map((r) => Number(r.value));
    if (ncVisualizationType === "bar") {
      return [{
        type: "bar",
        name: "No. of Companies",
        x, y,
        marker: { color: "rgba(14, 165, 233, 0.88)", line: { color: "rgba(2, 132, 199, 0.95)", width: 1 } },
        hovertemplate: "%{x}<br>No. of Companies: %{y}<extra></extra>",
      }];
    }
    if (ncVisualizationType === "area") {
      return [{
        type: "scatter", mode: "lines+markers", name: "No. of Companies",
        x, y,
        line: { color: "#0ea5e9", width: 3 }, marker: { color: "#0ea5e9", size: 8 },
        fill: "tozeroy", fillcolor: "rgba(14, 165, 233, 0.14)",
        hovertemplate: "%{x}<br>No. of Companies: %{y}<extra></extra>",
      }];
    }
    return [{
      type: "scatter", mode: "lines+markers", name: "No. of Companies",
      x, y,
      line: { color: "#0ea5e9", width: 3 }, marker: { color: "#0ea5e9", size: 8 },
      hovertemplate: "%{x}<br>No. of Companies: %{y}<extra></extra>",
    }];
  }, [ncVisibleRows, ncVisualizationType]);

  const ncPlotLayout = useMemo(() => ({
    autosize: true,
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    margin: { l: 60, r: 18, t: 20, b: 70 },
    xaxis: {
      title: { text: "Year", font: { size: 12, color: "#475569" } },
      showgrid: true, gridcolor: "rgba(148,163,184,0.16)", zeroline: false,
      tickfont: { size: 11, color: "#334155" }, tickangle: -35,
    },
    yaxis: {
      title: { text: "No. of Companies", font: { size: 12, color: "#475569" } },
      showgrid: true, gridcolor: "rgba(148,163,184,0.16)", zeroline: false,
      tickfont: { size: 12, color: "#334155" },
    },
    hoverlabel: { bgcolor: "#ffffff", bordercolor: "rgba(148,163,184,0.4)", font: { color: "#0f172a", size: 12 } },
  }), []);

  const ncPlotConfig = useMemo(() => ({
    responsive: true, displaylogo: false,
    toImageButtonOptions: { format: "png", filename: "no_of_companies_chart", width: 1280, height: 720, scale: 2 },
    modeBarButtonsToRemove: ["select2d", "lasso2d", "toggleSpikelines", "autoScale2d"],
  }), []);

  const handleNCExport = () => {
    if (ncVisibleRows.length === 0) return;
    const rows = [["Year", "No. of Companies"], ...ncVisibleRows.map((r) => [r.year, r.value])];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, "no_of_companies.xlsx");
  };

  // ─── Insurance Penetration ───
  const insPenetrationRows = useMemo(() => {
    return summary1Docs
      .filter((d) => d.metric === "insurance_penetration_percentage")
      .map((d) => ({ year: String(d.year), value: d.value }))
      .sort((a, b) => String(b.year).localeCompare(String(a.year)));
  }, [summary1Docs]);
  const insPenetrationLatestValue = insPenetrationRows.length > 0 ? insPenetrationRows[0].value : null;
  const [showIPTimelinePicker, setShowIPTimelinePicker] = useState(false);
  const [ipTimelineStartYear, setIPTimelineStartYear] = useState("");
  const [ipTimelineEndYear, setIPTimelineEndYear] = useState("");
  const [ipVisualizationType, setIPVisualizationType] = useState("bar");
  const [ipPendingVisualizationType, setIPPendingVisualizationType] = useState("bar");
  const [showIPChartTypePicker, setShowIPChartTypePicker] = useState(false);
  const ipTimelineYearOptions = useMemo(() => [...insPenetrationRows].map((r) => r.year).sort(), [insPenetrationRows]);
  useEffect(() => {
    if (ipTimelineYearOptions.length === 0) return;
    setIPTimelineStartYear(ipTimelineYearOptions[0]);
    setIPTimelineEndYear(ipTimelineYearOptions[ipTimelineYearOptions.length - 1]);
  }, [ipTimelineYearOptions]);
  const ipVisibleRows = useMemo(() => {
    if (!ipTimelineStartYear || !ipTimelineEndYear) return insPenetrationRows;
    return insPenetrationRows.filter((r) => r.year >= ipTimelineStartYear && r.year <= ipTimelineEndYear);
  }, [insPenetrationRows, ipTimelineStartYear, ipTimelineEndYear]);
  const ipPlotTraces = useMemo(() => {
    const sorted = [...ipVisibleRows].sort((a, b) => a.year.localeCompare(b.year));
    const x = sorted.map((r) => r.year);
    const y = sorted.map((r) => Number(r.value));
    if (ipVisualizationType === "bar") {
      return [{ type: "bar", name: "Insurance Penetration (%)", x, y, marker: { color: "rgba(14, 165, 233, 0.88)", line: { color: "rgba(2, 132, 199, 0.95)", width: 1 } }, hovertemplate: "%{x}<br>Penetration: %{y:,.2f}%<extra></extra>" }];
    }
    if (ipVisualizationType === "area") {
      return [{ type: "scatter", mode: "lines+markers", name: "Insurance Penetration (%)", x, y, line: { color: "#0ea5e9", width: 3 }, marker: { color: "#0ea5e9", size: 8 }, fill: "tozeroy", fillcolor: "rgba(14, 165, 233, 0.14)", hovertemplate: "%{x}<br>Penetration: %{y:,.2f}%<extra></extra>" }];
    }
    return [{ type: "scatter", mode: "lines+markers", name: "Insurance Penetration (%)", x, y, line: { color: "#0ea5e9", width: 3 }, marker: { color: "#0ea5e9", size: 8 }, hovertemplate: "%{x}<br>Penetration: %{y:,.2f}%<extra></extra>" }];
  }, [ipVisibleRows, ipVisualizationType]);
  const ipPlotLayout = useMemo(() => ({ autosize: true, paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", margin: { l: 60, r: 18, t: 20, b: 70 }, xaxis: { title: { text: "Year", font: { size: 12, color: "#475569" } }, showgrid: true, gridcolor: "rgba(148,163,184,0.16)", zeroline: false, tickfont: { size: 11, color: "#334155" }, tickangle: -35 }, yaxis: { title: { text: "Insurance Penetration (%)", font: { size: 12, color: "#475569" } }, showgrid: true, gridcolor: "rgba(148,163,184,0.16)", zeroline: false, tickfont: { size: 12, color: "#334155" } }, hoverlabel: { bgcolor: "#ffffff", bordercolor: "rgba(148,163,184,0.4)", font: { color: "#0f172a", size: 12 } } }), []);
  const ipPlotConfig = useMemo(() => ({ responsive: true, displaylogo: false, toImageButtonOptions: { format: "png", filename: "insurance_penetration_chart", width: 1280, height: 720, scale: 2 }, modeBarButtonsToRemove: ["select2d", "lasso2d", "toggleSpikelines", "autoScale2d"] }), []);
  const handleIPExport = () => {
    if (ipVisibleRows.length === 0) return;
    const rows = [["Year", "Insurance Penetration (%)"], ...ipVisibleRows.map((r) => [r.year, r.value])];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, "insurance_penetration.xlsx");
  };

  // ─── Insurance Density ───
  const insDensityRows = useMemo(() => {
    return summary1Docs
      .filter((d) => d.metric === "insurance_density_usdollar")
      .map((d) => ({ year: String(d.year), value: d.value }))
      .sort((a, b) => String(b.year).localeCompare(String(a.year)));
  }, [summary1Docs]);
  const insDensityLatestValue = insDensityRows.length > 0 ? insDensityRows[0].value : null;
  const [showIDTimelinePicker, setShowIDTimelinePicker] = useState(false);
  const [idTimelineStartYear, setIDTimelineStartYear] = useState("");
  const [idTimelineEndYear, setIDTimelineEndYear] = useState("");
  const [idVisualizationType, setIDVisualizationType] = useState("bar");
  const [idPendingVisualizationType, setIDPendingVisualizationType] = useState("bar");
  const [showIDChartTypePicker, setShowIDChartTypePicker] = useState(false);
  const idTimelineYearOptions = useMemo(() => [...insDensityRows].map((r) => r.year).sort(), [insDensityRows]);
  useEffect(() => {
    if (idTimelineYearOptions.length === 0) return;
    setIDTimelineStartYear(idTimelineYearOptions[0]);
    setIDTimelineEndYear(idTimelineYearOptions[idTimelineYearOptions.length - 1]);
  }, [idTimelineYearOptions]);
  const idVisibleRows = useMemo(() => {
    if (!idTimelineStartYear || !idTimelineEndYear) return insDensityRows;
    return insDensityRows.filter((r) => r.year >= idTimelineStartYear && r.year <= idTimelineEndYear);
  }, [insDensityRows, idTimelineStartYear, idTimelineEndYear]);
  const idPlotTraces = useMemo(() => {
    const sorted = [...idVisibleRows].sort((a, b) => a.year.localeCompare(b.year));
    const x = sorted.map((r) => r.year);
    const y = sorted.map((r) => Number(r.value));
    if (idVisualizationType === "bar") {
      return [{ type: "bar", name: "Insurance Density (USD)", x, y, marker: { color: "rgba(14, 165, 233, 0.88)", line: { color: "rgba(2, 132, 199, 0.95)", width: 1 } }, hovertemplate: "%{x}<br>Density: $%{y:,.2f}<extra></extra>" }];
    }
    if (idVisualizationType === "area") {
      return [{ type: "scatter", mode: "lines+markers", name: "Insurance Density (USD)", x, y, line: { color: "#0ea5e9", width: 3 }, marker: { color: "#0ea5e9", size: 8 }, fill: "tozeroy", fillcolor: "rgba(14, 165, 233, 0.14)", hovertemplate: "%{x}<br>Density: $%{y:,.2f}<extra></extra>" }];
    }
    return [{ type: "scatter", mode: "lines+markers", name: "Insurance Density (USD)", x, y, line: { color: "#0ea5e9", width: 3 }, marker: { color: "#0ea5e9", size: 8 }, hovertemplate: "%{x}<br>Density: $%{y:,.2f}<extra></extra>" }];
  }, [idVisibleRows, idVisualizationType]);
  const idPlotLayout = useMemo(() => ({ autosize: true, paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", margin: { l: 60, r: 18, t: 20, b: 70 }, xaxis: { title: { text: "Year", font: { size: 12, color: "#475569" } }, showgrid: true, gridcolor: "rgba(148,163,184,0.16)", zeroline: false, tickfont: { size: 11, color: "#334155" }, tickangle: -35 }, yaxis: { title: { text: "Insurance Density (USD)", font: { size: 12, color: "#475569" } }, showgrid: true, gridcolor: "rgba(148,163,184,0.16)", zeroline: false, tickfont: { size: 12, color: "#334155" } }, hoverlabel: { bgcolor: "#ffffff", bordercolor: "rgba(148,163,184,0.4)", font: { color: "#0f172a", size: 12 } } }), []);
  const idPlotConfig = useMemo(() => ({ responsive: true, displaylogo: false, toImageButtonOptions: { format: "png", filename: "insurance_density_chart", width: 1280, height: 720, scale: 2 }, modeBarButtonsToRemove: ["select2d", "lasso2d", "toggleSpikelines", "autoScale2d"] }), []);
  const handleIDExport = () => {
    if (idVisibleRows.length === 0) return;
    const rows = [["Year", "Insurance Density (USD)"], ...idVisibleRows.map((r) => [r.year, r.value])];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, "insurance_density.xlsx");
  };

  // ─── Market Share of PSUs ───
  const msPSURows = useMemo(() => {
    return summary1Docs
      .filter((d) => d.metric === "market_share_publicsector_percentage")
      .map((d) => ({ year: String(d.year), value: d.value }))
      .sort((a, b) => String(b.year).localeCompare(String(a.year)));
  }, [summary1Docs]);
  const msPSULatestValue = msPSURows.length > 0 ? msPSURows[0].value : null;
  const [showMSTimelinePicker, setShowMSTimelinePicker] = useState(false);
  const [msTimelineStartYear, setMSTimelineStartYear] = useState("");
  const [msTimelineEndYear, setMSTimelineEndYear] = useState("");
  const [msVisualizationType, setMSVisualizationType] = useState("bar");
  const [msPendingVisualizationType, setMSPendingVisualizationType] = useState("bar");
  const [showMSChartTypePicker, setShowMSChartTypePicker] = useState(false);
  const msTimelineYearOptions = useMemo(() => [...msPSURows].map((r) => r.year).sort(), [msPSURows]);
  useEffect(() => {
    if (msTimelineYearOptions.length === 0) return;
    setMSTimelineStartYear(msTimelineYearOptions[0]);
    setMSTimelineEndYear(msTimelineYearOptions[msTimelineYearOptions.length - 1]);
  }, [msTimelineYearOptions]);
  const msVisibleRows = useMemo(() => {
    if (!msTimelineStartYear || !msTimelineEndYear) return msPSURows;
    return msPSURows.filter((r) => r.year >= msTimelineStartYear && r.year <= msTimelineEndYear);
  }, [msPSURows, msTimelineStartYear, msTimelineEndYear]);
  const msPlotTraces = useMemo(() => {
    const sorted = [...msVisibleRows].sort((a, b) => a.year.localeCompare(b.year));
    const x = sorted.map((r) => r.year);
    const y = sorted.map((r) => Number(r.value));
    if (msVisualizationType === "bar") {
      return [{ type: "bar", name: "Market Share of PSUs (%)", x, y, marker: { color: "rgba(14, 165, 233, 0.88)", line: { color: "rgba(2, 132, 199, 0.95)", width: 1 } }, hovertemplate: "%{x}<br>Market Share: %{y:,.2f}%<extra></extra>" }];
    }
    if (msVisualizationType === "area") {
      return [{ type: "scatter", mode: "lines+markers", name: "Market Share of PSUs (%)", x, y, line: { color: "#0ea5e9", width: 3 }, marker: { color: "#0ea5e9", size: 8 }, fill: "tozeroy", fillcolor: "rgba(14, 165, 233, 0.14)", hovertemplate: "%{x}<br>Market Share: %{y:,.2f}%<extra></extra>" }];
    }
    return [{ type: "scatter", mode: "lines+markers", name: "Market Share of PSUs (%)", x, y, line: { color: "#0ea5e9", width: 3 }, marker: { color: "#0ea5e9", size: 8 }, hovertemplate: "%{x}<br>Market Share: %{y:,.2f}%<extra></extra>" }];
  }, [msVisibleRows, msVisualizationType]);
  const msPlotLayout = useMemo(() => ({ autosize: true, paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", margin: { l: 60, r: 18, t: 20, b: 70 }, xaxis: { title: { text: "Year", font: { size: 12, color: "#475569" } }, showgrid: true, gridcolor: "rgba(148,163,184,0.16)", zeroline: false, tickfont: { size: 11, color: "#334155" }, tickangle: -35 }, yaxis: { title: { text: "Market Share (%)", font: { size: 12, color: "#475569" } }, showgrid: true, gridcolor: "rgba(148,163,184,0.16)", zeroline: false, tickfont: { size: 12, color: "#334155" } }, hoverlabel: { bgcolor: "#ffffff", bordercolor: "rgba(148,163,184,0.4)", font: { color: "#0f172a", size: 12 } } }), []);
  const msPlotConfig = useMemo(() => ({ responsive: true, displaylogo: false, toImageButtonOptions: { format: "png", filename: "market_share_psu_chart", width: 1280, height: 720, scale: 2 }, modeBarButtonsToRemove: ["select2d", "lasso2d", "toggleSpikelines", "autoScale2d"] }), []);
  const handleMSExport = () => {
    if (msVisibleRows.length === 0) return;
    const rows = [["Year", "Market Share of PSUs (%)"], ...msVisibleRows.map((r) => [r.year, r.value])];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, "market_share_psu.xlsx");
  };

  // ─── No. of Foreign Reinsurer's Branches ───
  const numFRBsRows = useMemo(() => {
    return summary1Docs
      .filter((d) => d.metric === "number_frbs")
      .map((d) => ({ year: String(d.year), value: d.value }))
      .sort((a, b) => String(b.year).localeCompare(String(a.year)));
  }, [summary1Docs]);
  const numFRBsLatestValue = numFRBsRows.length > 0 ? numFRBsRows[0].value : null;
  const [showFRBTimelinePicker, setShowFRBTimelinePicker] = useState(false);
  const [frbTimelineStartYear, setFRBTimelineStartYear] = useState("");
  const [frbTimelineEndYear, setFRBTimelineEndYear] = useState("");
  const [frbVisualizationType, setFRBVisualizationType] = useState("bar");
  const [frbPendingVisualizationType, setFRBPendingVisualizationType] = useState("bar");
  const [showFRBChartTypePicker, setShowFRBChartTypePicker] = useState(false);
  const frbTimelineYearOptions = useMemo(() => [...numFRBsRows].map((r) => r.year).sort(), [numFRBsRows]);
  useEffect(() => {
    if (frbTimelineYearOptions.length === 0) return;
    setFRBTimelineStartYear(frbTimelineYearOptions[0]);
    setFRBTimelineEndYear(frbTimelineYearOptions[frbTimelineYearOptions.length - 1]);
  }, [frbTimelineYearOptions]);
  const frbVisibleRows = useMemo(() => {
    if (!frbTimelineStartYear || !frbTimelineEndYear) return numFRBsRows;
    return numFRBsRows.filter((r) => r.year >= frbTimelineStartYear && r.year <= frbTimelineEndYear);
  }, [numFRBsRows, frbTimelineStartYear, frbTimelineEndYear]);
  const frbPlotTraces = useMemo(() => {
    const sorted = [...frbVisibleRows].sort((a, b) => a.year.localeCompare(b.year));
    const x = sorted.map((r) => r.year);
    const y = sorted.map((r) => Number(r.value));
    if (frbVisualizationType === "bar") {
      return [{ type: "bar", name: "No. of Foreign Reinsurer's Branches", x, y, marker: { color: "rgba(14, 165, 233, 0.88)", line: { color: "rgba(2, 132, 199, 0.95)", width: 1 } }, hovertemplate: "%{x}<br>FRBs: %{y}<extra></extra>" }];
    }
    if (frbVisualizationType === "area") {
      return [{ type: "scatter", mode: "lines+markers", name: "No. of Foreign Reinsurer's Branches", x, y, line: { color: "#0ea5e9", width: 3 }, marker: { color: "#0ea5e9", size: 8 }, fill: "tozeroy", fillcolor: "rgba(14, 165, 233, 0.14)", hovertemplate: "%{x}<br>FRBs: %{y}<extra></extra>" }];
    }
    return [{ type: "scatter", mode: "lines+markers", name: "No. of Foreign Reinsurer's Branches", x, y, line: { color: "#0ea5e9", width: 3 }, marker: { color: "#0ea5e9", size: 8 }, hovertemplate: "%{x}<br>FRBs: %{y}<extra></extra>" }];
  }, [frbVisibleRows, frbVisualizationType]);
  const frbPlotLayout = useMemo(() => ({ autosize: true, paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", margin: { l: 60, r: 18, t: 20, b: 70 }, xaxis: { title: { text: "Year", font: { size: 12, color: "#475569" } }, showgrid: true, gridcolor: "rgba(148,163,184,0.16)", zeroline: false, tickfont: { size: 11, color: "#334155" }, tickangle: -35 }, yaxis: { title: { text: "No. of Foreign Reinsurer's Branches", font: { size: 12, color: "#475569" } }, showgrid: true, gridcolor: "rgba(148,163,184,0.16)", zeroline: false, tickfont: { size: 12, color: "#334155" } }, hoverlabel: { bgcolor: "#ffffff", bordercolor: "rgba(148,163,184,0.4)", font: { color: "#0f172a", size: 12 } } }), []);
  const frbPlotConfig = useMemo(() => ({ responsive: true, displaylogo: false, toImageButtonOptions: { format: "png", filename: "num_frbs_chart", width: 1280, height: 720, scale: 2 }, modeBarButtonsToRemove: ["select2d", "lasso2d", "toggleSpikelines", "autoScale2d"] }), []);
  const handleFRBExport = () => {
    if (frbVisibleRows.length === 0) return;
    const rows = [["Year", "No. of Foreign Reinsurer's Branches"], ...frbVisibleRows.map((r) => [r.year, r.value])];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, "num_frbs.xlsx");
  };

  // Modal filter state
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSector, setSelectedSector] = useState("");
  const [selectedInsurerType, setSelectedInsurerType] = useState("");

  const resetNCState = () => {
    setShowNCTimelinePicker(false);
    setShowNCChartTypePicker(false);
    setNCVisualizationType("bar");
    setNCPendingVisualizationType("bar");
  };

  const resetIPState = () => {
    setShowIPTimelinePicker(false);
    setShowIPChartTypePicker(false);
    setIPVisualizationType("bar");
    setIPPendingVisualizationType("bar");
  };

  const resetIDState = () => {
    setShowIDTimelinePicker(false);
    setShowIDChartTypePicker(false);
    setIDVisualizationType("bar");
    setIDPendingVisualizationType("bar");
  };

  const resetMSState = () => {
    setShowMSTimelinePicker(false);
    setShowMSChartTypePicker(false);
    setMSVisualizationType("bar");
    setMSPendingVisualizationType("bar");
  };

  const resetFRBState = () => {
    setShowFRBTimelinePicker(false);
    setShowFRBChartTypePicker(false);
    setFRBVisualizationType("bar");
    setFRBPendingVisualizationType("bar");
  };

  const openModal = (metric, section) => {
    setActiveModal({ metric, section });
    setSelectedYear("");
    setSelectedSector("");
    setSelectedInsurerType("");
    resetNCState();
    resetIPState();
    resetIDState();
    resetMSState();
    resetFRBState();
  };

  const closeModal = () => {
    setActiveModal(null);
    resetNCState();
    resetIPState();
    resetIDState();
    resetMSState();
    resetFRBState();
  };
  
  const isNoFilterModal = ["num-companies", "ins-penetration", "ins-density", "market-share-psu", "num-reinsurers"].includes(activeModal?.metric?.id);

  // Helper to dynamically get metric-specific state & handlers based on activeModal
  const getMetricConfig = () => {
    const id = activeModal?.metric?.id;
    if (id === "num-companies") return { visibleRows: ncVisibleRows, timelineYearOptions: ncTimelineYearOptions, showTimeline: showNCTimelinePicker, setShowTimeline: setShowNCTimelinePicker, timelineStart: ncTimelineStartYear, timelineEnd: ncTimelineEndYear, setTimelineStart: setNCTimelineStartYear, setTimelineEnd: setNCTimelineEndYear, plotTraces: ncPlotTraces, plotLayout: ncPlotLayout, plotConfig: ncPlotConfig, handleExport: handleNCExport, visualizationType: ncVisualizationType, setVisualizationType: setNCVisualizationType, pendingVisualizationType: ncPendingVisualizationType, setPendingVisualizationType: setNCPendingVisualizationType, showChartType: showNCChartTypePicker, setShowChartType: setShowNCChartTypePicker, tableHeader: "No. of Companies" };
    if (id === "ins-penetration") return { visibleRows: ipVisibleRows, timelineYearOptions: ipTimelineYearOptions, showTimeline: showIPTimelinePicker, setShowTimeline: setShowIPTimelinePicker, timelineStart: ipTimelineStartYear, timelineEnd: ipTimelineEndYear, setTimelineStart: setIPTimelineStartYear, setTimelineEnd: setIPTimelineEndYear, plotTraces: ipPlotTraces, plotLayout: ipPlotLayout, plotConfig: ipPlotConfig, handleExport: handleIPExport, visualizationType: ipVisualizationType, setVisualizationType: setIPVisualizationType, pendingVisualizationType: ipPendingVisualizationType, setPendingVisualizationType: setIPPendingVisualizationType, showChartType: showIPChartTypePicker, setShowChartType: setShowIPChartTypePicker, tableHeader: "Insurance Penetration (%)" };
    if (id === "ins-density") return { visibleRows: idVisibleRows, timelineYearOptions: idTimelineYearOptions, showTimeline: showIDTimelinePicker, setShowTimeline: setShowIDTimelinePicker, timelineStart: idTimelineStartYear, timelineEnd: idTimelineEndYear, setTimelineStart: setIDTimelineStartYear, setTimelineEnd: setIDTimelineEndYear, plotTraces: idPlotTraces, plotLayout: idPlotLayout, plotConfig: idPlotConfig, handleExport: handleIDExport, visualizationType: idVisualizationType, setVisualizationType: setIDVisualizationType, pendingVisualizationType: idPendingVisualizationType, setPendingVisualizationType: setIDPendingVisualizationType, showChartType: showIDChartTypePicker, setShowChartType: setShowIDChartTypePicker, tableHeader: "Insurance Density (USD)" };
    if (id === "market-share-psu") return { visibleRows: msVisibleRows, timelineYearOptions: msTimelineYearOptions, showTimeline: showMSTimelinePicker, setShowTimeline: setShowMSTimelinePicker, timelineStart: msTimelineStartYear, timelineEnd: msTimelineEndYear, setTimelineStart: setMSTimelineStartYear, setTimelineEnd: setMSTimelineEndYear, plotTraces: msPlotTraces, plotLayout: msPlotLayout, plotConfig: msPlotConfig, handleExport: handleMSExport, visualizationType: msVisualizationType, setVisualizationType: setMSVisualizationType, pendingVisualizationType: msPendingVisualizationType, setPendingVisualizationType: setMSPendingVisualizationType, showChartType: showMSChartTypePicker, setShowChartType: setShowMSChartTypePicker, tableHeader: "Market Share of PSUs (%)" };
    if (id === "num-reinsurers") return { visibleRows: frbVisibleRows, timelineYearOptions: frbTimelineYearOptions, showTimeline: showFRBTimelinePicker, setShowTimeline: setShowFRBTimelinePicker, timelineStart: frbTimelineStartYear, timelineEnd: frbTimelineEndYear, setTimelineStart: setFRBTimelineStartYear, setTimelineEnd: setFRBTimelineEndYear, plotTraces: frbPlotTraces, plotLayout: frbPlotLayout, plotConfig: frbPlotConfig, handleExport: handleFRBExport, visualizationType: frbVisualizationType, setVisualizationType: setFRBVisualizationType, pendingVisualizationType: frbPendingVisualizationType, setPendingVisualizationType: setFRBPendingVisualizationType, showChartType: showFRBChartTypePicker, setShowChartType: setShowFRBChartTypePicker, tableHeader: "No. of Foreign Reinsurer's Branches" };
    return null;
  };

  const metricConfig = activeModal ? getMetricConfig() : null;

  return (
    <div className="summary-viewport">
      {/* Sections */}
      <div className="summary-sections-scroll">
        {SECTIONS.map((section) => {
          const SectionIcon = section.icon;
          return (
            <div
              key={section.id}
              className="summary-section-block"
              style={{ "--section-accent": section.accent, "--section-soft": section.bg }}
            >
              {/* Section header */}
              <div className="summary-section-header">
                <div className="summary-section-icon-wrap" style={{ background: section.bg }}>
                  <SectionIcon size={16} strokeWidth={2} color={section.accent} />
                </div>
                <h2 className="summary-section-title" style={{ color: section.accent }}>
                  {section.title}
                </h2>
              </div>

              {/* Cards grid */}
              <div className="summary-cards-grid">
                {section.metrics.map((metric) => {
                  return (
                    <button
                      key={metric.id}
                      type="button"
                      className="summary-metric-card"
                      style={{ "--s-accent": section.accent, "--s-bg": section.bg }}
                      onClick={() => openModal(metric, section)}
                    >
                      <div className="summary-metric-text">
                        <span className="summary-metric-title">{metric.title}</span>
                        <span className="summary-metric-desc">{metric.desc}</span>
                      </div>
                      {metric.id === "num-companies" && numCompaniesLatestValue != null && (
                        <span className="summary-metric-live-val" style={{ color: section.accent }}>
                          {numCompaniesLatestValue}
                        </span>
                      )}
                      {metric.id === "ins-penetration" && insPenetrationLatestValue != null && (
                        <span className="summary-metric-live-val" style={{ color: section.accent }}>
                          {Number(insPenetrationLatestValue).toFixed(2)}%
                        </span>
                      )}
                      {metric.id === "ins-density" && insDensityLatestValue != null && (
                        <span className="summary-metric-live-val" style={{ color: section.accent }}>
                          ${Number(insDensityLatestValue).toFixed(0)}
                        </span>
                      )}
                      {metric.id === "market-share-psu" && msPSULatestValue != null && (
                        <span className="summary-metric-live-val" style={{ color: section.accent }}>
                          {Number(msPSULatestValue).toFixed(2)}%
                        </span>
                      )}
                      {metric.id === "num-reinsurers" && numFRBsLatestValue != null && (
                        <span className="summary-metric-live-val" style={{ color: section.accent }}>
                          {numFRBsLatestValue}
                        </span>
                      )}
                      <ChevronRight
                        size={15}
                        strokeWidth={2.2}
                        className="summary-metric-chevron"
                        color={section.accent}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Modal ─────────────────────────────────── */}
      {activeModal && (
        <div className="summary-modal-overlay" onClick={closeModal}>
          <div className="summary-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div
              className="summary-modal-header"
              style={{ borderBottomColor: `color-mix(in srgb, ${activeModal.section.accent} 20%, transparent)` }}
            >
              <div className="summary-modal-header-left">
                <div
                  className="summary-modal-icon"
                  style={{ background: activeModal.section.bg }}
                >
                  {(() => {
                    const Icon = activeModal.metric.icon;
                    return <Icon size={18} strokeWidth={1.8} color={activeModal.section.accent} />;
                  })()}
                </div>
                <div>
                  <p className="summary-modal-section-tag">{activeModal.section.title}</p>
                  <h2 className="summary-modal-title">{activeModal.metric.title}</h2>
                </div>
              </div>
              <button className="summary-modal-close-btn" onClick={closeModal} aria-label="Close">
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Modal filter bar – hidden for no-filter modals */}
            {!isNoFilterModal && (
              <div className="summary-modal-filterbar">
                <div className="summary-filterbar-group">
                  <label className="summary-filterbar-label">Insurer Type</label>
                  <select
                    className="summary-filterbar-select"
                    value={selectedInsurerType}
                    onChange={(e) => setSelectedInsurerType(e.target.value)}
                  >
                    <option value="">All Insurers</option>
                    {INSURER_TYPE_OPTIONS.slice(1).map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div className="summary-filterbar-group">
                  <label className="summary-filterbar-label">Sector</label>
                  <select
                    className="summary-filterbar-select"
                    value={selectedSector}
                    onChange={(e) => setSelectedSector(e.target.value)}
                  >
                    <option value="">All Sectors</option>
                    {SECTOR_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Modal panel body */}
            <div className={`summary-modal-body${isNoFilterModal ? " summary-modal-body-2col" : ""}`}>
              {/* Filters panel – only for filtered modals */}
              {!isNoFilterModal && (
                <div className="summary-panel summary-panel-filters life-filters card">
                  <div className="panel-header">
                    <div className="panel-icon-badge">
                      <Shuffle size={13} strokeWidth={2} />
                    </div>
                    <h3 className="panel-title section-title">Filters</h3>
                    <button
                      type="button"
                      className="filter-refresh-btn"
                      onClick={() => { setSelectedYear(""); setSelectedSector(""); setSelectedInsurerType(""); }}
                      title="Reset filters"
                    >
                      <RefreshCw size={16} strokeWidth={2.4} />
                    </button>
                  </div>
                  <div className="panel-body summary-filters-body">
                    <div className="summary-filter-item">
                      <label className="filter-label label-text">Financial Year</label>
                      <select
                        className="summary-filter-select"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                      >
                        <option value="">All Years</option>
                        {YEAR_OPTIONS.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                    <div className="summary-filter-item">
                      <label className="filter-label label-text">Sector</label>
                      <select
                        className="summary-filter-select"
                        value={selectedSector}
                        onChange={(e) => setSelectedSector(e.target.value)}
                      >
                        <option value="">All Sectors</option>
                        {SECTOR_OPTIONS.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                    <div className="summary-filter-item">
                      <label className="filter-label label-text">Insurer Type</label>
                      <select
                        className="summary-filter-select"
                        value={selectedInsurerType}
                        onChange={(e) => setSelectedInsurerType(e.target.value)}
                      >
                        {INSURER_TYPE_OPTIONS.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      className="summary-apply-btn"
                      style={{ background: activeModal.section.accent }}
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              )}

              {/* Data panel */}
              <div className="summary-panel summary-panel-data life-data-panel card">
                <div className="panel-header">
                  <div className="panel-icon-badge">
                    <BarChart2 size={13} strokeWidth={2} />
                  </div>
                  <h3 className="panel-title section-title">Data Panel</h3>
                  {isNoFilterModal && metricConfig?.visibleRows.length > 0 && (
                    <button
                      type="button"
                      className="data-export-btn"
                      onClick={() => metricConfig.setShowTimeline((p) => !p)}
                      title="Select Timeline"
                    >
                      Select Timeline
                    </button>
                  )}
                  <button
                    type="button"
                    className="data-export-btn panel-action-btn"
                    onClick={isNoFilterModal && metricConfig ? metricConfig.handleExport : undefined}
                    disabled={isNoFilterModal ? !metricConfig || metricConfig.visibleRows.length === 0 : true}
                    title="Export to Excel"
                  >
                    Export to Excel
                  </button>
                </div>
                {isNoFilterModal && metricConfig ? (
                  <div className="panel-body" style={{ padding: 0, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column" }}>
                    {metricConfig.showTimeline && metricConfig.timelineYearOptions.length > 0 && (
                      <div className="timeline-filter-row">
                        <div className="timeline-field">
                          <label className="filter-label label-text">From</label>
                          <select
                            className="filter-select timeline-select"
                            value={metricConfig.timelineStart}
                            onChange={(e) => {
                              const val = e.target.value;
                              metricConfig.setTimelineStart(val);
                              if (metricConfig.timelineEnd && val > metricConfig.timelineEnd) metricConfig.setTimelineEnd(val);
                            }}
                          >
                            {metricConfig.timelineYearOptions.map((y) => (
                              <option key={`metric-s-${y}`} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>
                        <div className="timeline-field">
                          <label className="filter-label label-text">To</label>
                          <select
                            className="filter-select timeline-select"
                            value={metricConfig.timelineEnd}
                            onChange={(e) => {
                              const val = e.target.value;
                              metricConfig.setTimelineEnd(val);
                              if (metricConfig.timelineStart && val < metricConfig.timelineStart) metricConfig.setTimelineStart(val);
                            }}
                          >
                            {metricConfig.timelineYearOptions.map((y) => (
                              <option key={`metric-e-${y}`} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          className="timeline-apply-btn"
                          onClick={() => metricConfig.setShowTimeline(false)}
                          title="Apply Timeline"
                        >
                          Apply Timeline
                        </button>
                      </div>
                    )}
                    <div style={{ overflowY: "auto", flex: 1 }}>
                      <table className="summary-nc-table">
                        <thead>
                          <tr>
                            <th>Year</th>
                            <th>{metricConfig.tableHeader}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metricConfig.visibleRows.length > 0 ? metricConfig.visibleRows.map((row) => (
                            <tr key={row.year}>
                              <td>{row.year}</td>
                              <td>{row.value}</td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={2} style={{ textAlign: "center", color: "#94a3b8", padding: "20px" }}>
                                Loading data…
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="panel-body summary-panel-placeholder">
                    <div className="panel-state panel-state-empty">
                      <Info className="panel-state-icon" size={20} strokeWidth={2.2} />
                      <p className="panel-placeholder">Select filters to view analytics.</p>
                      <p className="panel-state-hint">Results will appear here after applying filters.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Visualization panel */}
              <div className="summary-panel summary-panel-viz life-viz-panel card">
                <div className="panel-header">
                  <div className="panel-icon-badge">
                    <Activity size={13} strokeWidth={2} />
                  </div>
                  <h3 className="panel-title section-title">Visualization</h3>
                  {isNoFilterModal && metricConfig?.visibleRows.length > 0 && (
                    <button
                      type="button"
                      className="data-export-btn"
                      onClick={() => metricConfig.setShowChartType((p) => !p)}
                      title="Select chart type"
                    >
                      Select Chart Type
                    </button>
                  )}
                </div>
                {isNoFilterModal && metricConfig && metricConfig.visibleRows.length > 0 ? (
                  <div className="panel-body viz-panel-body" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                    {metricConfig.showChartType && (
                      <div className="timeline-filter-row chart-type-picker-row">
                        <div className="timeline-field">
                          <label className="filter-label label-text">Chart Type</label>
                          <select
                            className="filter-select timeline-select"
                            value={metricConfig.pendingVisualizationType}
                            onChange={(e) => metricConfig.setPendingVisualizationType(e.target.value)}
                          >
                            <option value="line">Line Chart</option>
                            <option value="area">Area Chart</option>
                            <option value="bar">Bar Chart</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          className="timeline-apply-btn"
                          onClick={() => { metricConfig.setVisualizationType(metricConfig.pendingVisualizationType); metricConfig.setShowChartType(false); }}
                          title="Apply chart type"
                        >
                          Apply Chart Type
                        </button>
                      </div>
                    )}
                    <div className="chart-wrapper plotly-chart-wrapper" style={{ flex: 1, minHeight: 0 }}>
                      <Plot
                        className="plot-component-fill"
                        data={metricConfig.plotTraces}
                        layout={metricConfig.plotLayout}
                        config={metricConfig.plotConfig}
                        useResizeHandler
                      />
                    </div>
                  </div>
                ) : (
                  <div className="panel-body summary-panel-placeholder">
                    <div className="panel-state panel-state-empty">
                      <Info className="panel-state-icon" size={20} strokeWidth={2.2} />
                      <p className="panel-placeholder">Chart will appear here.</p>
                      <p className="panel-state-hint">Apply filters in the Data Panel to generate a chart.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
