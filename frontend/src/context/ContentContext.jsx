import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";

// Fallback to relative path so the build works on any host (VPS, Vercel, etc.)
// where the backend is proxied under the same domain via /api/*.
const BACKEND = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND}/api`;

// Cross-tab sync channel: /admin -> landing tabs get notified of content updates.
const BROADCAST_CHANNEL = "autohaus-content-updates";

// Built-in fallback so the site never renders empty even if the API is unreachable.
// Must mirror /app/backend/default_content.py.
import { FALLBACK_CONTENT } from "@/lib/contentDefaults";

const ContentContext = createContext({
  content: FALLBACK_CONTENT,
  refresh: () => {},
  loading: true,
});

function deepMerge(base, override) {
  if (base && typeof base === "object" && !Array.isArray(base) &&
      override && typeof override === "object" && !Array.isArray(override)) {
    const out = { ...base };
    for (const k of Object.keys(override)) {
      out[k] = k in base ? deepMerge(base[k], override[k]) : override[k];
    }
    return out;
  }
  return override === undefined || override === null ? base : override;
}

export function ContentProvider({ children }) {
  const [content, setContent] = useState(FALLBACK_CONTENT);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async ({ broadcast = false } = {}) => {
    try {
      // Cache-buster query defeats any misconfigured CDN / browser HTTP cache
      // that might otherwise serve stale /api/content after admin edits.
      const { data } = await axios.get(`${API}/content?t=${Date.now()}`, {
        headers: { "Cache-Control": "no-cache" },
      });
      setContent(deepMerge(FALLBACK_CONTENT, data || {}));

      // If this refresh was triggered by admin save, broadcast to other tabs.
      if (broadcast && typeof BroadcastChannel !== "undefined") {
        try {
          const bc = new BroadcastChannel(BROADCAST_CHANNEL);
          bc.postMessage({ type: "content-updated", ts: Date.now() });
          bc.close();
        } catch (_) {
          /* older browsers — silently skip */
        }
      }
    } catch {
      setContent(FALLBACK_CONTENT);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    // Listen for cross-tab content updates (fired from /admin after save)
    if (typeof BroadcastChannel === "undefined") return;
    let bc;
    try {
      bc = new BroadcastChannel(BROADCAST_CHANNEL);
      bc.onmessage = (event) => {
        if (event?.data?.type === "content-updated") {
          refresh();
        }
      };
    } catch (_) {
      // older browsers — ignore
    }
    return () => {
      try { bc?.close(); } catch (_) { /* noop */ }
    };
  }, [refresh]);

  return (
    <ContentContext.Provider value={{ content, refresh, loading }}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  return useContext(ContentContext).content;
}

export function useContentRefresh() {
  return useContext(ContentContext).refresh;
}
