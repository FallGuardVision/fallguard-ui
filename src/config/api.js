/**
 * Dynamic API & WebSocket configuration utility.
 * 
 * Supports:
 * 1. Saved custom URL in localStorage ('FALLGUARD_BACKEND_URL')
 * 2. Vite environment variable import.meta.env.VITE_API_URL
 * 3. Intelligent fallback:
 *    - In browser production (e.g. Vercel, remote web): ALWAYS defaults to the cloud backend (https://fallguard-server.onrender.com)
 *      and automatically purges invalid localhost overrides.
 *    - In local development (localhost / 127.0.0.1): defaults to http://127.0.0.1:8000
 */

const STORAGE_KEY = 'FALLGUARD_BACKEND_URL';
export const DEFAULT_CLOUD_API = 'https://fallguard-server.onrender.com';
export const DEFAULT_LOCAL_API = 'http://127.0.0.1:8000';

export function isRemoteHost() {
  if (typeof window === 'undefined' || !window.location) return false;
  const host = window.location.hostname;
  return host !== 'localhost' && host !== '127.0.0.1' && host !== '::1' && !host.endsWith('.local');
}

export function getApiBaseUrl() {
  const remote = isRemoteHost();

  // 1. Check user override in localStorage
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved.trim()) {
      const clean = saved.trim().replace(/\/+$/, '');
      // If we are on Vercel/remote and the stored URL is localhost, it's invalid - discard it!
      if (remote && (clean.includes('127.0.0.1') || clean.includes('localhost'))) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        return clean;
      }
    }
  }

  // 2. Check build-time environment variable
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim()) {
    const envUrl = import.meta.env.VITE_API_URL.trim().replace(/\/+$/, '');
    // If on remote domain, ignore localhost values baked into build
    if (!remote || (!envUrl.includes('127.0.0.1') && !envUrl.includes('localhost'))) {
      return envUrl;
    }
  }

  // 3. Fallback: on remote sites (like Vercel), ALWAYS default to Render Cloud
  if (remote) {
    return DEFAULT_CLOUD_API;
  }

  return DEFAULT_LOCAL_API;
}

export function getWsBaseUrl() {
  const httpBase = getApiBaseUrl();
  return httpBase.replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:');
}

export function setApiBaseUrl(newUrl) {
  if (typeof window !== 'undefined') {
    if (!newUrl || !newUrl.trim()) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, newUrl.trim().replace(/\/+$/, ''));
    }
    // Notify listeners across components
    window.dispatchEvent(new Event('fallguard_api_changed'));
  }
}
