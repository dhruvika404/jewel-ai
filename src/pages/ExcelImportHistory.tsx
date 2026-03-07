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

  const loadHistoryData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await sharedAPI.getExcelImportHistory({ page: 1, size: 6 });

      if (res?.success === false) {
        throw new Error(res.message || "Failed to load history data");
      }
      const responseData = res?.data ?? res;
      setHistory(responseData?.data ?? responseData ?? []);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load history data";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistoryData();
  }, [loadHistoryData]);

  useEffect(() => {
    setHeader({
      title: "Excel Import History",
    });
  }, [setHeader]);

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="p-6">
        <Card className="overflow-hidden">
          <Table containerClassName="max-h-[calc(100vh-220px)] overflow-auto">
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
        </Card>
      </div>
    </div>
  );
}
