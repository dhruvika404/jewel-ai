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
import { formatDateForInput } from "@/lib/utils";

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientCode: string;
  order?: any;
  defaultSalesExecCode?: string;
}

export function NewOrderModal({
  isOpen,
  onClose,
  onSuccess,
  clientCode,
  order,
  defaultSalesExecCode,
}: NewOrderModalProps) {
  const { user } = useAuth();
  const isAdmin = user?.role !== "sales_executive";
  const [loading, setLoading] = useState(false);
  const [salesPersons, setSalesPersons] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    salesExecCode: (!order && defaultSalesExecCode) || (!order && user?.role === "sales_executive") ? user?.userCode || "" : (order?.salesExecCode || ""),
    clientCode: clientCode,
    lastSaleDate: "",
    lastOrderDate: "",
    nextFollowUpDate: "",
    status: "pending",
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
    if (order) {
      setFormData({
        salesExecCode: order.salesExecCode || "",
        clientCode: order.clientCode || clientCode,
        lastSaleDate: formatDateForInput(order.lastSaleDate),
        lastOrderDate: formatDateForInput(order.lastOrderDate),
        nextFollowUpDate: formatDateForInput(order.nextFollowUpDate),
        status: order.status || "pending",
      });
    } else {
      setFormData({
        salesExecCode: defaultSalesExecCode || "",
        clientCode: clientCode,
        lastSaleDate: "",
        lastOrderDate: "",
        nextFollowUpDate: "",
        status: "pending"
      });
    }
    setErrors({});
  }, [order, clientCode, isOpen]);

  const resetForm = () => {
    setFormData({
      salesExecCode: "",
      clientCode: clientCode,
      lastSaleDate: "",
      lastOrderDate: "",
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
    if (!formData.salesExecCode)
      newErrors.salesExecCode = "Sales Executive is required";
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
      if (order) {
        const { clientCode, salesExecCode, ...updatePayload } = formData;
        response = await newOrderAPI.update(order.uuid || order.id, updatePayload);
      } else {
        const { status, ...createPayload } = formData;
        const payload = filterEmptyFields(createPayload);
        response = await newOrderAPI.create(payload as any);
      }

      if (response && response.success === false) {
        toast.error(response.message || "Operation failed");
        return;
      }

      toast.success(
        response?.message ||
          (order
            ? "New order updated successfully"
            : "New order created successfully")
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
              disabled={!!order || !!defaultSalesExecCode}
            />
            <Input
              id="clientCode"
              label="Client Code"
              value={formData.clientCode}
              disabled
            />
          </div>

          {/* Category fields removed */}

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="lastSaleDate"
              label="Last Sale Date"
              type="date"
              value={formData.lastSaleDate}
              onChange={(e) =>
                setFormData({ ...formData, lastSaleDate: e.target.value })
              }
              onBlur={(e) => {
                const typedDate = e.target.value;
                const today = new Date().toISOString().split("T")[0];
                if (typedDate && typedDate > today) {
                  setErrors({
                    ...errors,
                    lastSaleDate: "Cannot select a future date",
                  });
                  setFormData({ ...formData, lastSaleDate: "" });
                }
              }}
              error={errors.lastSaleDate}
              max={new Date().toISOString().split("T")[0]}
            />
            <Input
              id="lastOrderDate"
              label="Last Order Date"
              type="date"
              value={formData.lastOrderDate}
              onChange={(e) =>
                setFormData({ ...formData, lastOrderDate: e.target.value })
              }
              onBlur={(e) => {
                const typedDate = e.target.value;
                const today = new Date().toISOString().split("T")[0];
                if (typedDate && typedDate > today) {
                  setErrors({
                    ...errors,
                    lastOrderDate: "Cannot select a future date",
                  });
                  setFormData({ ...formData, lastOrderDate: "" });
                }
              }}
              error={errors.lastOrderDate}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Input
                id="nextFollowUpDate"
                label="Next Follow-up Date"
                required
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={formData.nextFollowUpDate}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    nextFollowUpDate: e.target.value,
                  });
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
                disabled={!!order}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) =>
                  setFormData({ ...formData, status: val })
                }
                disabled={!!order}
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
