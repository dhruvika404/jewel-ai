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
  KeyRound,
  Plus,
  Edit2,
  Users,
  Phone,
  Mail,
  FileText,
  Eye,
  EyeOff,
  Pencil,
  KeyRoundIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { salesPersonAPI, authAPI, dashboardAPI } from "@/services/api";
import { Label } from "@/components/ui/label";

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

import { usePageHeader } from "@/contexts/PageHeaderProvider";

export default function SalesPersons() {
  const { setHeader } = usePageHeader();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  // Dialog states
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [selectedSalesPerson, setSelectedSalesPerson] =
    useState<SalesPerson | null>(null);

  // Password Visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    userCode: "",
    name: "",
    email: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Set header
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

  // Load sales persons data and stats
  const loadData = async () => {
    setLoading(true);
    let currentTotalItems = 0;
    try {
      // Load List
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

  // Reset to first page when search changes
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

    // Email validation
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
        // Update
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
        // Create
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

  const handleUpload = async () => {
    if (!uploadFile) return;

    setIsUploading(true);
    try {
      await salesPersonAPI.import(uploadFile);
      toast.success("Sales persons imported successfully");
      setShowUploadDialog(false);
      setUploadFile(null);
      loadData();
    } catch (error: any) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className="bg-gray-50 pb-6">
      <div className="p-6 space-y-6">
        {/* Statistics Cards */}
        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 border-none shadow-sm bg-white ring-1 ring-black/[0.05]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Total Users</p>
                <p className="text-xl font-bold text-gray-900">
                  {loading ? "..." : stats.total}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-none shadow-sm bg-white ring-1 ring-black/[0.05]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Active Users
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {loading ? "..." : stats.active}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-none shadow-sm bg-white ring-1 ring-black/[0.05]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-600 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Inactive Users
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {loading ? "..." : stats.inactive}
                </p>
              </div>
            </div>
          </Card>
        </div> */}

        {/* Sales Persons Table */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500">
              <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
              <p>Loading team members...</p>
            </div>
          ) : salesPersons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500">
              <Users className="h-16 w-16 text-gray-200 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                No sales persons found
              </h3>
              <p className="text-sm max-w-sm text-center mt-2">
                Get started by adding a new sales person or importing from an
                Excel file.
              </p>
              <Button
                onClick={handleOpenAdd}
                variant="outline"
                className="mt-6 gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Sales Person
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-medium text-gray-700 w-[100px]">
                      Name
                    </TableHead>
                    <TableHead className="font-medium text-gray-700 w-[100px]">
                      Code
                    </TableHead>
                    <TableHead className="font-medium text-gray-700 w-[200px]">
                      Contact
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
                  {salesPersons.map((sp) => (
                    <TableRow key={sp.uuid} className="hover:bg-gray-50">
                      <TableCell className="align-top py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                            {sp.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div className="font-medium text-gray-900">
                            {sp.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900 align-top py-4">
                        {sp.userCode}
                      </TableCell>
                      <TableCell className="align-top py-4">
                        <div className="flex flex-col gap-1">
                          {sp.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <span
                                className="truncate max-w-[180px]"
                                title={sp.email}
                              >
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
                          {!sp.email && !sp.phone && (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="align-top py-4">
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
                      <TableCell className="align-top py-4">
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalItems > 0 && (
            <div className="p-4 border-t bg-white flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Total Sales Persons: <span className="font-semibold text-gray-900">{loading ? "..." : totalItems}</span>
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

      {/* Add/Edit Dialog */}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="userCode">User Code *</Label>
                <Input
                  id="userCode"
                  placeholder="e.g. SE001"
                  value={formData.userCode}
                  onChange={(e) =>
                    setFormData({ ...formData, userCode: e.target.value })
                  }
                  disabled={!!selectedSalesPerson} // Disable userCode editing during update if desired
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="Contact number"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
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
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
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
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
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
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {selectedSalesPerson ? "Save Changes" : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Set Password Dialog */}
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

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
            <DialogDescription>
              Upload an Excel file to bulk import sales persons. Supported
              formats: .xlsx, .xls
            </DialogDescription>
          </DialogHeader>

          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50/50 transition-colors cursor-pointer"
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".xlsx,.xls"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            />
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-medium text-gray-900">
              {uploadFile ? uploadFile.name : "Click to select file"}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {uploadFile
                ? `${(uploadFile.size / 1024).toFixed(1)} KB`
                : "or drag and drop here"}
            </p>
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadDialog(false);
                setUploadFile(null);
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!uploadFile || isUploading}
            >
              {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isUploading ? "Importing..." : "Start Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
