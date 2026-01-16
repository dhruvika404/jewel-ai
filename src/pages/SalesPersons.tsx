import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Users,
  Phone,
  Mail,
  Pencil,
  KeyRoundIcon,
  Upload,
  Plus,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { salesPersonAPI, authAPI } from "@/services/api";
import { Label } from "@/components/ui/label";
import { ImportModal } from "@/components/modals/ImportModal";
import { usePageHeader } from "@/contexts/PageHeaderProvider";
import { StandardTable, Column } from "@/components/shared/StandardTable";

interface SalesPerson {
  uuid: string;
  userCode: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function SalesPersons() {
  const { setHeader } = usePageHeader();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [selectedSalesPerson, setSelectedSalesPerson] =
    useState<SalesPerson | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    userCode: "",
    name: "",
    email: "",
    phone: "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    setHeader({
      title: "Sales Persons",
      search: {
        placeholder: "Search sales persons...",
        value: searchQuery,
        onChange: (val) => setSearchQuery(val),
      },
      children: (
        <>
          <Button
            variant="outline"
            onClick={() => setShowUploadDialog(true)}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button onClick={handleOpenAdd} className="gap-2">
            <Plus className="w-4 h-4" />
            Add New
          </Button>
        </>
      ),
    });
  }, [searchQuery]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await salesPersonAPI.getAll({
        page: currentPage,
        size: pageSize,
        search: searchQuery,
        role: "sales_executive",
      });

      if (response.success) {
        setSalesPersons(response.data.data || []);
        setTotalItems(response.data.totalItems || 0);
      }
    } catch (error: any) {
      toast.error("Error loading data: " + error.message);
      setSalesPersons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(timer);
  }, [currentPage, pageSize, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const resetForm = () => {
    setFormData({
      userCode: "",
      name: "",
      email: "",
      phone: "",
    });
    setSelectedSalesPerson(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowFormDialog(true);
  };

  const handleOpenEdit = (sp: SalesPerson) => {
    setSelectedSalesPerson(sp);
    setFormData({
      userCode: sp.userCode,
      name: sp.name,
      email: sp.email || "",
      phone: sp.phone || "",
    });
    setShowFormDialog(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userCode || !formData.name) {
      toast.error("User Code and Name are required");
      return;
    }

    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Please enter a valid email address");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (selectedSalesPerson) {
        const response = await salesPersonAPI.update(
          selectedSalesPerson.uuid,
          formData
        );
        if (response.success) {
          toast.success("Sales person updated successfully");
          setShowFormDialog(false);
          loadData();
        } else {
          toast.error(response.message || "Failed to update sales person");
        }
      } else {
        const response = await salesPersonAPI.create(formData);
        if (response.success) {
          toast.success("Sales person created successfully");
          setShowFormDialog(false);
          loadData();
        } else {
          toast.error(response.message || "Failed to create sales person");
        }
      }
    } catch (error: any) {
      toast.error("Operation failed: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetPassword = async () => {
    if (!selectedSalesPerson) return;

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      await authAPI.setPassword(selectedSalesPerson.userCode, newPassword);
      toast.success("Password set successfully");
      handleClosePasswordDialog();
    } catch (error: any) {
      toast.error("Failed to set password: " + error.message);
    }
  };

  const handleClosePasswordDialog = () => {
    setShowPasswordDialog(false);
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setSelectedSalesPerson(null);
  };

  const handleImport = async (file: File) => {
    setIsUploading(true);
    try {
      const response = await salesPersonAPI.import(file);
      toast.success(response.message || "Import successful");
      setShowUploadDialog(false);
      loadData();
      return response;
    } catch (error: any) {
      toast.error(error.message || "Failed to import data");
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  const columns: Column<SalesPerson>[] = [
    {
      header: "Name",
      className: "w-[100px]",
      render: (sp) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
            {sp.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="font-medium text-gray-900">{sp.name}</div>
        </div>
      ),
    },
    {
      header: "Code",
      className: "w-[100px]",
      render: (sp) => <span className="font-medium text-gray-900">{sp.userCode}</span>,
    },
    {
      header: "Contact",
      className: "w-[200px]",
      render: (sp) => (
        <div className="flex flex-col gap-1">
          {sp.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-3 h-3 text-gray-400" />
              <span className="truncate max-w-[180px]" title={sp.email}>
                {sp.email}
              </span>
            </div>
          )}
          {sp.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-3 h-3 text-gray-400" />
              {sp.phone}
            </div>
          )}
          {!sp.email && !sp.phone && <span className="text-gray-400 text-sm">-</span>}
        </div>
      ),
    },
    {
      header: "Status",
      className: "w-[120px]",
      render: (sp) => (
        <Badge
          variant={sp.isActive ? "default" : "secondary"}
          className={
            sp.isActive
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
              : "bg-gray-100 text-gray-700"
          }
        >
          {sp.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      className: "w-[120px]",
      render: (sp) => (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-primary/10 text-gray-900 hover:text-primary transition-colors"
            title="Edit Details"
            onClick={() => handleOpenEdit(sp)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-primary/10 text-gray-900 hover:text-primary transition-colors"
            title="Set Password"
            onClick={() => {
              setSelectedSalesPerson(sp);
              setShowPasswordDialog(true);
            }}
          >
            <KeyRoundIcon className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-gray-50 pb-6">
      <div className="p-6 space-y-6">
        <StandardTable
          columns={columns}
          data={salesPersons}
          loading={loading}
          totalItems={totalItems}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          rowKey={(sp) => sp.uuid}
          emptyIcon={<Users className="h-12 w-12 text-gray-200 mb-4 mx-auto" />}
          emptyMessage="No sales persons found"
        />
      </div>

      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedSalesPerson ? "Edit Sales Person" : "Add New Sales Person"}
            </DialogTitle>
            <DialogDescription>
              {selectedSalesPerson
                ? "Update the details below"
                : "Enter the details for the new team member"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="userCode">User Code *</Label>
                <Input
                  id="userCode"
                  placeholder="e.g. SE001"
                  value={formData.userCode}
                  onChange={(e) => setFormData({ ...formData, userCode: e.target.value })}
                  disabled={!!selectedSalesPerson}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="Contact number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="Staff name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                autoComplete="off"
              />
            </div>

            <DialogFooter className="mt-6 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFormDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedSalesPerson ? "Save Changes" : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showPasswordDialog}
        onOpenChange={(open) => !open && handleClosePasswordDialog()}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Login Password</DialogTitle>
            <DialogDescription>
              Set a new password for{" "}
              <span className="font-medium text-gray-900">
                {selectedSalesPerson?.name}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6 pt-4 border-t">
            <Button variant="outline" onClick={handleClosePasswordDialog}>
              Cancel
            </Button>
            <Button onClick={handleSetPassword}>Set Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImportModal
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        title="Import Sales Persons"
        description="Upload an Excel or CSV file to bulk import sales persons."
        onImport={handleImport}
        isUploading={isUploading}
        onClose={() => {
          setShowUploadDialog(false);
          setIsUploading(false);
        }}
      />
    </div>
  );
}

