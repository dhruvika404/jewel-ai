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
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { newOrderAPI, salesPersonAPI } from "@/services/api";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Textarea } from "@/components/ui/textarea";
import { formatDateForInput } from "@/lib/utils";

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientCode: string;
  order?: any;
}

export function NewOrderModal({
  isOpen,
  onClose,
  onSuccess,
  clientCode,
  order,
}: NewOrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [salesPersons, setSalesPersons] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    salesExecCode: "",
    clientCode: clientCode,
    subCategory: "",
    lastSaleDate: "",
    lastOrderDate: "",
    clientCategoryName: "",
    nextFollowUpDate: "",
    status: "pending",
    remark: "",
  });

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
        subCategory: order.subCategory || "",
        lastSaleDate: formatDateForInput(order.lastSaleDate),
        lastOrderDate: formatDateForInput(order.lastOrderDate),
        clientCategoryName: order.clientCategoryName || "",
        nextFollowUpDate: formatDateForInput(order.nextFollowUpDate),
        status: order.status || "pending",
        remark: order.remark || "",
      });
    } else {
      setFormData({
        salesExecCode: "",
        clientCode: clientCode,
        subCategory: "",
        lastSaleDate: "",
        lastOrderDate: "",
        clientCategoryName: "",
        nextFollowUpDate: "",
        status: "pending",
        remark: "",
      });
    }
  }, [order, clientCode, isOpen]);

  const resetForm = () => {
    setFormData({
      salesExecCode: "",
      clientCode: clientCode,
      subCategory: "",
      lastSaleDate: "",
      lastOrderDate: "",
      clientCategoryName: "",
      nextFollowUpDate: "",
      status: "pending",
      remark: "",
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.salesExecCode ||
      !formData.subCategory ||
      !formData.clientCategoryName
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      let response;
      if (order) {
        response = await newOrderAPI.update(order.uuid || order.id, formData);
      } else {
        response = await newOrderAPI.create(formData);
      }

      if (response && response.success === false) {
        toast.error(response.message || "Operation failed");
        return;
      }

      toast.success(
        order
          ? "New order updated successfully"
          : "New order created successfully"
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
          <DialogTitle>{order ? "Edit" : "Add"} New Order</DialogTitle>
          <DialogDescription>
            {order
              ? "Update the new order details"
              : "Create a new order record"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salesExecCode">Sales Executive *</Label>
              <Combobox
                options={salesPersons.map((sp) => ({
                    value: sp.userCode,
                    label: `${sp.name} (${sp.userCode})`,
                }))}
                value={formData.salesExecCode}
                onSelect={(val) =>
                  setFormData({ ...formData, salesExecCode: val })
                }
                placeholder="Select sales executive"
                searchPlaceholder="Search sales executive..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientCode">Client Code</Label>
              <Input id="clientCode" value={formData.clientCode} disabled />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientCategoryName">Client Category Name *</Label>
              <Input
                id="clientCategoryName"
                value={formData.clientCategoryName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    clientCategoryName: e.target.value,
                  })
                }
                placeholder="e.g. diamond"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subCategory">Sub Category *</Label>
              <Input
                id="subCategory"
                value={formData.subCategory}
                onChange={(e) =>
                  setFormData({ ...formData, subCategory: e.target.value })
                }
                placeholder="e.g. 67GBB"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lastSaleDate">Last Sale Date</Label>
              <Input
                id="lastSaleDate"
                type="date"
                value={formData.lastSaleDate}
                onChange={(e) =>
                  setFormData({ ...formData, lastSaleDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastOrderDate">Last Order Date</Label>
              <Input
                id="lastOrderDate"
                type="date"
                value={formData.lastOrderDate}
                onChange={(e) =>
                  setFormData({ ...formData, lastOrderDate: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nextFollowUpDate">Next Follow-up Date</Label>
              <Input
                id="nextFollowUpDate"
                type="date"
                value={formData.nextFollowUpDate}
                onChange={(e) =>
                  setFormData({ ...formData, nextFollowUpDate: e.target.value })
                }
              />
            </div>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="remark">Remark</Label>
            <Textarea
              id="remark"
              value={formData.remark}
              onChange={(e) =>
                setFormData({ ...formData, remark: e.target.value })
              }
              placeholder="Enter any remarks or notes"
              rows={3}
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
