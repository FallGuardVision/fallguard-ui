const LOCAL_API = 'http://127.0.0.1:8000';
const DEPLOYED_API = 'https://fallguard-server.onrender.com';

function resolveApiBase() {
  const fromEnv = import.meta.env.VITE_API_URL;
  const fallback = import.meta.env.PROD ? DEPLOYED_API : LOCAL_API;
  return String(fromEnv || fallback).replace(/\/$/, '');
}

export const API_BASE = resolveApiBase();

export function apiUrl(path) {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${suffix}`;
}

export function wsUrl(path) {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  const wsBase = API_BASE.replace(/^https/, 'wss').replace(/^http/, 'ws');
  return `${wsBase}${suffix}`;
}
