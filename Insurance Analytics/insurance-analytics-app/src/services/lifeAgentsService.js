import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const COLLECTION_NAME = "life_individual_agents";

export async function getInsurerTrend(insurer) {
  const trendQuery = query(
    collection(db, COLLECTION_NAME),
    where("insurer", "==", insurer)
  );

  const snapshot = await getDocs(trendQuery);
  return aggregateByYear(snapshot.docs);
}

export async function getSectorAggregate(sector) {
  const baseCollection = collection(db, COLLECTION_NAME);

  const sectorQuery =
    sector === "Both"
      ? baseCollection
      : query(baseCollection, where("sector", "==", sector));

  const snapshot = await getDocs(sectorQuery);
  return aggregateByYear(snapshot.docs);
}

function aggregateByYear(documents) {
  const yearTotals = new Map();

  documents.forEach((document) => {
    const data = document.data();
    const year = Number(data.year);
    const agents = Number(data.agents) || 0;

    if (!Number.isFinite(year)) {
      return;
    }

    yearTotals.set(year, (yearTotals.get(year) || 0) + agents);
  });

  return Array.from(yearTotals.entries())
    .map(([year, agents]) => ({ year, agents }))
    .sort((first, second) => first.year - second.year);
}
