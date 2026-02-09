import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  pendingMaterialAPI,
  pendingOrderAPI,
  newOrderAPI,
} from "@/services/api";
import { toast } from "sonner";

interface AddFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordType: "new-order" | "pending-order" | "pending-material";
  recordId: string;
  clientName?: string;
  onSuccess?: () => void;
}

export function AddFollowUpModal({
  isOpen,
  onClose,
  recordType,
  recordId,
  clientName,
  onSuccess,
}: AddFollowUpModalProps) {
  const [formData, setFormData] = useState({
    followUpMsg: "",
    nextFollowUpDate: "",
    followUpStatus: "pending",
    remark: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    if (!submitting) {
      setFormData({
        followUpMsg: "",
        nextFollowUpDate: "",
        followUpStatus: "pending",
        remark: "",
      });
      setErrors({});
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.followUpMsg) newErrors.followUpMsg = "Message is required";
    if (formData.followUpStatus === "pending" && !formData.nextFollowUpDate)
      newErrors.nextFollowUpDate = "Next Date is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      let response;

      if (recordType === "pending-material") {
        response = await pendingMaterialAPI.addFollowUp({
          pendingMaterialRecordId: recordId,
          followUpMsg: formData.followUpMsg,
          nextFollowUpDate: formData.nextFollowUpDate,
          status: formData.followUpStatus,
          remark: formData.remark,
        });
      } else if (recordType === "pending-order") {
        response = await pendingOrderAPI.addFollowUp({
          pendingOrderId: recordId,
          followUpMsg: formData.followUpMsg,
          nextFollowUpDate: formData.nextFollowUpDate,
          status: formData.followUpStatus,
          remark: formData.remark,
        });
      } else {
        response = await newOrderAPI.addFollowUp({
          newOrderRecordId: recordId,
          followUpMsg: formData.followUpMsg,
          nextFollowUpDate: formData.nextFollowUpDate,
          status: formData.followUpStatus,
          remark: formData.remark,
        });
      }

      if (response?.success === false) {
        toast.error(response?.message || "Failed to add follow-up");
      } else {
        toast.success("Follow-up added successfully");
        handleClose();
        if (onSuccess) onSuccess();
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to add follow-up");
    } finally {
      setSubmitting(false);
    }
  };

  const getModalTitle = () => {
    const typeMap = {
      "pending-material": "Pending Material",
      "pending-order": "Pending Order",
      "new-order": "New Order",
    };
    return `Add ${typeMap[recordType]} Follow-up`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-md"
        onPointerDownOutside={(e) => {
          if (submitting) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (submitting) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
          <DialogDescription>
            {clientName
              ? `Add follow-up for ${clientName}`
              : "Enter follow-up details"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            <Select
              value={formData.followUpStatus}
              onValueChange={(val) =>
                setFormData({
                  ...formData,
                  followUpStatus: val,
                  nextFollowUpDate:
                    val === "completed" ? "" : formData.nextFollowUpDate,
                })
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

          <div className="space-y-2">
            <Input
              id="date"
              type="date"
              label="Next Follow-up Date"
              required={formData.followUpStatus === "pending"}
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
              error={errors.nextFollowUpDate}
              disabled={formData.followUpStatus === "completed"}
            />
          </div>

          <div className="space-y-2">
            <Textarea
              id="followUpMsg"
              label="Follow-up Message"
              required
              value={formData.followUpMsg}
              onChange={(e) => {
                setFormData({ ...formData, followUpMsg: e.target.value });
                if (errors.followUpMsg)
                  setErrors({ ...errors, followUpMsg: "" });
              }}
              placeholder="Enter follow-up notes"
              rows={3}
              error={errors.followUpMsg}
            />
          </div>

          <div className="space-y-2">
            <Textarea
              id="remark"
              label="Remark"
              value={formData.remark}
              onChange={(e) => {
                setFormData({ ...formData, remark: e.target.value });
              }}
              placeholder="Enter additional remarks"
              rows={2}
              maxLength={255}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
