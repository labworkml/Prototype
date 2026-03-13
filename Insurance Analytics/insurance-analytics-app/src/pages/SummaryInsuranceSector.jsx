import { useState } from "react";
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
      { id: "num-reinsurers",      title: "No. of Reinsurers Operating in India",   icon: Layers,      desc: "Active domestic & foreign reinsurers" },
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

  // Modal filter state
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSector, setSelectedSector] = useState("");
  const [selectedInsurerType, setSelectedInsurerType] = useState("");

  const openModal = (metric, section) => {
    setActiveModal({ metric, section });
    setSelectedYear("");
    setSelectedSector("");
    setSelectedInsurerType("");
  };

  const closeModal = () => setActiveModal(null);

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

            {/* Modal filter bar */}
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

            {/* Modal 3-panel body */}
            <div className="summary-modal-body">
              {/* Filters panel */}
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

              {/* Data panel */}
              <div className="summary-panel summary-panel-data life-data-panel card">
                <div className="panel-header">
                  <div className="panel-icon-badge">
                    <BarChart2 size={13} strokeWidth={2} />
                  </div>
                  <h3 className="panel-title section-title">Data Panel</h3>
                  <div className="panel-header-actions">
                    <button type="button" className="data-export-btn" disabled>
                      Export to Excel
                    </button>
                  </div>
                </div>
                <div className="panel-body summary-panel-placeholder">
                  <div className="panel-state panel-state-empty">
                    <Info className="panel-state-icon" size={20} strokeWidth={2.2} />
                    <p className="panel-placeholder">Select filters to view analytics.</p>
                    <p className="panel-state-hint">Results will appear here after applying filters.</p>
                  </div>
                </div>
              </div>

              {/* Visualization panel */}
              <div className="summary-panel summary-panel-viz life-viz-panel card">
                <div className="panel-header">
                  <div className="panel-icon-badge">
                    <Activity size={13} strokeWidth={2} />
                  </div>
                  <h3 className="panel-title section-title">Visualization</h3>
                </div>
                <div className="panel-body summary-panel-placeholder">
                  <div className="panel-state panel-state-empty">
                    <Info className="panel-state-icon" size={20} strokeWidth={2.2} />
                    <p className="panel-placeholder">Chart will appear here.</p>
                    <p className="panel-state-hint">Apply filters in the Data Panel to generate a chart.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
