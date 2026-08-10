import type { AssignmentStatus, TestResult } from "../types/student";

const STORAGE_PREFIX = "su-lms:release1:";
const STORAGE_EVENT = "su-lms:student-storage-updated";

export interface AssignmentState {
  status: AssignmentStatus;
  answer: string;
  fileName: string | null;
}

export interface StudentLocalState {
  version: 1;
  authenticated: boolean;
  profile: Record<string, string>;
  assignments: Record<string, AssignmentState>;
  testResults: Record<string, TestResult>;
  readNotifications: string[];
}

const defaults: StudentLocalState = {
  version: 1,
  authenticated: false,
  profile: {},
  assignments: {},
  testResults: {},
  readNotifications: [],
};

function storageKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(storageKey(key));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(storageKey(key), JSON.stringify(value));
    window.dispatchEvent(new Event(STORAGE_EVENT));
  } catch {
    // The UI remains usable if browser storage is disabled or full.
  }
}

export function getStudentLocalState(): StudentLocalState {
  return {
    version: 1,
    authenticated: read("authenticated", defaults.authenticated),
    profile: read("profile", defaults.profile),
    assignments: read("assignments", defaults.assignments),
    testResults: read("test-results", defaults.testResults),
    readNotifications: read("read-notifications", defaults.readNotifications),
  };
}

export function setAuthenticated(value: boolean): void {
  write("authenticated", value);
}

export function saveProfile(profile: Record<string, string>): void {
  write("profile", profile);
}

export function saveAssignmentState(
  assignmentId: string,
  state: AssignmentState,
): void {
  const assignments = read("assignments", defaults.assignments);
  write("assignments", { ...assignments, [assignmentId]: state });
}

export function saveTestResult(result: TestResult): void {
  const results = read("test-results", defaults.testResults);
  write("test-results", { ...results, [result.testId]: result });
}

export function markNotificationRead(notificationId: string): void {
  const ids = read("read-notifications", defaults.readNotifications);
  if (!ids.includes(notificationId)) write("read-notifications", [...ids, notificationId]);
}

export function markAllNotificationsRead(notificationIds: string[]): void {
  write("read-notifications", notificationIds);
}

export function subscribeStudentStorage(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handleStorage = (event: StorageEvent) => {
    if (event.key?.startsWith(STORAGE_PREFIX)) onStoreChange();
  };

  window.addEventListener(STORAGE_EVENT, onStoreChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(STORAGE_EVENT, onStoreChange);
    window.removeEventListener("storage", handleStorage);
  };
}
