import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { BarChart3, RefreshCw, Shuffle } from "lucide-react";
import * as XLSX from "xlsx";
import { db } from "../firebase/firebaseConfig";

const COLLECTION = "sheet96_life_agents_statewise";

const YEARS = [
  "2014-15",
  "2015-16",
  "2016-17",
  "2017-18",
  "2018-19",
  "2019-20",
  "2020-21",
  "2021-22",
  "2022-23",
  "2023-24",
  "2024-25",
];

const VIEW_OPTIONS = [
  { label: "Heat Map", value: "heatmap" },
  { label: "State Data", value: "state-data" },
];

const STATE_GRID = [
  ["Jammu and Kashmir", 1, 0],
  ["Ladakh", 4, 0],
  ["Himachal Pradesh", 2, 2],
  ["Punjab", 1, 2],
  ["Uttarakhand", 4, 2],
  ["Haryana", 2, 3],
  ["Delhi", 3, 3],
  ["Uttar Pradesh", 4, 3],
  ["Arunachal Pradesh", 9, 1],
  ["Rajasthan", 1, 4],
  ["Bihar", 6, 4],
  ["Sikkim", 8, 3],
  ["Assam", 8, 4],
  ["Nagaland", 10, 3],
  ["Manipur", 10, 4],
  ["Meghalaya", 8, 5],
  ["Mizoram", 9, 5],
  ["Tripura", 8, 6],
  ["Gujarat", 1, 5],
  ["Madhya Pradesh", 3, 5],
  ["Jharkhand", 6, 5],
  ["West Bengal", 7, 4],
  ["Maharashtra", 2, 7],
  ["Chhattisgarh", 5, 6],
  ["Odisha", 6, 6],
  ["Andhra Pradesh", 3, 9],
  ["Telangana", 3, 8],
  ["Karnataka", 2, 9],
  ["Tamil Nadu", 3, 10],
  ["Kerala", 2, 11],
  ["Goa", 2, 8],
  ["Chandigarh", 3, 2],
];

const STATE_ALIASES = {
  "jammu and kashmir": "jammu and kashmir",
  "jammu & kashmir": "jammu and kashmir",
  "jammu and kashmir and ladakh": "jammu and kashmir",
  "andaman and nicobar islands": "andaman and nicobar",
  "dadra and nagar haveli and daman and diu": "dadra and nagar haveli and daman and diu",
  "dadra and nagar haveli": "dadra and nagar haveli and daman and diu",
  "daman and diu": "dadra and nagar haveli and daman and diu",
  puducherry: "puducherry",
  pondicherry: "puducherry",
  uttrakhand: "uttarakhand",
  uttarakhand: "uttarakhand",
  chattisgarh: "chhattisgarh",
  chhattisgarh: "chhattisgarh",
  odisha: "odisha",
  orissa: "odisha",
};

function normalizeStateName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalStateName(value) {
  const normalized = normalizeStateName(value);
  return STATE_ALIASES[normalized] || normalized;
}

const GRID_STATE_LABELS = STATE_GRID.reduce((result, [stateName]) => {
  result[canonicalStateName(stateName)] = stateName;
  return result;
}, {});

function getColor(value, min, max) {
  if (!value || value === 0) return "#e8f4f4";
  const ratio = Math.pow((value - min) / (max - min || 1), 0.45);
  const red = Math.round(232 - ratio * (232 - 13));
  const green = Math.round(244 - ratio * (244 - 148));
  const blue = Math.round(244 - ratio * (244 - 136));
  return `rgb(${red}, ${green}, ${blue})`;
}

function getGrowthColor(value, min, max) {
  if (!Number.isFinite(value)) return "#e2e8f0";

  const positiveMax = Math.max(0, max);
  const negativeMin = Math.min(0, min);

  if (value >= 0) {
    const ratio = positiveMax > 0 ? Math.min(value / positiveMax, 1) : 0;
    const red = Math.round(241 - ratio * 199);
    const green = Math.round(245 - ratio * 66);
    const blue = Math.round(249 - ratio * 122);
    return `rgb(${red}, ${green}, ${blue})`;
  }

  const ratio = negativeMin < 0 ? Math.min(Math.abs(value / negativeMin), 1) : 0;
  const red = Math.round(254 - ratio * 34);
  const green = Math.round(242 - ratio * 124);
  const blue = Math.round(242 - ratio * 136);
  return `rgb(${red}, ${green}, ${blue})`;
}

function formatCompactNumber(value) {
  if (value == null || value === 0) return "-";
  if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString("en-IN");
}

function buildExportFileName(parts) {
  return parts
    .filter(Boolean)
    .join("_")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function getViewLabel(mode, value) {
  if (value === "heatmap") {
    return "Heat Map";
  }

  if (value === "state-data") {
    return mode === "state" ? "Insurer Data" : "State Data";
  }

  if (value === "top10") {
    return mode === "state" ? "Top 10 Insurers" : "Top 10 States";
  }

  return "-";
}

export default function StateAgentHeatmap() {
  const [insurerOptions, setInsurerOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [records, setRecords] = useState([]);

  const [draftAnalysisMode, setDraftAnalysisMode] = useState("");

  const [draftInsurer, setDraftInsurer] = useState("");
  const [draftStateFilter, setDraftStateFilter] = useState("");
  const [draftYear, setDraftYear] = useState("");
  const [draftView, setDraftView] = useState("");

  const [analysisMode, setAnalysisMode] = useState("");
  const [insurer, setInsurer] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [year, setYear] = useState("");
  const [viewMode, setViewMode] = useState("");

  const [selectedDetailKey, setSelectedDetailKey] = useState(null);
  const [tableSort, setTableSort] = useState({ key: "totalValue", direction: "desc" });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    setLoading(true);

    getDocs(collection(db, COLLECTION))
      .then((snapshot) => {
        if (!mounted) return;

        const normalizedRecords = snapshot.docs
          .map((docItem) => {
            const data = docItem.data();
            const insurerName = String(data?.insurer_name || "").trim();
            const rawStateName = String(data?.state || "").trim();
            const stateKey = canonicalStateName(rawStateName);
            const stateLabel = GRID_STATE_LABELS[stateKey] || rawStateName;
            const yearValue = String(data?.year || "").trim();
            const value = Number(data?.no_agents ?? 0);

            if (!insurerName || !stateKey || !yearValue) {
              return null;
            }

            return {
              insurerName,
              stateKey,
              stateLabel,
              year: yearValue,
              value: Number.isFinite(value) ? value : 0,
            };
          })
          .filter(Boolean);

        const insurers = Array.from(
          new Set(
            normalizedRecords
              .map((item) => item.insurerName)
              .filter(Boolean)
          )
        ).sort((left, right) => left.localeCompare(right));

        const states = Array.from(
          new Map(
            normalizedRecords.map((item) => [item.stateKey, { value: item.stateKey, label: item.stateLabel }])
          ).values()
        ).sort((left, right) => left.label.localeCompare(right.label));

        setRecords(normalizedRecords);
        setInsurerOptions(insurers);
        setStateOptions(states);
      })
      .catch((fetchError) => {
        if (!mounted) return;
        setError(fetchError.message || "Unable to load insurers.");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const recordsByInsurer = useMemo(() => {
    const result = {};

    records.forEach((item) => {
      if (!result[item.insurerName]) {
        result[item.insurerName] = {};
      }

      if (!result[item.insurerName][item.stateKey]) {
        result[item.insurerName][item.stateKey] = { label: item.stateLabel, years: {} };
      }

      result[item.insurerName][item.stateKey].years[item.year] = item.value;
    });

    return result;
  }, [records]);

  const recordsByState = useMemo(() => {
    const result = {};

    records.forEach((item) => {
      if (!result[item.stateKey]) {
        result[item.stateKey] = {};
      }

      if (!result[item.stateKey][item.insurerName]) {
        result[item.stateKey][item.insurerName] = { label: item.insurerName, years: {} };
      }

      result[item.stateKey][item.insurerName].years[item.year] = item.value;
    });

    return result;
  }, [records]);

  const entitySeriesMap = useMemo(() => {
    const source =
      analysisMode === "insurer"
        ? recordsByInsurer[insurer] || {}
        : analysisMode === "state"
        ? recordsByState[stateFilter] || {}
        : {};

    const result = {};

    Object.entries(source).forEach(([itemKey, itemData]) => {
      const currentValue = itemData.years[year] ?? 0;
      const previousYear = YEARS[YEARS.indexOf(year) - 1];
      const previousValue = previousYear ? (itemData.years[previousYear] ?? 0) : 0;
      const yoyGrowth = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;

      result[itemKey] = {
        label: itemData.label,
        years: itemData.years,
        value: currentValue,
        totalValue: currentValue,
        yoyValue: yoyGrowth,
      };
    });

    return result;
  }, [analysisMode, insurer, recordsByInsurer, recordsByState, stateFilter, year]);

  const rows = useMemo(
    () =>
      Object.entries(entitySeriesMap)
        .map(([key, item]) => ({
          key,
          label: item.label,
          value: item.value,
          years: item.years,
          totalValue: item.totalValue,
          yoyValue: item.yoyValue,
        })),
    [entitySeriesMap]
  );

  const sortedTableRows = useMemo(() => {
    const ordered = [...rows];
    const { key, direction } = tableSort;

    ordered.sort((left, right) => {
      const leftValue = Number(left[key] ?? 0);
      const rightValue = Number(right[key] ?? 0);

      if (direction === "asc") {
        return leftValue - rightValue;
      }

      return rightValue - leftValue;
    });

    return ordered;
  }, [rows, tableSort]);

  const { totalMin, totalMax, yoyMin, yoyMax } = useMemo(() => {
    const totalValues = rows
      .map((item) => item.totalValue)
      .filter((value) => Number.isFinite(value) && value >= 0);
    const yoyValues = rows
      .map((item) => item.yoyValue)
      .filter((value) => Number.isFinite(value));

    const rawTotalMin = totalValues.length ? Math.min(...totalValues) : 0;
    const rawTotalMax = totalValues.length ? Math.max(...totalValues) : 1;
    const rawYoyMin = yoyValues.length ? Math.min(...yoyValues) : -1;
    const rawYoyMax = yoyValues.length ? Math.max(...yoyValues) : 1;

    return {
      totalMin: rawTotalMin,
      totalMax: rawTotalMin === rawTotalMax ? rawTotalMax + 1 : rawTotalMax,
      yoyMin: rawYoyMin === rawYoyMax ? rawYoyMin - 1 : rawYoyMin,
      yoyMax: rawYoyMin === rawYoyMax ? rawYoyMax + 1 : rawYoyMax,
    };
  }, [rows]);

  // When analysisMode === "state", entitySeriesMap keys are insurer names,
  // so the state grid heatmap needs a separate map keyed by state.
  // Aggregate all records by state for the selected year (across all insurers).
  const heatmapStateMap = useMemo(() => {
    if (analysisMode === "insurer") return entitySeriesMap;
    if (analysisMode !== "state" || !year) return {};

    const prevYear = YEARS[YEARS.indexOf(year) - 1];
    const byState = {};

    records.forEach((record) => {
      if (!byState[record.stateKey]) {
        byState[record.stateKey] = { label: record.stateLabel, current: 0, prev: 0 };
      }
      if (record.year === year) byState[record.stateKey].current += record.value;
      if (prevYear && record.year === prevYear) byState[record.stateKey].prev += record.value;
    });

    const result = {};
    Object.entries(byState).forEach(([key, data]) => {
      const yoy = data.prev > 0 ? ((data.current - data.prev) / data.prev) * 100 : 0;
      result[key] = { label: data.label, totalValue: data.current, yoyValue: yoy };
    });
    return result;
  }, [analysisMode, year, records, entitySeriesMap]);

  const { hmTotalMin, hmTotalMax, hmYoyMin, hmYoyMax } = useMemo(() => {
    const vals = Object.values(heatmapStateMap);
    const totals = vals.map((v) => v.totalValue).filter((v) => Number.isFinite(v) && v >= 0);
    const yoys = vals.map((v) => v.yoyValue).filter((v) => Number.isFinite(v));
    const rawTotalMin = totals.length ? Math.min(...totals) : 0;
    const rawTotalMax = totals.length ? Math.max(...totals) : 1;
    const rawYoyMin = yoys.length ? Math.min(...yoys) : -1;
    const rawYoyMax = yoys.length ? Math.max(...yoys) : 1;
    return {
      hmTotalMin: rawTotalMin,
      hmTotalMax: rawTotalMin === rawTotalMax ? rawTotalMax + 1 : rawTotalMax,
      hmYoyMin: rawYoyMin === rawYoyMax ? rawYoyMin - 1 : rawYoyMin,
      hmYoyMax: rawYoyMin === rawYoyMax ? rawYoyMax + 1 : rawYoyMax,
    };
  }, [heatmapStateMap]);

  const selectedDetailSeries = useMemo(
    () => entitySeriesMap[selectedDetailKey]?.years || {},
    [entitySeriesMap, selectedDetailKey]
  );

  const selectedDetailLabel = entitySeriesMap[selectedDetailKey]?.label || "";

  const activePrimarySelection = analysisMode === "insurer" ? insurer : stateFilter;
  const activePrimaryLabel =
    analysisMode === "insurer"
      ? insurer
      : stateOptions.find((option) => option.value === stateFilter)?.label || "";
  const hasDraftPrimarySelection =
    draftAnalysisMode === "insurer"
      ? Boolean(draftInsurer)
      : draftAnalysisMode === "state"
      ? Boolean(draftStateFilter)
      : false;
  const currentDataTitle = "Agent Distribution - Analytics";
  const currentEntityLabel = analysisMode === "state" ? "Insurer" : "State";

  const applyFilters = () => {
    if (!draftAnalysisMode || !hasDraftPrimarySelection || !draftYear || !draftView) {
      setError("Please complete the required filter selections.");
      return;
    }

    setError("");
    setAnalysisMode(draftAnalysisMode);
    setInsurer(draftInsurer);
    setStateFilter(draftStateFilter);
    setYear(draftYear);
    setViewMode(draftView);
    setSelectedDetailKey(null);
  };

  const resetFilters = () => {
    setDraftAnalysisMode("");
    setDraftInsurer("");
    setDraftStateFilter("");
    setDraftYear("");
    setDraftView("");

    setAnalysisMode("");
    setInsurer("");
    setStateFilter("");
    setYear("");
    setViewMode("");
    setSelectedDetailKey(null);
    setError("");
  };

  const clearApplied = () => {
    setAnalysisMode("");
    setInsurer("");
    setStateFilter("");
    setYear("");
    setViewMode("");
    setSelectedDetailKey(null);
  };

  const handleExportData = () => {
    if (!analysisMode || !activePrimarySelection || !year || !viewMode || !hasData) {
      return;
    }

    const rowsToExport = sortedTableRows;

    const exportRows = [
      ["Module", "Agent Distribution - Analytics"],
      ["Analysis By", analysisMode === "state" ? "State" : "Insurer"],
      [analysisMode === "state" ? "State" : "Insurer", activePrimaryLabel],
      ["Year", year],
      ["Metrics", "Total Count and YoY Growth %"],
      ["View", getViewLabel(analysisMode, viewMode)],
      [],
      [currentEntityLabel, "Total Count", "YoY Growth %"],
      ...rowsToExport.map((item) => [
        item.label,
        item.totalValue,
        Number(item.yoyValue.toFixed(1)),
      ]),
    ];

    if (selectedDetailLabel && Object.keys(selectedDetailSeries).length > 0) {
      exportRows.push([]);
      exportRows.push([`Selected ${currentEntityLabel}`, selectedDetailLabel]);
      exportRows.push(["Year", "Value"]);
      YEARS.forEach((yearOption) => {
        exportRows.push([yearOption, selectedDetailSeries[yearOption] ?? 0]);
      });
    }

    const worksheet = XLSX.utils.aoa_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(
      workbook,
      `${buildExportFileName(["state_agent_heatmap", analysisMode, activePrimaryLabel, year, viewMode])}.xlsx`
    );
  };

  const handleSort = (key) => {
    setTableSort((previous) => {
      if (previous.key === key) {
        return {
          key,
          direction: previous.direction === "desc" ? "asc" : "desc",
        };
      }

      return { key, direction: "desc" };
    });
  };

  const hasData = rows.length > 0;

  const cellSize = 60;
  const cellGap = 4;
  const columns = 12;
  const gridRows = 13;

  return (
    <div style={{ width: "100%" }}>
      <style>{`
        .hm-layout { display: grid; grid-template-columns: minmax(240px, 27fr) minmax(0, 73fr); gap: 16px; align-items: stretch; }
        .hm-filter-panel { min-height: 0; }
        .hm-result-panel { min-height: 0; }
        .hm-subtitle { margin: 0; font-size: 13px; color: #5a9090; }
        .hm-panel-state { margin: auto; width: min(100%, 480px); }
        .hm-heatmap-wrap { width: 100%; }
        .hm-dual-heatmaps { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; align-items: start; }
        .hm-heatmap-card { border: 1px solid #d7ecec; border-radius: 12px; background: linear-gradient(180deg, #fbfefe, #f6fbfb); padding: 10px; }
        .hm-heatmap-card-title { margin: 0 0 8px; font-size: 12px; font-weight: 700; color: #0f3d3d; text-transform: uppercase; letter-spacing: 0.04em; }
        .hm-plot-wrap { width: 100%; height: 500px; }
        .hm-legend { margin-top: 14px; display: flex; align-items: center; gap: 8px; }
        .hm-legend-label { font-size: 11px; color: #5a9090; }
        .hm-legend-bar { width: 120px; height: 10px; border-radius: 999px; background: linear-gradient(90deg, #e8f4f4, #0d9488); }
        .hm-legend-bar-growth { width: 140px; height: 10px; border-radius: 999px; background: linear-gradient(90deg, #dc2626, #f8fafc, #0d9488); }
        .hm-detail-card { margin-top: 14px; padding: 10px 12px; border-radius: 10px; border: 1px solid #d0eded; background: linear-gradient(180deg, #fbfefe, #f5fbfb); }
        .hm-detail-title { margin: 0 0 8px; font-size: 13px; font-weight: 700; color: #0f3d3d; }
        .hm-detail-items { display: flex; gap: 10px; flex-wrap: wrap; }
        .hm-detail-item { font-size: 11px; color: #2d5f5f; }
        .hm-entity-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
        .hm-entity-card {
          border: 1px solid rgba(13, 148, 136, 0.14);
          border-radius: 12px;
          padding: 14px 12px;
          text-align: left;
          cursor: pointer;
          transition: all 180ms ease;
        }
        .hm-entity-card:hover { transform: translateY(-1px); box-shadow: 0 8px 14px rgba(15, 23, 42, 0.08); }
        .hm-entity-card.is-selected { border-width: 2px; border-color: #0d9488; }
        .hm-entity-label { font-size: 12px; font-weight: 700; margin-bottom: 6px; }
        .hm-entity-value { font-size: 14px; font-weight: 700; }
        .hm-state-table-wrap { max-height: 560px; overflow: auto; }
        .hm-state-table-wrap.data-table-container { max-height: 560px; max-width: 1080px; margin: 0 auto; }
        .hm-state-table.segment-data-table th { text-align: center; font-size: 13px; letter-spacing: 0.03em; }
        .hm-state-table.segment-data-table th:last-child,
        .hm-state-table.segment-data-table td:last-child { text-align: center; }
        .hm-state-table.segment-data-table th:nth-child(2),
        .hm-state-table.segment-data-table td:nth-child(2) { text-align: center; }
        .hm-state-table.segment-data-table td { padding: 13px 14px; }
        .hm-state-table.segment-data-table th:first-child { text-align: left; min-width: 220px; }
        .hm-state-table.segment-data-table td:first-child { color: #1e4d4d; font-weight: 600; text-align: left; min-width: 220px; white-space: nowrap; }
        .hm-state-table.segment-data-table td:nth-child(2) { color: #0d9488; font-weight: 700; }
        .hm-state-table.segment-data-table td:last-child { color: #0369a1; font-weight: 700; }
        .hm-sort-head-btn {
          border: none;
          background: transparent;
          color: inherit;
          font: inherit;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          padding: 0;
        }
        .hm-sort-head-btn:hover { color: #0f766e; }
        .hm-sort-indicator {
          font-size: 11px;
          color: #64748b;
          min-width: 18px;
          text-align: center;
        }
        .hm-rank-row { margin-bottom: 12px; }
        .hm-rank-row:last-child { margin-bottom: 0; }
        .hm-rank-meta { display: flex; justify-content: space-between; align-items: center; font-size: 13px; margin-bottom: 5px; gap: 8px; }
        .hm-rank-label { color: #1e4d4d; font-weight: 600; display: inline-flex; align-items: center; min-width: 0; }
        .hm-rank-position { color: #9bbcbc; margin-right: 6px; }
        .hm-rank-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .hm-rank-value { color: #0d9488; font-weight: 700; }
        .hm-svg-scroll { overflow: auto; max-height: 640px; }
        .hm-svg-scroll svg { display: block; }
        .hm-insurer-scroll { overflow-y: auto; max-height: 640px; padding: 4px; }
        .hm-insurer-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 6px; }
        .hm-insurer-cell {
          min-height: 80px; border-radius: 10px; padding: 8px 6px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          cursor: pointer; border: 2px solid transparent;
          transition: filter 0.15s, border-color 0.15s, box-shadow 0.15s;
          text-align: center; gap: 4px;
        }
        .hm-insurer-cell:hover { filter: brightness(0.88); box-shadow: 0 4px 10px rgba(0,0,0,0.12); }
        .hm-insurer-cell.is-selected { border-color: #0d9488; box-shadow: 0 0 0 3px rgba(13,148,136,0.2); }
        .hm-insurer-name { font-size: 10px; font-weight: 600; line-height: 1.25; word-break: break-word; hyphens: auto; }
        .hm-insurer-val { font-size: 13px; font-weight: 700; line-height: 1.1; margin-top: 2px; }
        .hm-state-cell { cursor: pointer; }
        .hm-state-cell rect { transition: all 0.15s; }
        .hm-state-cell:hover rect { filter: brightness(0.85); }
        .hm-bar-wrap { height: 6px; background: #e8f4f4; border-radius: 3px; overflow: hidden; }
        .hm-bar { background: linear-gradient(90deg, #0d9488, #2dd4bf); height: 100%; border-radius: 3px; }
        @media (max-width: 1200px) {
          .hm-layout { grid-template-columns: 1fr; }
          .hm-filter-panel,
          .hm-result-panel { min-height: auto; }
          .hm-dual-heatmaps { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="hm-layout">
        <div className="life-filters card hm-filter-panel">
          <div className="panel-header">
            <div className="panel-icon-badge">
              <Shuffle size={14} strokeWidth={2} />
            </div>
            <h3 className="panel-title section-title">Filters</h3>
            <button
              type="button"
              className="filter-refresh-btn"
              onClick={resetFilters}
              aria-label="Reset filters"
              title="Reset filters"
            >
              <RefreshCw className="refresh-icon" size={18} strokeWidth={2.4} />
            </button>
          </div>
          <div className="filters-body">
            <div className="filter-item">
              <label className="filter-label label-text">Analyze By</label>
              <div className="premium-toggle-group">
                <button
                  type="button"
                  className={`premium-toggle-btn ${draftAnalysisMode === "insurer" ? "active" : ""}`}
                  onClick={() => {
                    setDraftAnalysisMode("insurer");
                    setDraftStateFilter("");
                    setError("");
                    clearApplied();
                  }}
                >
                  Insurer
                </button>
                <button
                  type="button"
                  className={`premium-toggle-btn ${draftAnalysisMode === "state" ? "active" : ""}`}
                  onClick={() => {
                    setDraftAnalysisMode("state");
                    setDraftInsurer("");
                    setError("");
                    clearApplied();
                  }}
                >
                  State
                </button>
              </div>
            </div>

            {draftAnalysisMode === "insurer" && (
            <div className="filter-item">
              <label className="filter-label label-text">Select Insurer</label>
              <select className="filter-select" value={draftInsurer} onChange={(event) => { setDraftInsurer(event.target.value); clearApplied(); }}>
                <option value="">--------</option>
                {insurerOptions.map((insurerName) => (
                  <option key={insurerName} value={insurerName}>
                    {insurerName}
                  </option>
                ))}
              </select>
            </div>
            )}

            {draftAnalysisMode === "state" && (
            <div className="filter-item">
              <label className="filter-label label-text">Select State</label>
              <select className="filter-select" value={draftStateFilter} onChange={(event) => { setDraftStateFilter(event.target.value); clearApplied(); }}>
                <option value="">--------</option>
                {stateOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            )}

            <div className="filter-item">
              <label className="filter-label label-text">Select Year</label>
              <select className="filter-select" value={draftYear} onChange={(event) => { setDraftYear(event.target.value); clearApplied(); }}>
                <option value="">--------</option>
                {YEARS.map((yearOption) => (
                  <option key={yearOption} value={yearOption}>
                    {yearOption}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label className="filter-label label-text">View</label>
              <div className="premium-toggle-group">
                {VIEW_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`premium-toggle-btn ${draftView === option.value ? "active" : ""}`}
                    onClick={() => { setDraftView(option.value); clearApplied(); }}
                  >
                    {getViewLabel(draftAnalysisMode, option.value)}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="data-export-btn"
              onClick={applyFilters}
              disabled={!draftAnalysisMode || !hasDraftPrimarySelection || !draftYear || !draftView}
            >
              Apply Filters
            </button>
          </div>
        </div>

        <div className="life-data-panel card hm-result-panel">
          <div className="panel-header">
            <div className="panel-icon-badge">
              <BarChart3 size={14} strokeWidth={2} />
            </div>
            <div>
              <h3 className="panel-title section-title">{currentDataTitle}</h3>
              <p className="hm-subtitle">
                {activePrimaryLabel || "-"} | {year || "-"} | {getViewLabel(analysisMode, viewMode)}
              </p>
            </div>
            <div className="panel-header-actions">
              <button
                type="button"
                className="data-export-btn panel-action-btn"
                onClick={handleExportData}
                disabled={!analysisMode || !activePrimarySelection || !year || !viewMode || !hasData}
                title="Export to Excel"
              >
                Export to Excel
              </button>
            </div>
          </div>
          <div className="panel-body">

          {!analysisMode || !activePrimarySelection || !year || !viewMode ? (
            <div className="panel-state hm-panel-state">
              <p className="panel-placeholder">Select filters and click Apply Filters to view data.</p>
            </div>
          ) : loading ? (
            <div className="panel-state hm-panel-state">
              <p className="panel-placeholder">Loading data from Firestore...</p>
            </div>
          ) : error ? (
            <div className="panel-state panel-state-error hm-panel-state">
              <p className="panel-placeholder">Error: {error}</p>
            </div>
          ) : !hasData ? (
            <div className="panel-state hm-panel-state">
              <p className="panel-placeholder">No data available for the selected filters.</p>
            </div>
          ) : viewMode === "heatmap" ? (
            <div className="hm-heatmap-wrap">
              <div className="hm-dual-heatmaps">
                {/* ── Total Count panel ── */}
                <div className="hm-heatmap-card">
                  <p className="hm-heatmap-card-title">Total Count Heat Map</p>
                  <div className="hm-svg-scroll">
                    {analysisMode === "insurer" ? (
                      <svg width={columns * (cellSize + cellGap)} height={gridRows * (cellSize + cellGap)}>
                        {STATE_GRID.map(([stateName, col, row]) => {
                          const key = canonicalStateName(stateName);
                          const item = entitySeriesMap[key];
                          const value = item?.totalValue ?? 0;
                          const fill = getColor(value, totalMin, totalMax);
                          const isSelected = selectedDetailKey === key;
                          const cx = col * (cellSize + cellGap) + cellSize / 2;
                          const cy = row * (cellSize + cellGap) + cellSize / 2;
                          const words = stateName.split(" ");
                          const line1 = words[0]; const line2 = words.slice(1, 3).join(" ");
                          const nameColor = value > totalMax * 0.55 ? "white" : "#0f3d3d";
                          const valColor = value > totalMax * 0.55 ? "rgba(255,255,255,0.9)" : "#0d9488";
                          return (
                            <g key={key} className="hm-state-cell" onClick={() => setSelectedDetailKey(isSelected ? null : key)} style={{ cursor: "pointer" }}>
                              <rect x={col*(cellSize+cellGap)} y={row*(cellSize+cellGap)} width={cellSize} height={cellSize} rx={6} fill={fill} stroke={isSelected ? "#0d9488" : "transparent"} strokeWidth={isSelected ? 2 : 0} />
                              <text textAnchor="middle" fontSize={9} fill={nameColor}>
                                <tspan x={cx} y={line2 ? cy - 13 : cy - 7}>{line1}</tspan>
                                {line2 && <tspan x={cx} dy={10}>{line2}</tspan>}
                              </text>
                              <text x={cx} y={line2 ? cy + 11 : cy + 8} textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight="700" fill={valColor}>{formatCompactNumber(value)}</text>
                            </g>
                          );
                        })}
                      </svg>
                    ) : (
                      <div className="hm-insurer-scroll">
                      <div className="hm-insurer-grid">
                        {[...rows].sort((a, b) => b.totalValue - a.totalValue).map((item) => {
                          const fill = getColor(item.totalValue, totalMin, totalMax);
                          const isSelected = selectedDetailKey === item.key;
                          const nameColor = item.totalValue > totalMax * 0.55 ? "white" : "#0f3d3d";
                          const valColor = item.totalValue > totalMax * 0.55 ? "rgba(255,255,255,0.9)" : "#0d9488";
                          return (
                            <div key={item.key} className={`hm-insurer-cell${isSelected ? " is-selected" : ""}`} style={{ background: fill }} onClick={() => setSelectedDetailKey(isSelected ? null : item.key)}>
                              <span className="hm-insurer-name" style={{ color: nameColor }}>{item.label}</span>
                              <span className="hm-insurer-val" style={{ color: valColor }}>{formatCompactNumber(item.totalValue)}</span>
                            </div>
                          );
                        })}
                      </div>
                      </div>
                    )}
                  </div>
                  <div className="hm-legend">
                    <span className="hm-legend-label">Low</span>
                    <div className="hm-legend-bar" />
                    <span className="hm-legend-label">High</span>
                  </div>
                </div>

                {/* ── YoY Growth panel ── */}
                <div className="hm-heatmap-card">
                  <p className="hm-heatmap-card-title">YoY Growth % Heat Map</p>
                  <div className="hm-svg-scroll">
                    {analysisMode === "insurer" ? (
                      <svg width={columns * (cellSize + cellGap)} height={gridRows * (cellSize + cellGap)}>
                        {STATE_GRID.map(([stateName, col, row]) => {
                          const key = canonicalStateName(stateName);
                          const item = entitySeriesMap[key];
                          const value = item?.yoyValue ?? 0;
                          const fill = getGrowthColor(value, yoyMin, yoyMax);
                          const isSelected = selectedDetailKey === key;
                          const darkText = Math.abs(value) > Math.max(Math.abs(yoyMin), Math.abs(yoyMax)) * 0.5;
                          const cx = col * (cellSize + cellGap) + cellSize / 2;
                          const cy = row * (cellSize + cellGap) + cellSize / 2;
                          const words = stateName.split(" ");
                          const line1 = words[0]; const line2 = words.slice(1, 3).join(" ");
                          const nameColor = darkText ? "white" : "#0f3d3d";
                          const valColor = darkText ? "rgba(255,255,255,0.9)" : "#0d9488";
                          return (
                            <g key={key} className="hm-state-cell" onClick={() => setSelectedDetailKey(isSelected ? null : key)} style={{ cursor: "pointer" }}>
                              <rect x={col*(cellSize+cellGap)} y={row*(cellSize+cellGap)} width={cellSize} height={cellSize} rx={6} fill={fill} stroke={isSelected ? "#0d9488" : "transparent"} strokeWidth={isSelected ? 2 : 0} />
                              <text textAnchor="middle" fontSize={9} fill={nameColor}>
                                <tspan x={cx} y={line2 ? cy - 13 : cy - 7}>{line1}</tspan>
                                {line2 && <tspan x={cx} dy={10}>{line2}</tspan>}
                              </text>
                              <text x={cx} y={line2 ? cy + 11 : cy + 8} textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight="700" fill={valColor}>{Number.isFinite(value) ? `${value.toFixed(1)}%` : "-"}</text>
                            </g>
                          );
                        })}
                      </svg>
                    ) : (
                      <div className="hm-insurer-scroll">
                      <div className="hm-insurer-grid">
                        {[...rows].sort((a, b) => b.yoyValue - a.yoyValue).map((item) => {
                          const fill = getGrowthColor(item.yoyValue, yoyMin, yoyMax);
                          const isSelected = selectedDetailKey === item.key;
                          const darkText = Math.abs(item.yoyValue) > Math.max(Math.abs(yoyMin), Math.abs(yoyMax)) * 0.5;
                          const nameColor = darkText ? "white" : "#0f3d3d";
                          const valColor = darkText ? "rgba(255,255,255,0.9)" : "#0d9488";
                          return (
                            <div key={item.key} className={`hm-insurer-cell${isSelected ? " is-selected" : ""}`} style={{ background: fill }} onClick={() => setSelectedDetailKey(isSelected ? null : item.key)}>
                              <span className="hm-insurer-name" style={{ color: nameColor }}>{item.label}</span>
                              <span className="hm-insurer-val" style={{ color: valColor }}>{Number.isFinite(item.yoyValue) ? `${item.yoyValue.toFixed(1)}%` : "-"}</span>
                            </div>
                          );
                        })}
                      </div>
                      </div>
                    )}
                  </div>
                  <div className="hm-legend">
                    <span className="hm-legend-label">-ve</span>
                    <div className="hm-legend-bar-growth" />
                    <span className="hm-legend-label">+ve</span>
                  </div>
                </div>
              </div>

              {selectedDetailLabel && (
                <div className="hm-detail-card">
                  <p className="hm-detail-title">{selectedDetailLabel}</p>
                  <div className="hm-detail-items">
                    {YEARS.map((yr) => (
                      <span key={yr} className="hm-detail-item">
                        {yr}: {formatCompactNumber(selectedDetailSeries[yr] ?? 0)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hm-state-table-wrap data-table-container">
              <table className="hm-state-table segment-data-table">
                <thead>
                  <tr>
                    <th>{currentEntityLabel}</th>
                    <th>
                      <button type="button" className="hm-sort-head-btn" onClick={() => handleSort("totalValue")}>
                        Total No. of Individual Agents
                        <span className="hm-sort-indicator">
                          {tableSort.key === "totalValue" ? (tableSort.direction === "desc" ? "↓" : "↑") : "↕"}
                        </span>
                      </button>
                    </th>
                    <th>
                      <button type="button" className="hm-sort-head-btn" onClick={() => handleSort("yoyValue")}>
                        YoY Growth % for Individual Agents
                        <span className="hm-sort-indicator">
                          {tableSort.key === "yoyValue" ? (tableSort.direction === "desc" ? "↓" : "↑") : "↕"}
                        </span>
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTableRows.map((item) => (
                    <tr key={item.key}>
                      <td>{item.label}</td>
                      <td>{formatCompactNumber(item.totalValue)}</td>
                      <td>{`${item.yoyValue.toFixed(1)}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
