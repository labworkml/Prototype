import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";
import PlotComponentModule from "react-plotly.js";
import PlotlyModule from "plotly.js-dist-min";
import {
  BarChart3,
  Download,
  IndianRupee,
  Info,
  Lightbulb,
  Loader2,
  RefreshCw,
  Shuffle,
  TrendingUp,
} from "lucide-react";
import { db } from "../firebase/firebaseConfig";

const Plot = PlotComponentModule?.default || PlotComponentModule;
const Plotly = PlotlyModule?.default || PlotlyModule;
const COLLECTION_NAME = "Sheet_50_policyholder_account_metrics";

export default function GeneralPolicyholderAccountsModule({
  showInsights,
  setShowInsights,
}) {
  const [rawDocs, setRawDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("snapshot");
  const [selectedInsurer, setSelectedInsurer] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMetric, setSelectedMetric] = useState("");
  const [chartGraphDiv, setChartGraphDiv] = useState(null);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [showTimelinePicker, setShowTimelinePicker] = useState(false);
  const [timelineStartYear, setTimelineStartYear] = useState("");
  const [timelineEndYear, setTimelineEndYear] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    viewMode: "snapshot",
    insurer: "",
    segment: "",
    year: "",
    metric: "",
  });

  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      setError("");

      try {
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));
        const documents = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setRawDocs(documents);
      } catch (fetchError) {
        console.error("Failed to fetch Policyholder Accounts data:", fetchError);
        setError("Unable to load Policyholder Accounts data.");
        setRawDocs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, []);

  useEffect(() => {
    setSelectedInsurer("");
    setSelectedSegment("");
    setSelectedYear("");
    setSelectedMetric("");
  }, [viewMode]);

  const insurerOptions = useMemo(() => {
    return Array.from(new Set(rawDocs.map((document) => resolveInsurerName(document)).filter(Boolean)))
      .sort((first, second) => first.localeCompare(second))
      .map((insurerName) => ({ label: insurerName, value: insurerName }));
  }, [rawDocs]);

  const segmentOptions = useMemo(() => {
    const segments = new Set(["Total"]);

    rawDocs.forEach((document) => {
      const segmentName = resolvePolicyholderSegmentName(document);
      if (segmentName) {
        segments.add(segmentName);
      }
    });

    return Array.from(segments)
      .sort((first, second) => {
        if (normalizeText(first) === "total") {
          return -1;
        }

        if (normalizeText(second) === "total") {
          return 1;
        }

        return first.localeCompare(second);
      })
      .map((segmentName) => ({ label: segmentName, value: segmentName }));
  }, [rawDocs]);

  const yearOptions = useMemo(() => {
    return Array.from(new Set(rawDocs.map((document) => resolveYearLabel(document)).filter(Boolean)))
      .sort((first, second) => resolveYearSortValue(first) - resolveYearSortValue(second))
      .map((yearLabel) => ({ label: yearLabel, value: yearLabel }));
  }, [rawDocs]);

  const metricOptions = useMemo(() => {
    const normalizedInsurer = normalizeText(selectedInsurer);
    const normalizedSegment = normalizeText(selectedSegment || "Total");

    return Array.from(
      new Set(
        rawDocs
          .filter((document) => {
            if (normalizedInsurer && normalizeText(resolveInsurerName(document)) !== normalizedInsurer) {
              return false;
            }

            return normalizeText(resolvePolicyholderSegmentName(document)) === normalizedSegment;
          })
          .map((document) => resolvePolicyholderMetricName(document))
          .filter(Boolean)
      )
    )
      .sort(comparePolicyholderMetricNames)
      .map((metricName) => ({ label: metricName, value: metricName }));
  }, [rawDocs, selectedInsurer, selectedSegment]);

  const snapshotRows = useMemo(() => {
    if (!appliedFilters.insurer || !appliedFilters.year) {
      return [];
    }

    const normalizedInsurer = normalizeText(appliedFilters.insurer);
    const normalizedSegment = normalizeText(appliedFilters.segment || "Total");
    const normalizedYear = normalizeText(appliedFilters.year);
    const metricTotals = new Map();

    rawDocs.forEach((document) => {
      if (normalizeText(resolveInsurerName(document)) !== normalizedInsurer) {
        return;
      }

      if (normalizeText(resolvePolicyholderSegmentName(document)) !== normalizedSegment) {
        return;
      }

      if (normalizeText(resolveYearLabel(document)) !== normalizedYear) {
        return;
      }

      const metricName = resolvePolicyholderMetricName(document);
      if (!metricName) {
        return;
      }

      const currentRow = metricTotals.get(metricName) || {
        metric: metricName,
        value: 0,
        order: resolvePolicyholderMetricOrder(document),
      };

      currentRow.value += resolvePolicyholderMetricValue(document);

      const nextOrder = resolvePolicyholderMetricOrder(document);
      if (
        Number.isFinite(nextOrder) &&
        (!Number.isFinite(currentRow.order) || nextOrder < currentRow.order)
      ) {
        currentRow.order = nextOrder;
      }

      metricTotals.set(metricName, currentRow);
    });

    return Array.from(metricTotals.values()).sort(comparePolicyholderRows);
  }, [rawDocs, appliedFilters]);

  const trendRows = useMemo(() => {
    if (appliedFilters.viewMode !== "trend" || !appliedFilters.insurer || !appliedFilters.metric) {
      return [];
    }

    const normalizedInsurer = normalizeText(appliedFilters.insurer);
    const normalizedSegment = normalizeText(appliedFilters.segment || "Total");
    const normalizedMetric = normalizeText(appliedFilters.metric);
    const yearTotals = new Map();

    rawDocs.forEach((document) => {
      if (normalizeText(resolveInsurerName(document)) !== normalizedInsurer) {
        return;
      }

      if (normalizeText(resolvePolicyholderSegmentName(document)) !== normalizedSegment) {
        return;
      }

      if (normalizeText(resolvePolicyholderMetricName(document)) !== normalizedMetric) {
        return;
      }

      const yearLabel = resolveYearLabel(document);
      if (!yearLabel) {
        return;
      }

      yearTotals.set(
        yearLabel,
        (yearTotals.get(yearLabel) || 0) + resolvePolicyholderMetricValue(document)
      );
    });

    return Array.from(yearTotals.entries())
      .map(([year, value]) => ({ year, value }))
      .sort((first, second) => resolveYearSortValue(first.year) - resolveYearSortValue(second.year));
  }, [rawDocs, appliedFilters]);

  const timelineYearOptions = useMemo(() => {
    const seen = new Map();
    trendRows.forEach((row) => {
      const label = String(row.year || "").trim();
      const sortVal = resolveYearSortValue(label);
      if (label && Number.isFinite(sortVal) && !seen.has(label)) {
        seen.set(label, sortVal);
      }
    });
    return Array.from(seen.entries())
      .sort((a, b) => a[1] - b[1])
      .map(([label, sortVal]) => ({ label, sortVal }));
  }, [trendRows]);

  const filteredTrendRows = useMemo(() => {
    if (!timelineStartYear && !timelineEndYear) {
      return trendRows;
    }
    const start = timelineStartYear ? resolveYearSortValue(timelineStartYear) : -Infinity;
    const end = timelineEndYear ? resolveYearSortValue(timelineEndYear) : Infinity;
    return trendRows.filter((row) => {
      const y = resolveYearSortValue(row.year);
      return Number.isFinite(y) && y >= start && y <= end;
    });
  }, [trendRows, timelineStartYear, timelineEndYear]);

  const plotTraces = useMemo(() => {
    return [
      {
        type: "scatter",
        mode: "lines+markers",
        name: appliedFilters.metric || "Value",
        x: filteredTrendRows.map((row) => String(row.year)),
        y: filteredTrendRows.map((row) => Number(row.value || 0)),
        line: { color: "#0ea5a4", width: 3 },
        marker: { color: "#0ea5a4", size: 8 },
        hovertemplate: `%{x}<br>${appliedFilters.metric || "Value"}: %{y:,}<extra></extra>`,
      },
    ];
  }, [selectedMetric, trendRows]);

  const plotLayout = useMemo(
    () => ({
      autosize: true,
      paper_bgcolor: "rgba(0, 0, 0, 0)",
      plot_bgcolor: "rgba(0, 0, 0, 0)",
      margin: { l: 60, r: 18, t: 82, b: 52 },
      title: {
        text: wrapChartTitle(
          ["Policyholder Accounts", appliedFilters.insurer, appliedFilters.segment, appliedFilters.metric]
            .filter(Boolean)
            .join(" : ")
        ).text,
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
        title: { text: "Value", font: { size: 12, color: "#475569" } },
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
    [appliedFilters.insurer, appliedFilters.metric, appliedFilters.segment]
  );

  const plotConfig = useMemo(
    () => ({
      responsive: true,
      displaylogo: false,
      modeBarButtonsToRemove: ["select2d", "lasso2d", "toggleSpikelines", "autoScale2d"],
      toImageButtonOptions: {
        format: "png",
        filename: buildExportFileName("Policyholder Accounts", [
          { label: "Insurer", value: appliedFilters.insurer },
          { label: "Segment", value: appliedFilters.segment },
          { label: "Metric", value: appliedFilters.metric },
          { label: "View", value: "Trend" },
        ]),
        width: 1280,
        height: 720,
        scale: 2,
      },
    }),
    [appliedFilters.insurer, appliedFilters.metric, appliedFilters.segment]
  );

  const handleResetFilters = () => {
    setViewMode("snapshot");
    setSelectedInsurer("");
    setSelectedSegment("");
    setSelectedYear("");
    setSelectedMetric("");
    setAppliedFilters({
      viewMode: "snapshot",
      insurer: "",
      segment: "",
      year: "",
      metric: "",
    });
    setShowTimelinePicker(false);
    setTimelineStartYear("");
    setTimelineEndYear("");
    setError("");
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
      viewMode,
      insurer: selectedInsurer,
      segment: selectedSegment || "Total",
      year: selectedYear,
      metric: selectedMetric,
    });
    setShowTimelinePicker(false);
    setTimelineStartYear("");
    setTimelineEndYear("");
  };

  const handleExportImage = async () => {
    if (!chartGraphDiv || isExportingImage || trendRows.length === 0) {
      return;
    }

    setIsExportingImage(true);
    try {
      await Plotly.downloadImage(chartGraphDiv, {
        format: "png",
        filename: buildExportFileName("Policyholder Accounts", [
          { label: "Insurer", value: appliedFilters.insurer },
          { label: "Segment", value: appliedFilters.segment },
          { label: "Metric", value: appliedFilters.metric },
          { label: "View", value: "Trend" },
        ]),
        width: 1280,
        height: 720,
        scale: 2,
      });
    } catch (exportError) {
      console.error("Failed to export chart image:", exportError);
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleExportData = async () => {
    const activeFilters =
      appliedFilters.viewMode === "snapshot"
        ? [
            { label: "Insurer", value: appliedFilters.insurer },
            { label: "Segment", value: appliedFilters.segment },
            { label: "Year", value: appliedFilters.year },
            { label: "View", value: "Snapshot" },
          ]
        : [
            { label: "Insurer", value: appliedFilters.insurer },
            { label: "Segment", value: appliedFilters.segment },
            { label: "Metric", value: appliedFilters.metric },
            { label: "View", value: "Trend" },
          ];

    const exportRows =
      appliedFilters.viewMode === "snapshot"
        ? [
            ["Sub Module", "Policyholder Accounts"],
            [],
            ["Applied Filters", "Value"],
            ...activeFilters.map((filter) => [filter.label, formatFieldValue(filter.value)]),
            [],
            ["Metric", "Value"],
            ...snapshotRows.map((row) => [
              row.metric,
              Number(row.value || 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
            ]),
          ]
        : [
            ["Sub Module", "Policyholder Accounts"],
            [],
            ["Applied Filters", "Value"],
            ...activeFilters.map((filter) => [filter.label, formatFieldValue(filter.value)]),
            [],
            ["Year", "Value"],
            ...trendRows.map((row) => [
              row.year,
              Number(row.value || 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
            ]),
          ];

    if ((appliedFilters.viewMode === "snapshot" && snapshotRows.length === 0) || (appliedFilters.viewMode === "trend" && filteredTrendRows.length === 0)) {
      return;
    }

    const fileBaseName = buildExportFileName("Policyholder Accounts", activeFilters);

    try {
      const worksheet = XLSX.utils.aoa_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
      XLSX.writeFile(workbook, `${fileBaseName}.xlsx`);
      return;
    } catch (exportError) {
      const csvContent = exportRows.map((row) => row.map(escapeCsvValue).join(",")).join("\n");
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
    <>
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
            <div className="filter-item">
              <label className="filter-label label-text">Select View</label>
              <div className="policyholder-view-toggle" role="tablist" aria-label="Policyholder account views">
                <button
                  type="button"
                  className={`policyholder-view-toggle-btn ${viewMode === "snapshot" ? "active" : ""}`}
                  onClick={() => setViewMode("snapshot")}
                >
                  Snapshot View
                </button>
                <button
                  type="button"
                  className={`policyholder-view-toggle-btn ${viewMode === "trend" ? "active" : ""}`}
                  onClick={() => setViewMode("trend")}
                >
                  Trend View
                </button>
              </div>
            </div>
            <FilterSelect
              label="Select Insurer"
              options={insurerOptions}
              value={selectedInsurer}
              onChange={setSelectedInsurer}
            />
            <FilterSelect
              label="Select Segment"
              options={segmentOptions}
              value={selectedSegment}
              onChange={setSelectedSegment}
            />
            {viewMode === "snapshot" ? (
              <FilterSelect
                label="Select Year"
                options={yearOptions}
                value={selectedYear}
                onChange={setSelectedYear}
              />
            ) : (
              <FilterSelect
                label="Select Metric"
                options={metricOptions}
                value={selectedMetric}
                onChange={setSelectedMetric}
              />
            )}
            {loading && <p className="panel-placeholder">Loading filters...</p>}
            {error && !loading && <p className="panel-placeholder">{error}</p>}
            <button
              type="button"
              className="apply-filters-btn"
              onClick={handleApplyFilters}
            >
              Apply Filters
            </button>
          </div>
        </div>

        <div className="life-data-panel card">
          <div className="panel-header">
            <div className="panel-icon-badge">
              <BarChart3 size={14} strokeWidth={2} />
            </div>
            <h3 className="panel-title section-title">Data Panel</h3>
            {appliedFilters.viewMode === "trend" && trendRows.length > 0 && (
              <button
                type="button"
                className="data-export-btn"
                onClick={() => {
                  const isOpening = !showTimelinePicker;
                  setShowTimelinePicker(isOpening);
                  if (isOpening && timelineYearOptions.length > 0) {
                    if (!timelineStartYear) {
                      setTimelineStartYear(timelineYearOptions[0].label);
                    }
                    if (!timelineEndYear) {
                      setTimelineEndYear(timelineYearOptions[timelineYearOptions.length - 1].label);
                    }
                  }
                }}
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
            {loading ? (
              <PanelState variant="loading" message="Loading data..." />
            ) : error ? (
              <PanelState variant="error" message={error} />
            ) : appliedFilters.viewMode === "snapshot" ? (
              !appliedFilters.insurer || !appliedFilters.year ? (
                <PanelState
                  variant="empty"
                  message="Select insurer, segment, and year to view policyholder account metrics."
                  hint="Snapshot view shows all policyholder account values for the selected year."
                />
              ) : snapshotRows.length > 0 ? (
                <div className="data-table-container">
                  <table className="segment-data-table">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th className="col-value"><span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}><IndianRupee size={12} strokeWidth={2.2} />CR</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshotRows.map((row) => (
                        <tr key={row.metric}>
                          <td>{row.metric}</td>
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
              ) : (
                <PanelState
                  variant="empty"
                  message="No data found for selected filters."
                  hint="Try another insurer, segment, or year."
                />
              )
            ) : !appliedFilters.insurer || !appliedFilters.metric ? (
              <PanelState
                variant="empty"
                message="Select insurer, segment, and metric to view the trend."
                hint="Trend view shows the selected metric across all available years."
              />
            ) : trendRows.length > 0 ? (
              <div className="data-table-container">
                {showTimelinePicker && timelineYearOptions.length > 0 && (
                  <div className="timeline-filter-row">
                    <div className="timeline-field">
                      <label className="filter-label label-text">From</label>
                      <select
                        className="filter-select timeline-select"
                        value={timelineStartYear}
                        onChange={(e) => {
                          const next = e.target.value;
                          setTimelineStartYear(next);
                          const nextSortVal = resolveYearSortValue(next);
                          const endSortVal = resolveYearSortValue(timelineEndYear);
                          if (timelineEndYear && nextSortVal > endSortVal) {
                            setTimelineEndYear(next);
                          }
                        }}
                      >
                        {timelineYearOptions
                          .filter((opt) =>
                            !timelineEndYear ||
                            opt.sortVal <= resolveYearSortValue(timelineEndYear)
                          )
                          .map((opt) => (
                            <option key={`start-${opt.label}`} value={opt.label}>
                              {opt.label}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="timeline-field">
                      <label className="filter-label label-text">To</label>
                      <select
                        className="filter-select timeline-select"
                        value={timelineEndYear}
                        onChange={(e) => {
                          const next = e.target.value;
                          setTimelineEndYear(next);
                          const nextSortVal = resolveYearSortValue(next);
                          const startSortVal = resolveYearSortValue(timelineStartYear);
                          if (timelineStartYear && nextSortVal < startSortVal) {
                            setTimelineStartYear(next);
                          }
                        }}
                      >
                        {timelineYearOptions
                          .filter((opt) =>
                            !timelineStartYear ||
                            opt.sortVal >= resolveYearSortValue(timelineStartYear)
                          )
                          .map((opt) => (
                            <option key={`end-${opt.label}`} value={opt.label}>
                              {opt.label}
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
                <table className="segment-data-table">
                  <thead>
                    <tr>
                      <th className="col-year">Year</th>
                      <th className="col-value"><span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}><IndianRupee size={12} strokeWidth={2.2} />CR</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrendRows.map((row) => (
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
            ) : (
              <PanelState
                variant="empty"
                message="No data found for selected filters."
                hint="Try another insurer, segment, or metric."
              />
            )}
          </div>
        </div>

        <div className="life-viz-panel card">
          <div className="panel-header">
            <div className="panel-icon-badge">
              <TrendingUp size={14} strokeWidth={2} />
            </div>
            <h3 className="panel-title section-title">Visualization Panel</h3>
            {appliedFilters.viewMode === "trend" && filteredTrendRows.length > 0 && (
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
            )}
          </div>
          <div className="panel-body viz-panel-body">
            {loading ? (
              <PanelState
                variant="loading"
                message="Loading visualization"
                hint="Preparing chart for selected filters."
              />
            ) : error ? (
              <PanelState variant="error" message={error} />
            ) : appliedFilters.viewMode === "snapshot" ? (
              <div className="chart-wrapper">
                <PanelState
                  variant="empty"
                  message="Switch to Trend View to see the year-wise line chart."
                  hint="Snapshot view is table-only by design."
                />
              </div>
            ) : filteredTrendRows.length > 0 ? (
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
            ) : (
              <PanelState
                variant="empty"
                message={
                  appliedFilters.insurer && appliedFilters.metric
                    ? "No data found for selected filters."
                    : "Select filters to view the trend chart."
                }
                hint="Trend view plots year versus value."
              />
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
              {showInsights ? (
                "<<"
              ) : (
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
                  message="Insights are not configured for this module yet."
                  hint="The data and visualization views are fully available."
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
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

function FilterSelect({ label, options, value, onChange }) {
  return (
    <div className="filter-item">
      <label className="filter-label label-text">{label}</label>
      <select className="filter-select" value={value} onChange={(event) => onChange?.(event.target.value)}>
        <option value="">--------</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
  ];

  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined || candidate === "") {
      continue;
    }

    if (candidate && typeof candidate.toDate === "function") {
      const dateValue = candidate.toDate();
      if (dateValue instanceof Date && !Number.isNaN(dateValue.getTime())) {
        return dateValue.toLocaleDateString("en-GB");
      }
    }

    if (typeof candidate === "object" && Number.isFinite(candidate?.seconds)) {
      const dateValue = new Date(candidate.seconds * 1000);
      if (!Number.isNaN(dateValue.getTime())) {
        return dateValue.toLocaleDateString("en-GB");
      }
    }

    const value = String(candidate).trim();
    if (value) {
      return value;
    }
  }

  return "";
}

function resolvePolicyholderSegmentName(document) {
  return resolveSegmentName(document) || "Total";
}

function resolvePolicyholderMetricName(document) {
  const candidates = [
    document?.policyholder_account,
    document?.policyholderAccount,
    document?.metric,
    document?.metric_name,
    document?.metricName,
    document?.account_head,
    document?.accountHead,
    document?.line_item,
    document?.lineItem,
    document?.head,
    document?.item,
    document?.description,
  ];

  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (value) {
      return formatDisplayLabel(value);
    }
  }

  return "";
}

function resolvePolicyholderMetricValue(document) {
  const preferredFields = [
    "value",
    "amount",
    "metric_value",
    "metricValue",
    "policyholder_account_value",
    "policyholderAccountValue",
    "balance",
    "total",
  ];

  for (const fieldName of preferredFields) {
    const parsedValue = parseNumericFieldValue(document?.[fieldName]);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  for (const [fieldName, fieldValue] of Object.entries(document || {})) {
    if (/policyholder_account|metric|amount|value|balance|total/i.test(fieldName)) {
      const parsedValue = parseNumericFieldValue(fieldValue);
      if (parsedValue !== null) {
        return parsedValue;
      }
    }
  }

  return 0;
}

function resolvePolicyholderMetricOrder(document) {
  const candidates = [
    document?.order,
    document?.sort_order,
    document?.sortOrder,
    document?.sequence,
    document?.sequence_no,
    document?.sequenceNo,
    document?.serial_no,
    document?.serialNo,
    document?.s_no,
    document?.sno,
  ];

  for (const candidate of candidates) {
    const parsedValue = parseNumericFieldValue(candidate);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  return Number.NaN;
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

function formatDisplayLabel(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (!word) {
        return word;
      }

      if (word === word.toUpperCase() || /[A-Z]/.test(word.slice(1))) {
        return word;
      }

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

const POLICYHOLDER_METRIC_ORDER_PATTERNS = [
  /premiums?\s+earned/i,
  /profit.*(?:sale|redemption|invest)|loss.*(?:sale|redemption|invest)/i,
  /interest.*dividend|dividend.*rent/i,
  /other\s+income/i,
  /total\s+income/i,
  /claims?\s+incurred/i,
  /^commission$/i,
  /operating\s+expenses?.*(?:insurance|related|business)/i,
  /premium\s+deficiency/i,
  /total\s+expenses?/i,
  /operating\s+(?:profit|loss).*(?:fire|marine|misc|business)/i,
  /transfer.*shareholder/i,
];

function getPolicyholderMetricPriority(metricName) {
  const normalizedMetric = normalizeText(metricName);
  for (let i = 0; i < POLICYHOLDER_METRIC_ORDER_PATTERNS.length; i++) {
    if (POLICYHOLDER_METRIC_ORDER_PATTERNS[i].test(normalizedMetric)) {
      return i;
    }
  }
  return POLICYHOLDER_METRIC_ORDER_PATTERNS.length;
}

function comparePolicyholderMetricNames(firstMetric, secondMetric) {
  const firstPriority = getPolicyholderMetricPriority(firstMetric);
  const secondPriority = getPolicyholderMetricPriority(secondMetric);

  if (firstPriority !== secondPriority) {
    return firstPriority - secondPriority;
  }

  return String(firstMetric).localeCompare(String(secondMetric));
}

function comparePolicyholderRows(firstRow, secondRow) {
  const firstOrder = Number(firstRow?.order);
  const secondOrder = Number(secondRow?.order);

  if (Number.isFinite(firstOrder) && Number.isFinite(secondOrder) && firstOrder !== secondOrder) {
    return firstOrder - secondOrder;
  }

  if (Number.isFinite(firstOrder) && !Number.isFinite(secondOrder)) {
    return -1;
  }

  if (!Number.isFinite(firstOrder) && Number.isFinite(secondOrder)) {
    return 1;
  }

  return comparePolicyholderMetricNames(firstRow?.metric, secondRow?.metric);
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
