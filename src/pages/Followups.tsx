import { useState, useEffect, useRef } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/contexts/AuthContext";
import { getUTCISOString } from "@/lib/utils";
import {
  useParams,
  Navigate,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TablePagination from "@/components/ui/table-pagination";
import { Badge } from "@/components/ui/badge";
import { AddFollowUpModal } from "@/components/modals/AddFollowUpModal";
import { ImportModal } from "@/components/modals/ImportModal";
import {
  Download,
  Loader2,
  Upload,
  Plus,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  newOrderAPI,
  pendingOrderAPI,
  pendingMaterialAPI,
  cadOrderAPI,
  salesPersonAPI,
  clientAPI,
  remarkAPI,
  sharedAPI,
} from "@/services/api";
import { usePageHeader } from "@/contexts/PageHeaderProvider";
import * as XLSX from "xlsx";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { formatDisplayDate, getTakenByName } from "@/lib/utils";
import { DeleteModal } from "@/components/modals/DeleteModal";
import { RemarkHistoryModal } from "@/components/modals/RemarkHistoryModal";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type FollowupType =
  | "new-order"
  | "pending-order"
  | "pending-material"
  | "cad-order";

interface NewOrderFollowup {
  id: string;
  userCode: string;
  name: string;
  lastOrderDate: string;
  noOrderSince: number;
  salesExecutive: string;
  status: string;
  nextFollowupDate?: string;
  lastFollowUpDate?: string | null;
  lastFollowUpBy?: string | { name: string; userCode: string; uuid?: string };
  remark?: string;
  type: "new-order";
  originalData?: any;
}

interface PendingOrderFollowup {
  id: string;
  userCode: string;
  name: string;
  orderNo: string;
  totalOrderPcs: number;
  pendingPcs: number;
  salesExecutive: string;
  type: "pending-order";
  orderDate: string;
  pendingSince: number;
  nextFollowupDate?: string;
  lastFollowUpDate?: string | null;
  lastFollowUpBy?: string | { name: string; userCode: string; uuid?: string };
  remark?: string;
  status: string;
  originalData?: any;
}

interface PendingMaterialFollowup {
  id: string;
  userCode: string;
  name: string;
  pendingFor: string;
  pendingSinceDays: number;
  salesExecutive: string;
  nextFollowupDate?: string;
  styleNo: string;
  orderNo: string;
  orderDate: string;
  expectedDeliveryDate: string;
  departmentName: string;
  totalNetWt: string;
  lastFollowUpDate: string | null;
  lastFollowUpBy?: string | { name: string; userCode: string; uuid?: string };
  lastFollowUpMsg: string;
  status: string;
  remark?: string;
  type: "pending-material";
  originalData?: any;
}

interface CADOrderFollowup {
  id: string;
  userCode: string;
  name: string;
  designNo: string;
  salesExecutive: string;
  status: string;
  nextFollowupDate?: string;
  lastFollowUpDate?: string | null;
  lastFollowUpBy?: string | { name: string; userCode: string; uuid?: string };
  remark?: string;
  type: "cad-order";
  originalData?: any;
}

type FollowupRecord =
  | NewOrderFollowup
  | PendingOrderFollowup
  | PendingMaterialFollowup
  | CADOrderFollowup;

interface SalesPerson {
  uuid: string;
  userCode: string;
  name: string;
}

interface Client {
  uuid: string;
  userCode: string;
  name: string;
  salesExecCode?: string;
}

export default function Followups() {
  const { type } = useParams<{ type: FollowupType }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setHeader } = usePageHeader();
  const { user } = useAuth();
  const isAdmin = user?.role !== "sales_executive";
  const followupType = (type as FollowupType) || "new-order";
  const [salesPersonFilter, setSalesPersonFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const from = searchParams.get("startDate");
    const to = searchParams.get("endDate");
    if (from) {
      const fromDate = new Date(from);
      const toDate = to ? new Date(to) : fromDate;
      
      const normalizedFrom = new Date(
        fromDate.getUTCFullYear(),
        fromDate.getUTCMonth(),
        fromDate.getUTCDate()
      );
      const normalizedTo = new Date(
        toDate.getUTCFullYear(),
        toDate.getUTCMonth(),
        toDate.getUTCDate()
      );
      
      return {
        from: normalizedFrom,
        to: normalizedTo,
      };
    }
    return undefined;
  });
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [pendingRangeFilter, setPendingRangeFilter] = useState("all");
  const [daysFilter, setDaysFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [followups, setFollowups] = useState<FollowupRecord[]>([]);
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC" | null>(null);
  const [spSearchQuery, setSpSearchQuery] = useState("");
  const [isSpLoading, setIsSpLoading] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [isClientLoading, setIsClientLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showAddFollowUpModal, setShowAddFollowUpModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FollowupRecord | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<FollowupRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkRemarkModalOpen, setBulkRemarkModalOpen] = useState(false);
  const [bulkRemarkText, setBulkRemarkText] = useState("");
  const [bulkStatusModalOpen, setBulkStatusModalOpen] = useState(false);
  const [bulkStatusValue, setBulkStatusValue] = useState<
    "pending" | "completed"
  >("completed");
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [remarkHistoryOpen, setRemarkHistoryOpen] = useState(false);
  const [selectedRemarkItem, setSelectedRemarkItem] =
    useState<FollowupRecord | null>(null);
  const [remarkRecord, setRemarkRecord] = useState<FollowupRecord | null>(null);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const toggleAllSelection = (currentItems: FollowupRecord[]) => {
    const allSelected = currentItems.every((item) =>
      selectedItems.has(item.id),
    );
    if (allSelected) {
      const newSelected = new Set(selectedItems);
      currentItems.forEach((item) => newSelected.delete(item.id));
      setSelectedItems(newSelected);
    } else {
      const newSelected = new Set(selectedItems);
      currentItems.forEach((item) => newSelected.add(item.id));
      setSelectedItems(newSelected);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    setIsBulkProcessing(true);
    try {
      const entityTypeMap: Record<
        FollowupType,
        "pendingOrders" | "pendingMaterials" | "newOrders" | "cadOrders"
      > = {
        "new-order": "newOrders",
        "pending-order": "pendingOrders",
        "pending-material": "pendingMaterials",
        "cad-order": "cadOrders",
      };

      const payload = {
        entityType: entityTypeMap[followupType],
        ids: Array.from(selectedItems),
      };

      const response = await sharedAPI.deleteMultiple(payload);

      if (response?.success === false) {
        toast.error(response?.message || "Failed to delete selected records");
      } else {
        toast.success(
          `Successfully deleted ${selectedItems.size} selected records`,
        );
        setShowBulkDeleteConfirm(false);
        setSelectedItems(new Set());
        loadFollowupData();
      }
    } catch (e: any) {
      toast.error(
        e?.message || "Failed to delete selected records. Please try again.",
      );
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkRemark = async () => {
    if ((selectedItems.size === 0 && !remarkRecord) || !bulkRemarkText.trim())
      return;
    setIsBulkProcessing(true);
    try {
      const entityTypeMap: Record<
        FollowupType,
        "pendingOrders" | "pendingMaterials" | "newOrders" | "cadOrders"
      > = {
        "new-order": "newOrders",
        "pending-order": "pendingOrders",
        "pending-material": "pendingMaterials",
        "cad-order": "cadOrders",
      };

      const itemsToProcess =
        selectedItems.size > 0
          ? Array.from(selectedItems)
              .map((id) => followups.find((f) => f.id === id))
              .filter((item): item is FollowupRecord => !!item)
          : remarkRecord
            ? [remarkRecord]
            : [];

      const remarks = itemsToProcess
        .map((item) => {
          if (!item) return null;

          const originalData = (item as any).originalData || item;
          const salesExecCode =
            originalData.salesExecCode ||
            originalData.salesExecData?.userCode ||
            "";
          const clientCode = item.userCode || "";

          return {
            remarkMsg: bulkRemarkText,
            salesExecCode: salesExecCode as string,
            clientCode,
            entityType: entityTypeMap[item.type],
            entityId: item.id,
          };
        })
        .filter(Boolean);

      const response = await remarkAPI.createBulk({ remarks: remarks as any });

      if (response.success || response.data) {
        toast.success(
          `Remark added successfully to ${itemsToProcess.length} record${itemsToProcess.length !== 1 ? "s" : ""}`,
        );
        setBulkRemarkModalOpen(false);
        setBulkRemarkText("");
        setSelectedItems(new Set());
        setRemarkRecord(null);
        loadFollowupData();
      }
    } catch (e: any) {
      toast.error(
        e.message || "Failed to add remark to selected records"
      );
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedItems.size === 0) return;
    if (
      followupType !== "new-order" &&
      followupType !== "pending-order" &&
      followupType !== "pending-material"
    ) {
      return;
    }

    setIsBulkProcessing(true);
    try {
      const entityTypeMap: Record<
        Exclude<FollowupType, "cad-order">,
        "pendingOrders" | "pendingMaterials" | "newOrders"
      > = {
        "new-order": "newOrders",
        "pending-order": "pendingOrders",
        "pending-material": "pendingMaterials",
      };

      const payload = {
        entityType:
          entityTypeMap[followupType as Exclude<FollowupType, "cad-order">],
        status: bulkStatusValue,
        ids: Array.from(selectedItems),
      };

      const response = await sharedAPI.updateStatus(payload);

      if (response?.success === false) {
        toast.error(response?.message || "Failed to update status");
      } else {
        toast.success(
          `Status updated to "${bulkStatusValue}" for ${selectedItems.size} records`,
        );
        setBulkStatusModalOpen(false);
        setSelectedItems(new Set());
        loadFollowupData();
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to update status for selected records");
    } finally {
      setIsBulkProcessing(false);
    }
  };


  const MANUAL_SORT_COLUMNS = [
    "noOrderSince",
    "pendingSince",
    "pendingSinceDays",
  ];

  const validTypes: FollowupType[] = [
    "new-order",
    "pending-order",
    "pending-material",
    "cad-order",
  ];
  if (!validTypes.includes(followupType)) {
    return <Navigate to="/followups/new-order" replace />;
  }

  useEffect(() => {
    const loadSalesPersons = async (search?: string) => {
      try {
        if (!isAdmin) return;
        setIsSpLoading(true);
        const spRes = await salesPersonAPI.getAll({
          page: 1,
          size: 1000,
          role: "sales_executive",
          search: search,
        });
        if (spRes.success && spRes.data?.data) {
          setSalesPersons(spRes.data.data);
        }
      } catch (error) {
        console.error("Error loading sales persons:", error);
      } finally {
        setIsSpLoading(false);
      }
    };

    const timer = setTimeout(() => {
      loadSalesPersons(spSearchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [spSearchQuery]);

  useEffect(() => {
    const loadClients = async (search?: string) => {
      try {
        setIsClientLoading(true);
        const clientRes = await clientAPI.getAll({
          page: 1,
          size: 1000,
          role: "client",
          search: search,
        });
        if (clientRes.success !== false) {
          setClients(clientRes.data?.data || clientRes.data || []);
        }
      } catch (error) {
        console.error("Error loading clients:", error);
      } finally {
        setIsClientLoading(false);
      }
    };

    const timer = setTimeout(() => {
      loadClients(clientSearchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [clientSearchQuery]);

  const processCADOrderData = (res: any): CADOrderFollowup[] => {
    let dataArray = [];
    if (Array.isArray(res)) dataArray = res;
    else if (res.data?.data) dataArray = res.data.data;
    else if (res.data) dataArray = res.data;

    return dataArray.map((item: any) => {
      return {
        id: item.uuid || item._id || item.id || Math.random().toString(),
        userCode: item.clientCode || item.clientData?.userCode || item.userCode,
        name: item.clientData?.name || item.name || item.userCode,
        designNo: item.designNo || "",
        salesExecutive:
          item.salesExecData?.userCode || item.salesExecCode || "",
        status: (item.status || "pending").toLowerCase(),
        nextFollowupDate:
          item.nextFollowUpDate || item.nextFollowupDate || null,
        lastFollowUpDate: item.lastFollowUpDate || null,
        lastFollowUpBy: item.lastFollowUpBy || null,
        remark: item.remark || "",
        type: "cad-order" as const,
        originalData: item,
      };
    });
  };

  const processNewOrderData = (res: any): NewOrderFollowup[] => {
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
        (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
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
        lastFollowUpDate: item.lastFollowUpDate || null,
        lastFollowUpBy: item.lastFollowUpBy || null,
        remark: item.remark || "",
        type: "new-order" as const,
        originalData: item,
      };
    });
  };

  const processPendingOrderData = (res: any): PendingOrderFollowup[] => {
    let dataArray = [];
    if (Array.isArray(res)) dataArray = res;
    else if (res.data?.data) dataArray = res.data.data;
    else if (res.data) dataArray = res.data;

    return dataArray.map((item: any) => {
      const orderDate = item.orderDate || new Date().toISOString();
      const date = new Date(orderDate);
      const now = new Date();
      const daysDiff = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
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
        lastFollowUpDate: item.lastFollowUpDate || null,
        lastFollowUpBy: item.lastFollowUpBy || null,
        remark: item.remark || "",
        status: (item.status || "pending").toLowerCase(),

        originalData: item,
      };
    });
  };

  const processPendingMaterialData = (res: any): PendingMaterialFollowup[] => {
    let dataArray = [];
    if (Array.isArray(res)) dataArray = res;
    else if (res.data?.data) dataArray = res.data.data;
    else if (res.data) dataArray = res.data;

    return dataArray.map((item: any) => {
      const lastMovementDate = item.updatedAt || item.createdAt || new Date();
      const date = new Date(lastMovementDate);
      const now = new Date();
      const daysDiff = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
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
        lastFollowUpMsg: item.lastFollowUpMsg || "",
        status: item.status || "pending",
        type: "pending-material" as const,
        nextFollowupDate:
          item.nextFollowUpDate || item.nextFollowupDate || null,
        lastFollowUpDate: item.lastFollowUpDate || null,
        lastFollowUpBy: item.lastFollowUpBy || null,
        originalData: item,
      };
    });
  };

  const loadFollowupData = async (options?: {
    skipAllFilters?: boolean;
  }) => {
    const activeDateRange = dateRange;
    const skipAllFilters = options?.skipAllFilters || false;
    try {
      setLoading(true);
      let data: any[] = [];

      const params: any = {
        page: currentPage,
        size: pageSize,
      };

      if (activeDateRange?.from && !skipAllFilters) {
        params.startDate = getUTCISOString(activeDateRange.from, 'start');

        if (activeDateRange.to) {
          params.endDate = getUTCISOString(activeDateRange.to, 'end');
        } else {
          params.endDate = getUTCISOString(activeDateRange.from, 'end');
        }
      }
      if (!activeDateRange && !skipAllFilters) {
        const urlStartDate = searchParams.get("startDate");
        const urlEndDate = searchParams.get("endDate");
        if (urlStartDate) {
          params.startDate = urlStartDate;
        }
        if (urlEndDate) {
          params.endDate = urlEndDate;
        }
      }
      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      if (!skipAllFilters) {
        if (searchParams.get("todayDueFollowUp") === "true") {
          params.todayDueFollowUp = true;
        }
        if (searchParams.get("todayCompletedFollowUp") === "true") {
          params.todayCompletedFollowUp = true;
        }
        if (searchParams.get("sevenDayPendingFollowUp") === "true") {
          params.sevenDayPendingFollowUp = true;
        }
      }

      if (salesPersonFilter !== "all") {
        params.salesExecCode = salesPersonFilter;
      }

      if (clientFilter !== "all") {
        params.clientCode = clientFilter;
      }

      if (!isAdmin && user?.userCode) {
        params.salesExecCode = user.userCode;
      }

      const isManualSort = sortBy && MANUAL_SORT_COLUMNS.includes(sortBy);

      if (isManualSort) {
        params.page = 1;
        params.size = 1000;
      } else if (sortBy && sortOrder) {
        params.sortBy = sortBy;
        params.sortOrder = sortOrder;
      }

      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      if (followupType === "new-order") {
        const res = await newOrderAPI.getAll(params);
        data = processNewOrderData(res);
        setTotalPages(res.data?.totalPages || 1);
        setTotalItems(res.data?.totalItems || 0);
      } else if (followupType === "pending-order") {
        const res = await pendingOrderAPI.getAll(params);
        data = processPendingOrderData(res);
        setTotalPages(res.data?.totalPages || 1);
        setTotalItems(res.data?.totalItems || 0);
      } else if (followupType === "pending-material") {
        const res = await pendingMaterialAPI.getAll(params);
        data = processPendingMaterialData(res);
        setTotalPages(res.data?.totalPages || 1);
        setTotalItems(res.data?.totalItems || 0);
      } else if (followupType === "cad-order") {
        const res = await cadOrderAPI.getAll(params);
        data = processCADOrderData(res);
        setTotalPages(res.data?.totalPages || 1);
        setTotalItems(res.data?.totalItems || 0);
      }
      setFollowups(data);

      if (isManualSort && sortOrder) {
        setFollowups((currentData) => {
          const sorted = [...currentData].sort((a: any, b: any) => {
            let valA = a[sortBy];
            let valB = b[sortBy];

            if (typeof valA !== "number") valA = Number(valA || 0);
            if (typeof valB !== "number") valB = Number(valB || 0);

            return sortOrder === "ASC" ? valA - valB : valB - valA;
          });
          return sorted;
        });
      }
    } catch (error: any) {
    } finally {
      setLoading(false);
    }
  };

  const getFollowupTypeTitle = () => {
    switch (followupType) {
      case "new-order":
        return "New Order Followups";
      case "pending-order":
        return "Pending Order Followups";
      case "pending-material":
        return "Pending Material Followups";
      case "cad-order":
        return "CAD Order Followups";
      default:
        return "Followups";
    }
  };

  const clearFilters = () => {
    setSalesPersonFilter("all");
    setClientFilter("all");
    setSearchTerm("");
    setDateRangeFilter("all");
    setDateRange(undefined);
    setPendingRangeFilter("all");
    setDaysFilter("all");
    setStatusFilter("all");
    setSortBy(null);
    setSortOrder(null);
    setSpSearchQuery("");
    setClientSearchQuery("");
    setSelectedItems(new Set());
    navigate(`/followups/${followupType}`, {
      replace: true,
    });
    loadFollowupData({ skipAllFilters: true });
  };

  const handleExport = () => {
    if (filteredFollowups.length === 0) {
      return;
    }

    const exportData = filteredFollowups.map((fu, index) => {
      const baseRow = {
        "S.No": index + 1,
        "Client Code": fu.userCode,
        "Client Name": fu.name,
        "Sales Executive": fu.salesExecutive || "-",
      };

      if (fu.type === "new-order") {
        return {
          ...baseRow,
          "Last Order Date": formatDisplayDate(fu.lastOrderDate),
          "No Order Since": `${fu.noOrderSince} Days`,
          "Next Follow-up": formatDisplayDate(fu.nextFollowupDate),
          Remark: fu.remark || "-",
          Status: fu.status,
        };
      } else if (fu.type === "pending-order") {
        return {
          ...baseRow,
          "Order No": fu.orderNo,
          "Order Date": formatDisplayDate(fu.orderDate),
          "Pending Since": `${fu.pendingSince} Days`,
          "Pending Pcs": fu.pendingPcs,
          "Next Follow-up": formatDisplayDate(fu.nextFollowupDate),
          Remark: fu.remark || "-",
          Status: fu.status,
        };
      } else if (fu.type === "pending-material") {
        return {
          ...baseRow,
          "Order No": fu.orderNo,
          "Order Date": formatDisplayDate(fu.orderDate),
          "Last Movement": formatDisplayDate(
            fu.pendingSinceDays
              ? new Date(
                  Date.now() - fu.pendingSinceDays * 24 * 60 * 60 * 1000,
                ).toISOString()
              : new Date().toISOString(),
          ),
          "Pending For": fu.pendingFor,
          "Pending Since": `${fu.pendingSinceDays} Days`,
          "Next Follow-up": formatDisplayDate(fu.nextFollowupDate),
          Remark: fu.remark || "-",
          Status: fu.status,
        };
      } else {
        return {
          ...baseRow,
          "Design No": fu.designNo,
        };
      }
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
      wch: Math.max(key.length, 15),
    }));
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Followups");

    const fileName = `Followups_${followupType}_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;

    XLSX.writeFile(wb, fileName);
    toast.success(`Exported successfully as ${fileName}`);
  };


  useEffect(() => {
    loadFollowupData();
  }, [
    followupType,
    sortBy,
    sortOrder,
    statusFilter,
    currentPage,
    pageSize,
    salesPersonFilter,
    clientFilter,
    pendingRangeFilter,
    daysFilter,
    debouncedSearchTerm,
    dateRange,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    salesPersonFilter,
    clientFilter,
    pendingRangeFilter,
    daysFilter,
    debouncedSearchTerm,
    dateRange,
    statusFilter,
  ]);

  const filteredFollowups = followups.filter((fu) => {
    if (followupType === "new-order" && dateRangeFilter !== "all") {
      const daysSince = (fu as NewOrderFollowup).noOrderSince;
      if (dateRangeFilter === "30" && daysSince > 30) return false;
      if (dateRangeFilter === "60" && daysSince > 60) return false;
      if (dateRangeFilter === "90" && daysSince > 90) return false;
      if (dateRangeFilter === "90+" && daysSince <= 90) return false;
    }

    if (followupType === "pending-order" && pendingRangeFilter !== "all") {
      const pendingPcs = (fu as PendingOrderFollowup).pendingPcs;
      if (pendingRangeFilter === "0-50" && (pendingPcs < 0 || pendingPcs > 50))
        return false;
      if (
        pendingRangeFilter === "51-100" &&
        (pendingPcs < 51 || pendingPcs > 100)
      )
        return false;
      if (
        pendingRangeFilter === "101-500" &&
        (pendingPcs < 101 || pendingPcs > 500)
      )
        return false;
      if (pendingRangeFilter === "500+" && pendingPcs <= 500) return false;
    }

    if (followupType === "pending-material" && daysFilter !== "all") {
      const days = (fu as PendingMaterialFollowup).pendingSinceDays;
      if (daysFilter === "0-7" && (days < 0 || days > 7)) return false;
      if (daysFilter === "8-14" && (days < 8 || days > 14)) return false;
      if (daysFilter === "15-30" && (days < 15 || days > 30)) return false;
      if (daysFilter === "30+" && days <= 30) return false;
    }

    return true;
  });

  const isManualSort = sortBy && MANUAL_SORT_COLUMNS.includes(sortBy);

  const displayTotalItems = isManualSort
    ? filteredFollowups.length
    : totalItems;
  const displayTotalPages = isManualSort
    ? Math.ceil(displayTotalItems / pageSize)
    : totalPages;

  const paginatedFollowups = isManualSort
    ? filteredFollowups.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
      )
    : filteredFollowups;

  useEffect(() => {
    const urlStartDate = searchParams.get("startDate");
    const urlEndDate = searchParams.get("endDate");
    const hasUrlParams =
      urlStartDate ||
      searchParams.get("todayDueFollowUp") ||
      searchParams.get("todayCompletedFollowUp") ||
      searchParams.get("sevenDayPendingFollowUp");

    if (hasUrlParams) {
      if (urlStartDate) {
        setDateRange({
          from: new Date(urlStartDate),
          to: urlEndDate ? new Date(urlEndDate) : new Date(urlStartDate),
        });
      }
      return;
    }

    setSalesPersonFilter("all");
    setClientFilter("all");
    setSearchTerm("");
    setDateRangeFilter("all");
    setDateRange(undefined);
    setPendingRangeFilter("all");
    setDaysFilter("all");
    setStatusFilter("all");
    setSortBy(null);
    setSortOrder(null);
    setCurrentPage(1);
    setPageSize(10);
    setSelectedItems(new Set());
    setBulkRemarkText("");
    setBulkStatusValue("completed");
    loadFollowupData({ skipAllFilters: true });
  }, [followupType, searchParams.toString()]);

  useEffect(() => {
    setHeader({
      title: getFollowupTypeTitle(),
      search: {
        placeholder: "Search followups...",
        value: searchTerm,
        onChange: (val) => setSearchTerm(val),
      },
      children: (
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowUploadDialog(true)}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Import
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                className="flex items-center gap-2"
                disabled={filteredFollowups.length === 0}
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </>
          )}
        </div>
      ),
    });
  }, [filteredFollowups.length, followupType, searchTerm]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(column);
      setSortOrder("ASC");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-4 h-4 ml-1 inline shrink-0" />;
    }
    return sortOrder === "ASC" ? (
      <ArrowUp className="w-4 h-4 ml-1 inline shrink-0" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1 inline shrink-0" />
    );
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (salesPersonFilter !== "all") count++;
    if (clientFilter !== "all") count++;
    if (searchTerm) count++;
    if (dateRangeFilter !== "all") count++;
    if (dateRange) count++;
    if (pendingRangeFilter !== "all") count++;
    if (daysFilter !== "all") count++;
    if (statusFilter !== "all") count++;
    if (sortBy) count++;
    if (selectedItems.size > 0) count++;
    return count;
  };

  const handleImport = async (file: File) => {
    setIsUploading(true);
    try {
      let response;
      if (followupType === "new-order") {
        response = await newOrderAPI.import(file);
      } else if (followupType === "pending-order") {
        response = await pendingOrderAPI.import(file);
      } else if (followupType === "pending-material") {
        response = await pendingMaterialAPI.import(file);
      } else if (followupType === "cad-order") {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        response = {
          success: true,
          message: "CAD orders imported successfully",
        };
      }
      if (response && (response.success || response.status === 200)) {
        toast.success(`${getFollowupTypeTitle()} imported successfully`);
        setShowUploadDialog(false);
        loadFollowupData();
      } else {
        toast.error(response?.message, {
          duration: Infinity,
        });
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenAddFollowUp = (record: FollowupRecord) => {
    setSelectedRecord(record);
    setShowAddFollowUpModal(true);
  };

  const handleCloseAddFollowUp = () => {
    setShowAddFollowUpModal(false);
    setSelectedRecord(null);
  };

  const handleSubmitFollowUp = () => {
    loadFollowupData();
  };

  const handleOpenDelete = (followup: FollowupRecord) => {
    setDeletingItem(followup);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      let res: any;
      if (deletingItem.type === "new-order") {
        res = await newOrderAPI.delete(deletingItem.id);
      } else if (deletingItem.type === "pending-order") {
        res = await pendingOrderAPI.delete(deletingItem.id);
      } else if (deletingItem.type === "pending-material") {
        res = await pendingMaterialAPI.delete(deletingItem.id);
      } else if (deletingItem.type === "cad-order") {
        res = await cadOrderAPI.delete(deletingItem.id);
      }

      if (res?.success === false) {
        toast.error(res?.message || "Failed to delete record");
        return;
      }

      toast.success("Record deleted successfully");
      setDeleteModalOpen(false);
      setDeletingItem(null);
      loadFollowupData();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete record");
    } finally {
      setIsDeleting(false);
    }
  };



  return (
    <div className="bg-gray-50">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3 overflow-x-auto p-1">
          {isAdmin && (
            <Combobox
              options={[
                { value: "all", label: "Select Sales Person", disabled: salesPersonFilter === "all" },
                ...salesPersons.map((sp) => ({
                  value: sp.userCode,
                  label: sp.name ? `${sp.name} (${sp.userCode})` : sp.userCode,
                })),
              ]}
              value={salesPersonFilter}
              onSelect={setSalesPersonFilter}
              onSearchChange={setSpSearchQuery}
              searchValue={spSearchQuery}
              loading={isSpLoading}
              placeholder="Sales Person"
              searchPlaceholder="Search salesperson..."
              width="w-[180px]"
              className="h-9 bg-white"
            />
          )}
          <Combobox
            options={[
              { value: "all", label: "Select Client", disabled: clientFilter === "all" },
              ...clients.map((client) => ({
                value: client.userCode,
                label: client.userCode
                  ? `${client.userCode} (${client.name})`
                  : client.userCode,
              })),
            ]}
            value={clientFilter}
            onSelect={setClientFilter}
            onSearchChange={setClientSearchQuery}
            searchValue={clientSearchQuery}
            loading={isClientLoading}
            placeholder="Client"
            searchPlaceholder="Search client..."
            width="w-[220px]"
            className="h-9 bg-white"
          />

          {(followupType === "new-order" ||
            followupType === "pending-order" ||
            followupType === "pending-material") && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 bg-white w-[140px] flex-shrink-0">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" disabled={statusFilter === "all"}>Select Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          )}

          <div className="flex-shrink-0">
            <DatePickerWithRange
              date={dateRange}
              setDate={setDateRange}
              className="h-9"
            />
          </div>

          {selectedItems.size > 0 && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setBulkRemarkModalOpen(true)}
                className="h-9"
              >
                Add Remark
              </Button>
              <Button
                size="sm"
                className="h-9"
                onClick={() => setBulkStatusModalOpen(true)}
              >
                Update Status
              </Button>
              {isAdmin && (
                <Button
                  variant="destructive"
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />({selectedItems.size})
                </Button>
              )}
            </div>
          )}

          {getActiveFilterCount() > 0 && (
            <Button
              onClick={clearFilters}
              variant="outline"
              size="sm"
              className="flex-shrink-0"
            >
              Clear All
            </Button>
          )}
        </div>

        <ImportModal
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
          title={`Import ${getFollowupTypeTitle()}`}
          description="Upload an Excel file to bulk import data"
          onImport={handleImport}
          isUploading={isUploading}
          onClose={() => setShowUploadDialog(false)}
        />

        <Card className="overflow-hidden">
          <Table containerClassName="max-h-[calc(100vh-251px)] overflow-auto">
            <TableHeader className="sticky top-0 z-20 bg-gray-50">
              <TableRow className="bg-gray-50">
                <TableHead className="w-[50px] min-w-[50px] max-w-[50px] align-center sticky left-0 z-30 bg-gray-50 border-b border-gray-200 overflow-hidden">
                  <Checkbox
                    checked={
                      paginatedFollowups.length > 0 &&
                      paginatedFollowups.every((f) => selectedItems.has(f.id))
                    }
                    onCheckedChange={() =>
                      toggleAllSelection(paginatedFollowups)
                    }
                  />
                </TableHead>
                {followupType !== "pending-order" &&
                  followupType !== "pending-material" && (
                    <>
                      <TableHead className="font-medium text-gray-700 sticky left-[50px] z-30 bg-gray-50 w-[100px] min-w-[100px] max-w-[100px] border-b border-gray-200 overflow-hidden">
                        Client Code
                      </TableHead>
                      <TableHead className="font-medium text-gray-700 w-[180px] min-w-[180px] max-w-[180px] border-b border-gray-200 overflow-hidden">
                        Client Name
                      </TableHead>
                    </>
                  )}

                {followupType === "new-order" && (
                  <>
                    <TableHead
                      className="font-medium text-gray-700 border-b border-gray-200 w-[140px] min-w-[140px] max-w-[140px] cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("lastOrderDate")}
                    >
                      <div className="flex items-center">
                        Last Order Date
                        {getSortIcon("lastOrderDate")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-medium text-gray-700 border-b border-gray-200 w-[140px] min-w-[140px] max-w-[140px] cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("noOrderSince")}
                    >
                      <div className="flex items-center">
                        No Order Since
                        {getSortIcon("noOrderSince")}
                      </div>
                    </TableHead>
                  </>
                )}
                {followupType !== "pending-order" &&
                  followupType !== "pending-material" && (
                    <TableHead className="font-medium text-gray-700 border-b border-gray-200 w-[150px] min-w-[150px] max-w-[150px]">
                      Sales Executive
                    </TableHead>
                  )}
                {followupType === "new-order" && (
                  <>
                    <TableHead
                      className="font-medium text-gray-700 border-b border-gray-200 w-[130px] min-w-[130px] max-w-[130px] cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("lastFollowUpDate")}
                    >
                      <div className="flex items-center">
                        Last Followup
                        {getSortIcon("lastFollowUpDate")}
                      </div>
                    </TableHead>
                    <TableHead className="font-medium text-gray-700 border-b border-gray-200 w-[120px] min-w-[120px] max-w-[120px] whitespace-nowrap">
                      Taken By
                    </TableHead>
                    <TableHead
                      className="font-medium text-gray-700 border-b border-gray-200 w-[140px] min-w-[140px] max-w-[140px] cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("nextFollowUpDate")}
                    >
                      <div className="flex items-center">
                        Next Followup
                        {getSortIcon("nextFollowUpDate")}
                      </div>
                    </TableHead>
                    <TableHead className="font-medium text-gray-700 border-b border-gray-200 w-[100px] min-w-[100px] max-w-[100px]">
                      Remark
                    </TableHead>
                  </>
                )}
                {followupType === "new-order" && (
                  <>
                    <TableHead className="font-medium text-gray-700 sticky right-[100px] z-30 bg-gray-50 w-[100px] min-w-[100px] max-w-[100px] border-b border-gray-200 overflow-hidden">
                      Status
                    </TableHead>
                    <TableHead className="font-medium text-gray-700 sticky right-0 z-30 bg-gray-50 w-[100px] min-w-[100px] max-w-[100px] border-b border-gray-200 overflow-hidden">
                      Actions
                    </TableHead>
                  </>
                )}
                {followupType === "pending-order" && (
                  <>
                    <TableHead className="font-medium text-gray-700 sticky left-[50px] z-30 bg-gray-50 w-[100px] min-w-[100px] max-w-[100px] border-b border-gray-200 overflow-hidden">
                      Client Code
                    </TableHead>
                    <TableHead className="font-medium text-gray-700 w-[180px] min-w-[180px] max-w-[180px] border-b border-gray-200 overflow-hidden">
                      Client Name
                    </TableHead>
                    <TableHead className="font-medium text-gray-700 w-[120px] min-w-[120px] max-w-[120px] border-b border-gray-200 overflow-hidden">
                      Order No
                    </TableHead>
                    <TableHead className="font-medium text-gray-700 border-b border-gray-200 w-[150px] min-w-[150px] max-w-[150px]">
                      Sales Executive
                    </TableHead>
                    <TableHead
                      className="font-medium text-gray-700 border-b border-gray-200 w-[120px] min-w-[120px] max-w-[120px] cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("orderDate")}
                    >
                      <div className="flex items-center">
                        Order Date
                        {getSortIcon("orderDate")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-medium text-gray-700 border-b border-gray-200 w-[130px] min-w-[130px] max-w-[130px] cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("pendingSince")}
                    >
                      <div className="flex items-center">
                        Pending Since
                        {getSortIcon("pendingSince")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-medium text-gray-700 border-b border-gray-200 w-[120px] min-w-[120px] max-w-[120px] cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("pendingPcs")}
                    >
                      <div className="flex items-center">
                        Pending Pcs
                        {getSortIcon("pendingPcs")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-medium text-gray-700 border-b border-gray-200 w-[130px] min-w-[130px] max-w-[130px] cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                      onClick={() => handleSort("lastFollowUpDate")}
                    >
                      <div className="flex items-center">
                        Last Followup
                        {getSortIcon("lastFollowUpDate")}
                      </div>
                    </TableHead>
                    <TableHead className="font-medium text-gray-700 border-b border-gray-200 w-[120px] min-w-[120px] max-w-[120px] whitespace-nowrap">
                      Taken By
                    </TableHead>
                    <TableHead
                      className="font-medium text-gray-700 border-b border-gray-200 w-[130px] min-w-[130px] max-w-[130px] cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("nextFollowUpDate")}
                    >
                      <div className="flex items-center">
                        Next Followup
                        {getSortIcon("nextFollowUpDate")}
                      </div>
                    </TableHead>
                    <TableHead className="font-medium text-gray-700 border-b border-gray-200 w-[100px] min-w-[100px] max-w-[100px]">
                      Remark
                    </TableHead>
                    <TableHead className="font-medium text-gray-700 sticky right-[100px] z-30 bg-gray-50 w-[100px] min-w-[100px] max-w-[100px] border-b border-gray-200 overflow-hidden">
                      Status
                    </TableHead>
                    <TableHead className="font-medium text-gray-700 sticky right-0 z-30 bg-gray-50 w-[100px] min-w-[100px] max-w-[100px] border-b border-gray-200 overflow-hidden">
                      Actions
                    </TableHead>
                  </>
                )}
                {followupType === "pending-material" && (
                  <>
                    <TableHead className="font-medium text-gray-700 sticky left-[50px] z-30 bg-gray-50 w-[100px] min-w-[100px] max-w-[100px] border-b border-gray-200 overflow-hidden">
                      Client Code
                    </TableHead>
                    <TableHead className="font-medium text-gray-700 w-[180px] min-w-[180px] max-w-[180px] border-b border-gray-200 overflow-hidden">
                      Client Name
                    </TableHead>
                    <TableHead className="font-medium text-gray-700 w-[120px] min-w-[120px] max-w-[120px] border-b border-gray-200 overflow-hidden">
                      Order No
                    </TableHead>
                    <TableHead className="font-medium text-gray-700 border-b border-gray-200 w-[150px] min-w-[150px] max-w-[150px]">
                      Sales Executive
                    </TableHead>
                    <TableHead
                      className="font-medium text-gray-700 border-b border-gray-200 w-[120px] min-w-[120px] max-w-[120px] cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("orderDate")}
                    >
                      <div className="flex items-center">
                        Order Date
                        {getSortIcon("orderDate")}
                      </div>
                    </TableHead>
                    <TableHead className="font-medium text-gray-700 border-b border-gray-200 w-[130px] min-w-[130px] max-w-[130px]">
                      Pending Dept
                    </TableHead>
                    <TableHead
                      className="font-medium text-gray-700 border-b border-gray-200 w-[130px] min-w-[130px] max-w-[130px] cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("pendingSinceDays")}
                    >
                      <div className="flex items-center">
                        Pending Since
                        {getSortIcon("pendingSinceDays")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-medium text-gray-700 border-b border-gray-200 w-[130px] min-w-[130px] max-w-[130px] cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("lastFollowUpDate")}
                    >
                      <div className="flex items-center">
                        Last Followup
                        {getSortIcon("lastFollowUpDate")}
                      </div>
                    </TableHead>
                    <TableHead className="font-medium text-gray-700 border-b border-gray-200 w-[120px] min-w-[120px] max-w-[120px] whitespace-nowrap">
                      Taken By
                    </TableHead>
                    <TableHead
                      className="font-medium text-gray-700 border-b border-gray-200 w-[130px] min-w-[130px] max-w-[130px] cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("nextFollowupDate")}
                    >
                      <div className="flex items-center">
                        Next Followup
                        {getSortIcon("nextFollowupDate")}
                      </div>
                    </TableHead>
                    <TableHead className="font-medium text-gray-700 border-b border-gray-200 w-[100px] min-w-[100px] max-w-[100px]">
                      Remark
                    </TableHead>
                    <TableHead className="font-medium text-gray-700 sticky right-[100px] z-30 bg-gray-50 w-[100px] min-w-[100px] max-w-[100px] border-b border-gray-200 overflow-hidden">
                      Status
                    </TableHead>
                    <TableHead className="font-medium text-gray-700 sticky right-0 z-30 bg-gray-50 w-[100px] min-w-[100px] max-w-[100px] border-b border-gray-200 overflow-hidden">
                      Actions
                    </TableHead>
                  </>
                )}
                {followupType === "cad-order" && (
                  <>
                    <TableHead className="font-medium text-gray-700 border-b border-gray-200 w-[130px] min-w-[130px] max-w-[130px]">
                      Design No
                    </TableHead>
                    <TableHead className="font-medium text-gray-700 border-b border-gray-200 w-[120px] min-w-[120px] max-w-[120px]">
                      Actions
                    </TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={
                      (followupType === "new-order"
                        ? 11
                        : followupType === "pending-order" ||
                            followupType === "pending-material"
                          ? 13
                          : 4) + 1
                    }
                    className="text-center py-12"
                  >
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  </TableCell>
                </TableRow>
              ) : paginatedFollowups.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={
                      (followupType === "new-order"
                        ? 11
                        : followupType === "pending-order" ||
                            followupType === "pending-material"
                          ? 13
                          : 4) + 1
                    }
                    className="text-center py-8 text-muted-foreground"
                  >
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedFollowups.map((fu) => (
                  <TableRow key={fu.id} className="hover:bg-gray-50 group">
                    <TableCell className="align-center sticky left-0 z-10 bg-white group-hover:bg-gray-50 w-[50px] min-w-[50px] max-w-[50px] border-b border-gray-200 overflow-hidden">
                      <Checkbox
                        checked={selectedItems.has(fu.id)}
                        onCheckedChange={() => toggleSelection(fu.id)}
                      />
                    </TableCell>
                    {followupType !== "pending-order" &&
                      followupType !== "pending-material" && (
                        <>
                          <TableCell className="font-medium text-gray-900 align-center sticky left-[50px] z-10 bg-white group-hover:bg-gray-50 w-[100px] min-w-[100px] max-w-[100px] border-b border-gray-200 overflow-hidden">
                            <div className="truncate max-w-[80px]" title={fu.userCode}>
                              {fu.userCode}
                            </div>
                          </TableCell>
                          <TableCell className="align-center w-[180px] min-w-[180px] max-w-[180px] border-b border-gray-200 overflow-hidden">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                                {fu.name?.charAt(0) ||
                                  fu.userCode?.charAt(0) ||
                                  "C"}
                              </div>
                              <div
                                className="font-medium text-gray-900 max-w-[124px] truncate"
                                title={fu.name || "N/A"}
                              >
                                {fu.name || "N/A"}
                              </div>
                            </div>
                          </TableCell>
                        </>
                      )}

                    {fu.type === "new-order" && (
                      <>
                        <TableCell className="align-center border-b border-gray-200 w-[140px] min-w-[140px] max-w-[140px]">
                          <div className="text-sm text-gray-900 truncate">
                            {formatDisplayDate(fu.lastOrderDate)}
                          </div>
                        </TableCell>
                        <TableCell className="align-center border-b border-gray-200 w-[140px] min-w-[140px] max-w-[140px]">
                          <div className="text-sm text-gray-900 truncate">
                            {fu.noOrderSince} Days
                          </div>
                        </TableCell>
                      </>
                    )}

                    {followupType !== "pending-order" &&
                      followupType !== "pending-material" && (
                        <TableCell className="align-center border-b border-gray-200 w-[150px] min-w-[150px] max-w-[150px]">
                          {fu.salesExecutive ? (
                            <div className="text-sm text-gray-900 truncate" title={fu.salesExecutive}>
                              {fu.salesExecutive}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      )}

                    {fu.type === "new-order" && (
                      <>
                        <TableCell className="align-center border-b border-gray-200 w-[130px] min-w-[130px] max-w-[130px]">
                          <div className="text-sm text-gray-900 truncate">
                            {formatDisplayDate(fu.lastFollowUpDate)}
                          </div>
                        </TableCell>
                        <TableCell className="align-center border-b border-gray-200 w-[120px] min-w-[120px] max-w-[120px]">
                          <div
                            className="text-sm text-gray-900 truncate"
                            title={getTakenByName(fu.lastFollowUpBy)}
                          >
                            {getTakenByName(fu.lastFollowUpBy)}
                          </div>
                        </TableCell>

                        <TableCell className="align-center border-b border-gray-200 w-[130px] min-w-[130px] max-w-[130px]">
                          <div className="text-sm text-gray-900 truncate">
                            {formatDisplayDate(fu.nextFollowupDate)}
                          </div>
                        </TableCell>
                        <TableCell className="align-center border-b border-gray-200 w-[100px] min-w-[100px] max-w-[100px]">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary"
                              onClick={() => {
                                setSelectedRemarkItem(fu);
                                setRemarkHistoryOpen(true);
                              }}
                            >
                              View
                            </Button>
                       
                        </TableCell>
                      </>
                    )}

                    {fu.type === "new-order" && (
                      <>
                        <TableCell className="align-center sticky right-[100px] z-10 bg-white group-hover:bg-gray-50 w-[100px] min-w-[100px] max-w-[100px] border-b border-gray-200 overflow-hidden">
                          <Badge
                            variant="outline"
                            className={
                              fu.status === "completed"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-yellow-50 text-yellow-700 border-yellow-200"
                            }
                          >
                            {fu.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="align-center sticky right-0 z-10 bg-white group-hover:bg-gray-50 w-[100px] min-w-[100px] max-w-[100px] border-b border-gray-200 overflow-hidden">
                          <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 border border-border hover:bg-primary/10 text-gray-900 hover:text-primary transition-colors"
                                  title="Add Follow-up"
                                  onClick={() => handleOpenAddFollowUp(fu)}
                                  disabled={selectedItems.size > 0}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                                {isAdmin && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 hover:bg-red-50 text-gray-900 hover:text-red-600 transition-colors"
                                    title="Delete"
                                    onClick={() => handleOpenDelete(fu)}
                                    disabled={selectedItems.size > 0}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                          </div>
                        </TableCell>
                      </>
                    )}
                    {fu.type === "pending-order" && (
                      <>
                        <TableCell className="font-medium text-gray-900 align-center sticky left-[50px] z-10 bg-white group-hover:bg-gray-50 w-[100px] min-w-[100px] max-w-[100px] border-b border-gray-200 overflow-hidden">
                          <div className="truncate max-w-[80px]" title={fu.userCode}>
                            {fu.userCode}
                          </div>
                        </TableCell>
                        <TableCell className="align-center w-[180px] min-w-[180px] max-w-[180px] border-b border-gray-200 overflow-hidden">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                              {fu.name?.charAt(0) ||
                                fu.userCode?.charAt(0) ||
                                "C"}
                            </div>
                            <div
                              className="font-medium text-gray-900 max-w-[124px] truncate"
                              title={fu.name || "N/A"}
                            >
                              {fu.name || "N/A"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="align-center w-[120px] min-w-[120px] max-w-[120px] border-b border-gray-200 overflow-hidden">
                          <div
                            className="text-sm font-medium text-gray-900 truncate"
                            title={fu.orderNo}
                          >
                            {fu.orderNo}
                          </div>
                        </TableCell>
                        <TableCell className="align-center border-b border-gray-200 w-[150px] min-w-[150px] max-w-[150px]">
                          {fu.salesExecutive ? (
                            <div className="text-sm text-gray-900 truncate" title={fu.salesExecutive}>
                              {fu.salesExecutive}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="align-center border-b border-gray-200 w-[120px] min-w-[120px] max-w-[120px]">
                          <div className="text-sm text-gray-900 truncate">
                            {formatDisplayDate(fu.orderDate)}
                          </div>
                        </TableCell>
                        <TableCell className="align-center border-b border-gray-200 w-[120px] min-w-[120px] max-w-[120px]">
                          <div className="text-sm text-gray-900 truncate">
                            {fu.pendingSince} Days
                          </div>
                        </TableCell>
                        <TableCell className="align-center border-b border-gray-200 w-[100px] min-w-[100px] max-w-[100px]">
                          <div className="text-sm text-gray-900 truncate">
                            {fu.pendingPcs}
                          </div>
                        </TableCell>
                        <TableCell className="align-center border-b border-gray-200 w-[130px] min-w-[130px] max-w-[130px]">
                          <div className="text-sm text-gray-900 truncate">
                            {formatDisplayDate(fu.lastFollowUpDate)}
                          </div>
                        </TableCell>
                        <TableCell className="align-center border-b border-gray-200 w-[120px] min-w-[120px] max-w-[120px]">
                          <div
                            className="text-sm text-gray-900 truncate"
                            title={getTakenByName(fu.lastFollowUpBy)}
                          >
                            {getTakenByName(fu.lastFollowUpBy)}
                          </div>
                        </TableCell>

                        <TableCell className="align-center border-b border-gray-200 w-[130px] min-w-[130px] max-w-[130px]">
                          <div className="text-sm text-gray-900 truncate">
                            {formatDisplayDate(fu.nextFollowupDate)}
                          </div>
                        </TableCell>
                        <TableCell className="align-center border-b border-gray-200 w-[100px] min-w-[100px] max-w-[100px]">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary"
                              onClick={() => {
                                setSelectedRemarkItem(fu);
                                setRemarkHistoryOpen(true);
                              }}
                            >
                              View
                            </Button>
                         
                        </TableCell>
                        <TableCell className="align-center sticky right-[100px] z-10 bg-white group-hover:bg-gray-50 w-[100px] min-w-[100px] max-w-[100px] border-b border-gray-200 overflow-hidden">
                          <Badge
                            variant="outline"
                            className={
                              fu.status === "completed"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-yellow-50 text-yellow-700 border-yellow-200"
                            }
                          >
                            {fu.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="align-center sticky right-0 z-10 bg-white group-hover:bg-gray-50 w-[100px] min-w-[100px] max-w-[100px] border-b border-gray-200 overflow-hidden">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 border border-border hover:bg-primary/10 text-gray-900 hover:text-primary transition-colors disabled:cursor-not-allowed disabled:pointer-events-auto disabled:opacity-50"
                              title="Add Follow-up"
                              onClick={() => handleOpenAddFollowUp(fu)}
                              disabled={selectedItems.size > 0}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:bg-red-50 text-gray-900 hover:text-red-600 transition-colors disabled:cursor-not-allowed disabled:pointer-events-auto disabled:opacity-50"
                                title="Delete"
                                onClick={() => handleOpenDelete(fu)}
                                disabled={selectedItems.size > 0}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </>
                    )}
                    {fu.type === "pending-material" && (
                      <>
                        <TableCell className="font-medium text-gray-900 align-center sticky left-[50px] z-10 bg-white group-hover:bg-gray-50 w-[100px] min-w-[100px] max-w-[100px] border-b border-gray-200 overflow-hidden">
                          <div className="truncate max-w-[80px]" title={fu.userCode}>
                            {fu.userCode}
                          </div>
                        </TableCell>
                        <TableCell className="align-center w-[180px] min-w-[180px] max-w-[180px] border-b border-gray-200 overflow-hidden">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                              {fu.name?.charAt(0) ||
                                fu.userCode?.charAt(0) ||
                                "C"}
                            </div>
                            <div
                              className="font-medium text-gray-900 max-w-[124px] truncate"
                              title={fu.name || "N/A"}
                            >
                              {fu.name || "N/A"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="align-center w-[120px] min-w-[120px] max-w-[120px] border-b border-gray-200 overflow-hidden">
                          <div
                            className="text-sm text-gray-900 truncate"
                            title={fu.orderNo}
                          >
                            {fu.orderNo}
                          </div>
                        </TableCell>
                        <TableCell className="align-center border-b border-gray-200 w-[150px] min-w-[150px] max-w-[150px]">
                          {fu.salesExecutive ? (
                            <div className="text-sm text-gray-900 truncate" title={fu.salesExecutive}>
                              {fu.salesExecutive}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="align-center border-b border-gray-200 w-[120px] min-w-[120px] max-w-[120px]">
                          <div className="text-sm text-gray-900 truncate">
                            {formatDisplayDate(fu.orderDate)}
                          </div>
                        </TableCell>

                        <TableCell className="align-center border-b border-gray-200 w-[130px] min-w-[130px] max-w-[130px]">
                          <div
                            className="text-sm text-gray-900 truncate"
                            title={fu.departmentName}
                          >
                            {fu.departmentName}
                          </div>
                        </TableCell>

                        <TableCell className="align-center border-b border-gray-200 w-[120px] min-w-[120px] max-w-[120px]">
                          <div className="text-sm text-gray-900 truncate">
                            {fu.pendingSinceDays}
                          </div>
                        </TableCell>

                        <TableCell className="align-center border-b border-gray-200 w-[130px] min-w-[130px] max-w-[130px]">
                          <div className="text-sm text-gray-900 truncate">
                            {formatDisplayDate(fu.lastFollowUpDate)}
                          </div>
                        </TableCell>
                        <TableCell className="align-center border-b border-gray-200 w-[120px] min-w-[120px] max-w-[120px]">
                          <div
                            className="text-sm text-gray-900 truncate"
                            title={getTakenByName(fu.lastFollowUpBy)}
                          >
                            {getTakenByName(fu.lastFollowUpBy)}
                          </div>
                        </TableCell>

                        <TableCell className="align-center border-b border-gray-200 w-[130px] min-w-[130px] max-w-[130px]">
                          <div className="text-sm text-gray-900 truncate">
                            {formatDisplayDate(fu.nextFollowupDate)}
                          </div>
                        </TableCell>
                        <TableCell className="align-center border-b border-gray-200 w-[100px] min-w-[100px] max-w-[100px]">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary"
                              onClick={() => {
                                setSelectedRemarkItem(fu);
                                setRemarkHistoryOpen(true);
                              }}
                            >
                              View
                            </Button>
                        
                        </TableCell>
                        <TableCell className="align-center sticky right-[100px] z-10 bg-white group-hover:bg-gray-50 w-[100px] min-w-[100px] max-w-[100px] border-b border-gray-200 overflow-hidden">
                          <Badge
                            variant="outline"
                            className={
                              fu.status === "completed"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-yellow-50 text-yellow-700 border-yellow-200"
                            }
                          >
                            {fu.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="align-center sticky right-0 z-10 bg-white group-hover:bg-gray-50 w-[100px] min-w-[100px] max-w-[100px] border-b border-gray-200 overflow-hidden">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 hover:bg-primary/10 text-gray-900 hover:text-primary transition-colors disabled:cursor-not-allowed disabled:pointer-events-auto disabled:opacity-50"
                              title="Add Follow-up"
                              onClick={() => handleOpenAddFollowUp(fu)}
                              disabled={selectedItems.size > 0}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:bg-red-50 text-gray-900 hover:text-red-600 transition-colors disabled:cursor-not-allowed disabled:pointer-events-auto disabled:opacity-50"
                                title="Delete"
                                onClick={() => handleOpenDelete(fu)}
                                disabled={selectedItems.size > 0}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </>
                    )}
                    {fu.type === "cad-order" && (
                      <>
                        <TableCell className="align-center border-b border-gray-200 w-[130px] min-w-[130px] max-w-[130px]">
                          <div className="text-sm text-gray-900 truncate" title={fu.designNo}>
                            {fu.designNo}
                          </div>
                        </TableCell>
                        <TableCell className="align-center border-b border-gray-200 w-[120px] min-w-[120px] max-w-[120px]">
                          <div className="flex items-center">
                             <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 border border-border hover:bg-primary/10 text-gray-900 hover:text-primary transition-colors disabled:cursor-not-allowed disabled:pointer-events-auto disabled:opacity-50"
                              title="Add Follow-up"
                              onClick={() => handleOpenAddFollowUp(fu)}
                              disabled={selectedItems.size > 0}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:bg-red-50 text-gray-900 hover:text-red-600 transition-colors disabled:cursor-not-allowed disabled:pointer-events-auto disabled:opacity-50"
                                title="Delete"
                                onClick={() => handleOpenDelete(fu)}
                                disabled={selectedItems.size > 0}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="p-4 border-t bg-white flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Total:{" "}
              <span className="font-semibold text-gray-900">
                {loading ? "..." : displayTotalItems}
              </span>
            </div>
            <TablePagination
              currentPage={currentPage}
              totalPages={displayTotalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              setPageSize={setPageSize}
            />
          </div>
        </Card>

        {selectedRecord && selectedRecord.type !== "cad-order" && (
          <AddFollowUpModal
            isOpen={showAddFollowUpModal}
            onClose={handleCloseAddFollowUp}
            recordType={selectedRecord.type}
            recordId={selectedRecord.id}
            clientName={selectedRecord.name}
            onSuccess={handleSubmitFollowUp}
          />
        )}

        <DeleteModal
          isOpen={deleteModalOpen || showBulkDeleteConfirm}
          onClose={() => {
            if (isDeleting || isBulkProcessing) return;
            if (deleteModalOpen) {
              setDeleteModalOpen(false);
              setDeletingItem(null);
            } else {
              setShowBulkDeleteConfirm(false);
            }
          }}
          onConfirm={deleteModalOpen ? handleConfirmDelete : handleBulkDelete}
          title={
            deleteModalOpen
              ? "Delete Record?"
              : `Delete ${selectedItems.size} Records?`
          }
          description={
            deleteModalOpen
              ? "This action cannot be undone."
              : "Are you sure you want to delete the selected records? This action cannot be undone."
          }
          itemName={
            deleteModalOpen && deletingItem
              ? `${deletingItem.name || deletingItem.userCode} (${deletingItem.userCode})`
              : undefined
          }
          isLoading={isDeleting || isBulkProcessing}
        />
      </div>
      <Dialog open={bulkRemarkModalOpen} onOpenChange={setBulkRemarkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Remark to Selected Items</DialogTitle>
            <DialogDescription>
              This will update the remark for {selectedItems.size} selected
              items.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-remark">Remark</Label>
              <Textarea
                id="bulk-remark"
                placeholder="Enter remark..."
                value={bulkRemarkText}
                onChange={(e) => setBulkRemarkText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkRemarkModalOpen(false)}
              disabled={isBulkProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkRemark}
              disabled={isBulkProcessing || !bulkRemarkText.trim()}
            >
              {isBulkProcessing && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Remarks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={bulkStatusModalOpen} onOpenChange={setBulkStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status for Selected Items</DialogTitle>
            <DialogDescription>
              This will update the status for {selectedItems.size} selected
              items at a time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-status">Status</Label>
              <Select
                value={bulkStatusValue}
                onValueChange={(val) =>
                  setBulkStatusValue(val as "pending" | "completed")
                }
              >
                <SelectTrigger id="bulk-status" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkStatusModalOpen(false)}
              disabled={isBulkProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkStatusUpdate}
              disabled={isBulkProcessing || selectedItems.size === 0}
            >
              {isBulkProcessing && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {selectedRemarkItem && (
        <RemarkHistoryModal
          isOpen={remarkHistoryOpen}
          onClose={() => {
            setRemarkHistoryOpen(false);
            setSelectedRemarkItem(null);
          }}
          followUpTypeId={selectedRemarkItem.id}
          clientCode={selectedRemarkItem.userCode || ""}
          clientName={selectedRemarkItem.name || ""}
          salesExecCode={
            selectedRemarkItem.type === "pending-order" ||
            selectedRemarkItem.type === "pending-material" ||
            selectedRemarkItem.type === "new-order"
              ? selectedRemarkItem.originalData?.salesExecCode ||
                selectedRemarkItem.originalData?.salesExecutive ||
                ""
              : ""
          }
          salesExecName={selectedRemarkItem.salesExecutive}
        />
      )}
    </div>
  );
}
