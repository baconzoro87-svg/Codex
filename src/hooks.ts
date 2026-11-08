import { useEffect, useRef, useState } from 'react';

/** fetches json from the backend now and then again every `refreshMs` */
export function useApi<T>(url: string, refreshMs = 10 * 60 * 1000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as T;
        if (alive) { setData(body); setError(false); }
      } catch {
        if (alive) setError(true);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const timer = window.setInterval(load, refreshMs);
    return () => { alive = false; window.clearInterval(timer); };
  }, [url, refreshMs]);

  return { data, error, loading };
}

/** adds `is-visible` once the element scrolls into view (soft fade-in) */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) { el.classList.add('is-visible'); return; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.classList.add('is-visible'); io.disconnect(); }
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}
