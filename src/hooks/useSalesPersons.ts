import { useState, useEffect } from "react";
import { salesPersonAPI } from "@/services/api";

interface SalesPerson {
  uuid: string;
  userCode: string;
  name: string;
  role?: string;
}

interface UseSalesPersonsOptions {
  role?: string;
  enabled?: boolean;
}

// Simple in-memory cache
let cachedSalesPersons: SalesPerson[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useSalesPersons(options: UseSalesPersonsOptions = {}) {
  const { role = "sales_executive", enabled = true } = options;
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchSalesPersons = async () => {
      // Check cache first
      const now = Date.now();
      if (
        cachedSalesPersons &&
        cacheTimestamp &&
        now - cacheTimestamp < CACHE_DURATION
      ) {
        setSalesPersons(cachedSalesPersons);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await salesPersonAPI.getAll({
          size: 1000,
          role,
        });

        if (response.success && response.data?.data) {
          const data = response.data.data;
          cachedSalesPersons = data;
          cacheTimestamp = now;
          setSalesPersons(data);
        } else {
          setSalesPersons([]);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to fetch sales persons");
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesPersons();
  }, [role, enabled]);

  const invalidateCache = () => {
    cachedSalesPersons = null;
    cacheTimestamp = null;
  };

  return {
    salesPersons,
    loading,
    error,
    invalidateCache,
  };
}
