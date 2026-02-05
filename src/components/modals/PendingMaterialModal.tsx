import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { pendingMaterialAPI, salesPersonAPI } from "@/services/api";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { formatDateForInput } from "@/lib/utils";

interface PendingMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientCode: string;
  material?: any;
  defaultSalesExecCode?: string;
}

export function PendingMaterialModal({
  isOpen,
  onClose,
  onSuccess,
  clientCode,
  material,
  defaultSalesExecCode,
}: PendingMaterialModalProps) {
  const { user } = useAuth();
  const isAdmin = user?.role !== "sales_executive";
  const [loading, setLoading] = useState(false);
  const [salesPersons, setSalesPersons] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    salesExecCode: (!material && defaultSalesExecCode) || (!material && user?.role === "sales_executive") ? user?.userCode || "" : (material?.salesExecCode || ""),
    clientCode: clientCode,
    styleNo: "",
    orderNo: "",
    orderDate: "",
    lastMovementDate: "",
    expectedDeliveryDate: "",
    departmentName: "",
    totalNetWt: "",
    nextFollowUpDate: "",
    status: "pending",
    remark: "",
  });
  const [spSearchQuery, setSpSearchQuery] = useState("");
  const debouncedSpSearchQuery = useDebounce(spSearchQuery, 500);
  const [isSpLoading, setIsSpLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadSalesPersons = async (search?: string) => {
      try {
        if (!isAdmin) return;
        setIsSpLoading(true);
        const response = await salesPersonAPI.getAll({
          page: 1,
          size: 1000,
          role: "sales_executive",
          search: search,
        });
        if (response.success && response.data?.data) {
          setSalesPersons(response.data.data);
        }
      } catch (error) {
        console.error("Error loading sales persons:", error);
      } finally {
        setIsSpLoading(false);
      }
    };

    loadSalesPersons(debouncedSpSearchQuery);
  }, [debouncedSpSearchQuery]);

  useEffect(() => {
    if (material) {
      setFormData({
        salesExecCode: material.salesExecCode || "",
        clientCode: material.clientCode || clientCode,
        styleNo: material.styleNo || "",
        orderNo: material.orderNo || "",
        orderDate: formatDateForInput(material.orderDate),
        lastMovementDate: formatDateForInput(material.lastMovementDate),
        expectedDeliveryDate: formatDateForInput(material.expectedDeliveryDate),
        departmentName: material.departmentName || "",
        totalNetWt: material.totalNetWt || "",
        nextFollowUpDate: formatDateForInput(material.nextFollowUpDate),
        status: material.status || "pending",
        remark: material.remark || "",
      });
    } else {
      setFormData({
        salesExecCode: defaultSalesExecCode || "",
        clientCode: clientCode,
        styleNo: "",
        orderNo: "",
        orderDate: "",
        lastMovementDate: "",
        expectedDeliveryDate: "",
        departmentName: "",
        totalNetWt: "",
        nextFollowUpDate: "",
        status: "pending",
        remark: "",
      });
    }
    setErrors({});
  }, [material, clientCode, isOpen]);

  const resetForm = () => {
    setFormData({
      salesExecCode: "",
      clientCode: clientCode,
      styleNo: "",
      orderNo: "",
      orderDate: "",
      lastMovementDate: "",
      expectedDeliveryDate: "",
      departmentName: "",
      totalNetWt: "",
      nextFollowUpDate: "",
      status: "pending",
      remark: "",
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.salesExecCode)
      newErrors.salesExecCode = "Sales Executive is required";
    if (!formData.styleNo) newErrors.styleNo = "Style No is required";
    if (!formData.orderNo) newErrors.orderNo = "Order No is required";
    if (!formData.orderDate) newErrors.orderDate = "Order Date is required";
    if (!formData.lastMovementDate)
      newErrors.lastMovementDate = "Last Movement Date is required";
    if (!formData.departmentName)
      newErrors.departmentName = "Department Name is required";
    if (!formData.totalNetWt) newErrors.totalNetWt = "Total Net Wt is required";
    if (!formData.expectedDeliveryDate)
      newErrors.expectedDeliveryDate = "Expected delivery date is required";
    if (!formData.nextFollowUpDate)
      newErrors.nextFollowUpDate = "Next follow-up date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const filterEmptyFields = (data: Record<string, any>) => {
      const cleanData: Record<string, any> = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
          cleanData[key] = value;
        }
      });
      return cleanData;
    };

    setLoading(true);
    try {
      let response;
      if (material) {
        const { clientCode, salesExecCode, ...updatePayload } = formData;
        response = await pendingMaterialAPI.update(
          material.uuid || material.id,
          updatePayload,
        );
      } else {
        const { status, ...createPayload } = formData;
        const payload = filterEmptyFields(createPayload);
        response = await pendingMaterialAPI.create(payload as any);
      }

      if (response && response.success === false) {
        toast.error(response.message || "Operation failed");
        return;
      }

      toast.success(
        response?.message ||
          (material
            ? "Pending material updated successfully"
            : "Pending material created successfully")
      );
      onSuccess();
      resetForm();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {material ? "Edit" : "Add"} Pending Material
          </DialogTitle>
          <DialogDescription>
            {material
              ? "Update the pending material details"
              : "Create a new pending material record"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Combobox
              label="Sales Executive"
              required
              options={salesPersons.map((sp) => ({
                value: sp.userCode,
                label: sp.name ? `${sp.name} (${sp.userCode})` : sp.userCode,
              }))}
              value={formData.salesExecCode}
              onSelect={(val) => {
                setFormData({ ...formData, salesExecCode: val });
                if (errors.salesExecCode)
                  setErrors({ ...errors, salesExecCode: "" });
              }}
              onSearchChange={setSpSearchQuery}
              loading={isSpLoading}
              placeholder="Select sales executive"
              searchPlaceholder="Search sales executive..."
              error={errors.salesExecCode}
              className="!h-full"
              disabled={!!material || !!defaultSalesExecCode}
            />
            <Input
              id="clientCode"
              label="Client Code"
              value={formData.clientCode}
              disabled
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="styleNo"
              label="Style No"
              required
              value={formData.styleNo}
              onChange={(e) => {
                setFormData({ ...formData, styleNo: e.target.value });
                if (errors.styleNo) setErrors({ ...errors, styleNo: "" });
              }}
              placeholder="e.g. 67GBB"
              error={errors.styleNo}
            />
            <Input
              id="orderNo"
              label="Order No"
              required
              value={formData.orderNo}
              onChange={(e) => {
                setFormData({ ...formData, orderNo: e.target.value });
                if (errors.orderNo) setErrors({ ...errors, orderNo: "" });
              }}
              placeholder="e.g. ORD-1001"
              error={errors.orderNo}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="orderDate"
              label="Order Date"
              type="date"
              required
              value={formData.orderDate}
              onChange={(e) => {
                setFormData({ ...formData, orderDate: e.target.value });
                if (errors.orderDate) setErrors({ ...errors, orderDate: "" });
              }}
              onBlur={(e) => {
                const typedDate = e.target.value;
                const today = new Date().toISOString().split("T")[0];
                if (typedDate && typedDate > today) {
                  setErrors({
                    ...errors,
                    orderDate: "Cannot select a future date",
                  });
                  setFormData({ ...formData, orderDate: "" });
                }
              }}
              error={errors.orderDate}
              max={new Date().toISOString().split("T")[0]}
            />
            <Input
              id="lastMovementDate"
              label="Last Movement Date"
              type="date"
              required
              value={formData.lastMovementDate}
              onChange={(e) => {
                setFormData({ ...formData, lastMovementDate: e.target.value });
                if (errors.lastMovementDate)
                  setErrors({ ...errors, lastMovementDate: "" });
              }}
              onBlur={(e) => {
                const typedDate = e.target.value;
                const today = new Date().toISOString().split("T")[0];
                if (typedDate && typedDate > today) {
                  setErrors({
                    ...errors,
                    lastMovementDate: "Cannot select a future date",
                  });
                  setFormData({ ...formData, lastMovementDate: "" });
                }
              }}
              error={errors.lastMovementDate}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="departmentName"
              label="Department Name"
              required
              value={formData.departmentName}
              onChange={(e) => {
                setFormData({ ...formData, departmentName: e.target.value });
                if (errors.departmentName)
                  setErrors({ ...errors, departmentName: "" });
              }}
              placeholder="e.g. diamond"
              error={errors.departmentName}
            />
            <Input
              id="totalNetWt"
              label="Total Net Weight"
              required
              type="number"
              step="0.01"
              value={formData.totalNetWt}
              onChange={(e) => {
                setFormData({ ...formData, totalNetWt: e.target.value });
                if (errors.totalNetWt) setErrors({ ...errors, totalNetWt: "" });
              }}
              placeholder="e.g. 10.57"
              error={errors.totalNetWt}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="expectedDeliveryDate"
              label="Expected Delivery Date"
              required
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={formData.expectedDeliveryDate}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  expectedDeliveryDate: e.target.value,
                });
                if (errors.expectedDeliveryDate)
                  setErrors({ ...errors, expectedDeliveryDate: "" });
              }}
              onBlur={(e) => {
                const typedDate = e.target.value;
                const today = new Date().toISOString().split("T")[0];
                if (typedDate && typedDate < today) {
                  setErrors({
                    ...errors,
                    expectedDeliveryDate: "Cannot select a past date",
                  });
                  setFormData({ ...formData, expectedDeliveryDate: "" });
                }
              }}
              error={errors.expectedDeliveryDate}
            />
            <Input
              id="nextFollowUpDate"
              label="Next Follow-up Date"
              required
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={formData.nextFollowUpDate}
              onChange={(e) => {
                setFormData({ ...formData, nextFollowUpDate: e.target.value });
                if (errors.nextFollowUpDate)
                  setErrors({ ...errors, nextFollowUpDate: "" });
              }}
              onBlur={(e) => {
                const typedDate = e.target.value;
                const today = new Date().toISOString().split("T")[0];
                if (typedDate && typedDate < today) {
                  setErrors({
                    ...errors,
                    nextFollowUpDate: "Cannot select a past date",
                  });
                  setFormData({ ...formData, nextFollowUpDate: "" });
                }
              }}
              error={errors.nextFollowUpDate}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) =>
                  setFormData({ ...formData, status: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              id="remark"
              label="Remark"
              value={formData.remark}
              onChange={(e) =>
                setFormData({ ...formData, remark: e.target.value })
              }
              placeholder="Enter remark"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {material ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
