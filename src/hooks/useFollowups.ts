import { useState, useEffect, useCallback } from "react";
import {
  newOrderAPI,
  pendingOrderAPI,
  pendingMaterialAPI,
} from "@/services/api";

export type FollowupType = "new-order" | "pending-order" | "pending-material";

export interface BaseFollowup {
  id: string;
  userCode: string;
  name: string;
  salesExecutive: string;
  status: string;
  nextFollowupDate?: string;
  remark?: string;
  type: FollowupType;
  originalData?: any;
}

export interface NewOrderFollowup extends BaseFollowup {
  type: "new-order";
  lastOrderDate: string;
  noOrderSince: number;
}

export interface PendingOrderFollowup extends BaseFollowup {
  type: "pending-order";
  orderNo: string;
  totalOrderPcs: number;
  pendingPcs: number;
  orderDate: string;
  pendingSince: number;
}

export interface PendingMaterialFollowup extends BaseFollowup {
  type: "pending-material";
  pendingFor: string;
  pendingSinceDays: number;
  styleNo: string;
  orderNo: string;
  orderDate: string;
  expectedDeliveryDate: string;
  departmentName: string;
  totalNetWt: string;
  lastFollowUpDate: string | null;
  lastFollowUpMsg: string;
}

export type FollowupRecord =
  | NewOrderFollowup
  | PendingOrderFollowup
  | PendingMaterialFollowup;

interface UseFollowupsParams {
  type: FollowupType;
  page?: number;
  size?: number;
  search?: string;
  status?: string;
  salesExecCode?: string;
  clientCode?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  startDate?: string;
  endDate?: string;
  todayDueFollowUp?: boolean;
  todayCompletedFollowUp?: boolean;
  sevenDayPendingFollowUp?: boolean;
}

export function useFollowups(params: UseFollowupsParams) {
  const {
    type,
    page = 1,
    size = 10,
    search,
    status,
    salesExecCode,
    clientCode,
    sortBy,
    sortOrder,
    startDate,
    endDate,
    todayDueFollowUp,
    todayCompletedFollowUp,
    sevenDayPendingFollowUp,
  } = params;

  const [followups, setFollowups] = useState<FollowupRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchFollowups = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const apiParams: any = {
        page,
        size,
      };

      if (search) apiParams.search = search;
      if (status) apiParams.status = status;
      if (salesExecCode) apiParams.salesExecCode = salesExecCode;
      if (clientCode) apiParams.clientCode = clientCode;
      if (sortBy) apiParams.sortBy = sortBy;
      if (sortOrder) apiParams.sortOrder = sortOrder;
      if (startDate) apiParams.startDate = startDate;
      if (endDate) apiParams.endDate = endDate;
      if (todayDueFollowUp) apiParams.todayDueFollowUp = true;
      if (todayCompletedFollowUp) apiParams.todayCompletedFollowUp = true;
      if (sevenDayPendingFollowUp) apiParams.sevenDayPendingFollowUp = true;

      let response;
      let processedData: FollowupRecord[] = [];

      if (type === "new-order") {
        response = await newOrderAPI.getAll(apiParams);
        processedData = processNewOrderData(response);
      } else if (type === "pending-order") {
        response = await pendingOrderAPI.getAll(apiParams);
        processedData = processPendingOrderData(response);
      } else if (type === "pending-material") {
        response = await pendingMaterialAPI.getAll(apiParams);
        processedData = processPendingMaterialData(response);
      }

      setFollowups(processedData);
      setTotalPages(response.data?.totalPages || 1);
      setTotalItems(response.data?.totalItems || 0);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch followups");
      setError(error);
      setFollowups([]);
    } finally {
      setLoading(false);
    }
  }, [
    type,
    page,
    size,
    search,
    status,
    salesExecCode,
    clientCode,
    sortBy,
    sortOrder,
    startDate,
    endDate,
    todayDueFollowUp,
    todayCompletedFollowUp,
    sevenDayPendingFollowUp,
  ]);

  useEffect(() => {
    fetchFollowups();
  }, [fetchFollowups]);

  const refetch = useCallback(() => {
    fetchFollowups();
  }, [fetchFollowups]);

  return {
    followups,
    loading,
    error,
    totalItems,
    totalPages,
    refetch,
  };
}

// Data processing functions
function processNewOrderData(res: any): NewOrderFollowup[] {
  let dataArray = [];
  if (Array.isArray(res)) dataArray = res;
  else if (res.data?.data) dataArray = res.data.data;
  else if (res.data) dataArray = res.data;

  return dataArray.map((item: any) => {
    const lastOrderDate =
      item.lastOrderDate || item.lastSaleDate || new Date().toISOString();
    const date = new Date(lastOrderDate);
    const now = new Date();
    const daysDiff = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      id: item.uuid || item._id || item.id || Math.random().toString(),
      userCode: item.clientCode || item.clientData?.userCode || item.userCode,
      name: item.clientData?.name || item.name || item.userCode,
      lastOrderDate: lastOrderDate,
      noOrderSince: daysDiff,
      salesExecutive:
        item.salesExecData?.userCode || item.salesExecCode || "",
      status: (item.status || "pending").toLowerCase(),
      nextFollowupDate:
        item.nextFollowUpDate || item.nextFollowupDate || null,
      remark: item.remark || "",
      type: "new-order" as const,
      originalData: item,
    };
  });
}

function processPendingOrderData(res: any): PendingOrderFollowup[] {
  let dataArray = [];
  if (Array.isArray(res)) dataArray = res;
  else if (res.data?.data) dataArray = res.data.data;
  else if (res.data) dataArray = res.data;

  return dataArray.map((item: any) => {
    const orderDate = item.orderDate || new Date().toISOString();
    const date = new Date(orderDate);
    const now = new Date();
    const daysDiff = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      id: item.uuid || item._id || item.id || Math.random().toString(),
      userCode: item.clientCode || item.clientData?.userCode || item.userCode,
      name: item.clientData?.name || item.name || item.userCode,
      orderNo: item.orderNo || "",
      totalOrderPcs: item.totalOrderPcs || 0,
      pendingPcs:
        item.pendingPcs ??
        (item.totalOrderPcs || 0) - (item.deliveredPcs || 0),
      salesExecutive:
        item.salesExecData?.userCode || item.salesExecCode || "",
      type: "pending-order" as const,
      orderDate: orderDate,
      pendingSince: daysDiff,
      nextFollowupDate:
        item.nextFollowUpDate || item.nextFollowupDate || null,
      remark: item.remark || "",
      status: (item.status || "pending").toLowerCase(),
      originalData: item,
    };
  });
}

function processPendingMaterialData(res: any): PendingMaterialFollowup[] {
  let dataArray = [];
  if (Array.isArray(res)) dataArray = res;
  else if (res.data?.data) dataArray = res.data.data;
  else if (res.data) dataArray = res.data;

  return dataArray.map((item: any) => {
    const lastMovementDate = item.updatedAt || item.createdAt || new Date();
    const date = new Date(lastMovementDate);
    const now = new Date();
    const daysDiff = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      id: item.uuid || item._id || item.id || Math.random().toString(),
      userCode: item.clientCode || item.clientData?.userCode || item.userCode,
      name: item.clientData?.name || item.name || item.userCode,
      pendingFor: item.departmentName || "",
      pendingSinceDays: daysDiff,
      salesExecutive:
        item.salesExecData?.userCode || item.salesExecCode || "",
      remark: item.remark || "",
      styleNo: item.styleNo || "",
      orderNo: item.orderNo || "",
      orderDate: item.orderDate || new Date().toISOString(),
      expectedDeliveryDate: item.expectedDeliveryDate || "",
      departmentName: item.departmentName || "",
      totalNetWt: item.totalNetWt || "",
      lastFollowUpDate: item.lastFollowUpDate || null,
      lastFollowUpMsg: item.lastFollowUpMsg || "",
      status: item.status || "pending",
      type: "pending-material" as const,
      nextFollowupDate:
        item.nextFollowUpDate || item.nextFollowupDate || null,
      originalData: item,
    };
  });
}
