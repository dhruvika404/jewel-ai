import { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  Plus,
  Package,
  ShoppingCart,
  FileText,
  RefreshCw,
  Mail,
  Phone,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  clientAPI,
  pendingMaterialAPI,
  pendingOrderAPI,
  newOrderAPI,
} from "@/services/api";
import { toast } from "sonner";
import { PendingMaterialModal } from "@/components/modals/PendingMaterialModal";
import { PendingOrderModal } from "@/components/modals/PendingOrderModal";
import { NewOrderModal } from "@/components/modals/NewOrderModal";
import { DeleteModal } from "@/components/modals/DeleteModal";
import { AddFollowUpModal } from "@/components/modals/AddFollowUpModal";
import { usePageHeader } from "@/contexts/PageHeaderProvider";
import { useAuth } from "@/contexts/AuthContext";
import { formatDisplayDate } from "@/lib/utils";

interface Client {
  uuid: string;
  userCode: string;
  salesExecCode?: string;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  status?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

type TabType = "pending-material" | "pending-order" | "new-order";

export default function ClientDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { setHeader, clearHeader } = usePageHeader();
  const { user } = useAuth();
  const isAdmin = user?.role !== "sales_executive";
  const [client, setClient] = useState<Client | null>(
    location.state?.client || null,
  );
  const [loading, setLoading] = useState(!location.state?.client);
  const [materials, setMaterials] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [newOrders, setNewOrders] = useState<any[]>([]);
  const [loadingPM, setLoadingPM] = useState(false);
  const [loadingPO, setLoadingPO] = useState(false);
  const [loadingNO, setLoadingNO] = useState(false);
  const [pmFollowUps, setPmFollowUps] = useState<any[]>([]);
  const [poFollowUps, setPoFollowUps] = useState<any[]>([]);
  const [noFollowUps, setNoFollowUps] = useState<any[]>([]);
  const [loadingPMFollowUps, setLoadingPMFollowUps] = useState(false);
  const [loadingPOFollowUps, setLoadingPOFollowUps] = useState(false);
  const [loadingNOFollowUps, setLoadingNOFollowUps] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType | null>(null);
  const [activeRecordId, setActiveRecordId] = useState<string>("");
  const [showPMModal, setShowPMModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [showNOModal, setShowNOModal] = useState(false);
  const [editingPM, setEditingPM] = useState<any>(null);
  const [editingPO, setEditingPO] = useState<any>(null);
  const [editingNO, setEditingNO] = useState<any>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<any>(null);
  const [deletingType, setDeletingType] = useState<TabType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchClient = async () => {
    if (!id) return;
    if (!client) setLoading(true);

    try {
      const response = await clientAPI.getById(id);
      if (response?.success !== false) {
        const clientData = response?.data || response?.client;

        if (
          !isAdmin &&
          user?.userCode &&
          clientData?.salesExecCode !== user.userCode
        ) {
          toast.error("You do not have access to this client");
          navigate("/clients");
          return;
        }

        setClient(clientData);
      } else if (!client) {
        toast.error(response?.message || "Failed to load client details");
        navigate("/clients");
      }
    } catch (error: any) {
      if (!client) {
        toast.error(error.message || "Failed to load client details");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClient();
  }, [id, navigate]);

  useEffect(() => {
    setHeader({ visible: false });
    return () => clearHeader();
  }, []);

  const handleOpenDelete = (item: any, type: TabType) => {
    setDeletingItem(item);
    setDeletingType(type);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem || !deletingType) return;
    setIsDeleting(true);
    try {
      let res: any;
      const itemId = deletingItem.uuid || deletingItem.id;
      if (deletingType === "pending-material") {
        res = await pendingMaterialAPI.delete(itemId);
      } else if (deletingType === "pending-order") {
        res = await pendingOrderAPI.delete(itemId);
      } else if (deletingType === "new-order") {
        res = await newOrderAPI.delete(itemId);
      }

      if (res?.success === false) {
        toast.error(res?.message || "Failed to delete record");
        return;
      }

      toast.success(res?.message || "Record deleted successfully");
      setDeleteModalOpen(false);
      setDeletingItem(null);
      setDeletingType(null);
      refreshData();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete record");
    } finally {
      setIsDeleting(false);
    }
  };

  const refreshData = () => {
    if (!client?.userCode) return;

    // 1. Pending Material
    setLoadingPM(true);
    pendingMaterialAPI
      .getAll({ clientCode: client?.userCode, page: 1, size: 10 })
      .then((res) => {
        if (res.success && res?.data?.data) {
          setMaterials(res?.data?.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingPM(false));

    // 2. Pending Orders
    setLoadingPO(true);
    pendingOrderAPI
      .getAll({ clientCode: client.userCode, page: 1, size: 10 })
      .then((res) => {
        if (res.success && res?.data?.data) {
          setPendingOrders(res?.data?.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingPO(false));

    // 3. New Orders
    setLoadingNO(true);
    newOrderAPI
      .getAll({ clientCode: client.userCode, page: 1, size: 10 })
      .then((res) => {
        if (res.success && res.data?.data) {
          setNewOrders(res.data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingNO(false));

    // 4. Follow-ups
    setLoadingPMFollowUps(true);
    pendingMaterialAPI
      .getFollowUpsByClientCode({
        clientCode: client.userCode,
        page: 1,
        size: 10,
      })
      .then((res) => {
        if (res.success && res.data?.data) {
          setPmFollowUps(res.data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingPMFollowUps(false));

    setLoadingPOFollowUps(true);
    pendingOrderAPI
      .getFollowUpsByClientCode({
        clientCode: client.userCode,
        page: 1,
        size: 10,
      })
      .then((res) => {
        if (res.success && res.data?.data) {
          setPoFollowUps(res.data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingPOFollowUps(false));

    setLoadingNOFollowUps(true);
    newOrderAPI
      .getFollowUpsByClientCode({
        clientCode: client.userCode,
        page: 1,
        size: 10,
      })
      .then((res) => {
        if (res.success && res.data?.data) {
          setNoFollowUps(res.data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingNOFollowUps(false));
  };

  useEffect(() => {
    refreshData();
  }, [client]);

  const handleOpenModal = (type: TabType) => {
    const items =
      type === "pending-material"
        ? materials
        : type === "pending-order"
          ? pendingOrders
          : newOrders;

    if (items.length === 0) {
      toast.error(
        `No active ${type.replace("-", " ")} items found to attach follow-up to.`,
      );
      return;
    }

    const recordId = items[0].uuid || items[0].id;
    if (!recordId) {
      toast.error("No valid record found");
      return;
    }

    setActiveTab(type);
    setActiveRecordId(recordId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setActiveTab(null);
    setActiveRecordId("");
  };

  const renderColumn = (
    title: string,
    type: TabType,
    items: any[],
    loadingState: boolean,
    followUps: any[],
    loadingFollowUps: boolean,
    icon: any,
  ) => {
    const Icon = icon;
    return (
      <Card className="flex flex-col h-full border border-gray-200 bg-white overflow-hidden rounded-lg shadow-sm">
        <CardHeader className="py-4 px-6 border-b bg-white flex flex-row items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-md flex items-center justify-center ${
                type === "pending-material"
                  ? "bg-orange-50 text-orange-600"
                  : type === "pending-order"
                    ? "bg-blue-50 text-blue-600"
                    : "bg-emerald-50 text-emerald-600"
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                {title}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {items.length === 0 && isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-primary/10 text-gray-600 hover:text-primary"
                onClick={() => {
                  if (type === "pending-material") {
                    setEditingPM(null);
                    setShowPMModal(true);
                  } else if (type === "pending-order") {
                    setEditingPO(null);
                    setShowPOModal(true);
                  } else {
                    setEditingNO(null);
                    setShowNOModal(true);
                  }
                }}
                title="Add new"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 min-h-0 flex flex-col overflow-hidden">
          {/* Section 1: Basic Info */}
          <div className="shrink-0 bg-white border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="h-3 w-0.5 bg-primary rounded-full" />
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Basic Info
              </h4>
            </div>

            {loadingState ? (
              <div className="flex flex-col items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-primary mb-2" />
                <p className="text-xs text-gray-500">Loading...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="py-6 text-center bg-gray-50 rounded border border-dashed border-gray-200">
                <Icon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-xs font-medium text-gray-500">
                  No active records
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.slice(0, 1).map((item: any, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 rounded border border-gray-200 p-3 relative group"
                  >
                    <div className="absolute top-3 right-3 flex items-center transition-opacity">
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:text-primary hover:bg-primary/10"
                          onClick={() => {
                            if (type === "pending-material") {
                              setEditingPM(item);
                              setShowPMModal(true);
                            } else if (type === "pending-order") {
                              setEditingPO(item);
                              setShowPOModal(true);
                            } else {
                              setEditingNO(item);
                              setShowNOModal(true);
                            }
                          }}
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleOpenDelete(item, type)}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <div
                      className={`flex justify-between items-start mb-3 ${isAdmin ? "pr-14" : ""}`}
                    >
                      <div className="flex min-w-0 items-center gap-2 ">
                        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                          {type === "pending-material"
                            ? "Style ID: "
                            : "Order ID: "}
                        </span>
                        <h4 className="font-semibold text-sm text-gray-900 truncate">
                          {type === "pending-material"
                            ? item.styleNo || "N/A"
                            : item.orderNo || `ITEM-${idx + 1}`}
                        </h4>
                      </div>
                      <Badge
                        className={`text-[10px] font-medium px-2 py-0.5 rounded shrink-0 ml-2 pointer-events-none ${
                          item.status === "completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : item.status === "pending"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {item.status || "pending"}
                      </Badge>
                    </div>

                    <div className="space-y-2.5 pt-3 border-t border-gray-200">
                      {type === "pending-material" && (
                        <>
                          <div className="grid grid-cols-3 gap-2.5">
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                                Dept
                              </p>
                              <p
                                className="text-xs font-semibold text-gray-900 truncate"
                                title={item.departmentName}
                              >
                                {item.departmentName || "-"}
                              </p>
                            </div>
                            <div className="space-y-0.5 text-center">
                              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                                Net Wt
                              </p>
                              <p className="text-xs font-bold text-primary">
                                {item.totalNetWt || "-"}
                              </p>
                            </div>
                            <div className="space-y-0.5 text-right">
                              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                                Exp Del
                              </p>
                              <p className="text-xs font-semibold text-gray-900">
                                {item.expectedDeliveryDate || "-"}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2.5">
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                                Last Follow-up
                              </p>
                              <p className="text-xs font-semibold text-gray-900">
                                {formatDisplayDate(item.lastFollowUpDate)}
                              </p>
                            </div>
                            <div className="space-y-0.5 text-center">
                              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                                Sales Exec
                              </p>
                              <p className="text-xs font-bold text-gray-900">
                                {item.salesExecCode || "-"}
                              </p>
                            </div>
                            <div className="space-y-0.5 text-right">
                              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                                Next Follow-up
                              </p>
                              <p className="text-xs font-bold text-primary">
                                {formatDisplayDate(item.nextFollowUpDate)}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                      {type === "pending-order" && (
                        <>
                          <div className="grid grid-cols-3 gap-2.5">
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                                Order No
                              </p>
                              <p className="text-xs font-semibold text-gray-900 truncate">
                                {item.orderNo || "-"}
                              </p>
                            </div>
                            <div className="space-y-0.5 text-center">
                              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                                Gross Wt
                              </p>
                              <p className="text-xs font-bold text-emerald-600">
                                {item.grossWtTotal || "-"}
                              </p>
                            </div>
                            <div className="space-y-0.5 text-right">
                              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                                Order Date
                              </p>
                              <p className="text-xs font-semibold text-gray-900">
                                {formatDisplayDate(item.orderDate)}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2.5">
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                                Last Follow-up
                              </p>
                              <p className="text-xs font-semibold text-gray-900">
                                {formatDisplayDate(item.lastFollowUpDate)}
                              </p>
                            </div>
                            <div className="space-y-0.5 text-center">
                              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                                Sales Exec
                              </p>
                              <p className="text-xs font-bold text-gray-900">
                                {item.salesExecCode || "-"}
                              </p>
                            </div>
                            <div className="space-y-0.5 text-right">
                              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                                Next Follow-up
                              </p>
                              <p className="text-xs font-bold text-primary">
                                {formatDisplayDate(item.nextFollowUpDate)}
                              </p>
                            </div>
                          </div>
                        </>
                      )}

                      {type === "new-order" && (
                        <>
                          <div className="grid grid-cols-2 gap-2.5">
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                                Last Sale
                              </p>
                              <p className="text-xs font-semibold text-gray-900">
                                {item.lastSaleDate || "-"}
                              </p>
                            </div>
                            <div className="space-y-0.5 text-right">
                              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                                Sales Exec
                              </p>
                              <p className="text-xs font-bold text-gray-900">
                                {item.salesExecCode || "-"}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2.5">
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                                Last Follow-up
                              </p>
                              <p className="text-xs font-semibold text-gray-900">
                                {formatDisplayDate(item.lastFollowUpDate)}
                              </p>
                            </div>
                            <div className="space-y-0.5 text-right">
                              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                                Next Follow-up
                              </p>
                              <p className="text-xs font-bold text-primary">
                                {formatDisplayDate(item.nextFollowUpDate)}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Follow-ups List */}
          <div className="flex-1 min-h-0 flex flex-col pt-4 overflow-hidden">
            <div className="flex items-center justify-between mb-2 px-6">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-0.5 bg-emerald-500 rounded-full" />
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                  Follow-ups
                </h4>
              </div>
              {items.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs font-medium px-2.5 hover:bg-emerald-50 hover:text-emerald-700 rounded gap-1.5"
                  onClick={() => handleOpenModal(type)}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-4">
              {loadingFollowUps ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-primary mb-2" />
                  <p className="text-xs text-gray-500">Loading...</p>
                </div>
              ) : followUps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 bg-gray-50 border border-dashed border-gray-200 rounded">
                  <RefreshCw className="w-8 h-8 mb-2 text-gray-300" />
                  <p className="text-xs font-medium text-gray-500">
                    No follow-ups yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {followUps.map((fu, fidx) => (
                    <div
                      key={fidx}
                      className="bg-white rounded border border-gray-200 p-3 hover:border-gray-300 hover:shadow-sm transition-all"
                    >
                      <div className="space-y-2.5">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-medium text-gray-600 mb-1 uppercase tracking-wide">
                            Message
                          </span>
                          <div className="bg-gray-50 border-l-2 border-primary p-2 rounded-r-md">
                            <p className="text-xs text-gray-800 leading-relaxed font-medium">
                              {fu.lastFollowUpMsg ||
                                fu.followUpMsg ||
                                "No notes added"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                          <div className="flex flex-col flex-1">
                            <span className="text-[10px] font-medium text-gray-600 mb-0.5 uppercase tracking-wide">
                              Last Follow-up Date
                            </span>
                            <span className="text-xs font-semibold text-gray-900">
                              {formatDisplayDate(fu.createdAt)}
                            </span>
                          </div>

                          <div className="flex flex-col flex-1">
                            <span className="text-[10px] font-medium text-gray-600 mb-0.5 uppercase tracking-wide">
                              Next Follow-up Date
                            </span>
                            <span className="text-xs font-semibold text-primary">
                              {formatDisplayDate(fu.nextFollowUpDate)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-900 mb-1">
              Loading Client Details
            </p>
            <p className="text-xs text-gray-500">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-sm max-w-md w-full mx-4 border border-gray-200">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">
            Client Not Found
          </h3>
          <p className="text-gray-600 mb-5 text-xs leading-relaxed">
            The client you are looking for does not exist or has been removed.
          </p>
          <Button
            onClick={() => navigate("/clients")}
            variant="outline"
            className="h-9 px-4 text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden h-screen">
      <header className="px-6 py-3 border-b bg-card border-border sticky top-0 z-20 min-h-16 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/clients")}
            className="hover:bg-accent rounded-lg h-9 w-9 border-border"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </Button>
          <h1 className="text-base lg:text-lg font-semibold text-foreground">
            {client.name}
          </h1>
        </div>

        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md border border-border">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Code:
            </span>
            <span className="text-sm font-semibold text-foreground font-mono">
              {client.userCode}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md border border-border">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              {client.email || "Not provided"}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md border border-border">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              {client.phone || "Not provided"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content - 3 Column Layout */}
      <div className="flex-1 overflow-hidden p-6 bg-gray-50">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Column 1: Pending Material */}
          <div className="h-full min-h-0">
            {renderColumn(
              "Pending Material",
              "pending-material",
              materials,
              loadingPM,
              pmFollowUps,
              loadingPMFollowUps,
              Package,
            )}
          </div>

          {/* Column 2: Pending Orders */}
          <div className="h-full min-h-0">
            {renderColumn(
              "Pending Orders",
              "pending-order",
              pendingOrders,
              loadingPO,
              poFollowUps,
              loadingPOFollowUps,
              ShoppingCart,
            )}
          </div>

          {/* Column 3: New Orders */}
          <div className="h-full min-h-0">
            {renderColumn(
              "New Orders",
              "new-order",
              newOrders,
              loadingNO,
              noFollowUps,
              loadingNOFollowUps,
              FileText,
            )}
          </div>
        </div>
      </div>

      {/* Add Follow-up Modal */}
      {activeTab && activeRecordId && (
        <AddFollowUpModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          recordType={activeTab}
          recordId={activeRecordId}
          clientName={client?.name}
          onSuccess={refreshData}
        />
      )}

      {isAdmin && (
        <>
          <PendingMaterialModal
            isOpen={showPMModal}
            onClose={() => {
              setShowPMModal(false);
              setEditingPM(null);
            }}
            onSuccess={refreshData}
            clientCode={client?.userCode || ""}
            material={editingPM}
            defaultSalesExecCode={client?.salesExecCode}
          />
          <PendingOrderModal
            isOpen={showPOModal}
            onClose={() => {
              setShowPOModal(false);
              setEditingPO(null);
            }}
            onSuccess={refreshData}
            clientCode={client?.userCode || ""}
            order={editingPO}
            defaultSalesExecCode={client?.salesExecCode}
          />
          <NewOrderModal
            isOpen={showNOModal}
            onClose={() => {
              setShowNOModal(false);
              setEditingNO(null);
            }}
            onSuccess={refreshData}
            clientCode={client?.userCode || ""}
            order={editingNO}
            defaultSalesExecCode={client?.salesExecCode}
          />
          <DeleteModal
            isOpen={deleteModalOpen}
            onClose={() => {
              if (!isDeleting) {
                setDeleteModalOpen(false);
                setDeletingItem(null);
                setDeletingType(null);
              }
            }}
            onConfirm={handleConfirmDelete}
            title="Delete Record?"
            description="Are you sure you want to delete this record? This action cannot be undone."
            itemName={
              deletingItem
                ? `${deletingItem.styleNo || deletingItem.orderNo || "Record"}`
                : undefined
            }
            isLoading={isDeleting}
          />
        </>
      )}
    </div>
  );
}
