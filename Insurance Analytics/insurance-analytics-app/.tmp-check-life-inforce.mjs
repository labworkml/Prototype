import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const app = initializeApp({
  apiKey: "AIzaSyAHxytsfKGeIgMAy-d4-RXAzDUJx2UUNao",
  authDomain: "insurance-analytics-d1a8c.firebaseapp.com",
  projectId: "insurance-analytics-d1a8c",
  storageBucket: "insurance-analytics-d1a8c.firebasestorage.app",
  messagingSenderId: "917244923652",
  appId: "1:917244923652:web:a91c9332eef0585caeca51",
  measurementId: "G-6RJG5NSRQN"
});
const db = getFirestore(app, "database");
const names = [
  "sheet4_inforce_individual_business",
  "sheet4_inforce_individual_business_life",
  "sheet4_inforce_individual_business_life_insurers",
  "Sheet4_Inforce_Individual_Business",
  "Sheet4_inforce_individual_business",
  "sheet4_inforce_individual_life",
  "sheet4_life_inforce_individual_business",
  "inforce_individual_business_life",
  "sheet4_inforce_business",
  "sheet4"
];
for (const name of names) {
  try {
    const snapshot = await getDocs(collection(db, name));
    console.log(`COLLECTION ${name}: ${snapshot.size}`);
    if (snapshot.size > 0) {
      console.log(Object.keys(snapshot.docs[0].data()));
    }
  } catch (error) {
    console.log(`ERROR ${name}: ${error.message}`);
  }
}
