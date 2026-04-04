import { useState, useEffect, useMemo, useRef } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import * as XLSX from "xlsx";
import { BarChart3, Info, Loader2, Maximize2, Minimize2, RefreshCw, Shuffle, X } from "lucide-react";
import { db } from "../firebase/firebaseConfig";

const C_POLICIES  = "avg_individual_policies_agents";
const C_PREMIUM_A = "avg_new_business_premium_income_per_agent";
const C_PREMIUM_P = "avg_premium_income_per_policy_per_agent";

const YEARS = ["2014-15","2015-16","2016-17","2017-18","2018-19",
               "2019-20","2020-21","2021-22","2022-23","2023-24","2024-25"];

const SHORT = {
  "Life Insurance Corporation of India": "LIC",
  "Aditya Birla Sunlife Insurance Company Ltd.": "ABSLI",
  "Ageas Federal Life Insurance Company Ltd.": "Ageas Federal",
  "Aviva Life Insurance Company India Ltd.": "Aviva",
  "Bajaj Allianz Life Insurance Company Ltd.": "Bajaj Allianz",
  "Bharti AXA Life Insurance Company Ltd.": "Bharti AXA",
  "Canara HSBC Life Insurance Company Ltd.": "Canara HSBC",
  "Credit Access Life Insurance Ltd.": "CreditAccess",
  "Edelweiss Tokio Life Insurance Company Ltd.": "Edelweiss",
  "Exide Life Insurance Company Ltd.": "Exide Life",
  "Future Generali India Life Insurance Company Ltd.": "Future Generali",
  "Go Digit Life Insurance Ltd.": "Go Digit",
  "HDFC Life Insurance Company Ltd.": "HDFC Life",
  "ICICI Prudential Life Insurance Company Ltd.": "ICICI Pru",
  "IndiaFirst Life Insurance Company Ltd.": "IndiaFirst",
  "Kotak Mahindra Life Insurance Ltd.": "Kotak",
  "MaxLife  Insurance Company Ltd.": "Max Life",
  "PNB Metlife India Insurance Company Ltd.": "PNB MetLife",
  "Pramerica Life Insurance Company Ltd.": "Pramerica",
  "Reliance Nippon  Life Insurance Company Ltd.": "Reliance Nippon",
  "SBI Life Insurance Company Ltd.": "SBI Life",
  "Sahara  India Life Insurance Company Ltd.": "Sahara",
  "Shriram Life Insurance Company Ltd.": "Shriram",
  "Star Union Dai-ichi Life Insurance Company Ltd.": "Star Union",
  "TATA AIA Life Insurance Company Ltd.": "Tata AIA",
  "Acko Life Insurance Ltd.": "Acko",
  "Bandhan Life Insurance Ltd.": "Bandhan",
};

const SECTOR_COLOR = {
  "Life Insurance Corporation of India": "#f59e0b",
};
const PALETTE = ["#0d9488","#6366f1","#ec4899","#14b8a6","#8b5cf6",
                 "#f97316","#06b6d4","#84cc16","#ef4444","#3b82f6",
                 "#a855f7","#10b981","#f43f5e","#eab308","#64748b",
                 "#0ea5e9","#d946ef","#22c55e","#fb923c","#7c3aed",
                 "#0891b2","#65a30d","#dc2626","#ca8a04","#475569","#9333ea"];

function fmt(n, type) {
  if (!n || n <= 0) return "—";
  if (type === "premium_per_policy") return "₹" + Math.round(n).toLocaleString("en-IN");
  if (type === "premium_per_agent")  return "₹" + n.toFixed(2) + "L";
  return n.toFixed(2);
}

const QUADRANT_LABELS = [
  { x: "high", y: "high", label: "Stars",         desc: "High volume + high ticket",   color: "#0d9488" },
  { x: "low",  y: "high", label: "Premium Niche",  desc: "Low volume but high ticket",  color: "#6366f1" },
  { x: "high", y: "low",  label: "Volume Players", desc: "High volume, lower ticket",   color: "#f59e0b" },
  { x: "low",  y: "low",  label: "Laggards",       desc: "Low volume and low ticket",   color: "#94a3b8" },
];

export default function ProductivityQuadrant() {
  // Draft filter state (before Apply)
  const [draftAgentType, setDraftAgentType] = useState("");
  const [draftYear, setDraftYear]           = useState("");
  const [draftView, setDraftView]           = useState("");

  // Applied filter state
  const [agentType, setAgentType] = useState("");
  const [year, setYear]           = useState("");
  const [viewMode, setViewMode]   = useState("");

  // Chart interaction
  const [hovered, setHovered]   = useState(null);
  const [selected, setSelected] = useState(null); // used in normal mode for right panel
  // Popup — only shown in fullscreen mode
  const [popup, setPopup]       = useState(null); // { ins, x, y } | null

  // Fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fsW, setFsW] = useState(0);
  const [fsH, setFsH] = useState(0);

  // Refs
  const chartPanelRef      = useRef(null);
  const bubbleContainerRef = useRef(null);
  const svgRef             = useRef(null);
  const popupRef           = useRef(null);
  const popupInsRef        = useRef(null); // sync tracker for same-bubble toggle

  // Data
  const [cache, setCache]     = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // Ranking table sort
  const [rankSort, setRankSort] = useState({ key: "policies", dir: "desc" });

  useEffect(() => {
    if (!agentType) return;
    if (cache[agentType]) return;
    setLoading(true);
    setError(null);

    const q = (col) => getDocs(query(collection(db, col), where("agent_type", "==", agentType)));

    Promise.all([q(C_POLICIES), q(C_PREMIUM_A), q(C_PREMIUM_P)])
      .then(([snapP, snapA, snapPP]) => {
        const toMap = (snap, field) => {
          const m = {};
          snap.forEach(doc => {
            const { insurer, year: yr, [field]: val } = doc.data();
            if (!m[insurer]) m[insurer] = {};
            m[insurer][yr] = val ?? 0;
          });
          return m;
        };
        setCache(prev => ({
          ...prev,
          [agentType]: {
            policies: toMap(snapP,  "avg_policies"),
            premiumA: toMap(snapA,  "avg_new_business_premium_income_per_agent"),
            premiumP: toMap(snapPP, "avg_premium_income_per_policy_per_agent"),
          }
        }));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [agentType]);

  const points = useMemo(() => {
    const d = cache[agentType];
    if (!d) return [];
    const result = [];
    const insurers = Object.keys(d.policies);
    insurers.forEach((ins, i) => {
      const x = d.policies[ins]?.[year] ?? 0;
      const y = d.premiumP[ins]?.[year] ?? 0;
      const z = d.premiumA[ins]?.[year] ?? 0;
      if (x <= 0 || y <= 0) return;
      result.push({ ins, short: SHORT[ins] ?? ins.slice(0, 12), x, y, z, i });
    });
    return result;
  }, [cache, agentType, year]);

  const { medX, medY, maxX, maxY, maxZ } = useMemo(() => {
    if (!points.length) return { medX: 1, medY: 50000, maxX: 20, maxY: 200000, maxZ: 1 };
    const xs = points.map(p => p.x).sort((a, b) => a - b);
    const ys = points.map(p => p.y).sort((a, b) => a - b);
    const mid = arr => arr[Math.floor(arr.length / 2)];
    return {
      medX: mid(xs),
      medY: mid(ys),
      maxX: Math.max(...xs) * 1.15,
      maxY: Math.max(...ys) * 1.15,
      maxZ: Math.max(...points.map(p => p.z)),
    };
  }, [points]);

  // Apply / Reset handlers
  const handleApply = () => {
    setAgentType(draftAgentType);
    setYear(draftYear);
    setViewMode(draftView);
    setSelected(null);
    popupInsRef.current = null;
    setPopup(null);
  };

  const handleReset = () => {
    setDraftAgentType("");
    setDraftYear("");
    setDraftView("");
    setAgentType("");
    setYear("");
    setViewMode("");
    setSelected(null);
    popupInsRef.current = null;
    setPopup(null);
  };

  const hasApplied = Boolean(agentType && year && viewMode);

  const handleDownloadChart = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width  = svg.width?.baseVal?.value  || W;
      canvas.height = svg.height?.baseVal?.value || H;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      const agentTypeLabel = agentType === "individual_agent" ? "Individual" : "Corporate";
      link.download = `productivity-quadrant_${agentTypeLabel}_${year}.png`.replace(/[^a-z0-9_.-]/gi, "-");
      link.href = pngUrl;
      link.click();
    };
    img.src = url;
  };

  const W = isFullscreen ? Math.max(800, fsW) : 1100;
  const H = isFullscreen ? Math.max(500, fsH) : 750;
  const PAD = { top: 50, right: 40, bottom: 70, left: 90 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top  - PAD.bottom;

  const toSvgX = x => PAD.left + (x / maxX) * plotW;
  const toSvgY = y => PAD.top  + plotH - (y / maxY) * plotH;
  const toBubbleR = z => z <= 0 ? 0 : 8 + (z / (maxZ || 1)) * 26;

  const qLineX = toSvgX(medX);
  const qLineY = toSvgY(medY);

  // In normal mode: hover OR selected drives right panel
  // In fullscreen: hover OR popup drives the trend path
  const activeIns = isFullscreen ? (hovered || popup?.ins) : (hovered || selected);
  const activeData = activeIns ? cache[agentType] : null;

  const trendPoints = useMemo(() => {
    if (!activeIns || !activeData) return [];
    return YEARS.map(yr => ({
      yr,
      x: activeData.policies[activeIns]?.[yr] ?? 0,
      y: activeData.premiumP[activeIns]?.[yr]  ?? 0,
      z: activeData.premiumA[activeIns]?.[yr]  ?? 0,
    })).filter(p => p.x > 0 && p.y > 0);
  }, [activeIns, activeData]);

  const colorMap = useMemo(() => {
    const m = {};
    points.forEach((p) => {
      m[p.ins] = SECTOR_COLOR[p.ins] ?? PALETTE[p.i % PALETTE.length];
    });
    return m;
  }, [points]);

  // Ranking sort helpers
  const rankSortFn = (a, b) => {
    const d = cache[agentType];
    if (!d) return 0;
    const getVal = (p) => {
      if (rankSort.key === "policies") return d.policies[p.ins]?.[year] ?? 0;
      if (rankSort.key === "premiumA") return d.premiumA[p.ins]?.[year] ?? 0;
      if (rankSort.key === "premiumP") return d.premiumP[p.ins]?.[year] ?? 0;
      return 0;
    };
    return rankSort.dir === "desc" ? getVal(b) - getVal(a) : getVal(a) - getVal(b);
  };

  const toggleSort = (key) => {
    setRankSort(prev => ({ key, dir: prev.key === key && prev.dir === "desc" ? "asc" : "desc" }));
  };

  // ── Fullscreen: sync state on browser fullscreen change ───────────────────
  useEffect(() => {
    const handleFsChange = () => {
      const isFull = document.fullscreenElement === chartPanelRef.current;
      setIsFullscreen(isFull);
      if (isFull) {
        setFsW(window.innerWidth - 40);
        // Reserve: ~44px panel-header + ~38px filter bar + ~30px legend pills + ~10px bubble legend + gaps
        setFsH(window.innerHeight - 200);
      } else {
        // Clear popup when leaving fullscreen
        popupInsRef.current = null;
        setPopup(null);
      }
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // ── Close popup on Escape ─────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") { popupInsRef.current = null; setPopup(null); }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const toggleFullscreen = () => {
    if (!isFullscreen) chartPanelRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  const handleExportRanking = () => {
    const d = cache[agentType];
    if (!d || !points.length) return;

    const agentTypeLabel = agentType === "individual_agent" ? "Individual Agent" : "Corporate Agent";

    const activeFilters = [
      { label: "Agent Type", value: agentTypeLabel },
      { label: "Year",       value: year },
    ];

    const dataHeader = [
      "Insurer",
      "Avg Policies / Agent",
      "Avg New Business Premium / Agent (₹L)",
      "Avg Premium / Policy (₹)",
    ];

    const dataRows = [...points].sort(rankSortFn).map(p => [
      p.ins,
      d.policies[p.ins]?.[year] ?? "",
      d.premiumA[p.ins]?.[year] ?? "",
      d.premiumP[p.ins]?.[year] ? Math.round(d.premiumP[p.ins][year]) : "",
    ]);

    const exportRows = [
      ["Sub Module", "Productivity Quadrant"],
      [],
      ["Applied Filters", "Value"],
      ...activeFilters.map(f => [f.label, f.value || "-"]),
      [],
      dataHeader,
      ...dataRows,
    ];

    const slug = v => String(v).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const filterPart = activeFilters.filter(f => f.value).map(f => `${slug(f.label)}-${slug(f.value)}`).join("_");
    const datePart   = new Date().toISOString().slice(0, 10);
    const fileBaseName = ["productivity-quadrant", filterPart, datePart].filter(Boolean).join("_");

    try {
      const ws = XLSX.utils.aoa_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Productivity");
      XLSX.writeFile(wb, `${fileBaseName}.xlsx`);
    } catch {
      const csvContent = exportRows
        .map(row => row.map(v => `"${String(v === undefined ? "" : v).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", `${fileBaseName}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleExportInsurerDetails = (ins) => {
    const d = cache[agentType];
    if (!d || !ins) return;

    const agentTypeLabel = agentType === "individual_agent" ? "Individual Agent" : "Corporate Agent";

    const activeFilters = [
      { label: "Agent Type", value: agentTypeLabel },
      { label: "Year",       value: year },
      { label: "Insurer",    value: ins },
    ];

    const exportRows = [
      ["Sub Module", "Productivity Quadrant"],
      [],
      ["Applied Filters", "Value"],
      ...activeFilters.map(f => [f.label, f.value || "-"]),
      [],
      ["Metric", "Value"],
      ["Avg Policies / Agent",                   d.policies[ins]?.[year] ?? ""],
      ["Avg New Business Premium / Agent (₹L)",  d.premiumA[ins]?.[year] ?? ""],
      ["Avg Premium / Policy (₹)",               d.premiumP[ins]?.[year] ? Math.round(d.premiumP[ins][year]) : ""],
    ];

    const slug = v => String(v).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const datePart = new Date().toISOString().slice(0, 10);
    const fileBaseName = ["productivity-quadrant", "insurer-details", slug(ins).slice(0, 30), datePart].filter(Boolean).join("_");

    try {
      const ws = XLSX.utils.aoa_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Insurer Details");
      XLSX.writeFile(wb, `${fileBaseName}.xlsx`);
    } catch {
      const csvContent = exportRows
        .map(row => row.map(v => `"${String(v === undefined ? "" : v).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", `${fileBaseName}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "row", gap: 16, padding: "12px 24px 18px", overflow: "hidden", height: "100%", boxSizing: "border-box" }}>

      {/* popup fade-in keyframes */}
      <style>{`@keyframes pq-popup-in{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}`}</style>

      {/* ── FILTER PANEL ── */}
      <div className="life-filters card" style={{ flex: "0 0 240px", width: 240, minWidth: 0 }}>
        <div className="panel-header">
          <div className="panel-icon-badge"><Shuffle size={14} strokeWidth={2} /></div>
          <h3 className="panel-title section-title">Filters</h3>
          <button className="filter-refresh-btn" onClick={handleReset} title="Reset filters">
            <RefreshCw size={18} strokeWidth={2.4} className="refresh-icon" />
          </button>
        </div>
        <div className="filters-body">
          <div className="filter-item">
            <label className="filter-label label-text">Agent Type</label>
            <div className="premium-toggle-group">
              {[{ v: "individual_agent", l: "Individual" }, { v: "corporate_agent", l: "Corporate" }].map(({ v, l }) => (
                <button key={v} className={`premium-toggle-btn${draftAgentType === v ? " active" : ""}`} onClick={() => setDraftAgentType(v)}>{l}</button>
              ))}
            </div>
          </div>
          <div className="filter-item">
            <label className="filter-label label-text">Select Year</label>
            <select className="filter-select" value={draftYear} onChange={e => setDraftYear(e.target.value)}>
              <option value="">Select Year</option>
              {YEARS.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div className="filter-item">
            <label className="filter-label label-text">View</label>
            <div className="premium-toggle-group">
              {[{ v: "bubble", l: "Bubble Chart" }, { v: "ranking", l: "Ranking by Metric" }].map(({ v, l }) => (
                <button key={v} className={`premium-toggle-btn${draftView === v ? " active" : ""}`} onClick={() => setDraftView(v)}>{l}</button>
              ))}
            </div>
          </div>
          <button className="apply-filters-btn" style={{ marginTop: 8, width: "100%" }} onClick={handleApply}
            disabled={!draftAgentType || !draftYear || !draftView}>
            Apply Filters
          </button>
        </div>
      </div>

      {/* ── CHART / DATA PANEL ── */}
      <div
        className="life-data-panel card"
        ref={chartPanelRef}
        style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", ...(isFullscreen ? { background: "white" } : {}) }}
      >
        <div className="panel-header">
          <div className="panel-icon-badge"><BarChart3 size={14} strokeWidth={2} /></div>
          <h3 className="panel-title section-title">
            {hasApplied && viewMode === "ranking" ? "Ranking by Metric" : "Productivity Quadrant"}
          </h3>
          {hasApplied && viewMode === "ranking" && (
            <button className="data-export-btn panel-action-btn" style={{ marginLeft: "auto" }} onClick={handleExportRanking}>Export to Excel</button>
          )}
          {hasApplied && viewMode === "bubble" && (
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
              {points.length > 0 && (
                <button
                  title="Download chart as PNG"
                  onClick={handleDownloadChart}
                  style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: "4px 6px", borderRadius: 6, color: "#475569" }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </button>
              )}
              <button
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                onClick={toggleFullscreen}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: "4px 6px", borderRadius: 6, color: "#475569" }}
              >
                {isFullscreen ? <Minimize2 size={16} strokeWidth={2} /> : <Maximize2 size={16} strokeWidth={2} />}
              </button>
            </div>
          )}
        </div>

        {/* Compact filter bar shown inside fullscreen */}
        {isFullscreen && hasApplied && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 20px", borderBottom: "1px solid #e8f5f5", flexShrink: 0, background: "white", flexWrap: "nowrap", minHeight: 36 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#475569", whiteSpace: "nowrap" }}>Agent Type:</span>
            <div style={{ display: "flex", gap: 4 }}>
              {[{ v: "individual_agent", l: "Individual" }, { v: "corporate_agent", l: "Corporate" }].map(({ v, l }) => (
                <button key={v} className={`premium-toggle-btn${agentType === v ? " active" : ""}`}
                  style={{ fontSize: 11, padding: "4px 14px", whiteSpace: "nowrap", lineHeight: 1.4, height: 28 }}
                  onClick={() => { setAgentType(v); setDraftAgentType(v); popupInsRef.current = null; setPopup(null); }}>{l}</button>
              ))}
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginLeft: 10, whiteSpace: "nowrap" }}>Year:</span>
            <select className="filter-select" value={year} style={{ fontSize: 11, padding: "3px 8px", height: 28, minWidth: 100 }}
              onChange={e => { setYear(e.target.value); setDraftYear(e.target.value); popupInsRef.current = null; setPopup(null); }}>
              <option value="">Select Year</option>
              {YEARS.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
        )}

        <div className="panel-body" style={{ flex: 1, overflow: isFullscreen ? "hidden" : "auto", position: "relative", padding: 0, minHeight: 0 }}>
          {!hasApplied ? (
            <div className="panel-state panel-state-empty" style={{ margin: "40px auto" }}>
              <Info className="panel-state-icon" size={24} />
              <p className="panel-placeholder">Select filters and click Apply Filters to view data.</p>
            </div>
          ) : loading ? (
            <div className="panel-state panel-state-loading" style={{ margin: "40px auto" }}>
              <Loader2 className="panel-state-icon spinning" size={24} />
              <p className="panel-placeholder">Loading data…</p>
            </div>
          ) : error ? (
            <div className="panel-state panel-state-error" style={{ margin: "40px auto" }}>
              <p className="panel-placeholder">⚠️ {error}</p>
            </div>
          ) : points.length === 0 ? (
            <div className="panel-state panel-state-empty" style={{ margin: "40px auto" }}>
              <p className="panel-placeholder">No data available for this selection.</p>
            </div>
          ) : viewMode === "bubble" ? (

            /* ── BUBBLE CHART ── */
            <div
              ref={bubbleContainerRef}
              style={{ padding: isFullscreen ? "4px 4px 0" : "8px 4px 20px", minWidth: isFullscreen ? undefined : "max-content", position: "relative", display: isFullscreen ? "flex" : "block", flexDirection: isFullscreen ? "column" : undefined, height: isFullscreen ? "100%" : undefined }}
              onClick={() => { popupInsRef.current = null; setPopup(null); }}
            >
              {/* Quadrant legend pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 10px", marginBottom: isFullscreen ? 4 : 16, flexShrink: 0 }}>
                {[
                  { desc: "High volume + high ticket", color: "#0d9488" },
                  { desc: "Low volume, high ticket",   color: "#6366f1" },
                  { desc: "High volume, lower ticket", color: "#f59e0b" },
                  { desc: "Low volume and low ticket", color: "#94a3b8" },
                ].map(q => (
                  <span key={q.desc} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#475569", background: q.color + "14", border: `1px solid ${q.color}35`, borderRadius: 20, padding: "4px 12px" }}>
                    <span style={{ width: 9, height: 9, borderRadius: "50%", background: q.color, flexShrink: 0 }} />
                    {q.desc}
                  </span>
                ))}
              </div>

              {/* SVG Chart */}
              <svg ref={svgRef} width={W} height={H} overflow="visible" style={{ display: "block", flex: isFullscreen ? "1 1 auto" : undefined, minHeight: 0 }}>
                {/* Quadrant backgrounds */}
                <rect x={PAD.left} y={PAD.top}  width={qLineX - PAD.left}      height={qLineY - PAD.top}        fill="#6366f108" />
                <rect x={qLineX}   y={PAD.top}  width={W - PAD.right - qLineX} height={qLineY - PAD.top}        fill="#0d948808" />
                <rect x={PAD.left} y={qLineY}   width={qLineX - PAD.left}      height={H - PAD.bottom - qLineY} fill="#94a3b808" />
                <rect x={qLineX}   y={qLineY}   width={W - PAD.right - qLineX} height={H - PAD.bottom - qLineY} fill="#f59e0b08" />
                {/* Quadrant dividers */}
                <line x1={qLineX} y1={PAD.top} x2={qLineX} y2={H - PAD.bottom} stroke="#0d948860" strokeWidth={1.5} strokeDasharray="8,5" />
                <line x1={PAD.left} y1={qLineY} x2={W - PAD.right} y2={qLineY} stroke="#0d948860" strokeWidth={1.5} strokeDasharray="8,5" />
                {/* Y grid lines */}
                {[0.25, 0.5, 0.75, 1].map(t => {
                  const sy = toSvgY(t * maxY);
                  return <line key={t} x1={PAD.left} y1={sy} x2={W - PAD.right} y2={sy} stroke="#e2e8f0" strokeWidth={1} />;
                })}
                {/* X grid lines */}
                {[0.25, 0.5, 0.75, 1].map(t => {
                  const sx = toSvgX(t * maxX);
                  return <line key={t} x1={sx} y1={PAD.top} x2={sx} y2={H - PAD.bottom} stroke="#e2e8f0" strokeWidth={1} />;
                })}
                {/* Axes */}
                <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke="#64748b" strokeWidth={2} />
                <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke="#64748b" strokeWidth={2} />
                {/* X ticks + labels */}
                {[0, 0.25, 0.5, 0.75, 1].map(t => {
                  const val = t * maxX;
                  const sx  = toSvgX(val);
                  return (
                    <g key={t}>
                      <line x1={sx} y1={H - PAD.bottom} x2={sx} y2={H - PAD.bottom + 7} stroke="#64748b" strokeWidth={1.5} />
                      <text x={sx} y={H - PAD.bottom + 22} textAnchor="middle" fontSize={13} fontWeight="600" fill="#334155">
                        {val.toFixed(agentType === "corporate_agent" ? 0 : 1)}
                      </text>
                    </g>
                  );
                })}
                {/* Y ticks + labels */}
                {[0, 0.25, 0.5, 0.75, 1].map(t => {
                  const val = t * maxY;
                  const sy  = toSvgY(val);
                  return (
                    <g key={t}>
                      <line x1={PAD.left - 7} y1={sy} x2={PAD.left} y2={sy} stroke="#64748b" strokeWidth={1.5} />
                      <text x={PAD.left - 12} y={sy + 4} textAnchor="end" fontSize={13} fontWeight="600" fill="#334155">
                        {val >= 100000 ? (val / 100000).toFixed(1) + "L" : val >= 1000 ? (val / 1000).toFixed(0) + "K" : val.toFixed(0)}
                      </text>
                    </g>
                  );
                })}
                {/* Axis labels */}
                <text x={PAD.left + plotW / 2} y={H - PAD.bottom + 50} textAnchor="middle" fontSize={14} fontWeight="700" fill="#0f4c5c" letterSpacing="0.3">
                  Avg Policies per Agent
                </text>
                <text transform={`rotate(-90,18,${PAD.top + plotH / 2})`} x={18} y={PAD.top + plotH / 2} textAnchor="middle" fontSize={14} fontWeight="700" fill="#0f4c5c" letterSpacing="0.3">
                  Avg Premium per Policy (₹)
                </text>
                {/* Trend path for hovered/popup insurer */}
                {trendPoints.length > 1 && (
                  <polyline
                    points={trendPoints.map(p => `${toSvgX(p.x)},${toSvgY(p.y)}`).join(" ")}
                    fill="none"
                    stroke={colorMap[activeIns] ?? "#0d9488"}
                    strokeWidth={2}
                    strokeDasharray="5,3"
                    opacity={0.5}
                  />
                )}
                {/* Bubbles */}
                {points.map(p => {
                  const cx = toSvgX(p.x);
                  const cy = toSvgY(p.y);
                  const r  = toBubbleR(p.z);
                  const col = colorMap[p.ins] ?? "#0d9488";
                  const isActive   = activeIns === p.ins;
                  const isSelected = isFullscreen ? popup?.ins === p.ins : selected === p.ins;
                  const labelText  = SHORT[p.ins] ?? p.ins.split(" ").slice(0, 2).join(" ");
                  // Normal mode: labels for r > 10 or active; Fullscreen: all labels
                  const showLabel  = isFullscreen || isActive || r > 10;
                  return (
                    <g key={p.ins} style={{ cursor: "pointer" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isFullscreen) {
                          // Fullscreen: toggle floating popup
                          if (popupInsRef.current === p.ins) {
                            popupInsRef.current = null;
                            setPopup(null);
                          } else {
                            const rect = bubbleContainerRef.current?.getBoundingClientRect();
                            popupInsRef.current = p.ins;
                            setPopup({ ins: p.ins, x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) });
                          }
                        } else {
                          // Normal mode: select for right panel
                          setSelected(prev => prev === p.ins ? null : p.ins);
                        }
                      }}
                      onMouseEnter={() => setHovered(p.ins)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      <circle cx={cx} cy={cy} r={r + 8} fill="transparent" />
                      {(isActive || isSelected) && <circle cx={cx} cy={cy} r={r + 5} fill={col} fillOpacity={0.15} />}
                      <circle cx={cx} cy={cy} r={r}
                        fill={col}
                        fillOpacity={(isActive || isSelected) ? 0.92 : 0.58}
                        stroke={col}
                        strokeWidth={(isActive || isSelected) ? 3 : 1.5}
                      />
                      {showLabel && (
                        <text x={cx} y={cy - r - 6} textAnchor="middle" fontSize={isActive ? 10 : 9}
                          fontWeight={isActive ? "700" : "600"} fill={col}
                          style={{ paintOrder: "stroke", stroke: "white", strokeWidth: isActive ? 3 : 2, strokeLinejoin: "round" }}>
                          {isActive ? p.ins : labelText}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Bubble size legend — hidden in fullscreen to save space */}
              {!isFullscreen && (
                <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 16, paddingLeft: PAD.left }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Bubble size = Avg premium / agent (₹L)</span>
                  {[0.25, 0.6, 1].map(t => (
                    <div key={t} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 8 + t * 26, height: 8 + t * 26, borderRadius: "50%", background: "#0d948830", border: "2px solid #0d9488", flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{(t * (maxZ || 1)).toFixed(1)}L</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Floating bubble popup (fullscreen only) ── */}
              {isFullscreen && popup && (() => {
                const containerRect = bubbleContainerRef.current?.getBoundingClientRect();
                const containerW = containerRect?.width  ?? 800;
                const containerH = containerRect?.height ?? 600;
                const POPUP_W = 280, POPUP_H = 195;
                const flipX = popup.x + 20 + POPUP_W > containerW;
                const flipY = popup.y - 10 + POPUP_H > containerH;
                const left  = flipX ? popup.x - 20 - POPUP_W : popup.x + 20;
                const top   = flipY ? popup.y - 10 - POPUP_H : popup.y - 10;
                const ins   = popup.ins;
                const col   = colorMap[ins] ?? "#0d9488";
                const isPublic = ins === "Life Insurance Corporation of India";
                return (
                  <div
                    ref={popupRef}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: "absolute", left, top, width: POPUP_W,
                      background: "white", borderRadius: 12,
                      border: `1.5px solid ${col}`,
                      boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
                      zIndex: 100,
                      animation: "pq-popup-in 150ms ease-out forwards",
                      transformOrigin: flipX ? "right center" : "left center",
                      overflow: "hidden",
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px 8px", borderBottom: `1px solid ${col}25` }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: col, flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontWeight: 700, fontSize: 11, color: "#0f172a", flex: 1, lineHeight: 1.4 }}>
                        {ins}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, borderRadius: 10, padding: "2px 7px",
                          color: isPublic ? "#92400e" : "#4c1d95",
                          background: isPublic ? "#fef3c7" : "#ede9fe" }}>
                          {isPublic ? "Public" : "Private"}
                        </span>
                        <button
                          onClick={() => { popupInsRef.current = null; setPopup(null); }}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", color: "#94a3b8" }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Metric rows */}
                    <div style={{ padding: "8px 12px 10px" }}>
                      {[
                        { label: "Policies / Agent",  val: fmt(cache[agentType]?.policies[ins]?.[year], "policies") },
                        { label: "Premium / Agent",   val: fmt(cache[agentType]?.premiumA[ins]?.[year], "premium_per_agent") },
                        { label: "Premium / Policy",  val: fmt(cache[agentType]?.premiumP[ins]?.[year], "premium_per_policy") },
                      ].map(m => (
                        <div key={m.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #f1f5f9" }}>
                          <span style={{ fontSize: 11, color: "#64748b" }}>{m.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{m.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

          ) : (

            /* ── RANKING TABLE ── */
            <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "calc(100vh - 280px)" }}>
            <table className="segment-data-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th className="col-index" style={{ position: "sticky", top: 0, zIndex: 10 }}>#</th>
                  <th style={{ textAlign: "left", position: "sticky", top: 0, zIndex: 10 }}>Insurer</th>
                  <th style={{ cursor: "pointer", position: "sticky", top: 0, zIndex: 10 }} onClick={() => toggleSort("policies")}>
                    Avg Policies / Agent {rankSort.key === "policies" ? (rankSort.dir === "desc" ? "↓" : "↑") : ""}
                  </th>
                  <th style={{ cursor: "pointer", position: "sticky", top: 0, zIndex: 10 }} onClick={() => toggleSort("premiumA")}>
                    Avg New Business Premium / Agent (₹L) {rankSort.key === "premiumA" ? (rankSort.dir === "desc" ? "↓" : "↑") : ""}
                  </th>
                  <th style={{ cursor: "pointer", position: "sticky", top: 0, zIndex: 10 }} onClick={() => toggleSort("premiumP")}>
                    Avg Premium / Policy (₹) {rankSort.key === "premiumP" ? (rankSort.dir === "desc" ? "↓" : "↑") : ""}
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...points].sort(rankSortFn).map((p, i) => (
                  <tr key={p.ins}>
                    <td className="col-index">{i + 1}</td>
                    <td style={{ textAlign: "left", fontWeight: 600, whiteSpace: "normal" }}>{p.ins}</td>
                    <td>{fmt(cache[agentType]?.policies[p.ins]?.[year], "policies")}</td>
                    <td>{fmt(cache[agentType]?.premiumA[p.ins]?.[year], "premium_per_agent")}</td>
                    <td>{fmt(cache[agentType]?.premiumP[p.ins]?.[year], "premium_per_policy")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

          )}
        </div>
      </div>

      {/* ── INSURER DETAIL PANEL (bubble mode only) ── */}
      {hasApplied && viewMode === "bubble" && (
        <div className="life-data-panel card" style={{ flex: "0 0 290px", display: "flex", flexDirection: "column" }}>
          <div className="panel-header">
            <div className="panel-icon-badge"><Info size={14} strokeWidth={2} /></div>
            <h3 className="panel-title section-title">Insurer Details</h3>
            {selected && (
              <button className="data-export-btn panel-action-btn" style={{ marginLeft: "auto" }} onClick={() => handleExportInsurerDetails(selected)}>Export to Excel</button>
            )}
          </div>
          <div className="panel-body" style={{ flex: 1, overflow: "auto" }}>
            {activeIns ? (
              <div style={{ padding: "4px 2px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid #e8f5f5" }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", background: colorMap[activeIns] ?? "#0d9488", marginTop: 3, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f3d3d", lineHeight: 1.4 }}>{activeIns}</div>
                    <div style={{ fontSize: 11, color: "#5a9090", marginTop: 3 }}>
                      {year} · {agentType === "individual_agent" ? "Individual" : "Corporate"} agents
                    </div>
                  </div>
                </div>
                {[
                  { label: "Policies / Agent",  val: fmt(cache[agentType]?.policies[activeIns]?.[year], "policies"),           sub: "avg number of policies", accent: "#0d9488" },
                  { label: "Premium / Agent",   val: fmt(cache[agentType]?.premiumA[activeIns]?.[year], "premium_per_agent"),  sub: "new business premium",   accent: "#6366f1" },
                  { label: "Premium / Policy",  val: fmt(cache[agentType]?.premiumP[activeIns]?.[year], "premium_per_policy"), sub: "avg ticket size",         accent: "#f59e0b" },
                ].map(m => (
                  <div key={m.label} style={{ borderLeft: `3px solid ${m.accent}`, background: m.accent + "0e", borderRadius: "0 10px 10px 0", padding: "10px 14px", marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{m.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: m.accent, margin: "3px 0 2px" }}>{m.val}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>{m.sub}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "32px 16px", textAlign: "center" }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg,#f0fafa,#e0f7f6)", border: "1.5px solid #c8e8e8", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <BarChart3 size={26} color="#0d9488" strokeWidth={1.5} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#334155", marginBottom: 6 }}>No insurer selected</div>
                <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
                  Click or hover over a bubble to view detailed metrics and trends
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
