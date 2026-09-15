#!/usr/bin/env node
/**
 * Seed script for Civic-Right demo data.
 * Run: node seed.js (requires Firebase Admin SDK)
 * 
 * Sets up:
 *  - 3 authorities in Oyo State
 *  - 5 realistic reports (Elebu road, Apata flooding, IBEDC outage, etc.)
 *  - Confirmation counts for demo
 */

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function seed() {
  console.log("🌱 Seeding Civic-Right demo data...\n");

  // ─── Authorities ───────────────────────────────────────────────────────────
  const authorities = [
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
      type: "Electricity Distributor",
      state: "Oyo",
      lga: "Ibadan North",
      categories: ["electricity"],
      contact: "0700IBEDC123",
      website: "https://ibedc.com",
    },
    {
      id: "ibadan-north-lga",
      name: "Ibadan North Local Government Authority",
      type: "Local Government",
      state: "Oyo",
      lga: "Ibadan North",
      categories: ["waste_flooding"],
      contact: "08033456789",
      website: "https://ibadannorthlga.gov.ng",
    },
  ];

  for (const auth of authorities) {
    const { id, ...data } = auth;
    await db.collection("authorities").doc(id).set(data);
    console.log(`✅ Authority: ${data.name}`);
  }

  // ─── Reports ───────────────────────────────────────────────────────────────
  const now = admin.firestore.Timestamp.now();

  const reports = [
    {
      title: "Severely damaged road — Elebu",
      description: "The road along Elebu axis in Ibadan is completely destroyed. Large potholes everywhere, flooding after rain, causing serious accidents daily. Motorcycles are struggling, vehicles are getting damaged, and pedestrians are at risk.",
      category: "roads",
      state: "Oyo",
      lga: "Ibadan North",
      location: "Elebu, Ibadan",
      latitude: 7.4298,
      longitude: 3.9045,
      evidence: [],
      reportedBy: "demo-user-1",
      confirmationCount: 2431,
      authorityId: "oyo-ministry-works",
      status: "in_progress",
      aiExtracted: { problem: "Severely damaged road with deep potholes causing accidents and vehicle damage", severity: "high" },
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Persistent flooding — Apata area",
      description: "Apata has been flooding for over two months. Drainage channels are blocked with refuse. Water enters homes after any rainfall. Families are suffering.",
      category: "waste_flooding",
      state: "Oyo",
      lga: "Ibadan North",
      location: "Apata, Ibadan",
      latitude: 7.3874,
      longitude: 3.8997,
      evidence: [],
      reportedBy: "demo-user-2",
      confirmationCount: 934,
      authorityId: "ibadan-north-lga",
      status: "community_confirmed",
      aiExtracted: { problem: "Persistent street flooding from blocked drainage affecting residential homes", severity: "high" },
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "No electricity — Bodija zone for 3 weeks",
      description: "Bodija and the surrounding areas have had no electricity for almost three weeks. IBEDC has not responded to multiple complaints. Businesses are losing money, hospitals are affected.",
      category: "electricity",
      state: "Oyo",
      lga: "Ibadan North",
      location: "Bodija, Ibadan",
      latitude: 7.4121,
      longitude: 3.9018,
      evidence: [],
      reportedBy: "demo-user-3",
      confirmationCount: 1827,
      authorityId: "ibedc-ibadan",
      status: "assigned",
      aiExtracted: { problem: "3-week total power outage affecting commercial and medical facilities", severity: "high" },
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Collapsed bridge — Odo-Ona Eleta",
      description: "The footbridge on Odo-Ona Eleta road has partially collapsed. School children and commuters are at serious risk crossing it.",
      category: "roads",
      state: "Oyo",
      lga: "Ibadan North",
      location: "Odo-Ona Eleta, Ibadan",
      latitude: 7.4052,
      longitude: 3.9130,
      evidence: [],
      reportedBy: "demo-user-4",
      confirmationCount: 412,
      authorityId: "oyo-ministry-works",
      status: "reported",
      aiExtracted: { problem: "Partially collapsed footbridge posing serious danger to pedestrians", severity: "high" },
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Illegal refuse dumping — Ring Road",
      description: "A massive illegal refuse dump has been growing on Ring Road near Challenge for months. The smell is unbearable and disease risk is high.",
      category: "waste_flooding",
      state: "Oyo",
      lga: "Ibadan North",
      location: "Ring Road, Ibadan",
      latitude: 7.3935,
      longitude: 3.9060,
      evidence: [],
      reportedBy: "demo-user-5",
      confirmationCount: 218,
      authorityId: "ibadan-north-lga",
      status: "reported",
      aiExtracted: { problem: "Large illegal refuse dump creating health hazard and environmental pollution", severity: "medium" },
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const report of reports) {
    const ref = await db.collection("reports").add(report);
    console.log(`✅ Report: ${report.title} (${ref.id})`);
  }

  console.log("\n🎉 Seed complete! Civic-Right demo data is ready.");
}

seed().catch(console.error);
