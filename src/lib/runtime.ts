/**
 * Runtime environment detection — single source of truth for "where am I
 * running?". The wallet's same Vue codebase ships in 4 surfaces:
 *
 *   1. Chrome extension (side panel)        → chrome.runtime present
 *   2. Firefox extension (popup or sidebar) → browser.runtime present
 *   3. Standalone PWA on iOS/macOS Safari   → navigator.standalone === true
 *      or matchMedia('(display-mode: standalone)')
 *   4. Dev preview in a normal browser tab  → none of the above
 *
 * Cases (1) and (2) have full access to the dApp message bridge. Cases (3)
 * and (4) MUST gracefully skip every `chrome.runtime.*` / `chrome.storage.*`
 * code path because those APIs are undefined in plain web contexts and would
 * throw a TypeError that crashes the surrounding flow.
 */

/** True inside a Chrome / Firefox MV3 extension surface. */
export function isExtension(): boolean {
  return (
    typeof chrome !== "undefined" &&
    typeof chrome.runtime !== "undefined" &&
    typeof chrome.runtime.id === "string"
  );
}

/**
 * True when the wallet was launched from the home screen on iOS/iPadOS or
 * from `chrome://apps` as a standalone window. Safari sets the legacy
 * `navigator.standalone` flag (non-standard but the only reliable signal
 * pre-iOS 16.4); modern browsers expose `matchMedia('(display-mode: …)')`.
 */
export function isStandalonePWA(): boolean {
  if (typeof window === "undefined") return false;
  if ((window.navigator as any).standalone === true) return true;
  try {
    return window.matchMedia("(display-mode: standalone)").matches;
  } catch {
    return false;
  }
}

/** True when the wallet runs as plain page in a normal browser tab. */
export function isWebTab(): boolean {
  return !isExtension() && !isStandalonePWA();
}

/**
 * Human-readable label for the current surface. Useful for diagnostic
 * logging and conditional UI tweaks (e.g. hiding "Open in side panel"
 * link when we're already in the side panel).
 */
export function surfaceLabel(): "extension" | "pwa" | "web" {
  if (isExtension()) return "extension";
  if (isStandalonePWA()) return "pwa";
  return "web";
}
