import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Upload,
  Loader2,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Pencil,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  clientAPI,
  pendingOrderAPI,
  pendingMaterialAPI,
  newOrderAPI,
} from "@/services/api";
import { ClientModal } from "@/components/modals/ClientModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { formatDisplayDate } from "@/lib/utils";

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
  pendingMaterial?: FollowUpSummary;
  pendingOrder?: FollowUpSummary;
  newOrder?: FollowUpSummary;
  status?: string;
}

interface FollowUpSummary {
  uuid: string;
  clientCode: string;
  status: string;
  nextFollowUpDate: string;
  lastFollowUpDate: string;
  lastFollowUpMsg: string;
}

interface ImportResult {
  success: boolean;
  message: string;
  data?: {
    successCount: number;
    failureCount: number;
    failedRecords: Array<{
      rowNo: number;
      reason: string;
    }>;
  };
}

import { usePageHeader } from "@/contexts/PageHeaderProvider";

export default function Clients() {
  const { setHeader } = usePageHeader();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [importType, setImportType] = useState("clients");
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: "",
    endDate: "",
  });

  // Set header
  useEffect(() => {
    setHeader({
      title: "Clients",
      search: {
        placeholder: "Search clients...",
        value: searchQuery,
        onChange: (val) => setSearchQuery(val),
      },
      children: (
        <>
          <div className="flex items-center gap-2">
          </div>
          <Button
            variant="outline"
            onClick={() => setShowUploadDialog(true)}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Client
          </Button>
        </>
      ),
    });
  }, [searchQuery, dateRange]);

  const loadData = async () => {
    setLoading(true);
    let currentTotalItems = 0;
    try {
      const params: any = {
        page: currentPage,
        size: pageSize,
        search: searchQuery,
        role: "client",
      };

      if (dateRange.startDate) {
        params.startDate = dateRange.startDate;
      }
      if (dateRange.endDate) {
        params.endDate = dateRange.endDate;
      }

      if (user?.role === "sales_executive" && user?.userCode) {
        params.salesExecCode = user.userCode;
      }

      const response = await clientAPI.getAll(params);

      if (response.success !== false) {
        if (response.data?.data) {
          setClients(response.data.data);
          currentTotalItems = response.data.totalItems || 0;
          setTotalItems(currentTotalItems);
        } else {
          setClients(response.data || []);
          currentTotalItems = response.data?.length || 0;
          setTotalItems(currentTotalItems);
        }
      } else {
        toast.error("Failed to load clients");
      }
    } catch (error: any) {
      toast.error("Error loading data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(timer);
  }, [currentPage, pageSize, searchQuery, dateRange]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleUpload = async () => {
    if (!uploadFile) return;

    setIsUploading(true);
    setImportResult(null);
    try {
      let result;
      switch (importType) {
        case "pending-order":
          result = await pendingOrderAPI.import(uploadFile);
          break;
        case "pending-material":
          result = await pendingMaterialAPI.import(uploadFile);
          break;
        case "new-order":
          result = await newOrderAPI.import(uploadFile);
          break;
        default:
          result = await clientAPI.import(uploadFile);
      }

      setImportResult(result);
      if (result.success) {
        toast.success(result.message || "Import processed");
        loadData();
        resetUpload();
      }
    } catch (error: any) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setShowUploadDialog(false);
    setUploadFile(null);
    setImportResult(null);
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  const FollowUpCell = ({ data }: { data?: FollowUpSummary }) => {
    if (!data) return <span className="text-gray-400 text-xs">-</span>;

    const getFollowUpColor = () => {
      if (!data.nextFollowUpDate) return "bg-gray-50";

      const nextDate = new Date(data.nextFollowUpDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      nextDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor(
        (today.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff >= 1 && daysDiff <= 2)
        return "bg-blue-50 border-l-4 border-blue-500";
      if (daysDiff >= 3 && daysDiff <= 4)
        return "bg-yellow-50 border-l-4 border-yellow-500";
      if (daysDiff >= 5) return "bg-red-50 border-l-4 border-red-500";
    };

    return (
      <div
        className={`flex flex-col gap-1 min-w-[200px] p-2 rounded ${getFollowUpColor()}`}
      >
        <div className="flex items-start gap-1">
          <span
            className="text-sm font-medium text-gray-700 line-clamp-2"
            title={data.lastFollowUpMsg}
          >
            {data.lastFollowUpMsg}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-gray-500">
          {data.lastFollowUpDate && (
            <span className="whitespace-nowrap">
              Last Follow up:{" "}
              {formatDisplayDate(data.lastFollowUpDate)}
            </span>
          )}
          {data.nextFollowUpDate && (
            <span className="whitespace-nowrap font-medium text-blue-600">
              Next Follow up:{" "}
              {formatDisplayDate(data.nextFollowUpDate)}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 pb-6">
      <div className="p-6 space-y-6">
        <Card className="overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-medium text-gray-700 w-[200px]">
                      Client Name
                    </TableHead>
                    <TableHead className="font-medium text-gray-700 w-[130px]">
                      Client Code
                    </TableHead>
                    <TableHead className="font-medium text-gray-700 w-[150px]">
                      Sales Person
                    </TableHead>
                    <TableHead className="font-medium text-gray-700 w-[220px]">
                      Pending Material
                    </TableHead>
                    <TableHead className="font-medium text-gray-700 w-[220px]">
                      Pending Orders
                    </TableHead>
                    <TableHead className="font-medium text-gray-700 w-[220px]">
                      New Orders
                    </TableHead>
                    <TableHead className="font-medium text-gray-700 text-center w-[80px]">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients
                    .filter((client) => client?.status !== "completed")
                    .map((client) => (
                      <TableRow key={client.uuid} className="hover:bg-gray-50">
                        <TableCell className="align-center">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                              {client.name?.charAt(0) ||
                                client.userCode?.charAt(0) ||
                                "C"}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {client.name || "N/A"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-gray-900 align-center">
                          {client.userCode}
                        </TableCell>
                        <TableCell className="align-center">
                          {client.salesExecCode ? (
                            <div className="text-xs text-gray-500">
                              {client.salesExecCode}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>

                        <TableCell className="align-center">
                          <FollowUpCell data={client.pendingMaterial} />
                        </TableCell>
                        <TableCell className="align-center">
                          <FollowUpCell data={client.pendingOrder} />
                        </TableCell>
                        <TableCell className="align-center">
                          <FollowUpCell data={client.newOrder} />
                        </TableCell>

                        <TableCell className="align-center text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              to={`/admin/clients/${client.uuid}`}
                              state={{ client }}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-primary/10 text-gray-900 hover:text-primary transition-colors"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-primary/10 text-gray-900 hover:text-primary transition-colors"
                              title="Edit Client"
                              onClick={() => {
                                setEditingClient(client);
                                setShowEditModal(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  {clients.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No clients found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="p-4 border-t bg-white flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Total:{" "}
              <span className="font-semibold text-gray-900">
                {loading ? "..." : totalItems}
              </span>
            </div>
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              setPageSize={setPageSize}
            />
          </div>
        </Card>
      </div>

      <Dialog
        open={showUploadDialog}
        onOpenChange={(open) => {
          if (!open) resetUpload();
          else setShowUploadDialog(true);
        }}
      >
        <DialogContent className={`${importResult ? "max-w-4xl" : "max-w-md"}`}>
          <DialogHeader>
            <DialogTitle>
              {importResult
                ? "Import Processing Result"
                : importType === "clients"
                ? "Import Clients"
                : importType === "pending-order"
                ? "Import Pending Orders"
                : importType === "pending-material"
                ? "Import Pending Material"
                : "Import New Orders"}
            </DialogTitle>
            <DialogDescription>
              {importResult
                ? "Import Processing Result"
                : "Upload an Excel file to import data"}
            </DialogDescription>
          </DialogHeader>

          {!importResult ? (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Select Import Type
                  </Label>
                  <Select value={importType} onValueChange={setImportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select import type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clients">Clients</SelectItem>
                      <SelectItem value="pending-order">
                        Pending Order Task Sheet
                      </SelectItem>
                      <SelectItem value="pending-material">
                        Pending Material Task Sheet
                      </SelectItem>
                      <SelectItem value="new-order">
                        New Order Task Sheet
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block text-sm">Excel File</Label>
                  <Input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                  {uploadFile && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: {uploadFile.name} (
                      {(uploadFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button
                  variant="outline"
                  onClick={resetUpload}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!uploadFile || isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    "Upload"
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-full text-green-600">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      Success Count
                    </p>
                    <p className="text-2xl font-bold text-green-700">
                      {importResult.data?.successCount || 0}
                    </p>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-4">
                  <div className="p-3 bg-red-100 rounded-full text-red-600">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-900">
                      Failure Count
                    </p>
                    <p className="text-2xl font-bold text-red-700">
                      {importResult.data?.failureCount || 0}
                    </p>
                  </div>
                </div>
              </div>

              {importResult.data?.failedRecords &&
                importResult.data?.failedRecords.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      <h3 className="font-medium text-sm text-gray-700">
                        Failed Records Details
                      </h3>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">Row No</TableHead>
                            <TableHead>Reason</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importResult.data.failedRecords.map(
                            (record, idx) => (
                              <TableRow key={idx} className="hover:bg-gray-50">
                                <TableCell className="font-medium">
                                  {record.rowNo}
                                </TableCell>
                                <TableCell className="text-red-600 text-sm">
                                  {record.reason}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

              <DialogFooter>
                <Button onClick={resetUpload}>Close</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ClientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadData}
      />

      <ClientModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingClient(null);
        }}
        onSuccess={loadData}
        client={editingClient}
      />
    </div>
  );
}
