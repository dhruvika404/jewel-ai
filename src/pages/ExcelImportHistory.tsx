import { useState, useEffect, useCallback } from "react";
import { formatDisplayDateWithTime } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TablePagination from "@/components/ui/table-pagination";
import { sharedAPI } from "@/services/api";
import { usePageHeader } from "@/contexts/PageHeaderProvider";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImportHistoryRecord {
  uuid: string;
  entityType: string;
  uploadedBy: string;
  createdAt: string;
  excelUploadingBy?: {
    uuid: string;
    name: string;
    userCode: string;
  };
}

export default function ExcelImportHistory() {
  const { setHeader } = usePageHeader();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ImportHistoryRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const loadHistoryData = useCallback(async () => {
    try {
      setLoading(true);
      setHistory([]);
      setTotalItems(0);

      const res = await sharedAPI.getExcelImportHistory({
        page: currentPage,
        size: pageSize,
      });

      if (res?.success === false) {
        throw new Error(res.message || "Failed to load history data");
      }

      const responseData = res?.data ?? res;
      if (responseData && Array.isArray(responseData.data)) {
        setHistory(responseData.data);
        setTotalItems(responseData.totalItems ?? responseData.data.length ?? 0);
      } else if (Array.isArray(responseData)) {
        setHistory(responseData);
        setTotalItems(responseData.length);
      } else {
        setHistory([]);
        setTotalItems(0);
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load history data";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    loadHistoryData();
  }, [loadHistoryData]);

  useEffect(() => {
    setHeader({
      title: "Excel Import History",
    });
  }, [setHeader]);

  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  return (
    <div className="bg-gray-50">
      <div className="p-6 space-y-6">
        <Card className="overflow-hidden">
          <Table containerClassName="max-h-[calc(100vh-304px)] overflow-auto">
            <TableHeader className="sticky top-0 z-20 bg-gray-50">
              <TableRow className="bg-gray-50">
                <TableHead className="font-medium text-gray-700 w-[200px] border-b border-gray-200">
                  Entity Type
                </TableHead>
                <TableHead className="font-medium text-gray-700 w-[250px] border-b border-gray-200">
                  Uploaded By
                </TableHead>
                <TableHead className="font-medium text-gray-700 border-b border-gray-200">
                  Last Upload Date
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="text-sm text-gray-500 mt-2">Loading history...</p>
                  </TableCell>
                </TableRow>
              ) : history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center text-gray-500">
                    No import history found.
                  </TableCell>
                </TableRow>
              ) : (
                history.map((record, index) => (
                  <TableRow key={record.uuid || index}>
                    <TableCell className="capitalize text-sm font-medium text-gray-900 border-b border-gray-100">
                      {record.entityType === 'sales_executive' ? 'Sales Executive' : record.entityType?.replace(/([A-Z])/g, ' $1').trim()}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 border-b border-gray-100">
                      {record.excelUploadingBy
                        ? `${record.excelUploadingBy.name} (${record.excelUploadingBy.userCode})`
                        : record.uploadedBy || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 border-b border-gray-100">
                      {formatDisplayDateWithTime(record.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="p-4 border-t bg-white flex items-center gap-4 justify-between">
            <div className="text-sm text-gray-600">
              Total:{" "}
              <span className="font-semibold text-gray-900">
                {loading ? "..." : totalItems}
              </span>
            </div>

            <div className="flex-1" />

            <div className="shrink-0">
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                pageSize={pageSize}
                setPageSize={setPageSize}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
