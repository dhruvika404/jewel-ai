import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  salesPersonAPI,
  clientAPI,
  pendingOrderAPI,
  pendingMaterialAPI,
  newOrderAPI,
} from "@/services/api";

const Progress = ({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div
      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
      style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
    />
  </div>
);

interface UploadItem {
  id: string;
  name: string;
  description: string;
  apiFunction: (file: File) => Promise<any>;
  acceptedFiles: string;
}

const uploadItems: UploadItem[] = [
  {
    id: "sales-person",
    name: "Sales Person Master",
    description: "Upload sales person data",
    apiFunction: salesPersonAPI.import,
    acceptedFiles: ".xlsx,.xls",
  },
  {
    id: "client",
    name: "Client Master",
    description: "Upload client data",
    apiFunction: clientAPI.import,
    acceptedFiles: ".xlsx,.xls",
  },
  {
    id: "pending-order",
    name: "Pending Orders",
    description: "Upload pending order data",
    apiFunction: pendingOrderAPI.import,
    acceptedFiles: ".xlsx,.xls",
  },
  {
    id: "pending-material",
    name: "Pending Materials (WIP)",
    description: "Upload pending material data",
    apiFunction: pendingMaterialAPI.import,
    acceptedFiles: ".xlsx,.xls",
  },
  {
    id: "new-order",
    name: "New Order Followup",
    description: "Upload new order followup data",
    apiFunction: newOrderAPI.import,
    acceptedFiles: ".xlsx,.xls",
  },
];

interface UploadStatus {
  [key: string]: {
    status: "idle" | "uploading" | "success" | "error";
    progress: number;
    message?: string;
  };
}

export default function ExcelUpload() {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({});
  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: File }>(
    {}
  );
  const [fileBlobs, setFileBlobs] = useState<{
    [key: string]: { blob: Blob; name: string; type: string };
  }>({});

  const handleFileSelect = (itemId: string, file: File | null) => {
    if (file) {
      if (file.size === 0) {
        toast.error("Selected file is empty");
        return;
      }

      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        toast.error("Please select an Excel file (.xlsx or .xls)");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (arrayBuffer && arrayBuffer.byteLength > 0) {
          const blob = new Blob([arrayBuffer], { type: file.type });
          setSelectedFiles((prev) => ({ ...prev, [itemId]: file }));
          setFileBlobs((prev) => ({
            ...prev,
            [itemId]: {
              blob,
              name: file.name,
              type: file.type,
            },
          }));

          setUploadStatus((prev) => ({
            ...prev,
            [itemId]: { status: "idle", progress: 0 },
          }));

          toast.success(`File "${file.name}" selected and content preserved`);
        } else {
          toast.error("Selected file cannot be read or is empty");
        }
      };

      reader.onerror = () => {
        toast.error("Error reading selected file");
      };

      reader.readAsArrayBuffer(file);
    } else {
      setSelectedFiles((prev) => {
        const newFiles = { ...prev };
        delete newFiles[itemId];
        return newFiles;
      });
      setFileBlobs((prev) => {
        const newBlobs = { ...prev };
        delete newBlobs[itemId];
        return newBlobs;
      });
      setUploadStatus((prev) => {
        const newStatus = { ...prev };
        delete newStatus[itemId];
        return newStatus;
      });
    }
  };

  const handleUpload = async (item: UploadItem) => {
    const fileBlob = fileBlobs[item.id];

    setUploadStatus((prev) => ({
      ...prev,
      [item.id]: { status: "uploading", progress: 0 },
    }));

    try {
      const progressInterval = setInterval(() => {
        setUploadStatus((prev) => ({
          ...prev,
          [item.id]: {
            ...prev[item.id],
            progress: Math.min(prev[item.id]?.progress + 10, 90),
          },
        }));
      }, 200);

      const preservedFile = new File([fileBlob.blob], fileBlob.name, {
        type: fileBlob.type,
        lastModified: Date.now(),
      });

      const result = await item.apiFunction(preservedFile);
      clearInterval(progressInterval);

      const isSuccess =
        result.success !== false && !result.error && result.status !== "error";

      if (isSuccess) {
        setUploadStatus((prev) => ({
          ...prev,
          [item.id]: {
            status: "success",
            progress: 100,
            message: result.message || "Upload completed successfully",
          },
        }));
        toast.success(`${item.name} uploaded successfully`);
      } else {
        throw new Error(result.message || result.error || "Upload failed");
      }
    } catch (error: any) {
      setUploadStatus((prev) => ({
        ...prev,
        [item.id]: {
          status: "error",
          progress: 0,
          message: error.message || "Upload failed",
        },
      }));
      toast.error(`Failed to upload ${item.name}: ${error.message}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "uploading":
        return <AlertCircle className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <FileSpreadsheet className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "border-green-200 bg-green-50";
      case "error":
        return "border-red-200 bg-red-50";
      case "uploading":
        return "border-blue-200 bg-blue-50";
      default:
        return "border-gray-200 bg-white";
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Excel Data Import
        </h2>
        <p className="text-gray-600">
          Upload your Excel files to import data into the system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {uploadItems.map((item) => {
          const status = uploadStatus[item.id];
          const file = selectedFiles[item.id];

          return (
            <Card
              key={item.id}
              className={`transition-all duration-200 ${getStatusColor(
                status?.status || "idle"
              )}`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {getStatusIcon(status?.status || "idle")}
                  {item.name}
                </CardTitle>
                <p className="text-sm text-gray-600">{item.description}</p>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <input
                    type="file"
                    accept={item.acceptedFiles}
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0] || null;

                      if (selectedFile) {
                        handleFileSelect(item.id, selectedFile);
                      }
                    }}
                    className="hidden"
                    id={`file-${item.id}`}
                    key={`${item.id}-${file?.name || "empty"}`}
                  />
                  <label
                    htmlFor={`file-${item.id}`}
                    className={`flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      file
                        ? "border-green-300 bg-green-50 hover:border-green-400"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <div className="text-center">
                      <Upload
                        className={`h-8 w-8 mx-auto mb-2 ${
                          file ? "text-green-500" : "text-gray-400"
                        }`}
                      />
                      <p className="text-sm text-gray-600">
                        {file ? `✓ ${file.name}` : "Choose Excel file"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Supports .xlsx, .xls files
                      </p>
                      {file && (
                        <div className="text-xs text-gray-500 mt-1 space-y-1">
                          <p>Size: {(file.size / 1024).toFixed(2)} KB</p>
                          <p>Type: {file.type}</p>
                        </div>
                      )}
                    </div>
                  </label>

                  {file && (
                    <Button
                      onClick={() => {
                        handleFileSelect(item.id, null);
                        const input = document.getElementById(
                          `file-${item.id}`
                        ) as HTMLInputElement;
                        if (input) input.value = "";
                      }}
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 text-xs text-red-600 hover:text-red-700"
                    >
                      Remove File
                    </Button>
                  )}
                </div>

                {status?.status === "uploading" && (
                  <div className="space-y-2">
                    <Progress value={status.progress} className="w-full" />
                    <p className="text-xs text-center text-gray-600">
                      Uploading... {status.progress}%
                    </p>
                  </div>
                )}

                {status?.message && (
                  <p
                    className={`text-xs text-center ${
                      status.status === "success"
                        ? "text-green-600"
                        : status.status === "error"
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {status.message}
                  </p>
                )}

                <Button
                  onClick={() => handleUpload(item)}
                  disabled={!file || status?.status === "uploading"}
                  className="w-full"
                  variant={status?.status === "success" ? "outline" : "default"}
                >
                  {status?.status === "uploading"
                    ? "Uploading..."
                    : status?.status === "success"
                    ? "Upload Again"
                    : "Upload"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
