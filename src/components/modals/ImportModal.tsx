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
  onClose: () => void;
}

export function ImportModal({
  open,
  onOpenChange,
  title,
  description = "Upload a file to import data",
  onImport,
  isUploading,
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

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
     
      </DialogContent>
    </Dialog>
  );
}
