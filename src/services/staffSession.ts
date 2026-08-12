import { mockStaffUsers } from "../data/mock/mockUsers";
import type { StaffRole, StaffSession, StaffUser } from "../types/staff";

const SESSION_KEY = "su-lms-staff-session-v1";
const SESSION_EVENT = "su-lms-staff-session-change";
const DEMO_PASSWORD = "Demo123!";

function getStorage(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function getStaffSession(): StaffSession | null {
  const raw = getStorage()?.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as StaffSession;
    return session.authenticated ? session : null;
  } catch {
    return null;
  }
}

export function getCurrentStaffUser(): StaffUser | null {
  const session = getStaffSession();
  if (!session) return null;
  return mockStaffUsers.find((user) => user.id === session.userId) ?? null;
}

export function authenticateStaff(email: string, password: string): StaffSession | null {
  if (password !== DEMO_PASSWORD) return null;

  const normalizedEmail = email.trim().toLowerCase();
  const user = mockStaffUsers.find(
    (candidate) => candidate.email.toLowerCase() === normalizedEmail,
  );
  if (!user) return null;

  const session: StaffSession = {
    authenticated: true,
    userId: user.id,
    role: user.role,
  };
  getStorage()?.setItem(SESSION_KEY, JSON.stringify(session));
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SESSION_EVENT));
  return session;
}

export function switchStaffRole(role: StaffRole): StaffSession | null {
  const demoUser = mockStaffUsers.find((user) => user.role === role);
  if (!demoUser) return null;

  const session: StaffSession = {
    authenticated: true,
    userId: demoUser.id,
    role,
  };
  getStorage()?.setItem(SESSION_KEY, JSON.stringify(session));
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SESSION_EVENT));
  return session;
}

export function clearStaffSession(): void {
  getStorage()?.removeItem(SESSION_KEY);
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SESSION_EVENT));
}

export function subscribeStaffSession(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(SESSION_EVENT, listener);
  return () => window.removeEventListener(SESSION_EVENT, listener);
}

export function getStaffHomePath(role: StaffRole): string {
  if (role === "teacher") return "/teacher";
  if (role === "content-manager") return "/content";
  return "/admin";
}
