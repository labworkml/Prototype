import { CheckCircle } from "lucide-react";
import "../styles/segment-analysis-filters.css";

export default function SegmentAnalysisFilters({
  category,
  setCategory,
  segment,
  setSegment,
  participation,
  setParticipation,
  premiumType,
  setPremiumType,
  viewMode,
  setViewMode,
  onApply,
}) {
  const categoryOptions = ["Linked", "Non-Linked", "Linked and Non-Linked"];
  const segmentOptions = ["Life", "Pension", "Health", "Annuity", "Others"];
  const participationOptions = ["Participating", "Non-Participating", "Both"];
  const premiumTypeOptions = ["First Year", "Renewal", "Single", "Total"];
  const viewModeOptions = [
    { value: "amount", label: "Amount ₹" },
    { value: "percentage", label: "Percentage %" },
  ];

  const isApplyDisabled = !category || !segment || !participation || !premiumType;

  const handleApplyFilters = () => {
    if (onApply && !isApplyDisabled) {
      onApply();
    }
  };

  return (
    <div className="segment-analysis-filters">
      {/* Category Dropdown */}
      <div className="filter-item">
        <label className="filter-label">Category</label>
        <div className="dropdown-wrapper">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="filter-select"
          >
            <option value="">---- Select ----</option>
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Segment Dropdown */}
      <div className="filter-item">
        <label className="filter-label">Segment</label>
        <div className="dropdown-wrapper">
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            className="filter-select"
          >
            <option value="">---- Select ----</option>
            {segmentOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Participation Dropdown */}
      <div className="filter-item">
        <label className="filter-label">Participation</label>
        <div className="dropdown-wrapper">
          <select
            value={participation}
            onChange={(e) => setParticipation(e.target.value)}
            className="filter-select"
          >
            <option value="">---- Select ----</option>
            {participationOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Premium Type Toggle Buttons */}
      <div className="premium-type-section">
        <label className="filter-label">Premium Type</label>
        <div className="toggle-button-group">
          {premiumTypeOptions.map((option) => (
            <button
              key={option}
              className={`toggle-button ${premiumType === option ? "active" : ""}`}
              onClick={() => setPremiumType(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* View Mode Radio Toggle */}
      <div className="view-mode-section">
        <label className="filter-label">View Mode</label>
        <div className="radio-toggle-group">
          {viewModeOptions.map((option) => (
            <label key={option.value} className="radio-option">
              <input
                type="radio"
                name="viewMode"
                value={option.value}
                checked={viewMode === option.value}
                onChange={(e) => setViewMode(e.target.value)}
                className="radio-input"
              />
              <span className="radio-label">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Apply Filters Button */}
      <button
        type="button"
        className="apply-filters-btn"
        onClick={handleApplyFilters}
        disabled={isApplyDisabled}
        aria-label="Apply filters"
        title="Apply selected filters"
      >
        <CheckCircle className="apply-icon" size={16} strokeWidth={2} />
        <span>Apply Filters</span>
      </button>
    </div>
  );
}
