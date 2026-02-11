import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/contexts/AuthContext";
import { getUTCISOString } from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Loader2, Download } from "lucide-react";
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
import { formatDisplayDate, getTakenByName } from "@/lib/utils";
import { Combobox } from "@/components/ui/combobox";

type ReportType = "todays-taken" | "pending" | "overdue";

interface FollowUpRecord {
  id: string;
  clientCode: string;
  clientName: string;
  salesExecCode?: string;
  salesExecName?: string;
  lastFollowUpBy?: string | { name: string; userCode: string; uuid?: string };
  type: string;
  followUpMsg: string;
  nextFollowUpDate: string;
  lastFollowUpDate?: string;
  followUpStatus: string;
  createdAt?: string;
}

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

export default function Reports() {
  const { user } = useAuth();
  const isAdmin = user?.role !== "sales_executive";
  const { setHeader } = usePageHeader();
  const [reportType] = useState<ReportType>("todays-taken");
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange | undefined>(undefined);
  const [salesPersonFilter, setSalesPersonFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [loading, setLoading] = useState(false);
  const [followUps, setFollowUps] = useState<FollowUpRecord[]>([]);
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [spSearchQuery, setSpSearchQuery] = useState("");
  const [isSpLoading, setIsSpLoading] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [isClientLoading, setIsClientLoading] = useState(false);

  const clearFilters = () => {
    setSearchTerm("");
    setAppliedDateRange(undefined);
    setSalesPersonFilter("all");
    setClientFilter("all");
    setSpSearchQuery("");
    setClientSearchQuery("");
  };

  const isFiltering =
    searchTerm !== "" ||
    appliedDateRange !== undefined ||
    salesPersonFilter !== "all" ||
    clientFilter !== "all";


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
          shortBy: "userCode",
          shortOrder: "ASC",
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

  const getSalesPersonName = (code?: string) => {
    if (!code) return "";
    const sp = salesPersons.find((s) => s.userCode === code);
    return sp?.name || "";
  };


  const loadReportData = async (options?: {
    overrideDateRange?: DateRange | null;
    skipAllFilters?: boolean;
  }) => {
    const activeDateRange =
      options?.overrideDateRange !== undefined
        ? options.overrideDateRange
        : appliedDateRange;
    const skipAllFilters = options?.skipAllFilters || false;
    setLoading(true);
    try {
      const params: any = { page: 1, size: 10 };
      if (activeDateRange?.from && !skipAllFilters) {
        params.startDate = getUTCISOString(activeDateRange.from, 'start');

        if (activeDateRange.to) {
          params.endDate = getUTCISOString(activeDateRange.to, 'end');
        } else {
          params.endDate = getUTCISOString(activeDateRange.from, 'end');
        }
      }

      const [newOrderRes, pendingOrderRes, pendingMaterialRes] =
        await Promise.all([
          newOrderAPI.getFollowUpsByClientCode(params),
          pendingOrderAPI.getFollowUpsByClientCode(params),
          pendingMaterialAPI.getFollowUpsByClientCode(params),
        ]);

      const allFollowUps: FollowUpRecord[] = [];
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const processApiResponse = (res: any, type: string) => {
        let dataArray = [];

        if (Array.isArray(res)) {
          dataArray = res;
        } else if (res.data) {
          if (Array.isArray(res.data)) {
            dataArray = res.data;
          } else if (res.data.data && Array.isArray(res.data.data)) {
            dataArray = res.data.data;
          }
        }

        if (!Array.isArray(dataArray) || dataArray.length === 0) {
          return;
        }

        dataArray.forEach((item: any) => {
          if (item.followUps && Array.isArray(item.followUps)) {
            item.followUps.forEach((fu: any) => {
              const fuDate = new Date(getUTCISOString(fu.nextFollowUpDate, 'start'));

              let includeRecord = false;

              if (reportType === "todays-taken") {
                const createdDate = fu.createdAt
                  ? new Date(fu.createdAt)
                  : null;
                if (createdDate) {
                  const createdDateStart = new Date(getUTCISOString(fu.createdAt, 'start'));
                  if (activeDateRange?.from && !skipAllFilters) {
                    const from = new Date(getUTCISOString(activeDateRange.from, 'start'));
                    const to = activeDateRange.to
                      ? new Date(getUTCISOString(activeDateRange.to, 'end'))
                      : new Date(getUTCISOString(activeDateRange.from, 'end'));
                    
                    includeRecord =
                      createdDateStart >= from &&
                      createdDateStart <= to &&
                      fu.followUpStatus?.toLowerCase() === "completed";
                  }
 else if (!activeDateRange || skipAllFilters) {
                    includeRecord =
                      createdDate.getTime() === today.getTime() &&
                      fu.followUpStatus?.toLowerCase() === "completed";
                  }
                }
              } else if (reportType === "pending") {
                if (activeDateRange?.from && !skipAllFilters) {
                  const from = new Date(activeDateRange.from);
                  from.setHours(0, 0, 0, 0);
                  const to = activeDateRange.to
                    ? new Date(activeDateRange.to)
                    : new Date(from);
                  to.setHours(23, 59, 59, 999);

                  includeRecord =
                    fu.followUpStatus?.toLowerCase() !== "completed" &&
                    fuDate >= from &&
                    fuDate <= to;
                } else if (!activeDateRange || skipAllFilters) {
                  // Default behavior: pending from today onwards
                  includeRecord =
                    fu.followUpStatus?.toLowerCase() !== "completed" &&
                    fuDate >= today;
                }
              } else if (reportType === "overdue") {
                if (activeDateRange?.from && !skipAllFilters) {
                  const from = new Date(activeDateRange.from);
                  from.setHours(0, 0, 0, 0);
                  const to = activeDateRange.to
                    ? new Date(activeDateRange.to)
                    : new Date(from);
                  to.setHours(23, 59, 59, 999);

                  includeRecord =
                    fu.followUpStatus?.toLowerCase() !== "completed" &&
                    fuDate >= from &&
                    fuDate <= to;
                } else if (!activeDateRange || skipAllFilters) {
                  includeRecord =
                    fu.followUpStatus?.toLowerCase() !== "completed" &&
                    fuDate < today;
                }
              }

              if (includeRecord) {
                const client = clients.find(
                  (c) => c.userCode === item.clientCode,
                );
                const salesExecCode =
                  item.salesExecCode || client?.salesExecCode || "";

                allFollowUps.push({
                  id: fu._id || fu.id || Math.random().toString(),
                  clientCode: item.clientCode,
                  clientName:
                    item.designName ||
                    item.orderId ||
                    item.materialName ||
                    item.clientCode,
                  salesExecCode: salesExecCode,
                  salesExecName: getSalesPersonName(salesExecCode),
                  lastFollowUpBy: fu.lastFollowUpTakenBy || fu.lastFollowUpBy || fu.lastFollowUpByData,
                  type: type,
                  followUpMsg: fu.followUpMsg || fu.lastFollowUpMsg || "",
                  nextFollowUpDate: fu.nextFollowUpDate,
                  lastFollowUpDate: fu.lastFollowUpDate || fu.createdAt,
                  followUpStatus: fu.followUpStatus,
                  createdAt: fu.createdAt,
                });
              }
            });
          }
        });
      };
      processApiResponse(newOrderRes, "New Order");
      processApiResponse(pendingOrderRes, "Pending Order");
      processApiResponse(pendingMaterialRes, "Pending Material");
      setFollowUps(allFollowUps);
    } catch (error: any) {
      console.error("Error loading report data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSalesPersonFilter("all");
    setClientFilter("all");
    setSearchTerm("");
    setSpSearchQuery("");
    setClientSearchQuery("");
    setClientSearchQuery("");
    setAppliedDateRange(undefined);
    loadReportData({ overrideDateRange: null, skipAllFilters: true });
  }, [reportType]);

  useEffect(() => {
    if (clients.length > 0 && salesPersons.length > 0) {
      loadReportData();
    }
  }, [clients, salesPersons, appliedDateRange]);

  const filteredFollowUps = followUps.filter((fu) => {
    if (salesPersonFilter !== "all" && fu.salesExecCode !== salesPersonFilter) {
      return false;
    }

    if (clientFilter !== "all" && fu.clientCode !== clientFilter) {
      return false;
    }

    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      return (
        fu.clientCode.toLowerCase().includes(searchLower) ||
        fu.clientName.toLowerCase().includes(searchLower) ||
        fu.salesExecName?.toLowerCase().includes(searchLower) ||
        fu.followUpMsg.toLowerCase().includes(searchLower) ||
        fu.type.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const totalPages = Math.ceil(filteredFollowUps.length / pageSize);
  const paginatedFollowUps = filteredFollowUps.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [salesPersonFilter, clientFilter, reportType, debouncedSearchTerm, appliedDateRange]);

  useEffect(() => {
    setHeader({
      title: "Reports & Analytics",
      search: {
        placeholder: "Search reports...",
        value: searchTerm,
        onChange: (val) => setSearchTerm(val),
      },
      children: (
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              onClick={handleExport}
              className="flex items-center gap-2 h-9"
              disabled={filteredFollowUps.length === 0}
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          )}
        </div>
      ),
    });
  }, [searchTerm, filteredFollowUps.length]);

  const handleExport = () => {
    if (filteredFollowUps.length === 0) {
      toast.error("No data to export");
      return;
    }

    const exportData = filteredFollowUps.map((fu, index) => ({
      "S.No": index + 1,
      "Client Name": fu.clientName,
      "Client Code": fu.clientCode,
      "Sales Person Name": fu.salesExecName || "-",
      "Sales Person Code": fu.salesExecCode || "-",
      Type: fu.type,
      "Follow-up Message": fu.followUpMsg,
      "Next Follow-up Date": formatDisplayDate(fu.nextFollowUpDate),
      "Last Follow-up Date": formatDisplayDate(fu.lastFollowUpDate),
      Status: fu.followUpStatus,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);

    const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
      wch: Math.max(key.length, 15),
    }));
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Follow-ups Report");

    const reportName =
      reportType === "todays-taken"
        ? "Todays_Taken_Followups"
        : reportType === "pending"
          ? "Pending_Followups"
          : "Overdue_Followups";

    const fileName = `${reportName}_${
      new Date().toISOString().split("T")[0]
    }_${new Date().toTimeString().split(" ")[0].replace(/:/g, "-")}.xlsx`;

    XLSX.writeFile(wb, fileName);
    toast.success(`Report exported successfully as ${fileName}`);
  };

  const getReportTitle = () => {
    switch (reportType) {
      case "todays-taken":
        return "Today's Taken Follow-ups";
      case "pending":
        return "Pending Follow-ups";
      case "overdue":
        return "Overdue Follow-ups";
      default:
        return "Report";
    }
  };

  return (
    <div className="bg-gray-50 pb-6">
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
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
            width="w-[180px]"
            className="h-9 bg-white"
          />
          {isFiltering && (
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

        <Card className="overflow-hidden">
          <CardHeader className="bg-gray-50 border-b py-4 px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {getReportTitle()}
                </CardTitle>
              </div>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-medium text-gray-700 w-[200px]">
                    Client Details
                  </TableHead>
                  <TableHead className="font-medium text-gray-700 w-[150px]">
                    Sales Person
                  </TableHead>
                  <TableHead className="font-medium text-gray-700 w-[120px]">
                    Type
                  </TableHead>
                  <TableHead className="font-medium text-gray-700 w-[250px]">
                    Followup Message
                  </TableHead>
                  <TableHead className="font-medium text-gray-700 w-[130px]">
                    Last Followup
                  </TableHead>
                  <TableHead className="font-medium text-gray-700 w-[150px]">
                    Taken By
                  </TableHead>
                  <TableHead className="font-medium text-gray-700 w-[130px]">
                    Next Followup
                  </TableHead>
                  <TableHead className="font-medium text-gray-700 w-[100px]">
                    Status
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
                ) : paginatedFollowUps.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No records found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedFollowUps.map((fu) => (
                    <TableRow key={fu.id} className="hover:bg-gray-50">
                      <TableCell className="align-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                            {fu.clientName?.charAt(0) ||
                              fu.clientCode?.charAt(0) ||
                              "C"}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {fu.clientName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {fu.clientCode}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="align-center">
                        {fu.salesExecCode ? (
                          <div>
                            <div className="font-medium text-gray-900">
                              {fu.salesExecName || "Unknown"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {fu.salesExecCode}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="align-center">
                        <Badge
                          variant="outline"
                          className={`text-xs font-medium ${
                            fu.type === "New Order"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : fu.type === "Pending Order"
                                ? "bg-orange-50 text-orange-700 border-orange-200"
                                : "bg-purple-50 text-purple-700 border-purple-200"
                          }`}
                        >
                          {fu.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-center">
                        <div
                          className="text-sm text-gray-700 line-clamp-2 leading-relaxed"
                          title={fu.followUpMsg}
                        >
                          {fu.followUpMsg || (
                            <span className="text-gray-400 italic">
                              No message
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="align-center">
                        {fu.lastFollowUpDate ? (
                          <div className="text-sm text-gray-900">
                            {formatDisplayDate(fu.lastFollowUpDate)}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="align-center">
                        <div
                          className="text-sm text-gray-900 truncate max-w-[150px]"
                          title={getTakenByName(fu.lastFollowUpBy)}
                        >
                          {getTakenByName(fu.lastFollowUpBy)}
                        </div>
                      </TableCell>
                      <TableCell className="align-center">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDisplayDate(fu.nextFollowUpDate)}
                        </div>
                      </TableCell>
                      <TableCell className="align-center">
                        <Badge
                          variant="outline"
                          className={`text-xs font-medium ${
                            fu.followUpStatus?.toLowerCase() === "completed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : fu.followUpStatus?.toLowerCase() === "pending"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-gray-50 text-gray-700 border-gray-200"
                          }`}
                        >
                          {fu.followUpStatus || "Unknown"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="p-4 border-t bg-white flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Total Records:{" "}
              <span className="font-semibold text-gray-900">
                {filteredFollowUps.length}
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
    </div>
  );
}
