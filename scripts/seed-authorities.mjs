#!/usr/bin/env node
/**
 * Seeds the default authorities into Firestore
 */
import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(process.cwd(), "web/.env.local");
if (fs.existsSync(envPath)) {
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
};

const databaseId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || "default";
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app, databaseId);

const AUTHORITIES = [
  {
    id: "oyo-ministry-works",
    name: "Oyo State Ministry of Works & Transport",
    type: "State Ministry",
    state: "Oyo",
    lga: "Ibadan North",
    categories: ["roads"],
    contact: "08055001234",
    website: "https://oyostate.gov.ng/works",
  },
  {
    id: "ibedc-ibadan",
    name: "Ibadan Electricity Distribution Company (IBEDC)",
    type: "Electricity Distribution Company",
    state: "Oyo",
    lga: "Ibadan North",
    categories: ["electricity"],
    contact: "070042332123",
    website: "https://ibedc.com",
  },
  {
    id: "ibadan-north-lga",
    name: "Ibadan Waste Management & Environmental Sanitation Authority",
    type: "Local Government Agency",
    state: "Oyo",
    lga: "Ibadan North",
    categories: ["waste_flooding"],
    contact: "08033456789",
    website: "https://oyostate.gov.ng/waste",
  },
];

async function main() {
  console.log("Seeding authorities into Firestore (database: " + databaseId + ")...");
  // Sign in as government user to have write permission
  try {
    await signInWithEmailAndPassword(auth, "works@oyostate.gov.ng", "SecurePass2026!");
    console.log("Signed in as authorized official works@oyostate.gov.ng");
  } catch (err) {
    console.log("Signing in note:", err.message);
  }

  for (const authItem of AUTHORITIES) {
    const { id, ...data } = authItem;
    try {
      await setDoc(doc(db, "authorities", id), data);
      console.log(`✅ Seeded authority: ${data.name} (${id})`);
    } catch (err) {
      console.warn(`Could not set authority ${id} directly in Firestore:`, err.message);
    }
  }
  console.log("Done!");
  process.exit(0);
}

main();
