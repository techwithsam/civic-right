import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  setDoc,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./config";

// ─── Types ──────────────────────────────────────────────────────────────────

export type ReportCategory = "roads" | "electricity" | "waste_flooding";
export type ReportStatus =
  | "reported"
  | "community_confirmed"
  | "assigned"
  | "acknowledged"
  | "in_progress"
  | "resolved"
  | "closed";

export interface Report {
  id: string;
  title: string;
  description: string;
  category: ReportCategory;
  state: string;
  lga: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  evidence: string[];
  reportedBy: string;
  confirmationCount: number;
  authorityId: string | null;
  status: ReportStatus;
  latestNote?: string;
  aiExtracted: {
    problem: string;
    severity: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Authority {
  id: string;
  name: string;
  type: string;
  state: string;
  lga: string;
  categories: ReportCategory[];
  contact: string;
  website: string;
}

// ─── Reports ────────────────────────────────────────────────────────────────

export async function createReport(
  data: Omit<Report, "id" | "createdAt" | "updatedAt" | "confirmationCount" | "status">
): Promise<string> {
  const ref = await addDoc(collection(db, "reports"), {
    ...data,
    confirmationCount: 1, // reporter auto-confirms
    status: "reported",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getReport(id: string): Promise<Report | null> {
  const snap = await getDoc(doc(db, "reports", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Report;
}

export async function getReportsByLGA(
  state: string,
  lga: string
): Promise<Report[]> {
  const q = query(
    collection(db, "reports"),
    where("state", "==", state),
    where("lga", "==", lga),
    where("status", "!=", "closed"),
    orderBy("confirmationCount", "desc"),
    limit(30)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Report));
}

export async function getMyReports(userId: string): Promise<Report[]> {
  const q = query(
    collection(db, "reports"),
    where("reportedBy", "==", userId),
    orderBy("createdAt", "desc"),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Report));
}

export async function getAllReports(limitN = 50): Promise<Report[]> {
  const q = query(
    collection(db, "reports"),
    where("status", "!=", "closed"),
    orderBy("confirmationCount", "desc"),
    limit(limitN)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Report));
}

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  note?: string
): Promise<void> {
  const updates: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  };
  if (note) updates.latestNote = note;
  await updateDoc(doc(db, "reports", reportId), updates);
}

export function subscribeToReport(
  id: string,
  cb: (r: Report) => void
): Unsubscribe {
  return onSnapshot(doc(db, "reports", id), (snap) => {
    if (snap.exists()) cb({ id: snap.id, ...snap.data() } as Report);
  });
}

// ─── Confirmations ──────────────────────────────────────────────────────────

export async function confirmReport(
  reportId: string,
  userId: string
): Promise<{ alreadyConfirmed: boolean }> {
  const confirmId = `${reportId}_${userId}`;
  const ref = doc(db, "confirmations", confirmId);
  const existing = await getDoc(ref);
  if (existing.exists()) return { alreadyConfirmed: true };

  await setDoc(ref, {
    reportId,
    userId,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "reports", reportId), {
    confirmationCount: increment(1),
    status: "community_confirmed",
    updatedAt: serverTimestamp(),
  });
  return { alreadyConfirmed: false };
}

export async function hasUserConfirmed(
  reportId: string,
  userId: string
): Promise<boolean> {
  const ref = doc(db, "confirmations", `${reportId}_${userId}`);
  const snap = await getDoc(ref);
  return snap.exists();
}

export const DEFAULT_AUTHORITIES: Record<ReportCategory, Authority> = {
  roads: {
    id: "oyo-ministry-works",
    name: "Oyo State Ministry of Works & Transport",
    type: "State Ministry",
    state: "Oyo",
    lga: "Ibadan North",
    categories: ["roads"],
    contact: "08055001234",
    website: "https://oyostate.gov.ng/works",
  },
  electricity: {
    id: "ibedc-ibadan",
    name: "Ibadan Electricity Distribution Company (IBEDC)",
    type: "Electricity Distribution Company",
    state: "Oyo",
    lga: "Ibadan North",
    categories: ["electricity"],
    contact: "070042332123",
    website: "https://ibedc.com",
  },
  waste_flooding: {
    id: "ibadan-north-lga",
    name: "Ibadan Waste Management & Environmental Sanitation Authority",
    type: "Local Government Agency",
    state: "Oyo",
    lga: "Ibadan North",
    categories: ["waste_flooding"],
    contact: "08033456789",
    website: "https://oyostate.gov.ng/waste",
  },
};

// ─── Nearby reports ─────────────────────────────────────────────────────────

export async function findNearbyReports(
  category: ReportCategory,
  location: string,
  state: string
): Promise<Report[]> {
  try {
    const q = query(
      collection(db, "reports"),
      where("category", "==", category),
      limit(20)
    );
    const snap = await getDocs(q);
    const reports = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Report))
      .filter((r) => r.status !== "closed" && (!state || r.state === state));

    // Sort by confirmation count descending
    reports.sort((a, b) => (b.confirmationCount || 0) - (a.confirmationCount || 0));

    // Filter by location keyword overlap if location is provided
    if (!location.trim()) return reports.slice(0, 5);
    const locWords = location.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    if (locWords.length === 0) return reports.slice(0, 5);

    const matches = reports.filter((r) =>
      locWords.some(
        (w) =>
          r.location?.toLowerCase().includes(w) ||
          r.title?.toLowerCase().includes(w) ||
          r.description?.toLowerCase().includes(w)
      )
    );
    return (matches.length > 0 ? matches : reports).slice(0, 5);
  } catch (err) {
    console.warn("findNearbyReports query error, falling back:", err);
    return [];
  }
}

// ─── Authorities ─────────────────────────────────────────────────────────────

export async function getAuthority(id: string): Promise<Authority | null> {
  try {
    const snap = await getDoc(doc(db, "authorities", id));
    if (snap.exists()) return { id: snap.id, ...snap.data() } as Authority;
  } catch (err) {
    console.warn("getAuthority doc fetch error, checking defaults:", err);
  }

  // Fallback to default authority by ID
  for (const cat of Object.keys(DEFAULT_AUTHORITIES) as ReportCategory[]) {
    if (DEFAULT_AUTHORITIES[cat].id === id) {
      return DEFAULT_AUTHORITIES[cat];
    }
  }
  return null;
}

export async function findAuthority(
  state: string,
  category: ReportCategory
): Promise<Authority | null> {
  try {
    const q = query(
      collection(db, "authorities"),
      where("categories", "array-contains", category),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as Authority;
    }
  } catch (err) {
    console.warn("findAuthority query error, using default:", err);
  }

  // Guaranteed fallback for the category
  return DEFAULT_AUTHORITIES[category] || null;
}
