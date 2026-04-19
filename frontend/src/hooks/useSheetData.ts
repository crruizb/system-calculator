import { useState, useEffect, useCallback } from "react";
import Papa from "papaparse";
import type { SheetRow } from "../utils/filters";

const CACHE_KEY = "calc_prices_data";
const CACHE_TS_KEY = "calc_prices_ts";
const CACHE_TTL_MS = 1 * 10 * 1000; // 10 seconds

interface UseSheetDataResult {
  data: SheetRow[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

function loadFromCache(): SheetRow[] | null {
  try {
    const ts = parseInt(localStorage.getItem(CACHE_TS_KEY) ?? "0", 10);
    if (Date.now() - ts < CACHE_TTL_MS) {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) return JSON.parse(raw) as SheetRow[];
    }
  } catch {
    // ignore
  }
  return null;
}

function saveToCache(data: SheetRow[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TS_KEY, String(Date.now()));
  } catch {
    // ignore quota errors
  }
}

export function useSheetData(sheetUrl: string): UseSheetDataResult {
  const [data, setData] = useState<SheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    (forceRefresh = false) => {
      setLoading(true);
      setError(null);

      if (!forceRefresh) {
        const cached = loadFromCache();
        if (cached) {
          setData(cached);
          setLoading(false);
          // continue to fetch fresh data below (stale-while-revalidate)
        }
      }

      Papa.parse<SheetRow>(sheetUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const cleaned = results.data.filter((row) =>
            Object.values(row).some((v) => v && v.trim() !== "")
          );
          saveToCache(cleaned);
          setData(cleaned);
          setLoading(false);
        },
        error: (err) => {
          const cached = loadFromCache();
          if (cached) setData(cached);
          setLoading(false);
          setError(err.message || "Error al cargar datos");
        },
      });
    },
    [sheetUrl]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(false);
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  return { data, loading, error, refresh };
}
