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

// ─── Nearby reports ─────────────────────────────────────────────────────────

export async function findNearbyReports(
  category: ReportCategory,
  location: string,
  state: string
): Promise<Report[]> {
  // Simple text-match approach for hackathon — query same state + category
  const q = query(
    collection(db, "reports"),
    where("state", "==", state),
    where("category", "==", category),
    where("status", "!=", "closed"),
    orderBy("confirmationCount", "desc"),
    limit(5)
  );
  const snap = await getDocs(q);
  const reports = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Report));
  // Filter by location keyword overlap
  const locWords = location.toLowerCase().split(/\s+/);
  return reports.filter((r) =>
    locWords.some((w) => r.location.toLowerCase().includes(w))
  );
}

// ─── Authorities ─────────────────────────────────────────────────────────────

export async function getAuthority(id: string): Promise<Authority | null> {
  const snap = await getDoc(doc(db, "authorities", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Authority;
}

export async function findAuthority(
  state: string,
  category: ReportCategory
): Promise<Authority | null> {
  const q = query(
    collection(db, "authorities"),
    where("state", "==", state),
    where("categories", "array-contains", category),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Authority;
}
