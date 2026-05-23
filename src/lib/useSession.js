'use client';
import { useCallback, useEffect, useState } from 'react';

async function jsonFetch(url, opts = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : null;
  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function jsonFetchWithMinimumDelay(url, opts = {}, minimumMs = 1200) {
  const started = Date.now();
  try {
    return await jsonFetch(url, opts);
  } finally {
    const remaining = minimumMs - (Date.now() - started);
    if (remaining > 0) await sleep(remaining);
  }
}

export const api = {
  get: (u, opts = {}) => jsonFetch(u, opts),
  post: (u, body, opts = {}) => jsonFetchWithMinimumDelay(u, { ...opts, method: 'POST', body: JSON.stringify(body || {}) }),
  patch: (u, body, opts = {}) => jsonFetchWithMinimumDelay(u, { ...opts, method: 'PATCH', body: JSON.stringify(body || {}) }),
  del: (u, body, opts = {}) => jsonFetchWithMinimumDelay(u, { ...opts, method: 'DELETE', body: JSON.stringify(body || {}) }),
};

export function useSession() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get('/api/auth/me');
      setUser(data.user || null);
    } catch (_) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email, password) => {
    const data = await api.post('/api/auth/login', { email, password });
    setUser(data.user);
    return data.user;
  }, []);

  const signup = useCallback(async (email, password, name, referralCode) => {
    const data = await api.post('/api/auth/signup', { email, password, name, referralCode });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await api.post('/api/auth/logout');
    setUser(null);
  }, []);

  return { user, loading, refresh, login, signup, logout };
}

export function useSiteSettings(pollMs = 15000) {
  const [settings, setSettings] = useState(null);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const s = await api.get('/api/settings');
        if (mounted) setSettings(s);
      } catch (_) {}
    };
    load();
    const id = setInterval(load, pollMs);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [pollMs]);
  return settings;
}
