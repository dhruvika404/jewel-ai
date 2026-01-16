import { useState, useEffect, useCallback } from "react";
import { dashboardAPI } from "@/services/api";

interface SystemStats {
  todaysTotalPendingFollowUps: number;
  todaysTotalTakenFollowUps: number;
  last7daysTotalPendingFollowUps: number;
  todaysTotalPendingFollowUpsOfPendingOrder: number;
  todaysTotalTakenFollowUpsOfPendingOrder: number;
  last7DayPendingFollowUpsOfPendingOrder: number;
  todaysTotalPendingFollowUpsOfPendingMaterial: number;
  todaysTotalTakenFollowUpsOfPendingMaterial: number;
  last7DayPendingFollowUpsOfPendingMaterial: number;
  todaysTotalPendingFollowUpsOfNewOrder: number;
  todaysTotalTakenFollowUpsOfNewOrder: number;
  last7DayPendingFollowUpsOfNewOrder: number;
}

interface UseDashboardStatsOptions {
  salesExecCode?: string;
  enabled?: boolean;
  refreshInterval?: number; // in milliseconds
}

const defaultStats: SystemStats = {
  todaysTotalPendingFollowUps: 0,
  todaysTotalTakenFollowUps: 0,
  last7daysTotalPendingFollowUps: 0,
  todaysTotalPendingFollowUpsOfPendingOrder: 0,
  todaysTotalTakenFollowUpsOfPendingOrder: 0,
  last7DayPendingFollowUpsOfPendingOrder: 0,
  todaysTotalPendingFollowUpsOfPendingMaterial: 0,
  todaysTotalTakenFollowUpsOfPendingMaterial: 0,
  last7DayPendingFollowUpsOfPendingMaterial: 0,
  todaysTotalPendingFollowUpsOfNewOrder: 0,
  todaysTotalTakenFollowUpsOfNewOrder: 0,
  last7DayPendingFollowUpsOfNewOrder: 0,
};

export function useDashboardStats(options: UseDashboardStatsOptions = {}) {
  const { salesExecCode, enabled = true, refreshInterval } = options;

  const [stats, setStats] = useState<SystemStats>(defaultStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const params: any = {};
      if (salesExecCode) {
        params.salesExecCode = salesExecCode;
      }

      const response = await dashboardAPI.getOverview(params);

      if (response?.data) {
        setStats(response.data);
      } else {
        setStats(defaultStats);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch dashboard stats");
      setError(error);
      setStats(defaultStats);
    } finally {
      setLoading(false);
    }
  }, [salesExecCode, enabled]);

  useEffect(() => {
    fetchStats();

    // Set up auto-refresh if interval is provided
    if (refreshInterval && refreshInterval > 0) {
      const intervalId = setInterval(fetchStats, refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [fetchStats, refreshInterval]);

  const refetch = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch,
  };
}
