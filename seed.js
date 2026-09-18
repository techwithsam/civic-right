#!/usr/bin/env node
/**
 * Civic-Right Demo Seed Script
 * Uses Firebase Web SDK with citizen authentication to seed realistic demo reports.
 * 
 * Run with:
 *   node seed.js
 */

import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, limit } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve .env.local
const candidatePaths = [
  path.resolve(__dirname, "web/.env.local"),
  path.resolve(process.cwd(), "web/.env.local"),
  path.resolve(process.cwd(), ".env.local"),
];

let envPath = candidatePaths.find(p => fs.existsSync(p));
if (envPath) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [k, ...rest] = trimmed.split("=");
    if (k && rest.length) {
      process.env[k.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
    }
  }
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "civic-right.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "civic-right",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "civic-right.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  console.error("❌ Error: NEXT_PUBLIC_FIREBASE_API_KEY missing. Check web/.env.local");
  process.exit(1);
}

const databaseId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || "default";
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app, databaseId);

const DEMO_CITIZEN_EMAIL = "citizen.demo@civicright.ng";
const DEMO_CITIZEN_PASSWORD = "DemoCitizenPass2026!";

async function authenticateCitizen() {
  try {
    const cred = await signInWithEmailAndPassword(auth, DEMO_CITIZEN_EMAIL, DEMO_CITIZEN_PASSWORD);
    return cred.user;
  } catch (err) {
    if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
      try {
        const cred = await createUserWithEmailAndPassword(auth, DEMO_CITIZEN_EMAIL, DEMO_CITIZEN_PASSWORD);
        await updateProfile(cred.user, { displayName: "Babajide Adeleke" });
        return cred.user;
      } catch (createErr) {
        throw createErr;
      }
    }
    throw err;
  }
}

async function seed() {
  console.log("🌱 Seeding Civic-Right demo reports into Firestore...\n");

  let user;
  try {
    user = await authenticateCitizen();
    console.log(`👤 Authenticated as demo citizen (${user.email} - ${user.uid})`);
  } catch (authErr) {
    console.error("❌ Could not authenticate demo citizen:", authErr.message);
    process.exit(1);
  }

  // Check if reports already exist
  const existingSnap = await getDocs(query(collection(db, "reports"), limit(1)));
  if (!existingSnap.empty) {
    console.log("ℹ️  Existing reports found in database. Adding demo reports...");
  }

  const demoReports = [
    {
      title: "Severely damaged road — Elebu axis",
      description: "The road along Elebu axis in Ibadan is completely destroyed. Large craters everywhere, flooding after rain, causing serious accidents daily. Motorcycles are struggling, vehicles are getting damaged, and pedestrians are at risk.",
      category: "roads",
      state: "Oyo",
      lga: "Ibadan North",
      location: "Elebu, Ibadan",
      latitude: 7.4298,
      longitude: 3.9045,
      evidence: [],
      reportedBy: user.uid,
      confirmationCount: 2431,
      authorityId: "oyo-ministry-works",
      status: "in_progress",
      aiExtracted: {
        problem: "Severely damaged road with deep potholes causing accidents and vehicle damage",
        severity: "high",
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      title: "Persistent flooding & blocked drainage — Apata area",
      description: "Apata has been flooding for over two months. Primary drainage channels are blocked with refuse. Water enters homes after every heavy rainfall. Families and local businesses are suffering.",
      category: "waste_flooding",
      state: "Oyo",
      lga: "Ibadan North",
      location: "Apata, Ibadan",
      latitude: 7.3874,
      longitude: 3.8997,
      evidence: [],
      reportedBy: user.uid,
      confirmationCount: 934,
      authorityId: "ibadan-north-lga",
      status: "community_confirmed",
      aiExtracted: {
        problem: "Persistent street flooding from blocked municipal drainage affecting residential homes",
        severity: "high",
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      title: "3-week electricity outage — Bodija commercial zone",
      description: "Bodija and surrounding residential quarters have suffered total blackout for nearly three weeks. DisCo customer care has not resolved the faulty distribution transformer. Cold room businesses and healthcare facilities are severely impacted.",
      category: "electricity",
      state: "Oyo",
      lga: "Ibadan North",
      location: "Bodija, Ibadan",
      latitude: 7.4121,
      longitude: 3.9018,
      evidence: [],
      reportedBy: user.uid,
      confirmationCount: 1827,
      authorityId: "ibedc-ibadan",
      status: "assigned",
      aiExtracted: {
        problem: "Extended 3-week total power outage affecting commercial cold storage and medical facilities",
        severity: "high",
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      title: "Partially collapsed culvert & footbridge — Odo-Ona",
      description: "The concrete culvert and pedestrian crossing on Odo-Ona road has structurally collapsed after heavy rains. School children and commuters face serious risk crossing every morning.",
      category: "roads",
      state: "Oyo",
      lga: "Ibadan North",
      location: "Odo-Ona Eleta, Ibadan",
      latitude: 7.4052,
      longitude: 3.9130,
      evidence: [],
      reportedBy: user.uid,
      confirmationCount: 412,
      authorityId: "oyo-ministry-works",
      status: "reported",
      aiExtracted: {
        problem: "Partially collapsed pedestrian footbridge posing immediate structural danger",
        severity: "high",
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      title: "Illegal roadside refuse dump — Ring Road / Challenge",
      description: "A large illegal refuse dump has been accumulating on the median along Ring Road near Challenge junction. Strong stench, obstruction of pedestrian walkway, and severe health hazard for neighborhood.",
      category: "waste_flooding",
      state: "Oyo",
      lga: "Ibadan North",
      location: "Ring Road, Ibadan",
      latitude: 7.3935,
      longitude: 3.9060,
      evidence: [],
      reportedBy: user.uid,
      confirmationCount: 218,
      authorityId: "ibadan-north-lga",
      status: "reported",
      aiExtracted: {
        problem: "Illegal municipal solid waste accumulation creating public health hazard",
        severity: "medium",
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  ];

  for (const report of demoReports) {
    const docRef = await addDoc(collection(db, "reports"), report);
    console.log(`✅ Seeded report: "${report.title}" (ID: ${docRef.id}, ${report.confirmationCount} confirmations)`);
  }

  console.log("\n🎉 Civic-Right demo seeding complete! All reports visible on Feed and Map.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
