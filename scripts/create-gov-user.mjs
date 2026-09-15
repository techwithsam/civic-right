#!/usr/bin/env node
/**
 * Internal utility to create a verified Government Official account.
 * Government accounts cannot be created via public registration.
 *
 * Usage:
 *   node scripts/create-gov-user.mjs <email> <password> "<name>" "<department>" "<state>" "<lga>"
 *
 * Example:
 *   node scripts/create-gov-user.mjs engineer.tunde@oyostate.gov.ng Passw0rd123! "Engr. Tunde Adeleke" "Oyo State Ministry of Works" "Oyo" "Ibadan North"
 */

import { initializeApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";

// Load .env.local if present
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
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  console.error("❌ Error: NEXT_PUBLIC_FIREBASE_API_KEY is missing in web/.env.local.");
  process.exit(1);
}

const [,, email, password, name, department, state, lga] = process.argv;

if (!email || !password || !name) {
  console.log(`
🏛️ Civic-Right Internal Government Account Provisioning

Usage:
  node scripts/create-gov-user.mjs <email> <password> "<name>" ["<department>"] ["<state>"] ["<lga>"]

Example:
  node scripts/create-gov-user.mjs works@oyostate.gov.ng SecurePass2026! "Engr. Tunde Adeleke" "Ministry of Works" "Oyo" "Ibadan North"
`);
  process.exit(0);
}

const databaseId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || "default";
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app, databaseId);

async function main() {
  console.log(`Creating Government account for: ${name} (${email})...`);
  try {
    let user;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      user = userCredential.user;
    } catch (authErr) {
      if (authErr?.code === "auth/email-already-in-use") {
        console.log("Auth user already exists in Firebase Auth. Signing in to sync profile...");
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
      } else {
        throw authErr;
      }
    }

    await updateProfile(user, { displayName: name });

    const govProfile = {
      uid: user.uid,
      name,
      email,
      role: "government",
      department: department || "Public Works & Infrastructure",
      state: state || "Oyo",
      lga: lga || "Ibadan North",
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, "users", user.uid), govProfile);

    console.log("✅ Government Official account provisioned successfully!");
    console.log({
      uid: user.uid,
      name,
      email,
      role: "government",
      department: govProfile.department,
      state: govProfile.state,
      lga: govProfile.lga,
    });
    console.log("\nThe official can now log in at http://localhost:3000/login and will be routed to /dashboard.");
  } catch (err) {
    console.error("❌ Failed to create government account:", err.message || err);
    process.exit(1);
  }
}

main();
