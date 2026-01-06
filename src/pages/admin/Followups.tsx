import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { format } from "date-fns";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { FollowUpModal } from "@/components/modals/FollowUpModal";
import {
  Download,
  Loader2,
  Upload,
  FileText,
  Eye,
  Pencil,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  newOrderAPI,
  pendingOrderAPI,
  pendingMaterialAPI,
  salesPersonAPI,
  clientAPI,
} from "@/services/api";
import { usePageHeader } from "@/contexts/PageHeaderProvider";
import * as XLSX from "xlsx";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";

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
  // New fields
  orderDate: string;
  pendingSince: number;
  nextFollowupDate?: string;
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
  // New fields from JSON
  styleNo: string;
  orderNo: string;
  orderDate: string;
  expectedDeliveryDate: string;
  departmentName: string;
  totalNetWt: string;
  lastFollowUpDate: string | null;
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
  type: "cad-order";
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
  const { setHeader } = usePageHeader();
  const followupType = (type as FollowupType) || "new-order";
  const [salesPersonFilter, setSalesPersonFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
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
  
  // New Order specific states
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC" | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // Dialog states
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Modals state
  // Modals state
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingType, setEditingType] = useState<FollowupType>("new-order");

  const MANUAL_SORT_COLUMNS = ["noOrderSince", "pendingSince", "pendingSinceDays"];

  const validTypes: FollowupType[] = [
    "new-order",
    "pending-order",
    "pending-material",
    "cad-order",
  ];
  if (!validTypes.includes(followupType)) {
    return <Navigate to="/admin/followups/new-order" replace />;
  }

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [spRes, clientRes] = await Promise.all([
          salesPersonAPI.getAll({
            page: 1,
            size: 1000,
            role: "sales_executive",
          }),
          clientAPI.getAll({ page: 1, size: 1000, role: "client" }),
        ]);

        if (spRes.success && spRes.data?.data) {
          setSalesPersons(spRes.data.data);
        }

        if (clientRes.success !== false) {
          setClients(clientRes.data?.data || clientRes.data || []);
        }
      } catch (error) {
        console.error("Error loading filters:", error);
      }
    };
    loadFilters();
  }, []);

  const processNewOrderData = (res: any): NewOrderFollowup[] => {
    let dataArray = [];
    if (Array.isArray(res)) dataArray = res;
    else if (res.data?.data) dataArray = res.data.data;
    else if (res.data) dataArray = res.data;

    return dataArray.map((item: any) => {
      const lastOrderDate = item.lastOrderDate || item.lastSaleDate || new Date().toISOString();
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
        salesExecutive: item.salesExecData?.userCode || item.salesExecCode || "",
        status: (item.status || "pending").toLowerCase(),
        nextFollowupDate: item.nextFollowUpDate || item.nextFollowupDate || null,
        remark: item.remark || "",
        type: "new-order" as const,
        originalData: item
      };
    });
  };

  const processPendingOrderData = (res: any): PendingOrderFollowup[] => {
    let dataArray = [];
    if (Array.isArray(res)) dataArray = res;
    else if (res.data?.data) dataArray = res.data.data;
    else if (res.data) dataArray = res.data;

    return dataArray.map((item: any) => {
      // Calculate pending since days based on order date
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
        pendingPcs: item.pendingPcs ?? ((item.totalOrderPcs || 0) - (item.deliveredPcs || 0)),
        salesExecutive: item.salesExecData?.userCode || item.salesExecCode || "",
        type: "pending-order" as const,
        
        // New mappings
        orderDate: orderDate,
        pendingSince: daysDiff,
        nextFollowupDate: item.nextFollowUpDate || item.nextFollowupDate || null,
        remark: item.remark || "",
        status: (item.status || "pending").toLowerCase(),
        
        originalData: item
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
        (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        id: item.uuid || item._id || item.id || Math.random().toString(),
        userCode: item.clientCode || item.clientData?.userCode || item.userCode,
        name: item.clientData?.name || item.name || item.userCode,
        pendingFor: item.departmentName || "",
        pendingSinceDays: daysDiff,
        salesExecutive: item.salesExecData?.userCode || item.salesExecCode || "",
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
        nextFollowupDate: item.nextFollowUpDate || item.nextFollowupDate || null,
        originalData: item
      };
    });
  };

  const loadFollowupData = async () => {
    try {
      setLoading(true);
      let data: any[] = [];

      const params: any = {
        page: currentPage,
        size: pageSize,
      };

      if (dateRange?.from) {
        params.startDate = format(dateRange.from, "yyyy-MM-dd");
        if (dateRange.to) {
          params.endDate = format(dateRange.to, "yyyy-MM-dd");
        } else {
          params.endDate = format(dateRange.from, "yyyy-MM-dd");
        }
      }

      if (salesPersonFilter !== "all") {
        params.salesExecCode = salesPersonFilter;
      }

      const isManualSort = sortBy && MANUAL_SORT_COLUMNS.includes(sortBy);

      if (isManualSort) {
        params.page = 1;
        params.size = 10000;
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
        // For client-side pagination types, we don't set total pages/items from API pagination
      } else if (followupType === "cad-order") {
        data = [];
        setTotalPages(1);
        setTotalItems(0);
      }

      setFollowups(data);

      setFollowups(data);

      // Perform manual sorting if needed
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

  useEffect(() => {
    loadFollowupData();
  }, [followupType, sortBy, sortOrder, statusFilter, currentPage, pageSize]);



  const filteredFollowups = followups.filter((fu) => {
    if (
      salesPersonFilter !== "all" &&
      fu.salesExecutive !== salesPersonFilter
    ) {
      return false;
    }

    if (clientFilter !== "all" && fu.userCode !== clientFilter) {
      return false;
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        fu.userCode.toLowerCase().includes(searchLower) ||
        fu.name.toLowerCase().includes(searchLower) ||
        fu.salesExecutive.toLowerCase().includes(searchLower);

      if (fu.type === "pending-order") {
        return matchesSearch || fu.orderNo.toLowerCase().includes(searchLower);
      }
      if (!matchesSearch) return false;
    }

    if (dateRange?.from) {
      let dateToCheck: Date | null = null;

      if (followupType === "new-order") {
        dateToCheck = new Date((fu as NewOrderFollowup).lastOrderDate);
      } else if (followupType === "pending-order") {
        dateToCheck = new Date((fu as PendingOrderFollowup).orderDate);
      } else if (followupType === "pending-material") {
        dateToCheck = (fu as PendingMaterialFollowup).expectedDeliveryDate ? new Date((fu as PendingMaterialFollowup).expectedDeliveryDate) : null;
      }
      
      if (dateToCheck) {
        const fromDate = dateRange.from;
        const toDate = dateRange.to || dateRange.from;
        
        // Reset time for comparison
        dateToCheck.setHours(0, 0, 0, 0);
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);

        if (dateToCheck < from || dateToCheck > to) {
          return false;
        }
      }
    }

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
  
  const displayTotalItems = isManualSort ? filteredFollowups.length : totalItems;
  const displayTotalPages = isManualSort ? Math.ceil(displayTotalItems / pageSize) : totalPages;

  const paginatedFollowups = isManualSort 
    ? filteredFollowups.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filteredFollowups;


  useEffect(() => {
    // Clear all filters when switching tabs
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
  }, [
    followupType
  ]);

  useEffect(() => {
    // Refetch data when filters change (preserved relevant dependencies)
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
    searchTerm,
    dateRangeFilter,
    pendingRangeFilter,
    daysFilter,
    dateRange
  ]);

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
        </div>
      ),
    });
  }, [filteredFollowups.length, followupType, searchTerm]);

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
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      // New column, default to ASC
      setSortBy(column);
      setSortOrder("ASC");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-4 h-4 ml-1 inline" />;
    }
    return sortOrder === "ASC" ? (
      <ArrowUp className="w-4 h-4 ml-1 inline" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1 inline" />
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
    return count;
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
          "Last Order Date": new Date(fu.lastOrderDate).toLocaleDateString(),
          "No Order Since": `${fu.noOrderSince} Days`,
          "Status": fu.status,
        };
      } else if (fu.type === "pending-order") {
        return {
          ...baseRow,
          "Order No": fu.orderNo,
          "Total Order Pcs": fu.totalOrderPcs,
          "Pending Pcs": fu.pendingPcs,
        };
      } else if (fu.type === "pending-material") {
        return {
          ...baseRow,
          "Pending For": fu.pendingFor,
          "Pending Since": fu.pendingSinceDays,
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

  const handleImport = async () => {
    if (!uploadFile) return;

    setIsUploading(true);
    try {
      let response;
      if (followupType === "new-order") {
        response = await newOrderAPI.import(uploadFile);
      } else if (followupType === "pending-order") {
        response = await pendingOrderAPI.import(uploadFile);
      } else if (followupType === "pending-material") {
        response = await pendingMaterialAPI.import(uploadFile);
      } else if (followupType === "cad-order") {
        // Mock success for cad-order as requested
        await new Promise((resolve) => setTimeout(resolve, 1000));
        response = {
          success: true,
          message: "CAD orders imported successfully",
        };
      }

      // Check for success property or if it's a direct array/object without explicit success flag (depending on API)
      // Assuming standard API response structure as seen in other files { success: boolean, ... }
      if (response && (response.success || response.status === 200)) {
        toast.success(`${getFollowupTypeTitle()} imported successfully`);
        setShowUploadDialog(false);
        setUploadFile(null);
        loadFollowupData();
      } else {
        toast.error(
          "Import failed: " + (response?.message || "Unknown error occurred")
        );
      }
    } catch (error: any) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };


  const handleEditClick = (followup: FollowupRecord) => {
    setEditingItem(followup.type !== 'cad-order' ? (followup as any).originalData : null);

    if (followup.type !== 'cad-order') {
      setEditingType(followup.type);
      setShowFollowUpModal(true);
    }
  };

  const handleModalSuccess = () => {
    loadFollowupData();
    setShowFollowUpModal(false);
    setEditingItem(null);
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

  return (
    <div className="bg-gray-50 pb-6">
      <div className="p-6 space-y-6">
        {/* Inline Filter Bar */}
        <div className="flex items-center gap-3 overflow-x-auto p-1">
          {/* Sales Person Filter */}
          <Select value={salesPersonFilter} onValueChange={setSalesPersonFilter}>
            <SelectTrigger className="h-9 bg-white w-[180px] flex-shrink-0">
              <SelectValue placeholder="Sales Person" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Sales Persons</SelectItem>
              {salesPersons.map((sp) => (
                <SelectItem key={sp.uuid} value={sp.userCode}>
                  {sp.name} ({sp.userCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Client Filter */}
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="h-9 bg-white w-[180px] flex-shrink-0">
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.uuid} value={client.userCode}>
                  {client.name} ({client.userCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(followupType === "new-order" || followupType === "pending-order" || followupType === "pending-material") && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 bg-white w-[140px] flex-shrink-0">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          )}

          <div className="flex-shrink-0">
            <DatePickerWithRange date={dateRange} setDate={setDateRange} className="h-9" />
          </div>


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

        {/* Upload Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Import {getFollowupTypeTitle()}</DialogTitle>
              <DialogDescription>
                Upload an Excel file to bulk import data. Supported formats:
                .xlsx, .xls
              </DialogDescription>
            </DialogHeader>

            <div
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".xlsx,.xls"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-medium text-gray-900">
                {uploadFile ? uploadFile.name : "Click to select file"}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {uploadFile
                  ? `${(uploadFile.size / 1024).toFixed(1)} KB`
                  : "or drag and drop here"}
              </p>
            </div>

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadDialog(false);
                  setUploadFile(null);
                }}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={!uploadFile || isUploading}
              >
                {isUploading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isUploading ? "Importing..." : "Start Import"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card className="overflow-hidden">
          <CardHeader className="bg-gray-50 border-b py-4 px-6">
            <CardTitle className="text-lg font-semibold text-gray-900">
              {getFollowupTypeTitle()}
            </CardTitle>
          </CardHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      {followupType !== "pending-order" && followupType !== "pending-material" && (
                        <>
                          <TableHead className="font-medium text-gray-700 ">
                            Client Code
                          </TableHead>
                          <TableHead className="font-medium text-gray-700 ">
                            Client Name
                          </TableHead>
                        </>
                      )}
                      
                      {followupType === "new-order" && (
                        <>
                          <TableHead 
                            className="font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => handleSort("lastOrderDate")}
                          >
                            <div className="flex items-center">
                              Last Order Date
                              {getSortIcon("lastOrderDate")}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => handleSort("noOrderSince")}
                          >
                            <div className="flex items-center">
                              No Order Since
                              {getSortIcon("noOrderSince")}
                            </div>
                          </TableHead>
                        </>
                      )}
                      {followupType !== "pending-order" && followupType !== "pending-material" && (
                        <TableHead className="font-medium text-gray-700">
                          Sales Executive
                        </TableHead>
                      )}
                      {followupType === "new-order" && (
                        <>
                          <TableHead 
                            className="font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => handleSort("nextFollowUpDate")}
                          >
                            <div className="flex items-center">
                              Next Followup
                              {getSortIcon("nextFollowUpDate")}
                            </div>
                          </TableHead>
                          <TableHead className="font-medium text-gray-700">
                            Remark
                          </TableHead>
                        </>
                      )}
                      {followupType === "new-order" && (
                         <>
                           <TableHead className="font-medium text-gray-700">
                             Status
                           </TableHead>
                           <TableHead className="font-medium text-gray-700">
                             Actions
                           </TableHead>
                         </>
                      )}
                      {followupType === "pending-order" && (
                        <>
                          <TableHead className="font-medium text-gray-700">
                            Order No
                          </TableHead>
                          <TableHead className="font-medium text-gray-700 ">
                            Client Code
                          </TableHead>
                          <TableHead className="font-medium text-gray-700 ">
                            Client Name
                          </TableHead>
                          <TableHead className="font-medium text-gray-700">
                            Sales Executive
                          </TableHead>
                          <TableHead 
                            className="font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => handleSort("orderDate")}
                          >
                            <div className="flex items-center">
                              Order Date
                              {getSortIcon("orderDate")}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => handleSort("pendingSince")}
                          >
                            <div className="flex items-center">
                              Pending Since
                              {getSortIcon("pendingSince")}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => handleSort("pendingPcs")}
                          >
                            <div className="flex items-center">
                              Pending Pcs
                              {getSortIcon("pendingPcs")}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => handleSort("nextFollowUpDate")}
                          >
                            <div className="flex items-center">
                              Next Followup
                              {getSortIcon("nextFollowUpDate")}
                            </div>
                          </TableHead>
                           <TableHead className="font-medium text-gray-700">
                             Remark
                           </TableHead>
                           <TableHead className="font-medium text-gray-700">
                             Status
                           </TableHead>
                           <TableHead className="font-medium text-gray-700">
                             Actions
                           </TableHead>
                        </>
                      )}
                      {followupType === "pending-material" && (
                        <>
                          <TableHead className="font-medium text-gray-700">
                            Order No
                          </TableHead>
                          <TableHead className="font-medium text-gray-700 ">
                            Client Code
                          </TableHead>
                          <TableHead className="font-medium text-gray-700 ">
                            Client Name
                          </TableHead>
                          <TableHead className="font-medium text-gray-700">
                            Sales Executive
                          </TableHead>
                          <TableHead 
                            className="font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => handleSort("orderDate")}
                          >
                            <div className="flex items-center">
                              Order Date
                              {getSortIcon("orderDate")}
                            </div>
                          </TableHead>
                          <TableHead className="font-medium text-gray-700">
                            Pending Dept
                          </TableHead>
                           <TableHead 
                            className="font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => handleSort("pendingSinceDays")}
                          >
                            <div className="flex items-center">
                              Pending Since
                              {getSortIcon("pendingSinceDays")}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => handleSort("nextFollowupDate")}
                          >
                            <div className="flex items-center">
                              Next Followup
                              {getSortIcon("nextFollowupDate")}
                            </div>
                          </TableHead>
                           <TableHead className="font-medium text-gray-700">
                             Remark
                           </TableHead>
                          <TableHead className="font-medium text-gray-700">
                            Status
                          </TableHead>
                          <TableHead className="font-medium text-gray-700">
                            Actions
                          </TableHead>
                        </>
                      )}
                      {followupType === "cad-order" && (
                        <TableHead className="font-medium text-gray-700">
                          Design No
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedFollowups.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={
                            followupType === "new-order"
                              ? 9
                              : followupType === "pending-order"
                              ? 10
                              : followupType === "pending-material"
                              ? 11
                              : 4
                          }
                          className="text-center py-8 text-muted-foreground"
                        >
                          No records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedFollowups.map((fu) => (
                        <TableRow key={fu.id} className="hover:bg-gray-50">
                          {followupType !== "pending-order" && followupType !== "pending-material" && (
                            <>
                              <TableCell className="font-medium text-gray-900 align-center">
                                {fu.userCode}
                              </TableCell>
                              <TableCell className="align-center">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                                    {fu.name?.charAt(0) || fu.userCode?.charAt(0) || "C"}
                                  </div>
                                  <div className="font-medium text-gray-900 max-w-[150px] truncate" title={fu.name || "N/A"}>
                                    {fu.name || "N/A"}
                                  </div>
                                </div>
                              </TableCell>
                            </>
                          )}
                          
                          {fu.type === "new-order" && (
                            <>
                              <TableCell className="align-center">
                                <div className="text-sm text-gray-900">
                                  {new Date(fu.lastOrderDate).toLocaleDateString()}
                                </div>
                              </TableCell>
                              <TableCell className="align-center">
                                <div className="text-sm text-gray-900">
                                  {fu.noOrderSince} Days
                                </div>
                              </TableCell>
                            </>
                          )}

                          {followupType !== "pending-order" && followupType !== "pending-material" && (
                            <TableCell className="align-center">
                              {fu.salesExecutive ? (
                                <div className="text-sm text-gray-900">
                                  {fu.salesExecutive}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                          )}

                          {fu.type === "new-order" && (
                            <>
                              <TableCell className="align-center">
                                <div className="text-sm text-gray-900">
                                  {fu.nextFollowupDate ? new Date(fu.nextFollowupDate).toLocaleDateString() : "-"}
                                </div>
                              </TableCell>
                              <TableCell className="align-center">
                                <div className="text-sm text-gray-900 max-w-[200px] truncate" title={fu.remark}>
                                  {fu.remark || "-"}
                                </div>
                              </TableCell>
                            </>
                          )}

                          {fu.type === "new-order" && (
                             <>
                               <TableCell className="align-center">
                                 <Badge variant="outline" className={fu.status === "completed" ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}>
                                   {fu.status}
                                 </Badge>
                               </TableCell>
                               <TableCell className="align-center">
                                 <div className="flex items-center gap-2">
                                   <Button
                                     variant="ghost"
                                     size="icon"
                                     className="h-8 w-8 hover:bg-primary/10 text-gray-900 hover:text-primary transition-colors"
                                     title="View Details"
                                   >
                                     <Eye className="h-4 w-4" />
                                   </Button>
                                   <Button
                                     variant="ghost"
                                     size="icon"
                                     className="h-8 w-8 hover:bg-primary/10 text-gray-900 hover:text-primary transition-colors"
                                     title="Edit"
                                     onClick={() => handleEditClick(fu)}
                                   >
                                     <Pencil className="h-4 w-4" />
                                   </Button>
                                 </div>
                               </TableCell>
                             </>
                          )}
                          {fu.type === "pending-order" && (
                            <>
                              <TableCell className="align-center">
                                <div className="text-sm font-medium text-gray-900 max-w-[120px] truncate" title={fu.orderNo}>
                                  {fu.orderNo}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium text-gray-900 align-center">
                                {fu.userCode}
                              </TableCell>
                              <TableCell className="align-center">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                                    {fu.name?.charAt(0) || fu.userCode?.charAt(0) || "C"}
                                  </div>
                                  <div className="font-medium text-gray-900 max-w-[150px] truncate" title={fu.name || "N/A"}>
                                    {fu.name || "N/A"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="align-center">
                                {fu.salesExecutive ? (
                                  <div className="text-sm text-gray-900">
                                    {fu.salesExecutive}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell className="align-center">
                                <div className="text-sm text-gray-900">
                                  {new Date(fu.orderDate).toLocaleDateString()}
                                </div>
                              </TableCell>
                              <TableCell className="align-center">
                                <div className="text-sm text-gray-900 max-w-[200px] truncate">
                                  {fu.pendingSince} Days
                                </div>
                              </TableCell>
                              <TableCell className="align-center">
                                 <div className="text-sm text-gray-900">
                                  {fu.pendingPcs}
                                </div>
                              </TableCell>
                              <TableCell className="align-center">
                                <div className="text-sm text-gray-900">
                                  {fu.nextFollowupDate ? new Date(fu.nextFollowupDate).toLocaleDateString() : "-"}
                                </div>
                              </TableCell>
                              <TableCell className="align-center">
                                <div className="text-sm text-gray-900 max-w-[200px] truncate" title={fu.remark}>
                                  {fu.remark || "-"}
                                </div>
                              </TableCell>
                               <TableCell className="align-center">
                                 <Badge variant="outline" className={fu.status === "completed" ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}>
                                   {fu.status}
                                 </Badge>
                               </TableCell>
                               <TableCell className="align-center">
                                 <div className="flex items-center gap-2">
                                   <Button
                                     variant="ghost"
                                     size="icon"
                                     className="h-8 w-8 hover:bg-primary/10 text-gray-900 hover:text-primary transition-colors"
                                     title="View Details"
                                   >
                                     <Eye className="h-4 w-4" />
                                   </Button>
                                   <Button
                                     variant="ghost"
                                     size="icon"
                                     className="h-8 w-8 hover:bg-primary/10 text-gray-900 hover:text-primary transition-colors"
                                     title="Edit"
                                     onClick={() => handleEditClick(fu)}
                                   >
                                     <Pencil className="h-4 w-4" />
                                   </Button>
                                 </div>
                               </TableCell>
                            </>
                          )}
                          {fu.type === "pending-material" && (
                            <>
                              <TableCell className="align-center">
                                <div className="text-sm text-gray-900 max-w-[120px] truncate" title={fu.orderNo}>
                                  {fu.orderNo}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium text-gray-900 align-center">
                                {fu.userCode}
                              </TableCell>
                              <TableCell className="align-center">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                                    {fu.name?.charAt(0) || fu.userCode?.charAt(0) || "C"}
                                  </div>
                                  <div className="font-medium text-gray-900 max-w-[150px] truncate" title={fu.name || "N/A"}>
                                    {fu.name || "N/A"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="align-center">
                                {fu.salesExecutive ? (
                                  <div className="text-sm text-gray-900">
                                    {fu.salesExecutive}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell className="align-center">
                                <div className="text-sm text-gray-900">
                                  {new Date(fu.orderDate).toLocaleDateString()}
                                </div>
                              </TableCell>

                              <TableCell className="align-center">
                                <div className="text-sm text-gray-900 max-w-[150px] truncate" title={fu.departmentName}>
                                  {fu.departmentName}
                                </div>
                              </TableCell>

                              <TableCell className="align-center">
                                 <div className="text-sm text-gray-900">
                                  {fu.pendingSinceDays}
                                </div>
                              </TableCell>

                              <TableCell className="align-center">
                                <div className="text-sm text-gray-900">
                                  {fu.nextFollowupDate ? new Date(fu.nextFollowupDate).toLocaleDateString() : "-"}
                                </div>
                              </TableCell>
                              <TableCell className="align-center">
                                <div className="text-sm text-gray-900 max-w-[200px] truncate" title={fu.remark}>
                                  {fu.remark || "-"}
                                </div>
                              </TableCell>
                              <TableCell className="align-center">
                                <Badge variant="outline" className={fu.status === "completed" ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}>
                                  {fu.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="align-center">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-primary/10 text-gray-900 hover:text-primary transition-colors"
                                    title="View Details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-primary/10 text-gray-900 hover:text-primary transition-colors"
                                    title="Edit"
                                    onClick={() => handleEditClick(fu)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          )}
                          {fu.type === "cad-order" && (
                            <TableCell className="align-center">
                              <div className="text-sm font-medium text-gray-900">
                                {fu.designNo}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

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
            </>
          )}
        </Card>
        
        <FollowUpModal
          isOpen={showFollowUpModal}
          onClose={() => {
            setShowFollowUpModal(false);
            setEditingItem(null);
          }}
          onSuccess={handleModalSuccess}
          type={editingType as any}
          data={editingItem}
        />
      </div>
    </div>
  );
}
