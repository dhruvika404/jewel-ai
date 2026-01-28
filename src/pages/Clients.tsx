import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImportModal } from "@/components/modals/ImportModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import TablePagination from "@/components/ui/table-pagination";
import { Upload, Loader2, Eye, Plus, Pencil, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { clientAPI, salesPersonAPI, sharedAPI } from "@/services/api";
import { ClientModal } from "@/components/modals/ClientModal";
import { useAuth } from "@/contexts/AuthContext";
import { formatDisplayDate } from "@/lib/utils";
import { DeleteModal } from "@/components/modals/DeleteModal";
import { Combobox } from "@/components/ui/combobox";
import { usePageHeader } from "@/contexts/PageHeaderProvider";

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
  remark?: string;
}
interface SalesPerson {
  userCode: string;
  name: string;
}

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
  const [isUploading, setIsUploading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([]);
  const [selectedSalesPerson, setSelectedSalesPerson] = useState<string>("all");
  const [dateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: "",
    endDate: "",
  });
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const isAdmin = user?.role !== "sales_executive";

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const toggleAllSelection = (currentItems: Client[]) => {
    const allSelected = currentItems.every((item) =>
      selectedItems.has(item.uuid),
    );
    if (allSelected) {
      const newSelected = new Set(selectedItems);
      currentItems.forEach((item) => newSelected.delete(item.uuid));
      setSelectedItems(newSelected);
    } else {
      const newSelected = new Set(selectedItems);
      currentItems.forEach((item) => newSelected.add(item.uuid));
      setSelectedItems(newSelected);
    }
  };
  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    setIsBulkDeleting(true);
    try {
      const response = await sharedAPI.deleteMultipleUsers({
        userType: "client",
        ids: Array.from(selectedItems),
      });

      if (response.success === false) {
        toast.error(response.message || "Failed to delete clients");
      } else {
        toast.success(
          response.message || "Selected clients deleted successfully",
        );
        loadData();
        setShowBulkDeleteConfirm(false);
        setSelectedItems(new Set());
      }
    } catch (e: any) {
      toast.error("Failed to delete clients");
    } finally {
      setIsBulkDeleting(false);
    }
  };

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
          {isAdmin && (
            <>
              <Combobox
                options={[
                  { value: "all", label: "Select Sales Person" },
                  ...salesPersons.map((sp) => ({
                    value: sp.userCode,
                    label: sp.name
                      ? `${sp.name} (${sp.userCode})`
                      : sp.userCode,
                  })),
                ]}
                value={selectedSalesPerson}
                onSelect={setSelectedSalesPerson}
                placeholder="Select Sales Person"
                searchPlaceholder="Search salesperson..."
                width="w-[180px]"
              />
              <Button
                variant="outline"
                onClick={() => setShowUploadDialog(true)}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Import
              </Button>
              {selectedItems.size > 0 ? (
                <Button
                  variant="destructive"
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />({selectedItems.size})
                </Button>
              ) : (
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Client
                </Button>
              )}
            </>
          )}
        </>
      ),
    });
  }, [
    searchQuery,
    dateRange,
    selectedSalesPerson,
    salesPersons,
    selectedItems.size,
    isAdmin,
  ]);

  useEffect(() => {
    const fetchSalesPersons = async () => {
      try {
        if (isAdmin) {
          const response = await salesPersonAPI.getAll({
            size: 1000,
            role: "sales_executive",
          });
          if (response.success && response.data?.data) {
            setSalesPersons(response.data.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch sales persons:", error);
      }
    };

    fetchSalesPersons();
  }, [user, isAdmin]);

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
      } else if (selectedSalesPerson && selectedSalesPerson !== "all") {
        params.salesExecCode = selectedSalesPerson;
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
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(timer);
  }, [currentPage, pageSize, searchQuery, dateRange, selectedSalesPerson]);

  useEffect(() => {}, [searchQuery, selectedSalesPerson]);

  const handleImport = async (file: File) => {
    setIsUploading(true);
    try {
      const result = await clientAPI.import(file);
      toast.success(result.message || "Import successful");
      loadData();
      setShowUploadDialog(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to import data");
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setShowUploadDialog(false);
  };

  const handleOpenDelete = (client: Client) => {
    setDeletingClient(client);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingClient) return;
    setIsDeleting(true);
    try {
      const res = await clientAPI.delete(deletingClient.uuid);
      if (res?.success === false) {
        toast.error(res?.message || "Failed to delete client");
        return;
      }
      toast.success("Client deleted successfully");
      setDeleteModalOpen(false);
      setDeletingClient(null);
      loadData();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete client");
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  const FollowUpCell = ({ data }: { data?: FollowUpSummary }) => {
    if (!data || data.status === "completed")
      return <span className="text-gray-400 text-xs">-</span>;

    const getFollowUpColor = () => {
      if (!data.nextFollowUpDate)
        return "bg-gray-50 border-l-4 border-gray-300";

      const nextDate = new Date(data.nextFollowUpDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      nextDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor(
        (today.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysDiff <= 0) return "bg-purple-50 border-l-4 border-purple-500";
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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-sm font-medium text-gray-700 line-clamp-1 cursor-default">
                {data.lastFollowUpMsg}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-[300px] break-words">
                {data.lastFollowUpMsg}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-sm font-medium text-gray-700 line-clamp-1 cursor-default">
                Remark: {data.remark}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-[300px] break-words">Remark: {data.remark}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="flex items-center gap-3 text-[11px] text-gray-500">
            <span className="whitespace-nowrap">
              Last Follow up: {formatDisplayDate(data.lastFollowUpDate)}
            </span>
            <span className="whitespace-nowrap font-medium text-blue-600">
              Next Follow up: {formatDisplayDate(data.nextFollowUpDate)}
            </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50">
      <div className="p-6 space-y-6">
        <Card className="overflow-hidden">
          <div className="p-4 border-b bg-white flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-gray-600">Upcoming</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-600">1-2 Days Overdue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <span className="text-gray-600">3-4 Days Overdue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-600">5+ Days Overdue</span>
            </div>
          </div>
          <Table containerClassName="max-h-[calc(100vh-236px)] overflow-auto">
            <TableHeader className="sticky top-0 z-20 bg-gray-50">
              <TableRow className="bg-gray-50">
                <TableHead className="w-[50px] align-center">
                  <Checkbox
                    checked={
                      clients.length > 0 &&
                      clients.every((client) => selectedItems.has(client.uuid))
                    }
                    onCheckedChange={() => toggleAllSelection(clients)}
                  />
                </TableHead>
                <TableHead className="font-medium text-gray-700 w-[200px]">
                  Client Name
                </TableHead>
                <TableHead className="font-medium text-gray-700 w-[130px]">
                  Client Code
                </TableHead>
                {isAdmin && (
                  <TableHead className="font-medium text-gray-700 w-[150px]">
                    Sales Person
                  </TableHead>
                )}
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
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 8 : 7}
                    className="text-center py-12"
                  >
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  </TableCell>
                </TableRow>
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 8 : 7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No clients found
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.uuid} className="hover:bg-gray-50">
                    <TableCell className="align-center">
                      <Checkbox
                        checked={selectedItems.has(client.uuid)}
                        onCheckedChange={() => toggleSelection(client.uuid)}
                      />
                    </TableCell>
                    <TableCell className="align-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                          {client.name?.charAt(0) ||
                            client.userCode?.charAt(0) ||
                            "C"}
                        </div>
                        <div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="font-medium text-gray-900 max-w-[150px] truncate cursor-default">
                                  {client.name || "N/A"}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{client.name || "N/A"}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900 align-center">
                      {client?.userCode}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="font-medium text-gray-900 align-center">
                        {client?.salesExecCode}
                      </TableCell>
                    )}

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
                      <div className="flex items-center justify-center">
                        <Link to={`/clients/${client.uuid}`} state={{ client }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-primary/10 text-gray-900 hover:text-primary transition-colors disabled:cursor-not-allowed disabled:pointer-events-auto disabled:opacity-50"
                            title="View Details"
                            disabled={selectedItems.size > 0}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {isAdmin && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-primary/10 text-gray-900 hover:text-primary transition-colors disabled:cursor-not-allowed disabled:pointer-events-auto disabled:opacity-50"
                              title="Edit Client"
                              onClick={() => {
                                setEditingClient(client);
                                setShowEditModal(true);
                              }}
                              disabled={selectedItems.size > 0}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-red-50 text-gray-900 hover:text-red-600 transition-colors disabled:cursor-not-allowed disabled:pointer-events-auto disabled:opacity-50"
                              title="Delete Client"
                              onClick={() => handleOpenDelete(client)}
                              disabled={selectedItems.size > 0}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

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

      <ImportModal
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        title="Import Clients"
        description="Upload a file to import clients"
        onImport={handleImport}
        isUploading={isUploading}
        onClose={resetUpload}
      />

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

      <DeleteModal
        isOpen={deleteModalOpen || showBulkDeleteConfirm}
        onClose={() => {
          if (isDeleting || isBulkDeleting) return;
          if (deleteModalOpen) {
            setDeleteModalOpen(false);
            setDeletingClient(null);
          } else {
            setShowBulkDeleteConfirm(false);
          }
        }}
        onConfirm={deleteModalOpen ? handleConfirmDelete : handleBulkDelete}
        title={
          deleteModalOpen
            ? "Delete Client?"
            : `Delete ${selectedItems.size} Clients?`
        }
        description={
          deleteModalOpen
            ? "This action cannot be undone."
            : "Are you sure you want to delete the selected clients? This action cannot be undone."
        }
        itemName={
          deleteModalOpen && deletingClient
            ? `${deletingClient.name || "Client"} (${deletingClient.userCode})`
            : undefined
        }
        isLoading={isDeleting || isBulkDeleting}
      />
    </div>
  );
}
