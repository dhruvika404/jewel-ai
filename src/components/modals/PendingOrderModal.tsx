import { useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react";
import { pendingOrderAPI, salesPersonAPI } from "@/services/api";
import { toast } from "sonner";
import { Combobox } from "@/components/ui/combobox";
import { formatDateForInput } from "@/lib/utils";

interface PendingOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientCode: string;
  order?: any;
}

export function PendingOrderModal({
  isOpen,
  onClose,
  onSuccess,
  clientCode,
  order,
}: PendingOrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [salesPersons, setSalesPersons] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    salesExecCode: "",
    clientCode: clientCode,
    orderNo: "",
    orderDate: "",
    grossWtTotal: "",
    totalOrderPcs: "",
    pendingPcs: "",
    remark: "",
    nextFollowUpDate: "",
    status: "pending",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadSalesPersons = async () => {
      try {
        const response = await salesPersonAPI.getAll({
          page: 1,
          size: 1000,
          role: "sales_executive",
        });
        if (response.success && response.data?.data) {
          setSalesPersons(response.data.data);
        }
      } catch (error) {
        console.error("Error loading sales persons:", error);
      }
    };
    loadSalesPersons();
  }, []);

  useEffect(() => {
    if (order) {
      setFormData({
        salesExecCode: order.salesExecCode || "",
        clientCode: order.clientCode || clientCode,
        orderNo: order.orderNo || "",
        orderDate: formatDateForInput(order.orderDate),
        grossWtTotal: order.grossWtTotal?.toString() || "",
        totalOrderPcs: order.totalOrderPcs?.toString() || "",
        pendingPcs: order.pendingPcs?.toString() || "",
        remark: order.remark || "",
        nextFollowUpDate: formatDateForInput(order.nextFollowUpDate),
        status: order.status || "pending",
      });
    } else {
      setFormData({
        salesExecCode: "",
        clientCode: clientCode,
        orderNo: "",
        orderDate: "",
        grossWtTotal: "",
        totalOrderPcs: "",
        pendingPcs: "",
        remark: "",
        nextFollowUpDate: "",
        status: "pending",
      });
    }
    setErrors({});
  }, [order, clientCode, isOpen]);

  const resetForm = () => {
    setFormData({
      salesExecCode: "",
      clientCode: clientCode,
      orderNo: "",
      orderDate: "",
      grossWtTotal: "",
      totalOrderPcs: "",
      pendingPcs: "",
      remark: "",
      nextFollowUpDate: "",
      status: "pending",
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.salesExecCode) newErrors.salesExecCode = "Sales Executive is required";
    if (!formData.orderNo) newErrors.orderNo = "Order No is required";
    if (!formData.orderDate) newErrors.orderDate = "Order Date is required";
    if (!formData.grossWtTotal) newErrors.grossWtTotal = "Gross Weight is required";
    if (!formData.totalOrderPcs) newErrors.totalOrderPcs = "Total Order Pcs is required";
    if (!formData.pendingPcs) newErrors.pendingPcs = "Pending Pcs is required";
    if (!formData.nextFollowUpDate) newErrors.nextFollowUpDate = "Next Follow-up Date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const filterEmptyFields = (data: Record<string, any>) => {
      const cleanData: Record<string, any> = {}
      Object.entries(data).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          cleanData[key] = value
        }
      })
      return cleanData
    }

    setLoading(true);
    try {
      const initialPayload: any = {
        salesExecCode: formData.salesExecCode,
        clientCode: formData.clientCode,
        orderNo: formData.orderNo,
        orderDate: formData.orderDate,
        grossWtTotal: formData.grossWtTotal,
        totalOrderPcs: Number(formData.totalOrderPcs),
        pendingPcs: Number(formData.pendingPcs),
        remark: formData.remark,
        nextFollowUpDate: formData.nextFollowUpDate,
      };

      const payload = filterEmptyFields(initialPayload)

      let response;
      if (order) {
        response = await pendingOrderAPI.update(
          order.uuid || order.id,
          payload
        );
      } else {
        response = await pendingOrderAPI.create(payload as any);
      }

      if (response && response.success === false) {
        toast.error(response.message || "Operation failed");
        return;
      }

      toast.success(
        order
          ? "Pending order updated successfully"
          : "Pending order created successfully"
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
          <DialogTitle>{order ? "Edit" : "Add"} Pending Order</DialogTitle>
          <DialogDescription>
            {order
              ? "Update the pending order details"
              : "Create a new pending order record"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Combobox
              label="Sales Executive"
              required
              options={salesPersons.map((sp) => ({
                  value: sp.userCode,
                  label: `${sp.name} (${sp.userCode})`,
              }))}
              value={formData.salesExecCode}
              onSelect={(val) => {
                setFormData({ ...formData, salesExecCode: val })
                if (errors.salesExecCode) setErrors({ ...errors, salesExecCode: "" })
              }}
              placeholder="Select sales executive"
              searchPlaceholder="Search sales executive..."
              error={errors.salesExecCode}
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
              id="orderNo"
              label="Order No"
              required
              value={formData.orderNo}
              onChange={(e) => {
                setFormData({ ...formData, orderNo: e.target.value })
                if (errors.orderNo) setErrors({ ...errors, orderNo: "" })
              }}
              placeholder="e.g. ORD-1001"
              error={errors.orderNo}
            />
            <Input
              id="orderDate"
              label="Order Date"
              required
              type="date"
              value={formData.orderDate}
              onChange={(e) => {
                setFormData({ ...formData, orderDate: e.target.value })
                if (errors.orderDate) setErrors({ ...errors, orderDate: "" })
              }}
              error={errors.orderDate}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="totalOrderPcs"
              label="Total Order Pcs"
              required
              type="number"
              value={formData.totalOrderPcs}
              onChange={(e) => {
                setFormData({ ...formData, totalOrderPcs: e.target.value })
                if (errors.totalOrderPcs) setErrors({ ...errors, totalOrderPcs: "" })
              }}
              placeholder="e.g. 100"
              error={errors.totalOrderPcs}
            />
            <Input
              id="pendingPcs"
              label="Pending Pcs"
              required
              type="number"
              value={formData.pendingPcs}
              onChange={(e) => {
                setFormData({ ...formData, pendingPcs: e.target.value })
                if (errors.pendingPcs) setErrors({ ...errors, pendingPcs: "" })
              }}
              placeholder="e.g. 50"
              error={errors.pendingPcs}
            />
            <Input
              id="nextFollowUpDate"
              label="Next Follow-up Date"
              required
              type="date"
              value={formData.nextFollowUpDate}
              onChange={(e) => {
                setFormData({ ...formData, nextFollowUpDate: e.target.value })
                if (errors.nextFollowUpDate) setErrors({ ...errors, nextFollowUpDate: "" })
              }}
              error={errors.nextFollowUpDate}
            />
            <Input
              id="grossWtTotal"
              label="Gross Weight Total"
              required
              type="number"
              step="0.01"
              value={formData.grossWtTotal}
              onChange={(e) => {
                setFormData({ ...formData, grossWtTotal: e.target.value })
                if (errors.grossWtTotal) setErrors({ ...errors, grossWtTotal: "" })
              }}
              placeholder="e.g. 125.75"
              error={errors.grossWtTotal}
            />
            <Input
              id="remark"
              label="Remark"
              value={formData.remark}
              onChange={(e) =>
                setFormData({ ...formData, remark: e.target.value })
              }
              placeholder="Enter any remarks or notes"
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
              {order ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
