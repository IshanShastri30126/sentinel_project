import Cookies from "js-cookie";
import { getDeviceFingerprint } from "@/lib/deviceFingerprint";

export const SERVER_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000";
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || `${SERVER_BASE_URL}/api`;

/**
 * Resolves a file/image URL that may be either:
 * - A full absolute URL (from Cloudinary: https://res.cloudinary.com/...)
 * - A relative path (from local disk: /uploads/filename.jpg)
 * Returns the URL ready for use in <img src> or <a href>.
 */
export function getFileUrl(url: string | undefined | null): string {
  if (!url) return "";
  // Already a full URL (Cloudinary, external CDN, data URI, etc.)
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  // Relative path — prepend server base URL
  return `${SERVER_BASE_URL}${url}`;
}

interface FetchOptions extends RequestInit {
  token?: string;
}

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const apiCache = new Map<string, CacheEntry>();
const activeRequests = new Map<string, Promise<unknown>>();
const CACHE_TTL_MS = 10 * 1000; // 10 seconds

// Core HTTP execution function
async function executeApiRequest<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;

  const cookieToken = Cookies.get("accessToken");
  const activeToken = cookieToken || token;
  const activeClubSlug = typeof window !== "undefined" ? localStorage.getItem("ck_active_club_slug") || "chakravyuh" : "chakravyuh";
  const deviceFingerprint = typeof window !== "undefined" ? getDeviceFingerprint() : "";
  const localIp = typeof window !== "undefined" ? localStorage.getItem("ck_local_ip") || "192.168.1.100" : "192.168.1.100";

  const res = await fetch(`${API_BASE}${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
      "X-Club-Slug": activeClubSlug,
      ...(deviceFingerprint ? { "X-Device-Fingerprint": deviceFingerprint } : {}),
      "X-Local-IP": localIp,
      ...headers,
    },
    ...rest,
  });

  const data = await res.json();

  if (!res.ok) {
    if (res.status === 401 && endpoint !== "/auth/refresh" && endpoint !== "/auth/login") {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(deviceFingerprint ? { "X-Device-Fingerprint": deviceFingerprint } : {}),
          },
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newAccessToken = refreshData.accessToken;
          
          Cookies.set("accessToken", newAccessToken, { expires: 1 });

          const retryRes = await fetch(`${API_BASE}${endpoint}`, {
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${newAccessToken}`,
              "X-Club-Slug": activeClubSlug,
              ...(deviceFingerprint ? { "X-Device-Fingerprint": deviceFingerprint } : {}),
              ...headers,
            },
            ...rest,
          });
          if (retryRes.ok) {
            return await retryRes.json() as T;
          }
        }
      } catch {
        // Silent — do not expose token refresh failures to DevTools
      }
    }
    const errObj = new Error(data.error || `API error: ${res.status}`);
    Object.assign(errObj, data);
    throw errObj;
  }

  return data as T;
}

// Wrapper for caching and deduplication
export async function api<T = unknown>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const method = (options.method || "GET").toUpperCase();

  // If a mutating method is called, invalidate client-side cache immediately
  if (method !== "GET") {
    apiCache.clear();
  }

  // Check in-memory cache for GET requests
  if (method === "GET") {
    const cached = apiCache.get(endpoint);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data as T;
    }
  }

  // Request deduplication
  const dedupKey = `${method}:${endpoint}`;
  if (activeRequests.has(dedupKey)) {
    return activeRequests.get(dedupKey) as Promise<T>;
  }

  const requestPromise = (async () => {
    try {
      const data = await executeApiRequest<T>(endpoint, options);
      if (method === "GET") {
        apiCache.set(endpoint, { data, timestamp: Date.now() });
      }
      return data;
    } finally {
      activeRequests.delete(dedupKey);
    }
  })();

  activeRequests.set(dedupKey, requestPromise);
  return requestPromise;
}

// For file uploads (no Content-Type header — let browser set boundary)
export async function apiUpload<T = unknown>(endpoint: string, formData: FormData, token?: string, method = "POST"): Promise<T> {
  const cookieToken = Cookies.get("accessToken");
  const activeToken = cookieToken || token;
  const activeClubSlug = typeof window !== "undefined" ? localStorage.getItem("ck_active_club_slug") || "chakravyuh" : "chakravyuh";
  const deviceFingerprint = typeof window !== "undefined" ? getDeviceFingerprint() : "";

  // Invalidate cache on upload (as it's a mutating action)
  apiCache.clear();

  const makeUploadRequest = (authToken: string | undefined) =>
    fetch(`${API_BASE}${endpoint}`, {
      method,
      credentials: "include",
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        "X-Club-Slug": activeClubSlug,
        ...(deviceFingerprint ? { "X-Device-Fingerprint": deviceFingerprint } : {}),
      },
      body: formData,
    });

  let res = await makeUploadRequest(activeToken);

  if (res.status === 401) {
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(deviceFingerprint ? { "X-Device-Fingerprint": deviceFingerprint } : {}),
        },
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        const newAccessToken = refreshData.accessToken;
        Cookies.set("accessToken", newAccessToken, { expires: 1 });
        res = await makeUploadRequest(newAccessToken);
      }
    } catch {
      // Silent — do not expose token refresh failures to DevTools
    }
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `API error: ${res.status}`);
  return data as T;
}
