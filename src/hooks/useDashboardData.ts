"use client";
import { useState, useEffect, useCallback } from "react";

export interface DashboardData {
  pipedrive: any | null;
  clickup: any | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useDashboardData(refreshInterval = 300000) {
  const [data, setData] = useState<DashboardData>({
    pipedrive: null,
    clickup: null,
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const fetchData = useCallback(async () => {
    try {
      setData((prev) => ({ ...prev, loading: true, error: null }));

      const [pipedriveRes, clickupRes] = await Promise.all([
        fetch("/api/pipedrive"),
        fetch("/api/clickup"),
      ]);

      const pipedrive = pipedriveRes.ok ? await pipedriveRes.json() : null;
      const clickup = clickupRes.ok ? await clickupRes.json() : null;

      if (pipedrive?.error) console.warn("Pipedrive error:", pipedrive.error);
      if (clickup?.error) console.warn("ClickUp error:", clickup.error);

      setData({
        pipedrive: pipedrive?.error ? null : pipedrive,
        clickup: clickup?.error ? null : clickup,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error: any) {
      setData((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return { ...data, refresh: fetchData };
}
