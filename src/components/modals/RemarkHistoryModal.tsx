import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, MessageSquare } from "lucide-react";
import { remarkAPI } from "@/services/api";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { formatDisplayDate } from "@/lib/utils";

interface RemarkHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  followUpTypeId: string;
  clientCode: string;
  clientName: string;
  salesExecCode: string;
  salesExecName?: string;
}

interface RemarkItem {
  id?: string;
  remarkMsg: string;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
}

export function RemarkHistoryModal({
  isOpen,
  onClose,
  followUpTypeId,
  clientCode,
  clientName,
  salesExecCode,
  salesExecName,
}: RemarkHistoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [remarkHistory, setRemarkHistory] = useState<RemarkItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    if (isOpen && followUpTypeId) {
      loadRemarkHistory();
    }
  }, [isOpen, followUpTypeId, currentPage]);

  const loadRemarkHistory = async () => {
    setLoading(true);
    try {
      const response = await remarkAPI.getByFollowUpTypeId({
        followUpTypeId,
        page: currentPage,
        size: pageSize,
      });

      if (response.success && response.data) {
        const remarks = Array.isArray(response.data.data)
          ? response.data.data
          : response.data.remarks || [];
        setRemarkHistory(remarks);

        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages || 1);
        } else if (response.data.totalCount) {
          setTotalPages(Math.ceil(response.data.totalCount / pageSize));
        }
      } else {
        setRemarkHistory([]);
      }
    } catch (error) {
      console.error("Error loading remark history:", error);
      setRemarkHistory([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Remark History
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-xs text-gray-600">Client Name</Label>
              <p className="font-medium text-gray-900">{clientName}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Client Code</Label>
              <p className="font-medium text-gray-900">{clientCode}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Sales Executive</Label>
              <p className="font-medium text-gray-900">
                {salesExecName || salesExecCode}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <Label className="font-semibold text-gray-900">
              Remark History ({remarkHistory.length})
            </Label>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : remarkHistory.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {remarkHistory.map((remark, index) => (
                  <div
                    key={remark.id || index}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {remark.remarkMsg}
                        </p>
                      </div>
                      {remark.createdAt && (
                        <span className="text-xs">
                          {formatDisplayDate(remark.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No remarks yet</p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages || loading}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
