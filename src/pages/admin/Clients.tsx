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
import { Upload, Loader2, Eye, Plus, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { clientAPI, salesPersonAPI } from "@/services/api";
import { ClientModal } from "@/components/modals/ClientModal";
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

interface SalesPerson {
  userCode: string;
  name: string;
}

import { Combobox } from "@/components/ui/combobox";
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
  const [isUploading, setIsUploading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([]);
  const [selectedSalesPerson, setSelectedSalesPerson] = useState<string>("all");
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
          {user?.role !== "sales_executive" && (
            <Combobox
              options={[
                { value: "all", label: "Select Sales Person" },
                ...salesPersons.map((sp) => ({
                  value: sp.userCode,
                  label: `${sp.name} (${sp.userCode})`,
                })),
              ]}
              value={selectedSalesPerson}
              onSelect={setSelectedSalesPerson}
              placeholder="Select Sales Person"
              searchPlaceholder="Search salesperson..."
              width="w-[180px]"
            />
          )}
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
  }, [searchQuery, dateRange, selectedSalesPerson, salesPersons]);

  useEffect(() => {
    const fetchSalesPersons = async () => {
      try {
        if (user?.role !== "sales_executive") {
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
  }, [user]);

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
  }, [currentPage, pageSize, searchQuery, dateRange, selectedSalesPerson]);

  useEffect(() => {}, [searchQuery, selectedSalesPerson]);

  const handleImport = async (file: File) => {
    setIsUploading(true);
    try {
      const result = await clientAPI.import(file);
      toast.success(result.message || "Import successful");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to import data");
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setShowUploadDialog(false);
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  const FollowUpCell = ({ data }: { data?: FollowUpSummary }) => {
    if (!data || data.status === "completed")
      return <span className="text-gray-400 text-xs">-</span>;

    const getFollowUpColor = () => {
      if (!data.nextFollowUpDate) return "bg-gray-50";

      const nextDate = new Date(data.nextFollowUpDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      nextDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor(
        (today.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24)
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
              Last Follow up: {formatDisplayDate(data.lastFollowUpDate)}
            </span>
          )}
          {data.nextFollowUpDate && (
            <span className="whitespace-nowrap font-medium text-blue-600">
              Next Follow up: {formatDisplayDate(data.nextFollowUpDate)}
            </span>
          )}
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : clients.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No clients found
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => (
                    <TableRow key={client.uuid} className="hover:bg-gray-50">
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
                       <TableCell className="font-medium text-gray-900 align-center">
                        {client?.salesExecCode}
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>

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
    </div>
  );
}
