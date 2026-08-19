const SIDEBAR_COLLAPSED_KEY = "su-lms:ui:sidebar-collapsed";

function getStorage(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function getSidebarCollapsed(): boolean {
  try {
    return getStorage()?.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

export function setSidebarCollapsed(isCollapsed: boolean): void {
  try {
    getStorage()?.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
  } catch {
    // The preference is optional when browser storage is unavailable.
  }
}
