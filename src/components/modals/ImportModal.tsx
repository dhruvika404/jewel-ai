import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
} from "lucide-react";

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onImport: (file: File) => Promise<any>;
  isUploading: boolean;
  importResult: any;
  onClose: () => void;
}

export function ImportModal({
  open,
  onOpenChange,
  title,
  description = "Upload a file to import data",
  onImport,
  isUploading,
  importResult,
  onClose,
}: ImportModalProps) {
  const [fileFormat, setFileFormat] = useState("excel");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const getAcceptType = () => {
    switch (fileFormat) {
      case "csv":
        return ".csv";
      case "excel":
      default:
        return ".xlsx,.xls";
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    await onImport(uploadFile);
  };

  const handleClose = () => {
    setUploadFile(null);
    setFileFormat("excel");
    onClose();
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      handleClose();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className={`${importResult ? "max-w-4xl" : "max-w-md"}`}>
        <DialogHeader>
          <DialogTitle>
            {importResult ? "Import Processing Result" : title}
          </DialogTitle>
          <DialogDescription>
            {importResult ? "Import Processing Result" : description}
          </DialogDescription>
        </DialogHeader>

        {!importResult ? (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Select File Format
                </Label>
                <Select value={fileFormat} onValueChange={setFileFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select file format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excel">Excel (.xlsx, .xls)</SelectItem>
                    <SelectItem value="csv">CSV (.csv)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50/50 transition-colors cursor-pointer"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept={getAcceptType()}
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
            </div>
            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={handleClose}
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
                        {importResult.data?.failedRecords.map(
                          (record: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                {record.rowNo || index + 1}
                              </TableCell>
                              <TableCell className="text-sm text-red-600">
                                {record.reason ||
                                  record.error ||
                                  "Unknown error"}
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
              <Button onClick={handleClose} className="w-full">
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
