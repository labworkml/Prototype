import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const LIFE_INDIVIDUAL_AGENTS_COLLECTION = "life_individual_agents";
const CORPORATE_AGENTS_COLLECTION = "corporate_agents_life_insurers";
const MICRO_INSURANCE_AGENTS_COLLECTION = "Microinsurance_agents_life_insurers";

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

function resolveAgentsValue(data) {
  const preferredFields = [
    "agents",
    "corporate_agents",
    "corporate_agent",
    "corporate_agents_count",
    "no_of_corporate_agents",
    "number_of_corporate_agents",
    "total_corporate_agents",
    "agent_count",
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
