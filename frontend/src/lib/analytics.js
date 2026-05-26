// Capture analytics data (UTM, device, referrer) from the current session.
// UTM params are persisted in sessionStorage so they survive client-side
// navigation within the landing.

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
];

const STORAGE_KEY = "autohaus_utm";

function safeGetSession() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function readStoredUTM() {
  const s = safeGetSession();
  if (!s) return {};
  try {
    const raw = s.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persistUTM(utm) {
  const s = safeGetSession();
  if (!s) return;
  try {
    s.setItem(STORAGE_KEY, JSON.stringify(utm));
  } catch {
    /* ignore quota */
  }
}

function readUTMFromURL() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const out = {};
  for (const key of UTM_KEYS) {
    const v = params.get(key);
    if (v) out[key] = v;
  }
  return out;
}

function detectDevice() {
  if (typeof navigator === "undefined") return "Unknown";
  const ua = navigator.userAgent || "";
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) return /Mobile/i.test(ua) ? "Android Phone" : "Android Tablet";
  if (/Mac OS X/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows PC";
  if (/Linux/i.test(ua)) return "Linux";
  return "Desktop";
}

// On first import, merge URL UTMs into session storage so they survive across forms.
const fromUrl = readUTMFromURL();
if (Object.keys(fromUrl).length > 0) {
  persistUTM({ ...readStoredUTM(), ...fromUrl });
}

export function getAnalyticsPayload() {
  const utm = { ...readStoredUTM(), ...readUTMFromURL() };
  const out = { ...utm };

  if (typeof window !== "undefined") {
    out.page_url = window.location.href;
    out.referrer = document.referrer || null;
  }
  out.device = detectDevice();
  return out;
}
