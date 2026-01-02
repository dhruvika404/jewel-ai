import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  Loader2,
  Clock,
  AlertCircle,
  CheckCircle,
  Filter,
  Users,
  Building2,
  Search,
  X,
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

type ReportType = "todays-taken" | "pending" | "overdue";

interface FollowUpRecord {
  id: string;
  clientCode: string;
  clientName: string;
  salesExecCode?: string;
  salesExecName?: string;
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
  const { setHeader } = usePageHeader();
  const [reportType, setReportType] = useState<ReportType>("todays-taken");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [salesPersonFilter, setSalesPersonFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [followUps, setFollowUps] = useState<FollowUpRecord[]>([]);
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  const getSalesPersonName = (code?: string) => {
    if (!code) return "";
    const sp = salesPersons.find((s) => s.userCode === code);
    return sp?.name || "";
  };

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [newOrderRes, pendingOrderRes, pendingMaterialRes] =
        await Promise.all([
          newOrderAPI.getFollowUpsByClientCode({ page: 1, size: 10000 }),
          pendingOrderAPI.getFollowUpsByClientCode({
            page: 1,
            size: 10000,
            clientCode: "",
          }),
          pendingMaterialAPI.getFollowUpsByClientCode({
            page: 1,
            size: 10000,
            clientCode: "",
          }),
        ]);

      const allFollowUps: FollowUpRecord[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDateObj = new Date(selectedDate);
      selectedDateObj.setHours(0, 0, 0, 0);

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
              const fuDate = new Date(fu.nextFollowUpDate);
              fuDate.setHours(0, 0, 0, 0);

              let includeRecord = false;

              if (reportType === "todays-taken") {
                const createdDate = fu.createdAt
                  ? new Date(fu.createdAt)
                  : null;
                if (createdDate) {
                  createdDate.setHours(0, 0, 0, 0);
                  includeRecord =
                    createdDate.getTime() === today.getTime() &&
                    fu.followUpStatus?.toLowerCase() === "completed";
                }
              } else if (reportType === "pending") {
                includeRecord =
                  fu.followUpStatus?.toLowerCase() !== "completed" &&
                  fuDate >= selectedDateObj;
              } else if (reportType === "overdue") {
                includeRecord =
                  fu.followUpStatus?.toLowerCase() !== "completed" &&
                  fuDate < today;
              }

              if (includeRecord) {
                const client = clients.find(
                  (c) => c.userCode === item.clientCode
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
      toast.error("Error loading report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [reportType, selectedDate]);

  useEffect(() => {
    if (clients.length > 0 && salesPersons.length > 0 && followUps.length > 0) {
      loadReportData();
    }
  }, [clients, salesPersons]);

  const filteredFollowUps = followUps.filter((fu) => {
    if (salesPersonFilter !== "all" && fu.salesExecCode !== salesPersonFilter) {
      return false;
    }

    if (clientFilter !== "all" && fu.clientCode !== clientFilter) {
      return false;
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
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
    currentPage * pageSize
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [salesPersonFilter, clientFilter, reportType, selectedDate, searchTerm]);

  useEffect(() => {
    setHeader({
      title: "Reports & Analytics",
      children: (
        <div className="flex items-center gap-2">
           <Button
            variant="outline"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      ),
    });
  }, [filteredFollowUps.length]);

  const clearFilters = () => {
    setSalesPersonFilter("all");
    setClientFilter("all");
    setSearchTerm("");
    setSelectedDate(new Date().toISOString().split("T")[0]);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (salesPersonFilter !== "all") count++;
    if (clientFilter !== "all") count++;
    if (searchTerm) count++;
    return count;
  };

  const handleExport = () => {
    if (filteredFollowUps.length === 0) {
      toast.error("No data to export");
      return;
    }

    const exportData = filteredFollowUps.map((fu, index) => ({
      "S.No": index + 1,
      "Client Code": fu.clientCode,
      "Client Name": fu.clientName,
      "Sales Person Code": fu.salesExecCode || "-",
      "Sales Person Name": fu.salesExecName || "-",
      Type: fu.type,
      "Follow-up Message": fu.followUpMsg,
      "Next Follow-up Date": new Date(fu.nextFollowUpDate).toLocaleDateString(),
      "Last Follow-up Date": fu.lastFollowUpDate
        ? new Date(fu.lastFollowUpDate).toLocaleDateString()
        : "-",
      Status: fu.followUpStatus,
      "Export Date": new Date().toLocaleDateString(),
      "Export Time": new Date().toLocaleTimeString(),
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
      <div className="p-6 space-y-6">
        <Card className="overflow-hidden">
          <Tabs
            value={reportType}
            onValueChange={(value) => setReportType(value as ReportType)}
            className="w-full"
          >
            <div className="border-b bg-gray-50 px-6 py-4">
              <TabsList className="grid w-full grid-cols-3 bg-white">
                <TabsTrigger
                  value="todays-taken"
                  className="flex items-center gap-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  Today's Taken
                </TabsTrigger>
                <TabsTrigger
                  value="pending"
                  className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                >
                  <Clock className="w-4 h-4" />
                  Pending
                </TabsTrigger>
                <TabsTrigger
                  value="overdue"
                  className="flex items-center gap-2 data-[state=active]:bg-red-50 data-[state=active]:text-red-700"
                >
                  <AlertCircle className="w-4 h-4" />
                  Overdue
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <CardTitle className="text-base font-semibold">
                  Filters & Search
                </CardTitle>
                {getActiveFilterCount() > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {getActiveFilterCount()} active
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {getActiveFilterCount() > 0 && (
                  <Button
                    onClick={clearFilters}
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div
              className={`grid gap-4 ${
                reportType === "pending"
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
                  : "grid-cols-1 md:grid-cols-3"
              }`}
            >
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Search Records
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-9"
                  />
                  {searchTerm && (
                    <Button
                      onClick={() => setSearchTerm("")}
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>

              {reportType === "pending" && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    As on Date
                  </Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="h-9"
                  />
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Sales Person
                </Label>
                <Select
                  value={salesPersonFilter}
                  onValueChange={setSalesPersonFilter}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Sales Persons" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        All Sales Persons
                      </div>
                    </SelectItem>
                    {salesPersons.map((sp) => (
                      <SelectItem key={sp.uuid} value={sp.userCode}>
                        <div className="flex flex-col">
                          <span className="font-medium">{sp.name}</span>
                          <span className="text-xs text-gray-500">
                            {sp.userCode}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Client
                </Label>
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        All Clients
                      </div>
                    </SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.uuid} value={client.userCode}>
                        <div className="flex flex-col">
                          <span className="font-medium">{client.name}</span>
                          <span className="text-xs text-gray-500">
                            {client.userCode}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

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
                        Follow-up Message
                      </TableHead>
                      <TableHead className="font-medium text-gray-700 w-[130px]">
                        Next Follow-up
                      </TableHead>
                      <TableHead className="font-medium text-gray-700 w-[130px]">
                        Last Follow-up
                      </TableHead>
                      <TableHead className="font-medium text-gray-700 w-[100px]">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedFollowUps.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No records found for the selected criteria
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
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(
                                fu.nextFollowUpDate
                              ).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell className="align-center">
                            {fu.lastFollowUpDate ? (
                              <div className="text-sm text-gray-900">
                                {new Date(
                                  fu.lastFollowUpDate
                                ).toLocaleDateString()}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="align-center">
                            <Badge
                              variant="outline"
                              className={`text-xs font-medium ${
                                fu.followUpStatus?.toLowerCase() === "completed"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : fu.followUpStatus?.toLowerCase() ===
                                    "pending"
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
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
