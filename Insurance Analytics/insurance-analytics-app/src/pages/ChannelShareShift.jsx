import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";
import { db } from "../firebase/firebaseConfig";
import { Loader2, Download, Maximize2, Minimize2, Shuffle, RefreshCw, TrendingUp } from "lucide-react";

// ─── Firestore collections ────────────────────────────────────────────────────
const C_INDIVIDUAL = "Sheet99_Channel_Wise_Individual_New_Business_Life_Insurance";
const C_GROUP      = "Sheet101_Channel_Wise_Group_New_Business_Life_Insurance";

// ─── Channel config ───────────────────────────────────────────────────────────
const CHANNELS = [
  "Individual Agents",
  "Corporate Agents - Banks",
  "Corporate Agents- Others than Banks",
  "Brokers",
  "Direct Selling",
  "MicorInsurance Agents",
  "Common Service Centres (CSCs)",
  "Web-Aggregators",
  "Insurance Marketing Firms (IMFs)",
  "Online - Company Website",
  "Point of Sales",
  "Others - If any",
];

const CHANNEL_COLORS = {
  "Individual Agents":                   "#0d9488",
  "Corporate Agents - Banks":            "#6366f1",
  "Corporate Agents- Others than Banks": "#f59e0b",
  "Brokers":                             "#14b8a6",
  "Direct Selling":                      "#ec4899",
  "MicorInsurance Agents":              "#84cc16",
  "Common Service Centres (CSCs)":       "#f97316",
  "Web-Aggregators":                     "#8b5cf6",
  "Insurance Marketing Firms (IMFs)":    "#06b6d4",
  "Online - Company Website":            "#3b82f6",
  "Point of Sales":                      "#10b981",
  "Others - If any":                     "#94a3b8",
};

// These two channels have irregular year-on-year patterns due to reclassification
const IRREGULAR = new Set(["Others - If any", "Direct Selling"]);

// ─── Year list ────────────────────────────────────────────────────────────────
const YEARS = [
  "2014-15", "2015-16", "2016-17", "2017-18", "2018-19", "2019-20",
  "2020-21", "2021-22", "2022-23", "2023-24", "2024-25",
];

// ─── Metric options ───────────────────────────────────────────────────────────
const IND_METRICS = [
  { key: "policies",      label: "Policies"      },
  { key: "premium_crore", label: "Premium (₹Cr)" },
];
const GRP_METRICS = [
  { key: "schemes",       label: "Schemes"       },
  { key: "lives_covered", label: "Lives Covered" },
  { key: "premium_crore", label: "Premium (₹Cr)" },
];

// ─── SVG chart constants ──────────────────────────────────────────────────────
const W = 700;
const H = 340;
const PAD = { top: 16, right: 20, bottom: 56, left: 54 };
const plotW = W - PAD.left - PAD.right;
const plotH = H - PAD.top  - PAD.bottom;

function toX(i)   { return PAD.left + (i / (YEARS.length - 1)) * plotW; }
function toY(pct) { return PAD.top  + (1 - pct / 100) * plotH; }

// Build SVG area path for one channel across all years
function buildAreaPath(stacks, ch) {
  const n = YEARS.length;
  const topPts = YEARS.map((_, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(stacks[i].cumEnd[ch]).toFixed(1)}`);
  const botPts = YEARS.map((_, i) => `L${toX(n - 1 - i).toFixed(1)},${toY(stacks[n - 1 - i].cumStart[ch]).toFixed(1)}`);
  return [...topPts, ...botPts, "Z"].join(" ");
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ChannelShareShift() {
  // Applied (committed) state
  const [bizType, setBizType] = useState("");
  const [metric,  setMetric]  = useState("");
  // Pending (draft) state – committed on Apply
  const [pendingBizType, setPendingBizType] = useState("");
  const [pendingMetric,  setPendingMetric]  = useState("");

  const [raw,     setRaw]     = useState({});
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [hovIdx,  setHovIdx]  = useState(null);  // hovered year index
  const [pinIdx,  setPinIdx]  = useState(null);  // clicked/pinned year index

  const svgRef        = useRef(null);
  const chartPanelRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fsPopup, setFsPopup]     = useState(null); // { idx, x, y, containerW } — fullscreen only

  const metrics = pendingBizType === "Group New Business" ? GRP_METRICS : IND_METRICS;

  // Fetch data – cached per applied bizType, fetched on Apply
  useEffect(() => {
    if (!bizType) return;
    if (raw[bizType]) return; // already cached
    const colName = bizType === "Individual New Business" ? C_INDIVIDUAL : C_GROUP;
    setLoading(true);
    setError(null);
    getDocs(collection(db, colName))
      .then(snap => {
        const map = {};
        snap.forEach(doc => {
          const d = doc.data();
          if (!map[d.channel]) map[d.channel] = {};
          map[d.channel][d.year] = d;
        });
        setRaw(prev => ({ ...prev, [bizType]: map }));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [bizType]); // eslint-disable-line react-hooks/exhaustive-deps

  const cur = raw[bizType] || {};
  const hasData = Object.keys(cur).length > 0;
  const hasApplied = Boolean(bizType && metric);

  // ── Compute per-year stacks ─────────────────────────────────────────────────
  const stacks = useMemo(() => {
    return YEARS.map(yr => {
      const vals = {};
      let total = 0;
      CHANNELS.forEach(ch => {
        const v = Math.max(0, Number(cur[ch]?.[yr]?.[metric] ?? 0));
        vals[ch] = v;
        total += v;
      });
      const pcts = {};
      const cumStart = {};
      const cumEnd = {};
      let cum = 0;
      CHANNELS.forEach(ch => {
        pcts[ch]     = total > 0 ? (vals[ch] / total) * 100 : 0;
        cumStart[ch] = cum;
        cum         += pcts[ch];
        cumEnd[ch]   = cum;
      });
      return { yr, vals, pcts, cumStart, cumEnd, total };
    });
  }, [cur, metric]);

  // ── Right-panel: display index — pinned beats hovered beats last year ──────
  const selIdx   = pinIdx ?? hovIdx ?? (YEARS.length - 1);
  const selStack = stacks[selIdx];

  // Pre-build area paths
  const areaPaths = useMemo(() =>
    CHANNELS.map(ch => ({ ch, d: buildAreaPath(stacks, ch) })),
    [stacks]
  );

  // ── Hover / mouse / click handling ────────────────────────────────────────
  const getIdxFromEvent = useCallback(e => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX  = (e.clientX - rect.left) * (W / rect.width);
    const rawIdx = (svgX - PAD.left) / plotW * (YEARS.length - 1);
    return Math.max(0, Math.min(YEARS.length - 1, Math.round(rawIdx)));
  }, []);

  const handleMouseMove = useCallback(e => {
    setHovIdx(getIdxFromEvent(e));
  }, [getIdxFromEvent]);

  const handleMouseLeave = useCallback(() => setHovIdx(null), []);

  const handleClick = useCallback(e => {
    const idx = getIdxFromEvent(e);
    if (isFullscreen) {
      const rect = svgRef.current?.getBoundingClientRect();
      const relX = rect ? e.clientX - rect.left : 0;
      const relY = rect ? e.clientY - rect.top  : 0;
      const cW   = rect ? rect.width : W;
      setPinIdx(prev => {
        if (prev === idx) { setFsPopup(null); return null; }
        setFsPopup({ idx, x: relX, y: relY, containerW: cW });
        return idx;
      });
    } else {
      setFsPopup(null);
      setPinIdx(prev => prev === idx ? null : idx);
    }
  }, [getIdxFromEvent, isFullscreen]);

  // ── Right-panel: share in selected year (sorted desc) ──────────────────────
  const shareInYear = useMemo(() =>
    CHANNELS
      .map(ch => ({ ch, pct: selStack.pcts[ch], val: selStack.vals[ch] }))
      .filter(x => x.pct > 0.01)
      .sort((a, b) => b.pct - a.pct),
    [selStack]
  );

  // ── Tooltip value formatter — kept for export label use ────────────────────
  const metLabel = metrics.find(m => m.key === metric)?.label ?? (pendingMetric ? (metrics.find(m => m.key === pendingMetric)?.label ?? "") : "");

  // ── Apply / Reset handlers ──────────────────────────────────────────────────
  const handleApply = () => {
    if (!pendingBizType || !pendingMetric) return;
    setBizType(pendingBizType);
    setMetric(pendingMetric);
    setPinIdx(null);
    setHovIdx(null);
    setFsPopup(null);
  };

  const handleReset = () => {
    setPendingBizType("");
    setPendingMetric("");
    setBizType("");
    setMetric("");
    setPinIdx(null);
    setHovIdx(null);
    setFsPopup(null);
  };

  const isDirty = pendingBizType !== bizType || pendingMetric !== metric;  // eslint-disable-line no-unused-vars

  // ── Fullscreen ────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleFsChange = () => {
      const isNowFs = document.fullscreenElement === chartPanelRef.current;
      setIsFullscreen(isNowFs);
      if (!isNowFs) setFsPopup(null);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!isFullscreen) chartPanelRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  // ── Download chart as PNG ─────────────────────────────────────────────────
  const handleDownloadChart = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const clone = svg.cloneNode(true);
    clone.setAttribute("width",  W * 2);
    clone.setAttribute("height", H * 2);
    clone.removeAttribute("style");
    const svgData = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width  = W * 2;
      canvas.height = H * 2;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      const bizSlug = bizType.toLowerCase().replace(/\s+/g, "-");
      link.download = `channel-share-shift_${bizSlug}_${metric}.png`;
      link.href = pngUrl;
      link.click();
    };
    img.src = url;
  };

  // ── Export to Excel — exports pinned/selected year breakdown ───────────────
  const handleExport = () => {
    if (!hasData) return;
    const yr = YEARS[selIdx];
    const activeFilters = [
      { label: "Business Type", value: bizType },
      { label: "Metric",        value: metLabel },
      { label: "Year",          value: yr },
    ];
    const dataHeader = ["Channel", "Share (%)", metLabel];
    const dataRows = shareInYear.map(({ ch, pct, val }) => [
      ch,
      parseFloat(pct.toFixed(2)),
      val !== undefined ? Number(val) : "",
    ]);
    const exportRows = [
      ["Sub Module", "Channel Share Shift"],
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
    const fileBaseName = ["channel-share-shift", filterPart, datePart].filter(Boolean).join("_");
    try {
      const ws = XLSX.utils.aoa_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Channel Share");
      XLSX.writeFile(wb, `${fileBaseName}.xlsx`);
    } catch {
      const csv = exportRows
        .map(row => row.map(v => `"${String(v === undefined ? "" : v).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.setAttribute("download", `${fileBaseName}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };


  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "row", gap: 16, minHeight: "calc(100vh - 260px)" }}>

      {/* ── LEFT: Filter panel (matches Channel-wise / Insurer-wise filter panel width) ── */}
      <div className="life-filters card" style={{ flex: "0 0 240px", width: 240, minWidth: 0 }}>
        <div className="panel-header">
          <div className="panel-icon-badge"><Shuffle size={14} strokeWidth={2} /></div>
          <h3 className="panel-title section-title">Filters</h3>
          <button className="filter-refresh-btn" onClick={handleReset} title="Reset filters">
            <RefreshCw className="refresh-icon" size={18} strokeWidth={2.4} />
          </button>
        </div>
        <div className="filters-body">
          <div className="filter-item">
            <label className="filter-label label-text">Business Type</label>
            <div className="premium-toggle-group">
              {["Individual New Business", "Group New Business"].map(bt => (
                <button
                  key={bt}
                  className={`premium-toggle-btn${pendingBizType === bt ? " active" : ""}`}
                  onClick={() => {
                    setPendingBizType(bt);
                    setPendingMetric(""); // user must pick metric explicitly
                  }}
                >
                  {bt}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-item">
            <label className="filter-label label-text">Metric</label>
            <div className="premium-toggle-group">
              {metrics.map(m => (
                <button
                  key={m.key}
                  className={`premium-toggle-btn${pendingMetric === m.key ? " active" : ""}`}
                  onClick={() => setPendingMetric(m.key)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <button
            className="apply-filters-btn"
            style={{ marginTop: 8, width: "100%" }}
            onClick={handleApply}
            disabled={!pendingBizType || !pendingMetric}
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* ── Chart card ─────────────────────────────────────────────────────── */}
        <div className="life-data-panel card" ref={chartPanelRef} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", ...(isFullscreen ? { background: "white" } : {}) }}>
          <div className="panel-header">
            <div className="panel-icon-badge"><TrendingUp size={14} strokeWidth={2} /></div>
            <h3 className="panel-title section-title">
              Channel Share Shift{metLabel ? ` — ${metLabel}` : ""}
            </h3>
            {hovIdx !== null && (
              <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b", marginLeft: 4 }}>· {YEARS[hovIdx]}</span>
            )}
            {hasApplied && (
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
                {hasData && (
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

          {/* Compact filter bar — shown only inside fullscreen */}
          {isFullscreen && hasApplied && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 20px", borderBottom: "1px solid #e8f5f5", flexShrink: 0, background: "white", flexWrap: "nowrap", minHeight: 36 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#475569", whiteSpace: "nowrap" }}>Business Type:</span>
              <div style={{ display: "flex", gap: 4 }}>
                {[{ v: "Individual New Business", l: "Individual" }, { v: "Group New Business", l: "Group" }].map(({ v, l }) => (
                  <button key={v} className={`premium-toggle-btn${bizType === v ? " active" : ""}`}
                    style={{ fontSize: 11, padding: "4px 14px", whiteSpace: "nowrap", lineHeight: 1.4, height: 28 }}
                    onClick={() => { setBizType(v); setPendingBizType(v); setMetric(""); setPendingMetric(""); setPinIdx(null); setHovIdx(null); setFsPopup(null); }}>
                    {l}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginLeft: 10, whiteSpace: "nowrap" }}>Metric:</span>
              <div style={{ display: "flex", gap: 4 }}>
                {(bizType === "Group New Business" ? GRP_METRICS : IND_METRICS).map(m => (
                  <button key={m.key} className={`premium-toggle-btn${metric === m.key ? " active" : ""}`}
                    style={{ fontSize: 11, padding: "4px 14px", whiteSpace: "nowrap", lineHeight: 1.4, height: 28 }}
                    onClick={() => { setMetric(m.key); setPendingMetric(m.key); setPinIdx(null); setHovIdx(null); setFsPopup(null); }}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Legend below panel header */}
          {hasApplied && hasData && (
            <div style={{ padding: "0 16px 8px", display: "flex", flexWrap: "wrap", gap: "4px 14px", borderBottom: "1px solid #f0fafa" }}>
              {CHANNELS.map(ch => (
                <div key={ch} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 9, height: 9, borderRadius: 2, background: CHANNEL_COLORS[ch], flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: "#475569", whiteSpace: "nowrap" }}>{ch}</span>
                  {IRREGULAR.has(ch) && (
                    <span title="Irregular pattern" style={{ cursor: "help", color: "#94a3b8", fontSize: 11, lineHeight: 1 }}>ⓘ</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="panel-body" style={{ flex: 1, overflow: isFullscreen ? "hidden" : "auto", position: "relative", padding: 8, minHeight: 0, display: isFullscreen ? "flex" : undefined, flexDirection: isFullscreen ? "column" : undefined }}>
          {/* Chart area: show prompt if not yet applied or dirty */}
          {!hasApplied || isDirty ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 10, color: "#94a3b8" }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Select filters on the left, then click Apply Filters</span>
            </div>
          ) : loading && !hasData ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: 10 }}>
              <Loader2 size={24} color="#0d9488" style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ color: "#0f4c5c", fontWeight: 600, fontSize: 13 }}>Loading data…</span>
            </div>
          ) : error && !hasData ? (
            <div style={{ color: "#dc2626", padding: "24px 0", fontSize: 13 }}>Error: {error}</div>
          ) : (
            <div style={{ display: isFullscreen ? "flex" : "block", flexDirection: isFullscreen ? "column" : undefined, height: isFullscreen ? "100%" : undefined }}>
              {/* SVG stacked area chart */}
              <div style={{ position: "relative", flex: isFullscreen ? "1 1 auto" : undefined, display: isFullscreen ? "flex" : undefined, flexDirection: isFullscreen ? "column" : undefined, minHeight: 0 }}>
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${W} ${H}`}
                  style={{ width: "100%", display: "block", cursor: "crosshair", flex: isFullscreen ? "1 1 auto" : undefined, minHeight: 0 }}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  onClick={handleClick}
                >
                  {/* Y axis label */}
                  <text
                    x={-(PAD.top + plotH / 2)} y={14}
                    transform="rotate(-90)"
                    textAnchor="middle" fontSize={11} fill="#64748b"
                  >
                    Share (%)
                  </text>

                  {/* Y grid lines + tick labels */}
                  {[0, 25, 50, 75, 100].map(p => (
                    <g key={p}>
                      <line
                        x1={PAD.left} y1={toY(p)} x2={PAD.left + plotW} y2={toY(p)}
                        stroke={p === 0 || p === 100 ? "#cbd5e1" : "#e2e8f0"}
                        strokeWidth={p === 0 || p === 100 ? 1.5 : 1}
                      />
                      <text
                        x={PAD.left - 6} y={toY(p)}
                        textAnchor="end" dominantBaseline="middle"
                        fontSize={11} fill="#64748b"
                      >
                        {p}%
                      </text>
                    </g>
                  ))}

                  {/* Stacked area paths – bottom channel first so top channels paint over */}
                  {areaPaths.map(({ ch, d }) => (
                    <path
                      key={ch}
                      d={d}
                      fill={CHANNEL_COLORS[ch]}
                      fillOpacity={0.88}
                      stroke="#fff"
                      strokeWidth={0.6}
                    />
                  ))}

                  {/* Hover vertical line */}
                  {hovIdx !== null && hovIdx !== pinIdx && (
                    <line
                      x1={toX(hovIdx)} y1={PAD.top}
                      x2={toX(hovIdx)} y2={PAD.top + plotH}
                      stroke="#94a3b8" strokeWidth={1}
                      strokeDasharray="4,3"
                      pointerEvents="none"
                    />
                  )}

                  {/* Pinned vertical line */}
                  {pinIdx !== null && (
                    <line
                      x1={toX(pinIdx)} y1={PAD.top}
                      x2={toX(pinIdx)} y2={PAD.top + plotH}
                      stroke="#0f172a" strokeWidth={1.8}
                      strokeDasharray="4,3"
                      pointerEvents="none"
                    />
                  )}

                  {/* X axis ticks */}
                  {YEARS.map((yr, i) => (
                    <text
                      key={yr}
                      x={toX(i)} y={PAD.top + plotH + 15}
                      textAnchor="middle"
                      fontSize={10}
                      fill={i % 2 === 0 ? "#334155" : "#94a3b8"}
                      fontWeight={i % 2 === 0 ? "600" : "normal"}
                    >
                      {yr.slice(2, 7)}
                    </text>
                  ))}

                  {/* X axis label */}
                  <text
                    x={PAD.left + plotW / 2} y={H - 6}
                    textAnchor="middle" fontSize={11} fill="#64748b"
                  >
                    Financial Year
                  </text>
                </svg>

                {/* No floating hover tooltip — right panel shows the selected year breakdown */}

                {/* ── Fullscreen: floating popup showing Share in selected year ─────── */}
                {isFullscreen && fsPopup && shareInYear.length > 0 && (
                  <div
                    onClick={e => e.stopPropagation()}
                    style={{
                      position: "absolute",
                      left: (fsPopup.x + 15 + 290 > fsPopup.containerW)
                        ? Math.max(0, fsPopup.x - 290 - 10)
                        : fsPopup.x + 15,
                      top: Math.max(10, fsPopup.y - 60),
                      zIndex: 1000,
                      background: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: 10,
                      boxShadow: "0 8px 28px rgba(0,0,0,0.16)",
                      width: 284,
                      maxHeight: 400,
                      overflowY: "auto",
                      padding: "10px 14px 12px",
                    }}
                  >
                    {/* Popup header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f4c5c" }}>Share in {YEARS[fsPopup.idx]}</span>
                        <span style={{ fontSize: 9, color: "#0d9488", marginLeft: 6, fontWeight: 500 }}>● pinned</span>
                      </div>
                      <button
                        onClick={() => { setFsPopup(null); setPinIdx(null); }}
                        title="Close"
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 18, lineHeight: 1, padding: "0 2px", display: "flex", alignItems: "center" }}
                      >
                        ×
                      </button>
                    </div>

                    {/* Channel rows */}
                    {shareInYear.map(({ ch, pct, val }) => (
                      <div key={ch} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: CHANNEL_COLORS[ch], flexShrink: 0 }} />
                            <span style={{ fontSize: 10, color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 168 }}>{ch}</span>
                            {IRREGULAR.has(ch) && (
                              <span title="Irregular pattern" style={{ cursor: "help", color: "#94a3b8", fontSize: 11, lineHeight: 1, flexShrink: 0 }}>ⓘ</span>
                            )}
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#0f4c5c", flexShrink: 0 }}>{pct.toFixed(1)}%</span>
                        </div>
                        <div style={{ height: 5, borderRadius: 3, background: "#f0fafa", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: CHANNEL_COLORS[ch], borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}

                    {/* Metric value footer */}
                    {metLabel && (
                      <div style={{ borderTop: "1px solid #f0fafa", marginTop: 8, paddingTop: 6, fontSize: 10, color: "#64748b" }}>
                        Metric: <span style={{ fontWeight: 600 }}>{metLabel}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}
          </div>
        </div>

      {/* ── Share in selected year panel ──────────────────────────────────── */}
        <div className="life-data-panel card" style={{ flex: "0 0 360px", display: "flex", flexDirection: "column" }}>
          <div className="panel-header">
            <h3 className="panel-title section-title" style={{ flex: 1 }}>
              Share in {YEARS[selIdx]}
              {pinIdx !== null && (
                <span style={{ fontSize: 10, color: "#0d9488", marginLeft: 6, fontWeight: 500 }}>● pinned</span>
              )}
            </h3>
            <button
              className="data-export-btn panel-action-btn"
              onClick={handleExport}
              disabled={!hasData}
              title="Export to Excel"
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", fontSize: 11, minHeight: "unset", height: 28 }}
            >
              <Download size={12} strokeWidth={2} />
              Export
            </button>
          </div>
          <div className="panel-body" style={{ flex: 1, overflowY: "auto", padding: "8px 14px" }}>
            {!hasApplied || isDirty ? (
              <div style={{ color: "#94a3b8", fontSize: 12, textAlign: "center", padding: "20px 0" }}>{isDirty ? "Click Apply Filters to update" : "Apply filters to see breakdown"}</div>
            ) : !hasData ? (
              <div style={{ color: "#94a3b8", fontSize: 12, textAlign: "center", padding: "16px 0" }}>
                {loading ? "Loading…" : "No data"}
              </div>
            ) : (
              shareInYear.map(({ ch, pct }) => (
                <div key={ch} style={{ marginBottom: 9 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                      <div style={{ width: 9, height: 9, borderRadius: 2, background: CHANNEL_COLORS[ch], flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 158 }}>{ch}</span>
                      {IRREGULAR.has(ch) && (
                        <span title="Irregular pattern" style={{ cursor: "help", color: "#94a3b8", fontSize: 12, lineHeight: 1, flexShrink: 0 }}>ⓘ</span>
                      )}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#0f4c5c", flexShrink: 0 }}>
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "#f0fafa", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: CHANNEL_COLORS[ch], borderRadius: 3, transition: "width 350ms ease" }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
    </div>
  );
}
