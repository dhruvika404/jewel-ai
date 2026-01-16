import { useState, useEffect, useCallback, useRef } from "react";
import { clientAPI } from "@/services/api";

interface Client {
  uuid: string;
  userCode: string;
  salesExecCode?: string;
  name: string;
  city?: string;
  role: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  pendingMaterial?: any;
  pendingOrder?: any;
  newOrder?: any;
  status?: string;
}

interface UseClientsParams {
  page?: number;
  size?: number;
  search?: string;
  role?: string;
  salesExecCode?: string;
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

export function useClients(params: UseClientsParams = {}) {
  const {
    page = 1,
    size = 10,
    search = "",
    role = "client",
    salesExecCode,
    startDate,
    endDate,
    enabled = true,
  } = params;

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce search
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const fetchClients = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const apiParams: any = {
        page,
        size,
        role,
      };

      if (search) apiParams.search = search;
      if (salesExecCode) apiParams.salesExecCode = salesExecCode;
      if (startDate) apiParams.startDate = startDate;
      if (endDate) apiParams.endDate = endDate;

      const response = await clientAPI.getAll(apiParams);

      if (response.success !== false) {
        if (response.data?.data) {
          setClients(response.data.data);
          setTotalItems(response.data.totalItems || 0);
          setTotalPages(response.data.totalPages || 1);
        } else {
          setClients(response.data || []);
          setTotalItems(response.data?.length || 0);
          setTotalPages(1);
        }
      } else {
        setClients([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch clients");
      setError(error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [page, size, search, role, salesExecCode, startDate, endDate, enabled]);

  useEffect(() => {
    // Debounce search queries
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchClients();
    }, search ? 500 : 0);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [fetchClients]);

  const refetch = useCallback(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    loading,
    error,
    totalItems,
    totalPages,
    refetch,
  };
}
