/**
 * Dynamic API & WebSocket configuration utility.
 * 
 * Supports:
 * 1. Saved custom URL in localStorage ('FALLGUARD_BACKEND_URL')
 * 2. Vite environment variable import.meta.env.VITE_API_URL
 * 3. Intelligent fallback:
 *    - In browser production (e.g. Vercel, remote web): defaults to the cloud backend (https://fallguard-server.onrender.com)
 *    - In local development (localhost / 127.0.0.1): defaults to http://127.0.0.1:8000
 */

const STORAGE_KEY = 'FALLGUARD_BACKEND_URL';
export const DEFAULT_CLOUD_API = 'https://fallguard-server.onrender.com';
export const DEFAULT_LOCAL_API = 'http://127.0.0.1:8000';

export function getApiBaseUrl() {
  // 1. Check user override in localStorage
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }
  }

  // 2. Check build-time environment variable
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim()) {
    return import.meta.env.VITE_API_URL.trim().replace(/\/+$/, '');
  }

  // 3. Fallback based on runtime environment
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    if (!isLocalhost) {
      // Remote / Vercel deployed frontend -> connect to cloud backend
      return DEFAULT_CLOUD_API;
    }
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
