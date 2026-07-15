import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";

// Fallback to relative path so the build works on any host (VPS, Vercel, etc.)
// where the backend is proxied under the same domain via /api/*.
const BACKEND = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND}/api`;

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

  const refresh = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/content`);
      setContent(deepMerge(FALLBACK_CONTENT, data || {}));
    } catch {
      setContent(FALLBACK_CONTENT);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
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
