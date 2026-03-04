import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig";

/**
 * Fetch segment premium analysis data from Firestore
 * @param {string} category - Category filter
 * @param {string} segment - Segment filter
 * @param {string} participation - Participation filter
 * @param {string} premiumType - Premium type filter (note: field is premium_type with underscore)
 * @returns {Promise<Array>} Array of documents sorted by year
 */
export const fetchSegmentPremiumData = async (
  category,
  segment,
  participation,
  premiumType
) => {
  try {
    // Validate inputs
    if (!category || !segment || !participation || !premiumType) {
      console.warn("Missing filter parameters");
      return [];
    }

    console.log("🔍 Querying Firestore with filters:", {
      category,
      segment,
      participation,
      premium_type: premiumType,
    });

    // Build query with multiple where clauses
    const q = query(
      collection(db, "segment_premium_stats"),
      where("category", "==", category),
      where("segment", "==", segment),
      where("participation", "==", participation),
      where("premium_type", "==", premiumType),
      orderBy("year", "asc")
    );

    // Execute query
    const snapshot = await getDocs(q);

    console.log(`✅ Query returned ${snapshot.docs.length} documents`);

    // Transform documents
    const results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return results;
  } catch (error) {
    console.error("❌ Firestore query error:", error);
    throw error;
  }
};

/**
 * Transform Firestore data into table rows
 * @param {Array} data - Raw Firestore documents
 * @param {string} viewMode - "amount" or "percentage"
 * @returns {Array} Formatted table rows
 */
export const transformToTableRows = (data, viewMode) => {
  return data.map((doc) => ({
    year: doc.year || "-",
    value: viewMode === "percentage" 
      ? (doc.percentage !== undefined ? doc.percentage : "-")
      : (doc.amount !== undefined ? doc.amount : "-"),
  }));
};

/**
 * Transform Firestore data into chart data
 * @param {Array} data - Raw Firestore documents
 * @param {string} viewMode - "amount" or "percentage"
 * @returns {Array} Formatted chart data
 */
export const transformToChartData = (data, viewMode) => {
  return data.map((doc) => {
    const value = viewMode === "percentage" ? doc.percentage : doc.amount;
    return {
      year: doc.year || "-",
      value: value !== undefined ? value : 0,
    };
  });
};
