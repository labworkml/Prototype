import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const LIFE_INDIVIDUAL_AGENTS_COLLECTION = "life_individual_agents";
const CORPORATE_AGENTS_COLLECTION = "corporate_agents_life_insurers";
const MICRO_INSURANCE_AGENTS_COLLECTION = "Microinsurance_agents_life_insurers";
const AVG_INDIVIDUAL_POLICIES_COLLECTION = "avg_individual_policies_agents";
const AVG_NEW_BUSINESS_PREMIUM_COLLECTION = "avg_new_business_premium_income_per_agent";
const AVG_PREMIUM_PER_POLICY_COLLECTION = "avg_premium_income_per_policy_per_agent";
const LIFE_AGENTS_STATEWISE_COLLECTION = "sheet96_life_agents_statewise";
const REGISTERED_BROKERS_STATEWISE_COLLECTION = "sheet97_statewise_registered_brokers";
const IMFS_STATEWISE_COLLECTION = "sheet98_statewise_number_of_imfs";
const LIFE_CHANNEL_INDIVIDUAL_NEW_BUSINESS_COLLECTION =
  "Sheet99_Channel_Wise_Individual_New_Business_Life_Insurance";
const LIFE_CHANNEL_GROUP_NEW_BUSINESS_COLLECTION =
  "Sheet101_Channel_Wise_Group_New_Business_Life_Insurance";
const LIFE_INSURER_INDIVIDUAL_NEW_BUSINESS_COLLECTION =
  "Sheet100_Channel_Wise_Insurer_Wise_Individual_New_Business_Premium_for_Life";
const LIFE_INSURER_GROUP_NEW_BUSINESS_COLLECTION =
  "Sheet102_CHANNEL_WISE_INSURER_WISE_LIFE_INSURANCE_GROUP_NEW_BUSINESS";
const NON_LIFE_GENERAL_INSURANCE_CHANNEL_WISE_COLLECTION =
  "Sheet103_General_Insurance_Business_Channel_Wise";
const NON_LIFE_HEALTH_INSURANCE_CHANNEL_WISE_COLLECTION =
  "Sheet104_CLEANED";

const HEALTH_CATEGORY_DISPLAY_ORDER = [
  "Individual Business",
  "Individual Insurance including Family/Floater",
  "Group Business (Excluding Government Business)",
  "Group Business (Including Government Sponsored Insurance Schemes & RBSY)",
  "Government Business (Including RBSY & Other Government Sponsored Schemes)",
  "Grand Total",
];

export function getDefaultNonLifeGeneralCollectionName() {
  return NON_LIFE_GENERAL_INSURANCE_CHANNEL_WISE_COLLECTION;
}

export function getDefaultNonLifeHealthCollectionName() {
  return NON_LIFE_HEALTH_INSURANCE_CHANNEL_WISE_COLLECTION;
}

export async function getHealthBusinessChannels(collectionName) {
  if (!collectionName) {
    return [];
  }

  try {
    const snapshot = await getDocs(collection(db, collectionName));

    return Array.from(
      new Set(snapshot.docs.map((document) => resolveChannelName(document.data())).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error("Failed to fetch health business channels:", error);
    return [];
  }
}

export async function getHealthBusinessCategories(collectionName, channel) {
  if (!collectionName || !channel) {
    return [];
  }

  try {
    const snapshot = await getDocs(collection(db, collectionName));

    const discoveredCategories = Array.from(
      new Set(
        snapshot.docs
          .filter((document) => matchesChannelName(document.data(), channel))
          .map((document) => resolveCategoryName(document.data()))
          .filter(Boolean)
      )
    );

    const canonicalFoundSet = new Set();
    const remainingCategories = [];

    discoveredCategories.forEach((category) => {
      const canonicalCategory = getCanonicalHealthCategoryLabel(category);
      if (canonicalCategory) {
        canonicalFoundSet.add(canonicalCategory);
        return;
      }

      remainingCategories.push(category);
    });

    const orderedCanonicalCategories = HEALTH_CATEGORY_DISPLAY_ORDER.filter((displayLabel) =>
      canonicalFoundSet.has(displayLabel)
    );

    const uniqueRemainingCategories = Array.from(new Set(remainingCategories)).sort((a, b) =>
      a.localeCompare(b)
    );

    return [...orderedCanonicalCategories, ...uniqueRemainingCategories];
  } catch (error) {
    console.error("Failed to fetch health business categories:", error);
    return [];
  }
}

export async function getHealthBusinessMetrics(collectionName, channel, category) {
  if (!collectionName || !channel || !category) {
    return [];
  }

  try {
    const snapshot = await getDocs(collection(db, collectionName));
    const metricValueLabels = new Map();
    const metricFields = new Map();

    snapshot.docs.forEach((document) => {
      const data = document.data();

      if (!matchesChannelName(data, channel) || !matchesCategoryName(data, category)) {
        return;
      }

      // Schema 1: metric name stored as data value (e.g. metric: "No.of policies Issued")
      const metricName = resolveMetricName(data);
      if (metricName) {
        const normalizedMetricName = normalizeComparableText(metricName);
        if (!metricValueLabels.has(normalizedMetricName)) {
          metricValueLabels.set(normalizedMetricName, metricName);
        }
      }

      Object.entries(data || {}).forEach(([fieldName, fieldValue]) => {
        if (isNonMetricField(fieldName)) {
          return;
        }

        if (!hasNumericSignal(fieldValue)) {
          return;
        }

        if (!metricFields.has(fieldName)) {
          metricFields.set(fieldName, formatMetricFieldLabel(fieldName));
        }
      });
    });

    if (metricValueLabels.size > 0) {
      return Array.from(metricValueLabels.values())
        .sort((a, b) => a.localeCompare(b))
        .map((metricLabel) => ({ value: metricLabel, label: metricLabel }));
    }

    return Array.from(metricFields.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch (error) {
    console.error("Failed to fetch health business metrics:", error);
    return [];
  }
}

export async function getHealthBusinessYearwiseData(collectionName, channel, category, metricField) {
  if (!collectionName || !channel || !category || !metricField) {
    return [];
  }

  try {
    const snapshot = await getDocs(collection(db, collectionName));

    const filteredDocuments = snapshot.docs.filter((document) => {
      const data = document.data();
      return matchesChannelName(data, channel) && matchesCategoryName(data, category);
    });

    const hasMetricValueSchema = filteredDocuments.some((document) =>
      Boolean(resolveMetricName(document.data()))
    );

    if (hasMetricValueSchema) {
      const metricMatchedDocuments = filteredDocuments.filter((document) =>
        matchesMetricName(document.data(), metricField)
      );

      return aggregateByYearForHealthMetricDocuments(metricMatchedDocuments);
    }

    return aggregateByYearForHealthBusiness(filteredDocuments, metricField);
  } catch (error) {
    console.error("Failed to fetch health business yearwise data:", error);
    return [];
  }
}

export async function getNonLifeBusinessSegments(collectionName) {
  if (!collectionName) {
    return [];
  }

  try {
    const snapshot = await getDocs(collection(db, collectionName));

    return Array.from(
      new Set(
        snapshot.docs
          .map((document) => resolveSegmentName(document.data()))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error("Failed to fetch non-life business segments:", error);
    return [];
  }
}

export async function getNonLifeBusinessChannels(collectionName, segment) {
  if (!collectionName || !segment) {
    return [];
  }

  try {
    const snapshot = await getDocs(collection(db, collectionName));

    return Array.from(
      new Set(
        snapshot.docs
          .filter((document) => matchesSegmentName(document.data(), segment))
          .map((document) => resolveChannelName(document.data()))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error("Failed to fetch non-life business channels:", error);
    return [];
  }
}

export async function getNonLifeBusinessYearwiseData(collectionName, segment, channel) {
  if (!collectionName || !segment || !channel) {
    return [];
  }

  try {
    const snapshot = await getDocs(collection(db, collectionName));

    const filteredDocuments = snapshot.docs.filter((document) => {
      const data = document.data();
      return matchesSegmentName(data, segment) && matchesChannelName(data, channel);
    });

    return aggregateByYearForNonLifeBusiness(filteredDocuments);
  } catch (error) {
    console.error("Failed to fetch non-life business yearwise data:", error);
    return [];
  }
}

export async function getLifeBusinessInsurers(businessType) {
  const targetCollection = resolveLifeBusinessInsurerCollection(businessType);
  if (!targetCollection) {
    return [];
  }

  try {
    const snapshot = await getDocs(collection(db, targetCollection));

    return Array.from(
      new Set(
        snapshot.docs
          .map((document) => resolveInsurerName(document.data()))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error("Failed to fetch life business insurers:", error);
    return [];
  }
}

export async function getLifeBusinessInsurerChannelData(businessType, insurer, selectedYear = "") {
  const targetCollection = resolveLifeBusinessInsurerCollection(businessType);
  if (!targetCollection || !insurer) {
    return [];
  }

  try {
    const snapshot = await getDocs(collection(db, targetCollection));

    const filteredDocuments = snapshot.docs.filter((document) =>
      matchesInsurerName(document.data(), insurer)
    );

    return aggregateByChannelForInsurerBusiness(filteredDocuments, businessType, selectedYear);
  } catch (error) {
    console.error("Failed to fetch insurer-wise life business data:", error);
    return [];
  }
}

export async function getLifeBusinessInsurerYears(businessType, insurer) {
  const targetCollection = resolveLifeBusinessInsurerCollection(businessType);
  if (!targetCollection || !insurer) {
    return [];
  }

  try {
    const snapshot = await getDocs(collection(db, targetCollection));
    const yearOptions = new Map();

    snapshot.docs.forEach((document) => {
      const data = document.data();
      if (!matchesInsurerName(data, insurer)) {
        return;
      }

      const yearInfo = resolveYearInfoFromData(data);
      if (!yearInfo || yearOptions.has(yearInfo.key)) {
        return;
      }

      yearOptions.set(yearInfo.key, {
        label: yearInfo.label,
        sortValue: yearInfo.sortValue,
      });
    });

    return Array.from(yearOptions.entries())
      .sort((first, second) => {
        if (first[1].sortValue !== second[1].sortValue) {
          return first[1].sortValue - second[1].sortValue;
        }

        return String(first[1].label).localeCompare(String(second[1].label));
      })
      .map((item) => item[1].label);
  } catch (error) {
    console.error("Failed to fetch insurer-wise life business years:", error);
    return [];
  }
}

export async function getLifeBusinessChannels(businessType) {
  const targetCollection = resolveLifeBusinessCollection(businessType);
  if (!targetCollection) {
    return [];
  }

  try {
    const snapshot = await getDocs(collection(db, targetCollection));

    return Array.from(
      new Set(
        snapshot.docs
          .map((document) => resolveChannelName(document.data()))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error("Failed to fetch life business channels:", error);
    return [];
  }
}

export async function getLifeBusinessYearwiseData(businessType, channel, metric) {
  const targetCollection = resolveLifeBusinessCollection(businessType);
  if (!targetCollection || !channel || !metric) {
    return [];
  }

  try {
    const snapshot = await getDocs(collection(db, targetCollection));

    const filteredDocuments = snapshot.docs.filter((document) =>
      matchesChannelName(document.data(), channel)
    );

    return aggregateByYearForBusinessMetric(filteredDocuments, metric);
  } catch (error) {
    console.error("Failed to fetch life business yearwise data:", error);
    return [];
  }
}

function resolveLifeBusinessCollection(businessType) {
  if (businessType === "Individual New Business") {
    return LIFE_CHANNEL_INDIVIDUAL_NEW_BUSINESS_COLLECTION;
  }

  if (businessType === "Group New Business") {
    return LIFE_CHANNEL_GROUP_NEW_BUSINESS_COLLECTION;
  }

  return "";
}

function resolveLifeBusinessInsurerCollection(businessType) {
  if (businessType === "Individual New Business") {
    return LIFE_INSURER_INDIVIDUAL_NEW_BUSINESS_COLLECTION;
  }

  if (businessType === "Group New Business") {
    return LIFE_INSURER_GROUP_NEW_BUSINESS_COLLECTION;
  }

  return "";
}

function aggregateByChannelForInsurerBusiness(documents, businessType, selectedYear = "") {
  const normalizedSelectedYear = normalizeComparableText(selectedYear);
  const channelTotals = new Map();

  documents.forEach((document) => {
    const data = document.data();
    if (normalizedSelectedYear) {
      const yearInfo = resolveYearInfoFromData(data);
      if (!yearInfo || normalizeComparableText(yearInfo.label) !== normalizedSelectedYear) {
        return;
      }
    }

    const channel = resolveChannelName(data);

    if (!channel) {
      return;
    }

    const rowYear = resolveYearInfoFromData(data)?.label || String(selectedYear || "").trim();

    const existing =
      channelTotals.get(channel) ||
      {
        year: rowYear,
        channel,
        premium_crore: 0,
        policies: 0,
        lives_covered: 0,
        scheme: 0,
      };

    existing.premium_crore += resolvePremiumCroreValue(data);

    if (businessType === "Individual New Business") {
      existing.policies += resolvePoliciesValue(data);
    } else {
      existing.lives_covered += resolveLivesCoveredValue(data);
      existing.scheme += resolveSchemeValue(data);
    }

    channelTotals.set(channel, existing);
  });

  return Array.from(channelTotals.values()).sort((first, second) =>
    first.channel.localeCompare(second.channel)
  );
}

function aggregateByYearForBusinessMetric(documents, metric) {
  const yearTotals = new Map();

  documents.forEach((document) => {
    const data = document.data();
    const yearInfo = resolveYearInfo(data.year);
    const metricValue = resolveBusinessMetricValue(data, metric);

    if (!yearInfo) {
      return;
    }

    const existing = yearTotals.get(yearInfo.key);
    if (existing) {
      existing.agents += metricValue;
      return;
    }

    yearTotals.set(yearInfo.key, {
      year: yearInfo.label,
      sortValue: yearInfo.sortValue,
      agents: metricValue,
    });
  });

  return Array.from(yearTotals.values())
    .sort((first, second) => {
      if (first.sortValue !== second.sortValue) {
        return first.sortValue - second.sortValue;
      }

      return String(first.year).localeCompare(String(second.year));
    })
    .map(({ year, agents }) => ({ year, agents }));
}

function resolveBusinessMetricValue(data, metric) {
  if (metric === "policies") {
    return resolvePoliciesValue(data);
  }

  if (metric === "premium_crore") {
    return resolvePremiumCroreValue(data);
  }

  if (metric === "lives_covered") {
    return resolveLivesCoveredValue(data);
  }

  if (metric === "scheme") {
    return resolveSchemeValue(data);
  }

  return 0;
}

function resolvePremiumCroreValue(data) {
  const preferredFields = [
    "premium_crore",
    "premium_in_crore",
    "premium",
    "new_business_premium",
    "new_business_premium_crore",
    "business_premium",
    "premium_income",
    "value",
    "amount",
  ];

  for (const fieldName of preferredFields) {
    const parsedValue = parseNumericValue(data?.[fieldName]);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  for (const [fieldName, fieldValue] of Object.entries(data || {})) {
    if (!/premium|crore|amount/i.test(fieldName)) {
      continue;
    }

    const parsedValue = parseNumericValue(fieldValue);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  return 0;
}

function resolveLivesCoveredValue(data) {
  const preferredFields = [
    "lives_covered",
    "lives",
    "covered_lives",
    "no_of_lives",
    "number_of_lives",
    "total_lives_covered",
    "value",
    "count",
  ];

  for (const fieldName of preferredFields) {
    const parsedValue = parseNumericValue(data?.[fieldName]);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  for (const [fieldName, fieldValue] of Object.entries(data || {})) {
    if (!/lives|covered/i.test(fieldName)) {
      continue;
    }

    const parsedValue = parseNumericValue(fieldValue);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  return 0;
}

function resolveSchemeValue(data) {
  const preferredFields = [
    "scheme",
    "schemes",
    "scheme_count",
    "no_of_schemes",
    "number_of_schemes",
    "total_schemes",
    "value",
    "count",
  ];

  for (const fieldName of preferredFields) {
    const parsedValue = parseNumericValue(data?.[fieldName]);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  for (const [fieldName, fieldValue] of Object.entries(data || {})) {
    if (!/scheme/i.test(fieldName)) {
      continue;
    }

    const parsedValue = parseNumericValue(fieldValue);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  return 0;
}

function resolveChannelName(data) {
  const candidates = [
    data?.Channel,
    data?.CHANNEL,
    data?.channel,
    data?.channel_name,
    data?.channelName,
    data?.distribution_channel,
    data?.distributionChannel,
    data?.business_channel,
    data?.businessChannel,
  ];

  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (value) {
      return value;
    }
  }

  for (const [fieldName, fieldValue] of Object.entries(data || {})) {
    if (!/channel/i.test(fieldName)) {
      continue;
    }

    const value = String(fieldValue || "").trim();
    if (value) {
      return value;
    }
  }

  return "";
}

function resolveSegmentName(data) {
  const candidates = [
    data?.segment,
    data?.segment_name,
    data?.segmentName,
    data?.business_segment,
    data?.businessSegment,
    data?.line_of_business,
  ];

  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (value) {
      return value;
    }
  }

  for (const [fieldName, fieldValue] of Object.entries(data || {})) {
    if (!/segment|line.*business/i.test(fieldName)) {
      continue;
    }

    const value = String(fieldValue || "").trim();
    if (value) {
      return value;
    }
  }

  return "";
}

function resolveCategoryName(data) {
  const candidates = [
    data?.Category,
    data?.CATEGORY,
    data?.category,
    data?.category_name,
    data?.categoryName,
    data?.business_category,
    data?.businessCategory,
    data?.type,
  ];

  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (value) {
      return value;
    }
  }

  for (const [fieldName, fieldValue] of Object.entries(data || {})) {
    if (!/category|type/i.test(fieldName)) {
      continue;
    }

    const value = String(fieldValue || "").trim();
    if (value) {
      return value;
    }
  }

  return "";
}

function resolveMetricName(data) {
  const candidates = [
    data?.Metric,
    data?.METRIC,
    data?.metric,
    data?.metric_name,
    data?.metricName,
    data?.measure,
    data?.measure_name,
    data?.kpi,
  ];

  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (value) {
      return value;
    }
  }

  for (const [fieldName, fieldValue] of Object.entries(data || {})) {
    if (!/metric|measure|kpi/i.test(fieldName)) {
      continue;
    }

    const value = String(fieldValue || "").trim();
    if (value) {
      return value;
    }
  }

  return "";
}

function matchesSegmentName(data, selectedSegment) {
  const normalizedSelectedSegment = normalizeComparableText(selectedSegment);
  if (!normalizedSelectedSegment) {
    return false;
  }

  const candidateSegment = normalizeComparableText(resolveSegmentName(data));
  return candidateSegment === normalizedSelectedSegment;
}

function matchesCategoryName(data, selectedCategory) {
  const normalizedSelectedCategory = normalizeComparableText(selectedCategory);
  if (!normalizedSelectedCategory) {
    return false;
  }

  const candidateCategory = resolveCategoryName(data);
  const normalizedCandidateCategory = normalizeComparableText(candidateCategory);

  const canonicalSelectedCategory = getCanonicalHealthCategoryLabel(selectedCategory);
  const canonicalCandidateCategory = getCanonicalHealthCategoryLabel(candidateCategory);

  if (canonicalSelectedCategory && canonicalCandidateCategory) {
    return canonicalSelectedCategory === canonicalCandidateCategory;
  }

  return normalizedCandidateCategory === normalizedSelectedCategory;
}

function matchesMetricName(data, selectedMetric) {
  const normalizedSelectedMetric = normalizeComparableText(selectedMetric);
  if (!normalizedSelectedMetric) {
    return false;
  }

  const normalizedCandidateMetric = normalizeComparableText(resolveMetricName(data));
  return normalizedCandidateMetric === normalizedSelectedMetric;
}

function matchesChannelName(data, selectedChannel) {
  const normalizedSelectedChannel = normalizeComparableText(selectedChannel);
  if (!normalizedSelectedChannel) {
    return false;
  }

  const candidateChannel = normalizeComparableText(resolveChannelName(data));
  return candidateChannel === normalizedSelectedChannel;
}

function normalizeComparableText(value) {
  return String(value || "")
    .replace(/[\u00A0\u2007\u202F]/g, " ")
    .replace(/&/g, " and ")
    .replace(/[()./,]/g, " ")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function aggregateByYearForNonLifeBusiness(documents) {
  const yearTotals = new Map();

  documents.forEach((document) => {
    const data = document.data();
    const yearInfo = resolveYearInfoFromData(data);
    const metricValue = resolvePremiumCroreValue(data);

    if (!yearInfo) {
      return;
    }

    const existing = yearTotals.get(yearInfo.key);
    if (existing) {
      existing.agents += metricValue;
      return;
    }

    yearTotals.set(yearInfo.key, {
      year: yearInfo.label,
      sortValue: yearInfo.sortValue,
      agents: metricValue,
    });
  });

  return Array.from(yearTotals.values())
    .sort((first, second) => {
      if (first.sortValue !== second.sortValue) {
        return first.sortValue - second.sortValue;
      }

      return String(first.year).localeCompare(String(second.year));
    })
    .map(({ year, agents }) => ({ year, agents }));
}

function aggregateByYearForHealthBusiness(documents, metricField) {
  const yearTotals = new Map();

  documents.forEach((document) => {
    const data = document.data();
    const yearInfo = resolveYearInfoFromData(data);
    const metricValue = resolveMetricValueByField(data, metricField);

    if (!yearInfo) {
      return;
    }

    const existing = yearTotals.get(yearInfo.key);
    if (existing) {
      existing.agents += metricValue;
      return;
    }

    yearTotals.set(yearInfo.key, {
      year: yearInfo.label,
      sortValue: yearInfo.sortValue,
      agents: metricValue,
    });
  });

  return Array.from(yearTotals.values())
    .sort((first, second) => {
      if (first.sortValue !== second.sortValue) {
        return first.sortValue - second.sortValue;
      }

      return String(first.year).localeCompare(String(second.year));
    })
    .map(({ year, agents }) => ({ year, agents }));
}

function aggregateByYearForHealthMetricDocuments(documents) {
  const yearTotals = new Map();

  documents.forEach((document) => {
    const data = document.data();
    const yearValuePairs = extractYearValuePairsFromData(data);

    if (yearValuePairs.length > 0) {
      yearValuePairs.forEach(({ yearInfo, value }) => {
        const existing = yearTotals.get(yearInfo.key);
        if (existing) {
          existing.agents += value;
          return;
        }

        yearTotals.set(yearInfo.key, {
          year: yearInfo.label,
          sortValue: yearInfo.sortValue,
          agents: value,
        });
      });
      return;
    }

    // Fallback for row-wise schema where year is a value field.
    const yearInfo = resolveYearInfoFromData(data);
    if (!yearInfo) {
      return;
    }

    const metricValue = resolveMetricDataValue(data);
    const existing = yearTotals.get(yearInfo.key);
    if (existing) {
      existing.agents += metricValue;
      return;
    }

    yearTotals.set(yearInfo.key, {
      year: yearInfo.label,
      sortValue: yearInfo.sortValue,
      agents: metricValue,
    });
  });

  return Array.from(yearTotals.values())
    .sort((first, second) => {
      if (first.sortValue !== second.sortValue) {
        return first.sortValue - second.sortValue;
      }

      return String(first.year).localeCompare(String(second.year));
    })
    .map(({ year, agents }) => ({ year, agents }));
}

function extractYearValuePairsFromData(data) {
  const pairs = [];

  Object.entries(data || {}).forEach(([fieldName, fieldValue]) => {
    const yearInfo = resolveYearInfoFromFieldName(fieldName);
    if (!yearInfo) {
      return;
    }

    const value = parseNumericValue(fieldValue);
    if (value === null) {
      return;
    }

    pairs.push({ yearInfo, value });
  });

  return pairs;
}

function resolveYearInfoFromFieldName(fieldName) {
  const normalizedFieldName = String(fieldName || "").trim();
  if (!normalizedFieldName) {
    return null;
  }

  const yearRangeMatch = normalizedFieldName.match(/\b\d{4}\s*[-/]\s*\d{2,4}\b/);
  if (yearRangeMatch) {
    return resolveYearInfo(yearRangeMatch[0].replace(/\s+/g, ""));
  }

  const yearMatch = normalizedFieldName.match(/\b\d{4}\b/);
  if (yearMatch) {
    return resolveYearInfo(yearMatch[0]);
  }

  return null;
}

function resolveMetricValueByField(data, metricField) {
  const directValue = parseNumericValue(data?.[metricField]);
  if (directValue !== null) {
    return directValue;
  }

  const normalizedMetricField = normalizeComparableText(metricField);

  for (const [fieldName, fieldValue] of Object.entries(data || {})) {
    if (normalizeComparableText(fieldName) !== normalizedMetricField) {
      continue;
    }

    const parsedValue = parseNumericValue(fieldValue);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  return 0;
}

function resolveMetricDataValue(data) {
  const preferredFields = [
    "value",
    "metric_value",
    "metricValue",
    "amount",
    "count",
    "number",
    "total",
    "premium",
    "policies",
  ];

  for (const fieldName of preferredFields) {
    const parsedValue = parseNumericValue(data?.[fieldName]);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  for (const [fieldName, fieldValue] of Object.entries(data || {})) {
    if (isNonMetricField(fieldName)) {
      continue;
    }

    const parsedValue = parseNumericValue(fieldValue);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  return 0;
}

function isNonMetricField(fieldName) {
  return /year|fy|financial|channel|category|segment|insurer|state|id|sno|sr\.?no|index/i.test(
    String(fieldName || "")
  );
}

function hasNumericSignal(value) {
  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) {
    return false;
  }

  return /\d/.test(normalized);
}

function formatMetricFieldLabel(fieldName) {
  return String(fieldName || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getCanonicalHealthCategoryLabel(categoryValue) {
  const normalized = normalizeComparableText(categoryValue);
  if (!normalized) {
    return "";
  }

  if (normalized.includes("grand total")) {
    return "Grand Total";
  }

  if (normalized.includes("individual business")) {
    return "Individual Business";
  }

  if (
    normalized.includes("individual insurance") &&
    (normalized.includes("family") || normalized.includes("floater"))
  ) {
    return "Individual Insurance including Family/Floater";
  }

  if (
    normalized.includes("group business") &&
    (normalized.includes("excluding") || normalized.includes("excluding government"))
  ) {
    return "Group Business (Excluding Government Business)";
  }

  if (
    normalized.includes("group business") &&
    (normalized.includes("including") || normalized.includes("government sponsored") || normalized.includes("rbsy") || normalized.includes("rsby"))
  ) {
    return "Group Business (Including Government Sponsored Insurance Schemes & RBSY)";
  }

  if (
    normalized.includes("government business") ||
    (normalized.includes("government") && (normalized.includes("rbsy") || normalized.includes("rsby") || normalized.includes("sponsored")))
  ) {
    return "Government Business (Including RBSY & Other Government Sponsored Schemes)";
  }

  return "";
}

function resolveYearInfoFromData(data) {
  const candidateValues = [
    data?.year,
    data?.Year,
    data?.financial_year,
    data?.financialYear,
    data?.fy,
    data?.FY,
  ];

  for (const candidateValue of candidateValues) {
    const yearInfo = resolveYearInfo(candidateValue);
    if (yearInfo) {
      return yearInfo;
    }
  }

  for (const [fieldName, fieldValue] of Object.entries(data || {})) {
    if (!/year|fy|financial/i.test(fieldName)) {
      continue;
    }

    const yearInfo = resolveYearInfo(fieldValue);
    if (yearInfo) {
      return yearInfo;
    }
  }

  return null;
}

export function getInsurerTrend(insurer) {
  return getInsurerTrendByCollection(LIFE_INDIVIDUAL_AGENTS_COLLECTION, insurer);
}

export function getCorporateInsurerTrend(insurer) {
  return getInsurerTrendByCollection(CORPORATE_AGENTS_COLLECTION, insurer);
}

export function getMicroInsuranceInsurerTrend(insurer) {
  return getInsurerTrendByCollection(MICRO_INSURANCE_AGENTS_COLLECTION, insurer);
}

export function getSectorAggregate(sector) {
  return getSectorAggregateByCollection(LIFE_INDIVIDUAL_AGENTS_COLLECTION, sector);
}

export function getCorporateSectorAggregate(sector) {
  return getSectorAggregateByCollection(CORPORATE_AGENTS_COLLECTION, sector);
}

export function getMicroInsuranceSectorAggregate(sector) {
  return getSectorAggregateByCollection(MICRO_INSURANCE_AGENTS_COLLECTION, sector);
}

export function getAvgPoliciesInsurerTrend(insurer, agentType) {
  return getDocs(collection(db, AVG_INDIVIDUAL_POLICIES_COLLECTION)).then((snapshot) => {
    const filteredDocuments = snapshot.docs.filter((document) =>
      matchesAgentType(document.data(), agentType) &&
      matchesInsurerName(document.data(), insurer)
    );

    return aggregateByYearForPolicies(filteredDocuments);
  });
}

export function getAvgPoliciesSectorAggregate(sector, agentType) {
  const baseCollection = collection(db, AVG_INDIVIDUAL_POLICIES_COLLECTION);

  const sectorQuery =
    sector === "Both"
      ? baseCollection
      : query(baseCollection, where("sector", "==", sector));

  return getDocs(sectorQuery).then((snapshot) => {
    const filteredDocuments = snapshot.docs.filter((document) =>
      matchesAgentType(document.data(), agentType)
    );

    return aggregateByYearForPolicies(filteredDocuments);
  });
}

export function getAvgPremiumInsurerTrend(insurer, agentType) {
  console.log('[getAvgPremiumInsurerTrend] Called with:', { insurer, agentType, collection: AVG_NEW_BUSINESS_PREMIUM_COLLECTION });
  
  return getDocs(collection(db, AVG_NEW_BUSINESS_PREMIUM_COLLECTION)).then((snapshot) => {
    console.log('[getAvgPremiumInsurerTrend] Total documents fetched:', snapshot.docs.length);
    
    if (snapshot.docs.length > 0) {
      console.log('[getAvgPremiumInsurerTrend] Sample document fields:', Object.keys(snapshot.docs[0].data()));
    }
    
    const filteredDocuments = snapshot.docs.filter((document) =>
      matchesAgentType(document.data(), agentType) &&
      matchesInsurerName(document.data(), insurer)
    );
    
    console.log('[getAvgPremiumInsurerTrend] Documents after filtering:', filteredDocuments.length);

    const result = aggregateByYearForPremium(filteredDocuments);
    console.log('[getAvgPremiumInsurerTrend] Aggregated result:', result);
    return result;
  });
}

export function getAvgPremiumSectorAggregate(sector, agentType) {
  console.log('[getAvgPremiumSectorAggregate] Called with:', { sector, agentType, collection: AVG_NEW_BUSINESS_PREMIUM_COLLECTION });
  
  const baseCollection = collection(db, AVG_NEW_BUSINESS_PREMIUM_COLLECTION);

  const sectorQuery =
    sector === "Both"
      ? baseCollection
      : query(baseCollection, where("sector", "==", sector));

  return getDocs(sectorQuery).then((snapshot) => {
    console.log('[getAvgPremiumSectorAggregate] Total documents fetched:', snapshot.docs.length);
    
    if (snapshot.docs.length > 0) {
      console.log('[getAvgPremiumSectorAggregate] Sample document fields:', Object.keys(snapshot.docs[0].data()));
    }
    
    const filteredDocuments = snapshot.docs.filter((document) =>
      matchesAgentType(document.data(), agentType)
    );
    
    console.log('[getAvgPremiumSectorAggregate] Documents after agent type filtering:', filteredDocuments.length);

    const result = aggregateByYearForPremium(filteredDocuments);
    console.log('[getAvgPremiumSectorAggregate] Aggregated result:', result);
    return result;
  });
}

export function getAvgPremiumPerPolicyInsurerTrend(insurer, agentType) {
  return getDocs(collection(db, AVG_PREMIUM_PER_POLICY_COLLECTION)).then((snapshot) => {
    const filteredDocuments = snapshot.docs.filter((document) =>
      matchesAgentType(document.data(), agentType) &&
      matchesInsurerName(document.data(), insurer)
    );

    return aggregateByYearForPremiumPerPolicy(filteredDocuments);
  });
}

export function getAvgPremiumPerPolicySectorAggregate(sector, agentType) {
  const baseCollection = collection(db, AVG_PREMIUM_PER_POLICY_COLLECTION);

  const sectorQuery =
    sector === "Both"
      ? baseCollection
      : query(baseCollection, where("sector", "==", sector));

  return getDocs(sectorQuery).then((snapshot) => {
    const filteredDocuments = snapshot.docs.filter((document) =>
      matchesAgentType(document.data(), agentType)
    );

    return aggregateByYearForPremiumPerPolicy(filteredDocuments);
  });
}

function getInsurerTrendByCollection(collectionName, insurer) {
  const trendQuery = query(
    collection(db, collectionName),
    where("insurer", "==", insurer)
  );

  return getDocs(trendQuery).then((snapshot) => aggregateByYear(snapshot.docs));
}

function getSectorAggregateByCollection(collectionName, sector) {
  const baseCollection = collection(db, collectionName);

  const sectorQuery =
    sector === "Both"
      ? baseCollection
      : query(baseCollection, where("sector", "==", sector));

  return getDocs(sectorQuery).then((snapshot) => aggregateByYear(snapshot.docs));
}

function aggregateByYear(documents) {
  const yearTotals = new Map();

  documents.forEach((document) => {
    const data = document.data();
    const year = Number(data.year);
    const agents = resolveAgentsValue(data);

    if (!Number.isFinite(year)) {
      return;
    }

    yearTotals.set(year, (yearTotals.get(year) || 0) + agents);
  });

  return Array.from(yearTotals.entries())
    .map(([year, agents]) => ({ year, agents }))
    .sort((first, second) => first.year - second.year);
}

function aggregateByYearForPolicies(documents) {
  const yearTotals = new Map();

  documents.forEach((document) => {
    const data = document.data();
    const yearInfo = resolveYearInfo(data.year);
    const policies = resolvePoliciesValue(data);

    if (!yearInfo) {
      return;
    }

    const existing = yearTotals.get(yearInfo.key);
    if (existing) {
      existing.agents += policies;
      return;
    }

    yearTotals.set(yearInfo.key, {
      year: yearInfo.label,
      sortValue: yearInfo.sortValue,
      agents: policies,
    });
  });

  return Array.from(yearTotals.values())
    .sort((first, second) => {
      if (first.sortValue !== second.sortValue) {
        return first.sortValue - second.sortValue;
      }

      return String(first.year).localeCompare(String(second.year));
    })
    .map(({ year, agents }) => ({ year, agents }));
}

function aggregateByYearForPremium(documents) {
  console.log('[aggregateByYearForPremium] Processing', documents.length, 'documents');
  
  const yearTotals = new Map();

  documents.forEach((document) => {
    const data = document.data();
    const yearInfo = resolveYearInfo(data.year);
    const premium = resolvePremiumValue(data);

    console.log('[aggregateByYearForPremium] Document:', { 
      year: data.year, 
      yearInfo, 
      premium,
      allFields: Object.keys(data) 
    });

    if (!yearInfo) {
      console.warn('[aggregateByYearForPremium] Skipping document - no valid year');
      return;
    }

    const existing = yearTotals.get(yearInfo.key);
    if (existing) {
      existing.agents += premium;
      return;
    }

    yearTotals.set(yearInfo.key, {
      year: yearInfo.label,
      sortValue: yearInfo.sortValue,
      agents: premium,
    });
  });

  const result = Array.from(yearTotals.values())
    .sort((first, second) => {
      if (first.sortValue !== second.sortValue) {
        return first.sortValue - second.sortValue;
      }

      return String(first.year).localeCompare(String(second.year));
    })
    .map(({ year, agents }) => ({ year, agents }));
  
  console.log('[aggregateByYearForPremium] Final aggregated result:', result);
  return result;
}

function aggregateByYearForPremiumPerPolicy(documents) {
  const yearTotals = new Map();

  documents.forEach((document) => {
    const data = document.data();
    const yearInfo = resolveYearInfo(data.year);
    const premiumPerPolicy = resolvePremiumPerPolicyValue(data);

    if (!yearInfo) {
      return;
    }

    const existing = yearTotals.get(yearInfo.key);
    if (existing) {
      existing.agents += premiumPerPolicy;
      return;
    }

    yearTotals.set(yearInfo.key, {
      year: yearInfo.label,
      sortValue: yearInfo.sortValue,
      agents: premiumPerPolicy,
    });
  });

  return Array.from(yearTotals.values())
    .sort((first, second) => {
      if (first.sortValue !== second.sortValue) {
        return first.sortValue - second.sortValue;
      }

      return String(first.year).localeCompare(String(second.year));
    })
    .map(({ year, agents }) => ({ year, agents }));
}

function aggregateByYearForAgents(documents) {
  console.log('[aggregateByYearForAgents] Processing', documents.length, 'documents');
  
  const yearTotals = new Map();

  documents.forEach((document) => {
    const data = document.data();
    const yearInfo = resolveYearInfo(data.year);
    const agentCount = resolveAgentsValue(data);

    console.log('[aggregateByYearForAgents] Document:', { 
      year: data.year, 
      yearInfo, 
      agentCount,
      allFields: Object.keys(data) 
    });

    if (!yearInfo) {
      console.warn('[aggregateByYearForAgents] Skipping document - no valid year');
      return;
    }

    const existing = yearTotals.get(yearInfo.key);
    if (existing) {
      existing.agents += agentCount;
      return;
    }

    yearTotals.set(yearInfo.key, {
      year: yearInfo.label,
      sortValue: yearInfo.sortValue,
      agents: agentCount,
    });
  });

  const result = Array.from(yearTotals.values())
    .sort((first, second) => {
      if (first.sortValue !== second.sortValue) {
        return first.sortValue - second.sortValue;
      }

      return String(first.year).localeCompare(String(second.year));
    })
    .map(({ year, agents }) => ({ year, agents }));
  
  console.log('[aggregateByYearForAgents] Final aggregated result:', result);
  return result;
}

function resolveAgentsValue(data) {
  const preferredFields = [
    "agents",
    "individual_agents",
    "no_of_agents",
    "total_agents",
    "agent_count",
    "corporate_agents",
    "corporate_agent",
    "corporate_agents_count",
    "no_of_corporate_agents",
    "number_of_corporate_agents",
    "total_corporate_agents",
    "no_of_individual_agents",
    "number_of_individual_agents",
    "count",
    "value",
  ];

  for (const fieldName of preferredFields) {
    const parsedValue = parseNumericValue(data?.[fieldName]);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  for (const [fieldName, fieldValue] of Object.entries(data || {})) {
    if (!/agent/i.test(fieldName)) {
      continue;
    }

    const parsedValue = parseNumericValue(fieldValue);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  return 0;
}

function parseNumericValue(value) {
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

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function resolvePoliciesValue(data) {
  const preferredFields = [
    "policies",
    "avg_policies",
    "average_policies",
    "policies_sold",
    "individual_policies",
    "no_of_policies",
    "number_of_policies",
    "policy_count",
    "count",
    "value",
  ];

  for (const fieldName of preferredFields) {
    const parsedValue = parseNumericValue(data?.[fieldName]);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  for (const [fieldName, fieldValue] of Object.entries(data || {})) {
    if (!/polic/i.test(fieldName)) {
      continue;
    }

    const parsedValue = parseNumericValue(fieldValue);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  return 0;
}

function resolvePremiumValue(data) {
  const preferredFields = [
    "premium",
    "avg_premium",
    "average_premium",
    "premium_income",
    "new_business_premium",
    "new_business_premium_income",
    "avg_new_business_premium",
    "avg_new_business_premium_income",
    "avg_new_business_premium_income_per_agent",
    "business_premium",
    "business_premium_income",
    "amount",
    "value",
  ];

  for (const fieldName of preferredFields) {
    const parsedValue = parseNumericValue(data?.[fieldName]);
    if (parsedValue !== null) {
      console.log(`[resolvePremiumValue] Found value in field "${fieldName}":`, parsedValue);
      return parsedValue;
    }
  }

  // Fallback: try any field matching premium, income, business, or amount
  for (const [fieldName, fieldValue] of Object.entries(data || {})) {
    if (!/premium|income|amount|business/i.test(fieldName)) {
      continue;
    }

    const parsedValue = parseNumericValue(fieldValue);
    if (parsedValue !== null) {
      console.log(`[resolvePremiumValue] Found value in dynamic field "${fieldName}":`, parsedValue);
      return parsedValue;
    }
  }

  console.warn('[resolvePremiumValue] No premium value found in data:', Object.keys(data || {}));
  return 0;
}

function resolvePremiumPerPolicyValue(data) {
  const preferredFields = [
    "premium_per_policy",
    "avg_premium_per_policy",
    "average_premium_per_policy",
    "avg_premium_income_per_policy",
    "premium_income_per_policy",
    "avg_premium_income_per_policy_per_agent",
    "premium",
    "avg_premium",
    "amount",
    "value",
  ];

  for (const fieldName of preferredFields) {
    const parsedValue = parseNumericValue(data?.[fieldName]);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  for (const [fieldName, fieldValue] of Object.entries(data || {})) {
    if (!/premium.*policy|per.*policy/i.test(fieldName)) {
      continue;
    }

    const parsedValue = parseNumericValue(fieldValue);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  return 0;
}

function matchesAgentType(data, selectedAgentType) {
  if (!selectedAgentType) {
    return true;
  }

  const normalizedSelectedAgentType = normalizeAgentType(selectedAgentType);

  const candidateValues = [
    data?.agent_type,
    data?.agentType,
    data?.agent,
    data?.agent_category,
    data?.category,
    data?.type,
  ].filter((value) => value !== undefined && value !== null && value !== "");

  if (candidateValues.length === 0) {
    return false;
  }

  return candidateValues.some((value) => normalizeAgentType(value) === normalizedSelectedAgentType);
}

function normalizeAgentType(value) {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.includes("corporate")) {
    return "corporate";
  }

  if (normalized.includes("individual")) {
    return "individual";
  }

  return normalized;
}

function resolveYearInfo(rawYearValue) {
  if (rawYearValue === null || rawYearValue === undefined || rawYearValue === "") {
    return null;
  }

  const numericYear = Number(rawYearValue);
  if (Number.isFinite(numericYear)) {
    const normalizedYear = String(Math.trunc(numericYear));
    return {
      key: normalizedYear,
      label: normalizedYear,
      sortValue: Math.trunc(numericYear),
    };
  }

  const yearLabel = String(rawYearValue).trim();
  if (!yearLabel) {
    return null;
  }

  const match = yearLabel.match(/\d{4}/);
  const sortValue = match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;

  return {
    key: yearLabel,
    label: yearLabel,
    sortValue,
  };
}

function matchesInsurerName(data, insurer) {
  const normalizedSelectedInsurer = String(insurer || "").trim().toLowerCase();
  if (!normalizedSelectedInsurer) {
    return false;
  }

  const insurerName = resolveInsurerName(data);
  const normalizedInsurerName = insurerName.toLowerCase();
  
  const matches = normalizedInsurerName === normalizedSelectedInsurer;
  
  if (!matches && normalizedInsurerName) {
    console.log('[matchesInsurerName] No match:', { 
      selected: normalizedSelectedInsurer, 
      candidate: normalizedInsurerName 
    });
  }
  
  return matches;
}

function resolveInsurerName(data) {
  const candidates = [
    data?.insurer,
    data?.insurer_name,
    data?.insurerName,
    data?.company,
    data?.company_name,
    data?.name,
  ];

  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (value) {
      return value;
    }
  }

  return "";
}

// State-wise analysis functions
export async function getStatewiseInsurers() {
  console.log('[getStatewiseInsurers] Fetching insurers from:', LIFE_AGENTS_STATEWISE_COLLECTION);
  
  try {
    const snapshot = await getDocs(collection(db, LIFE_AGENTS_STATEWISE_COLLECTION));
    console.log('[getStatewiseInsurers] Total documents:', snapshot.docs.length);
    
    if (snapshot.docs.length > 0) {
      console.log('[getStatewiseInsurers] Sample document:', snapshot.docs[0].data());
    }
    
    const insurerNames = Array.from(
      new Set(
        snapshot.docs
          .map((doc) => resolveInsurerName(doc.data()))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));

    console.log('[getStatewiseInsurers] Found insurers:', insurerNames);
    return insurerNames;
  } catch (error) {
    console.error("Failed to fetch statewise insurers:", error);
    return [];
  }
}

export async function getStatewiseStates() {
  console.log('[getStatewiseStates] Fetching states from:', LIFE_AGENTS_STATEWISE_COLLECTION);
  
  try {
    const snapshot = await getDocs(collection(db, LIFE_AGENTS_STATEWISE_COLLECTION));
    console.log('[getStatewiseStates] Total documents:', snapshot.docs.length);
    
    const stateNames = Array.from(
      new Set(
        snapshot.docs
          .map((doc) => resolveStateName(doc.data()))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));

    console.log('[getStatewiseStates] Found states:', stateNames);
    return stateNames;
  } catch (error) {
    console.error("Failed to fetch statewise states:", error);
    return [];
  }
}

export async function getStatewiseData(insurer, state) {
  console.log('[getStatewiseData] Called with:', { insurer, state });
  
  try {
    const snapshot = await getDocs(collection(db, LIFE_AGENTS_STATEWISE_COLLECTION));
    console.log('[getStatewiseData] Total documents fetched:', snapshot.docs.length);
    
    if (snapshot.docs.length > 0) {
      console.log('[getStatewiseData] Sample document:', snapshot.docs[0].data());
    }
    
    const filteredDocuments = snapshot.docs.filter((doc) => {
      const data = doc.data();
      const matchesInsurer = matchesInsurerName(data, insurer);
      const matchesState = matchesStateName(data, state);
      
      if (matchesInsurer && matchesState) {
        console.log('[getStatewiseData] Matched document:', data);
      }
      
      return matchesInsurer && matchesState;
    });

    console.log('[getStatewiseData] Filtered documents:', filteredDocuments.length);

    const result = aggregateByYearForAgents(filteredDocuments);
    console.log('[getStatewiseData] Aggregated result:', result);
    
    return result;
  } catch (error) {
    console.error("Failed to fetch statewise data:", error);
    return [];
  }
}

export async function getRegisteredBrokersStates() {
  try {
    const snapshot = await getDocs(collection(db, REGISTERED_BROKERS_STATEWISE_COLLECTION));

    return Array.from(
      new Set(
        snapshot.docs
          .map((doc) => resolveStateName(doc.data()))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error("Failed to fetch registered broker states:", error);
    return [];
  }
}

export async function getRegisteredBrokersData(state) {
  try {
    const snapshot = await getDocs(collection(db, REGISTERED_BROKERS_STATEWISE_COLLECTION));

    const filteredDocuments = snapshot.docs.filter((doc) =>
      matchesStateName(doc.data(), state)
    );

    return aggregateByYearForBrokers(filteredDocuments);
  } catch (error) {
    console.error("Failed to fetch registered brokers data:", error);
    return [];
  }
}

export async function getImfStates() {
  try {
    const snapshot = await getDocs(collection(db, IMFS_STATEWISE_COLLECTION));

    return Array.from(
      new Set(
        snapshot.docs
          .map((doc) => resolveStateName(doc.data()))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error("Failed to fetch IMF states:", error);
    return [];
  }
}

export async function getImfData(state) {
  try {
    const snapshot = await getDocs(collection(db, IMFS_STATEWISE_COLLECTION));

    const filteredDocuments = snapshot.docs.filter((doc) =>
      matchesStateName(doc.data(), state)
    );

    return aggregateByYearForImfs(filteredDocuments);
  } catch (error) {
    console.error("Failed to fetch IMF data:", error);
    return [];
  }
}

function aggregateByYearForBrokers(documents) {
  const yearTotals = new Map();

  documents.forEach((document) => {
    const data = document.data();
    const yearInfo = resolveYearInfo(data.year);
    const brokerCount = resolveBrokersValue(data);

    if (!yearInfo) {
      return;
    }

    const existing = yearTotals.get(yearInfo.key);
    if (existing) {
      existing.agents += brokerCount;
      return;
    }

    yearTotals.set(yearInfo.key, {
      year: yearInfo.label,
      sortValue: yearInfo.sortValue,
      agents: brokerCount,
    });
  });

  return Array.from(yearTotals.values())
    .sort((first, second) => {
      if (first.sortValue !== second.sortValue) {
        return first.sortValue - second.sortValue;
      }

      return String(first.year).localeCompare(String(second.year));
    })
    .map(({ year, agents }) => ({ year, agents }));
}

function resolveBrokersValue(data) {
  const preferredFields = [
    "registered_brokers",
    "registered_broker",
    "number_of_registered_brokers",
    "no_of_registered_brokers",
    "brokers",
    "broker_count",
    "count",
    "value",
  ];

  for (const fieldName of preferredFields) {
    const parsedValue = parseNumericValue(data?.[fieldName]);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  for (const [fieldName, fieldValue] of Object.entries(data || {})) {
    if (!/broker/i.test(fieldName)) {
      continue;
    }

    const parsedValue = parseNumericValue(fieldValue);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  return 0;
}

function aggregateByYearForImfs(documents) {
  const yearTotals = new Map();

  documents.forEach((document) => {
    const data = document.data();
    const yearInfo = resolveYearInfo(data.year);
    const imfCount = resolveImfValue(data);

    if (!yearInfo) {
      return;
    }

    const existing = yearTotals.get(yearInfo.key);
    if (existing) {
      existing.agents += imfCount;
      return;
    }

    yearTotals.set(yearInfo.key, {
      year: yearInfo.label,
      sortValue: yearInfo.sortValue,
      agents: imfCount,
    });
  });

  return Array.from(yearTotals.values())
    .sort((first, second) => {
      if (first.sortValue !== second.sortValue) {
        return first.sortValue - second.sortValue;
      }

      return String(first.year).localeCompare(String(second.year));
    })
    .map(({ year, agents }) => ({ year, agents }));
}

function resolveImfValue(data) {
  const preferredFields = [
    "imfs",
    "imf",
    "number_of_imfs",
    "no_of_imfs",
    "insurance_marketing_firms",
    "marketing_firms",
    "count",
    "value",
  ];

  for (const fieldName of preferredFields) {
    const parsedValue = parseNumericValue(data?.[fieldName]);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  for (const [fieldName, fieldValue] of Object.entries(data || {})) {
    if (!/imf|marketing.*firm/i.test(fieldName)) {
      continue;
    }

    const parsedValue = parseNumericValue(fieldValue);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  return 0;
}

function resolveStateName(data) {
  const candidates = [
    data?.state,
    data?.state_name,
    data?.stateName,
    data?.State,
    data?.State_Name,
    data?.State_name,
    data?.STATE,
    data?.location,
    data?.region,
  ];

  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (value && value !== "") {
      return value;
    }
  }

  return "";
}

function matchesStateName(data, state) {
  const normalizedSelectedState = String(state || "").trim().toLowerCase();
  if (!normalizedSelectedState) {
    return false;
  }

  const stateName = resolveStateName(data);
  const normalizedStateName = stateName.toLowerCase();
  
  const matches = normalizedStateName === normalizedSelectedState;
  
  if (!matches && normalizedStateName) {
    console.log('[matchesStateName] No match:', { 
      selected: normalizedSelectedState, 
      candidate: normalizedStateName 
    });
  }
  
  return matches;
}
