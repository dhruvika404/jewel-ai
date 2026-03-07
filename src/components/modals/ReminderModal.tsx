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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Bell } from "lucide-react";
import { salesPersonAPI, sharedAPI } from "@/services/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
  entityType: string;
  defaultSalesPersonId?: string;
  onSuccess?: () => void;
}

interface SalesPerson {
  uuid: string;
  userCode: string;
  name: string;
}

export function ReminderModal({
  isOpen,
  onClose,
  entityId,
  entityType,
  defaultSalesPersonId,
  onSuccess,
}: ReminderModalProps) {
  const [formData, setFormData] = useState({
    userId: "",
    task: "",
    reminderTime: "",
  });
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([]);
  const [loadingSalesPersons, setLoadingSalesPersons] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { user } = useAuth();
  const isSalesPerson = user?.role === "sales_executive";

  useEffect(() => {
    if (isOpen) {
      if (!isSalesPerson) {
        loadSalesPersons();
      }
      const now = new Date();
      setFormData({
        userId: isSalesPerson ? (user?.uuid || user?.id || "") : (defaultSalesPersonId || ""),
        task: "",
        reminderTime: format(now, "yyyy-MM-dd'T'HH:mm"),
      });
      setErrors({});
    }
  }, [isOpen, defaultSalesPersonId, isSalesPerson, user?.uuid, user?.id]);

  const loadSalesPersons = async () => {
    try {
      setLoadingSalesPersons(true);
      const res = await salesPersonAPI.getAll({
        page: 1,
        size: 500,
        role: "sales_executive",
      });
      if (res.success && res.data?.data) {
        setSalesPersons(res.data.data);
      }
    } catch (error) {
      console.error("Error loading sales persons:", error);
    } finally {
      setLoadingSalesPersons(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const newErrors: Record<string, string> = {};
    if (!formData.userId) newErrors.userId = "Sales person is required";
    if (!formData.task) newErrors.task = "Task is required";
    if (!formData.reminderTime) newErrors.reminderTime = "Reminder time is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      const response = await sharedAPI.remindTask({
        userId: formData?.userId, 
        task: formData.task,
        reminderTime: new Date(formData.reminderTime).toISOString(),
        entityId:entityId , 
        entityType,
      });

      if (response?.success) {
        toast.success("Reminder added successfully");
        handleClose();
        if (onSuccess) onSuccess();
      } else {
        toast.error(response?.message || "Failed to add reminder");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to add reminder");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <DialogTitle>Add Reminder</DialogTitle>
          </div>
          <DialogDescription>
            Set a reminder task for a sales person.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {!isSalesPerson && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Assign Sales Person</Label>
              <Select
                value={formData.userId}
                onValueChange={(val) => {
                  setFormData({ ...formData, userId: val });
                  if (errors.userId) setErrors({ ...errors, userId: "" });
                }}
                disabled={loadingSalesPersons}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingSalesPersons ? "Loading..." : "Select sales person"} />
                </SelectTrigger>
                <SelectContent>
                  {salesPersons.map((sp) => (
                    <SelectItem key={sp.uuid} value={sp.uuid}>
                      {sp.name} ({sp.userCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.userId && (
                <p className="text-xs text-red-600 mt-1">{errors.userId}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium">Task Details</Label>
            <Textarea
              value={formData.task}
              onChange={(e) => {
                setFormData({ ...formData, task: e.target.value });
                if (errors.task) setErrors({ ...errors, task: "" });
              }}
              placeholder="Enter task details..."
              rows={3}
            />
            {errors.task && (
              <p className="text-xs text-red-600 mt-1">{errors.task}</p>
            )}
          </div>

          <div className="space-y-2">
            <Input
              type="datetime-local"
              label="Reminder Date & Time"
              value={formData.reminderTime}
              onChange={(e) => {
                setFormData({ ...formData, reminderTime: e.target.value });
                if (errors.reminderTime) setErrors({ ...errors, reminderTime: "" });
              }}
               onBlur={(e) => {
                const typedTime = e.target.value;
                const now = format(new Date(), "yyyy-MM-dd'T'HH:mm");
                if (typedTime && typedTime < now) {
                  setErrors({
                    ...errors,
                    reminderTime: "Cannot select a past date or time",
                  });
                  setFormData({ ...formData, reminderTime: now });
                }
              }}
              error={errors.reminderTime}
              min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Set Reminder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
