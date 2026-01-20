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
import {
  newOrderAPI,
  pendingOrderAPI,
  pendingMaterialAPI,
} from "@/services/api";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateForInput } from "@/lib/utils";

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  type: "new-order" | "pending-order" | "pending-material";
  data: any;
}

export function FollowUpModal({
  isOpen,
  onClose,
  onSuccess,
  type,
  data,
}: FollowUpModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    salesExecCode: "",
    nextFollowUpDate: "",
    status: "",
    remark: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) {
      setFormData({
        salesExecCode: data.salesExecCode || data.salesExecutive || "",
        nextFollowUpDate: formatDateForInput(data.nextFollowUpDate),
        status: (data.status || "pending").toLowerCase(),
        remark: data.remark || "",
      });
      setErrors({});
    }
  }, [data, isOpen]);

  const resetForm = () => {
    setFormData({
      salesExecCode: "",
      nextFollowUpDate: "",
      status: "",
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
    if (formData.status === "pending") {
      if (!formData.nextFollowUpDate) {
        newErrors.nextFollowUpDate = "Next Follow-up Date is required for Pending status";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      const payload: any = {
        nextFollowUpDate: formData.nextFollowUpDate,
        status: formData.status,
        remark: formData.remark,
      };

      const id = data.uuid || data.id || data._id;

      let response;
      if (type === "new-order") {
        response = await newOrderAPI.update(id, payload);
      } else if (type === "pending-order") {
        response = await pendingOrderAPI.update(id, payload);
      } else if (type === "pending-material") {
        response = await pendingMaterialAPI.update(id, payload);
      }

      if (response && response.success === false) {
        toast.error(response.message || "Operation failed");
        return;
      }

      toast.success("Follow-up updated successfully");
      onSuccess();
      resetForm();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case "new-order":
        return "Edit New Order Follow-up";
      case "pending-order":
        return "Edit Pending Order Follow-up";
      case "pending-material":
        return "Edit Pending Material Follow-up";
      default:
        return "Edit Follow-up";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>Update follow-up details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="nextFollowUpDate"
            label="Next Follow-up Date"
            required={formData.status === "pending"}
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={formData.nextFollowUpDate}
            onChange={(e) => {
              setFormData({ ...formData, nextFollowUpDate: e.target.value })
              if (errors.nextFollowUpDate) setErrors({ ...errors, nextFollowUpDate: "" })
            }}
            error={errors.nextFollowUpDate}
          />
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(val) => setFormData({ ...formData, status: val })}
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

          <div className="space-y-2">
            <Label htmlFor="remark">Remark</Label>
            <Textarea
              id="remark"
              value={formData.remark}
              onChange={(e) =>
                setFormData({ ...formData, remark: e.target.value })
              }
              placeholder="Enter follow-up notes"
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
              Update
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
