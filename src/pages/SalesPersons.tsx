import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TablePagination from "@/components/ui/table-pagination";
import {
  Upload,
  Loader2,
  Plus,
  Phone,
  Mail,
  Pencil,
  KeyRoundIcon,
  Trash2,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { salesPersonAPI, authAPI, sharedAPI } from "@/services/api";
import { Label } from "@/components/ui/label";
import { DeleteModal } from "@/components/modals/DeleteModal";
import { ImportModal } from "@/components/modals/ImportModal";
import { usePageHeader } from "@/contexts/PageHeaderProvider";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingSalesPerson, setDeletingSalesPerson] =
    useState<SalesPerson | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const toggleAllSelection = (currentItems: SalesPerson[]) => {
    const allSelected = currentItems.every((item) =>
      selectedItems.has(item.uuid),
    );
    if (allSelected) {
      const newSelected = new Set(selectedItems);
      currentItems.forEach((item) => newSelected.delete(item.uuid));
      setSelectedItems(newSelected);
    } else {
      const newSelected = new Set(selectedItems);
      currentItems.forEach((item) => newSelected.add(item.uuid));
      setSelectedItems(newSelected);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    setIsBulkDeleting(true);
    try {
      const response = await sharedAPI.deleteMultipleUsers({
        userType: "sales_executive",
        ids: Array.from(selectedItems),
      });

      if (response.success === false) {
        toast.error(response.message || "Failed to delete sales persons");
      } else {
        toast.success(
          response.message || "Selected sales persons deleted successfully",
        );
        loadData();
        setShowBulkDeleteConfirm(false);
        setSelectedItems(new Set());
      }
    } catch (e: any) {
      toast.error("Failed to delete sales persons");
    } finally {
      setIsBulkDeleting(false);
    }
  };

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
          {selectedItems.size > 0 ? (
            <Button
              variant="destructive"
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />({selectedItems.size})
            </Button>
          ) : (
            <Button onClick={handleOpenAdd} className="gap-2">
              <Plus className="w-4 h-4" />
              Add New
            </Button>
          )}
        </>
      ),
    });
  }, [searchQuery, selectedItems.size]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadData = async () => {
    setLoading(true);
    let currentTotalItems = 0;
    try {
      const response = await salesPersonAPI.getAll({
        page: currentPage,
        size: pageSize,
        search: searchQuery,
        role: "sales_executive",
      });

      if (response.success) {
        setSalesPersons(response.data.data || []);
        currentTotalItems = response.data.totalItems || 0;
        setTotalItems(currentTotalItems);
      }
    } catch (error: any) {
      toast.error(error.message);
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
    setErrors({});
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
    setErrors({});
    setShowFormDialog(true);
  };

  const handleOpenDelete = (sp: SalesPerson) => {
    setDeletingSalesPerson(sp);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSalesPerson) return;
    setIsDeleting(true);
    try {
      const res = await salesPersonAPI.delete(deletingSalesPerson.uuid);
      if (res?.success === false) {
        toast.error(res?.message || "Failed to delete sales person");
        return;
      }
      toast.success(res?.message || "Sales person deleted successfully");
      setDeleteModalOpen(false);
      setDeletingSalesPerson(null);
      loadData();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete sales person");
    } finally {
      setIsDeleting(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.userCode) newErrors.userCode = "User Code is required";
    if (!formData.name) newErrors.name = "Full Name is required";

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    if (formData.phone && formData.phone.length < 10) {
      newErrors.phone = "Phone number must be at least 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (selectedSalesPerson) {
        const response = await salesPersonAPI.update(
          selectedSalesPerson.uuid,
          formData,
        );
        if (
          response.success &&
          !response.message?.toLowerCase().includes("exist")
        ) {
          toast.success(
            response.message || "Sales person updated successfully",
          );
          setShowFormDialog(false);
          loadData();
        } else {
          toast.error(response.message || "Failed to update sales person");
        }
      } else {
        const response = await salesPersonAPI.create(formData);
        if (
          response.success &&
          !response.message?.toLowerCase().includes("exist")
        ) {
          toast.success(
            response.message || "Sales person created successfully",
          );
          setShowFormDialog(false);
          loadData();
        } else {
          toast.error(response.message || "Failed to create sales person");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetPassword = async () => {
    if (!selectedSalesPerson) return;

    const newErrors: Record<string, string> = {};
    if (!newPassword) newErrors.newPassword = "New Password is required";
    if (!confirmPassword)
      newErrors.confirmPassword = "Confirm Password is required";

    if (newPassword && confirmPassword) {
      if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      } else if (newPassword.length < 6) {
        newErrors.newPassword = "Password must be at least 6 characters";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const response = await authAPI.setPassword(selectedSalesPerson.userCode, newPassword);
      toast.success(response.message || "Password set successfully");
      handleClosePasswordDialog();
    } catch (error: any) {
      toast.error(error.message);
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

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const response = await salesPersonAPI.import(file);
      if (response.success) {
        toast.success(response.message || "Sales persons imported successfully");
        setShowUploadDialog(false);
        loadData();
      } else {
        const errorMsg =
          response.message?.message || response.message || "Import failed";
        toast.error(errorMsg);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className="bg-gray-50">
      <div className="p-6 space-y-6">
        <Card className="overflow-hidden">
          <Table containerClassName="max-h-[calc(100vh-180px)] overflow-auto">
            <TableHeader className="sticky top-0 z-20 bg-gray-50">
              <TableRow className="bg-gray-50">
                <TableHead className="w-[50px] align-center">
                  <Checkbox
                    checked={
                      salesPersons.length > 0 &&
                      salesPersons.every((sp) => selectedItems.has(sp.uuid))
                    }
                    onCheckedChange={() => toggleAllSelection(salesPersons)}
                  />
                </TableHead>
                <TableHead className="font-medium text-gray-700 w-[100px]">
                  Name
                </TableHead>
                <TableHead className="font-medium text-gray-700 w-[100px]">
                  Code
                </TableHead>
                 <TableHead className="font-medium text-gray-700 w-[200px]">
                  Email
                </TableHead>
                <TableHead className="font-medium text-gray-700 w-[150px]">
                  Phone
                </TableHead>
                <TableHead className="font-medium text-gray-700 w-[120px]">
                  Status
                </TableHead>
                <TableHead className="font-medium text-gray-700 text-center w-[120px]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  </TableCell>
                </TableRow>
              ) : salesPersons.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No sales persons found
                  </TableCell>
                </TableRow>
              ) : (
                salesPersons.map((sp) => (
                  <TableRow key={sp.uuid} className="hover:bg-gray-50">
                    <TableCell className="align-center">
                      <Checkbox
                        checked={selectedItems.has(sp.uuid)}
                        onCheckedChange={() => toggleSelection(sp.uuid)}
                      />
                    </TableCell>
                    <TableCell className="align-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                          {sp.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="font-medium text-gray-900">
                          {sp.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900 align-center">
                      {sp.userCode}
                    </TableCell>
                    <TableCell className="align-center">
                      {sp.email ? (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span
                            className="truncate max-w-[180px]"
                            title={sp.email}
                          >
                            {sp.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="align-center">
                      {sp.phone ? (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {sp.phone}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="align-center">
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
                    </TableCell>
                    <TableCell className="align-center">
                      <div className="flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-primary/10 text-gray-900 hover:text-primary transition-colors disabled:cursor-not-allowed disabled:pointer-events-auto disabled:opacity-50"
                          title="Edit Details"
                          onClick={() => handleOpenEdit(sp)}
                          disabled={selectedItems.size > 0}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-primary/10 text-gray-900 hover:text-primary transition-colors disabled:cursor-not-allowed disabled:pointer-events-auto disabled:opacity-50"
                          title="Set Password"
                          onClick={() => {
                            setSelectedSalesPerson(sp);
                            setShowPasswordDialog(true);
                          }}
                          disabled={selectedItems.size > 0}
                        >
                          <KeyRoundIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-red-50 text-gray-900 hover:text-red-600 transition-colors disabled:cursor-not-allowed disabled:pointer-events-auto disabled:opacity-50"
                          title="Delete"
                          onClick={() => handleOpenDelete(sp)}
                          disabled={selectedItems.size > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {totalItems > 0 && (
            <div className="p-4 border-t bg-white flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Total :{" "}
                <span className="font-semibold text-gray-900">
                  {loading ? "..." : totalItems}
                </span>
              </div>
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                pageSize={pageSize}
                setPageSize={setPageSize}
              />
            </div>
          )}
        </Card>
      </div>

      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedSalesPerson
                ? "Edit Sales Person"
                : "Add New Sales Person"}
            </DialogTitle>
            <DialogDescription>
              {selectedSalesPerson
                ? "Update the details below"
                : "Enter the details for the new team member"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <Input
              id="userCode"
              label="User Code"
              required
              placeholder="e.g. SE001"
              value={formData.userCode}
              onChange={(e) => {
                setFormData({ ...formData, userCode: e.target.value });
                if (errors.userCode) setErrors({ ...errors, userCode: "" });
              }}
              disabled={!!selectedSalesPerson}
              autoComplete="off"
              error={errors.userCode}
            />
            <Input
              id="phone"
              label="Phone"
              placeholder="Contact number"
              value={formData.phone}
              maxLength={10}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, "");
                setFormData({ ...formData, phone: value });
                if (errors.phone) setErrors({ ...errors, phone: "" });
              }}
              autoComplete="off"
              error={errors.phone}
            />

            <Input
              id="name"
              label="Full Name"
              required
              placeholder="Staff name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: "" });
              }}
              autoComplete="off"
              error={errors.name}
            />

            <Input
              id="email"
              label="Email Address"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: "" });
              }}
              autoComplete="off"
               error={errors.email}
            />

            <DialogFooter className="mt-6 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFormDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
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
            <div className="space-y-4">
              <div className="space-y-2">
                <Label required>New Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errors.newPassword)
                        setErrors({ ...errors, newPassword: "" });
                    }}
                    className="pr-10"
                    autoComplete="new-password"
                    error={errors.newPassword}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label required>Confirm Password</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword)
                        setErrors({ ...errors, confirmPassword: "" });
                    }}
                    className="pr-10"
                    autoComplete="new-password"
                    error={errors.confirmPassword}
                  />
                </div>
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
        description="Upload an Excel file to bulk import sales persons"
        onImport={handleUpload}
        isUploading={isUploading}
        onClose={() => setShowUploadDialog(false)}
      />

      <DeleteModal
        isOpen={deleteModalOpen || showBulkDeleteConfirm}
        onClose={() => {
          if (isDeleting || isBulkDeleting) return;
          if (deleteModalOpen) {
            setDeleteModalOpen(false);
            setDeletingSalesPerson(null);
          } else {
            setShowBulkDeleteConfirm(false);
          }
        }}
        onConfirm={deleteModalOpen ? handleConfirmDelete : handleBulkDelete}
        title={
          deleteModalOpen
            ? "Delete Sales Person?"
            : `Delete ${selectedItems.size} Sales Persons?`
        }
        description={
          deleteModalOpen
            ? "This action cannot be undone."
            : "Are you sure you want to delete the selected sales persons? This action cannot be undone."
        }
        itemName={
          deleteModalOpen && deletingSalesPerson
            ? `${deletingSalesPerson.name} (${deletingSalesPerson.userCode})`
            : undefined
        }
        isLoading={isDeleting || isBulkDeleting}
      />
    </div>
  );
}
