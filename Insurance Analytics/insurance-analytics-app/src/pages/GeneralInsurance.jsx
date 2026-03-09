import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";
import {
  AlertTriangle,
  BarChart2,
  BarChart3,
  Building,
  Building2,
  CheckCircle,
  CreditCard,
  FileText,
  Globe,
  IndianRupeeIcon,
  Landmark,
  LayoutGrid,
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
  }, [isAumInsurerWiseView, selectedAumSector]);

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
                <p className="panel-placeholder">Loading insurer details...</p>
              ) : detailsError ? (
                <p className="panel-placeholder">{detailsError}</p>
              ) : !selectedInsurerRegNo ? (
                <p className="panel-placeholder">Select an insurer to view details.</p>
              ) : insurerDetailRows.length > 0 ? (
                <div className="data-fields-list">
                  {insurerDetailRows.map((row) => (
                    <DataRow key={row.label} label={row.label} value={row.value} />
                  ))}
                </div>
              ) : (
                <p className="panel-placeholder">Select an insurer to view details.</p>
              )
            ) : isAumInsurerWiseView ? (
              aumLoading ? (
                <p className="panel-placeholder">Loading data...</p>
              ) : aumError ? (
                <p className="panel-placeholder">{aumError}</p>
              ) : !appliedAumSector || !appliedAumInsurer || !appliedInvestmentCategory ? (
                <p className="panel-placeholder">Select filters and click Apply Filters to view data.</p>
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
                    </div>
                  )}
                  <div className="data-table-container">
                    <table className="segment-data-table">
                      <thead>
                        <tr>
                          <th className="col-year">Year</th>
                          <th className="col-value">
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              Assets under Management in Cr
                              <IndianRupeeIcon size={13} strokeWidth={2.2} />
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleAumRows.map((row) => (
                          <tr key={row.year}>
                            <td className="col-year">{row.year}</td>
                            <td className="col-value">
                              {Number(row.value || 0).toLocaleString("en-IN", {
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
                <p className="panel-placeholder">No data found for selected filters.</p>
              )
            ) : (
              <div className="data-table-container">
                <p className="panel-placeholder">Select filters to view analytics.</p>
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
          </div>
          <div className="panel-body viz-panel-body">
            <div className="chart-wrapper">
              <p className="panel-placeholder">Select filters to view analytics.</p>
            </div>
          </div>
        </div>
      </div>
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
        <option value="">{placeholder}</option>
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
