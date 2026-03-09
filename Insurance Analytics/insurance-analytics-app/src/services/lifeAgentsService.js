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
