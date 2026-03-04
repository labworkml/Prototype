# SegmentAnalysisFilters Component

A reusable filter UI component for "Total Premium - Segment Analysis" under Market Overview in Life Insurance.

## Features

- **Category Dropdown**: Linked, Non-Linked, Linked and Non-Linked
- **Segment Dropdown**: Life, Pension, Health, Annuity, Others
- **Participation Dropdown**: Participating, Non-Participating, Both
- **Premium Type Toggle Buttons**: First Year, Renewal, Single, Total
- **View Mode Radio Toggle**: Amount ₹, Percentage %
- **Reset Filters Button**: Clears all filters to defaults

## Usage

### Import

```jsx
import SegmentAnalysisFilters from "../components/SegmentAnalysisFilters";
```

### Example Implementation

```jsx
import { useState } from "react";
import SegmentAnalysisFilters from "../components/SegmentAnalysisFilters";

export default function SegmentAnalysisPage() {
  // Filter state
  const [category, setCategory] = useState("Linked");
  const [segment, setSegment] = useState("Life");
  const [participation, setParticipation] = useState("Participating");
  const [premiumType, setPremiumType] = useState("Total");
  const [viewMode, setViewMode] = useState("amount");

  // Handle data fetch or chart update based on filters
  const handleFilterChange = () => {
    // Call API or update chart with current filter values
    console.log({
      category,
      segment,
      participation,
      premiumType,
      viewMode,
    });
  };

  return (
    <div className="segment-analysis-page">
      {/* Filters Component */}
      <SegmentAnalysisFilters
        category={category}
        setCategory={setCategory}
        segment={segment}
        setSegment={setSegment}
        participation={participation}
        setParticipation={setParticipation}
        premiumType={premiumType}
        setPremiumType={setPremiumType}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Chart or Data Panel */}
      <div className="content-area">
        {/* Your chart or data visualization here */}
      </div>
    </div>
  );
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `category` | string | Current category value (Linked, Non-Linked, Linked and Non-Linked) |
| `setCategory` | function | Setter for category |
| `segment` | string | Current segment value (Life, Pension, Health, Annuity, Others) |
| `setSegment` | function | Setter for segment |
| `participation` | string | Current participation value (Participating, Non-Participating, Both) |
| `setParticipation` | function | Setter for participation |
| `premiumType` | string | Current premium type (First Year, Renewal, Single, Total) |
| `setPremiumType` | function | Setter for premium type |
| `viewMode` | string | Current view mode ('amount' or 'percentage') |
| `setViewMode` | function | Setter for view mode |

## Default Values

When using the reset button, filters reset to:
- **Category**: Linked
- **Segment**: Life
- **Participation**: Participating
- **Premium Type**: Total
- **View Mode**: amount (Amount ₹)

## Styling

The component uses CSS from `src/styles/segment-analysis-filters.css`. It features:

- Blue theme with hover effects
- Responsive design (desktop, tablet, mobile)
- Accessibility features (proper labels, semantic HTML)
- Smooth transitions and animations

## Integration Notes

- This component handles **UI only** - no Firestore or data fetching
- Parent component is responsible for handling data updates when filters change
- Use `useEffect` in parent to trigger updates when filter values change:

```jsx
useEffect(() => {
  // Fetch or filter data based on current state
  fetchFilteredData({
    category,
    segment,
    participation,
    premiumType,
    viewMode,
  });
}, [category, segment, participation, premiumType, viewMode]);
```

## Customization

To modify options or defaults, edit the arrays in the component:

```jsx
const categoryOptions = ["Linked", "Non-Linked", "Linked and Non-Linked"];
const segmentOptions = ["Life", "Pension", "Health", "Annuity", "Others"];
const participationOptions = ["Participating", "Non-Participating", "Both"];
const premiumTypeOptions = ["First Year", "Renewal", "Single", "Total"];
```
