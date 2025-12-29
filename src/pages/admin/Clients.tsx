import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import TablePagination from "@/components/ui/table-pagination";
import {
  Search,
  Plus,
  Eye,
  Calendar,
  Clock,
  MessageSquare,
  Upload,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  clientAPI, 
  pendingOrderAPI, 
  pendingMaterialAPI, 
  newOrderAPI 
} from "@/services/api";
import ExcelUpload from "@/components/ExcelUpload";

interface Client {
  id: string;
  clientCode: string;
  clientName: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
  createdAt?: string;
}

interface FollowUp {
  id: string;
  followUpMsg: string;
  nextFollowUpDate: string;
  followUpStatus: string;
  createdAt: string;
}

interface PendingOrder {
  id: string;
  orderId: string;
  clientCode: string;
  status: string;
  orderDate: string;
  grossWt: string;
  collection: string;
  followUps?: FollowUp[];
}

interface PendingMaterial {
  id: string;
  materialName: string;
  clientCode: string;
  status: string;
  quantity: string;
  remark: string;
  followUps?: FollowUp[];
}

interface NewOrder {
  id: string;
  designName: string;
  clientCode: string;
  status: string;
  date: string;
  remark: string;
  followUps?: FollowUp[];
}

type TabType = "pendingMaterial" | "pendingOrders" | "newOrders";
type ViewType = "list" | "detail" | "upload";

const getStatusBadgeVariant = (status: string) => {
  const statusLower = status.toLowerCase();
  if (statusLower === "completed" || statusLower === "approved")
    return "default";
  if (statusLower === "pending" || statusLower === "in review")
    return "secondary";
  if (statusLower === "processing" || statusLower === "in transit")
    return "outline";
  return "secondary";
};

export default function AdminClients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("pendingMaterial");
  const [showAddFollowUp, setShowAddFollowUp] = useState(false);
  const [followUpMessage, setFollowUpMessage] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpStatus, setFollowUpStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewType, setViewType] = useState<ViewType>("list");
  
  // Data states
  const [clients, setClients] = useState<Client[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [pendingMaterials, setPendingMaterials] = useState<PendingMaterial[]>([]);
  const [newOrders, setNewOrders] = useState<NewOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>("");

  // Load clients data
  const loadClients = async () => {
    setLoading(true);
    try {
      const response = await clientAPI.getAll({
        page: currentPage,
        size: pageSize,
        role: "client"
      });
      
      if (response.success !== false) {
        setClients(response.data || response.clients || []);
      } else {
        toast.error("Failed to load clients");
      }
    } catch (error: any) {
      toast.error("Error loading clients: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load client-specific data
  const loadClientData = async (clientCode: string) => {
    setLoading(true);
    try {
      const [ordersRes, materialsRes, newOrdersRes] = await Promise.all([
        pendingOrderAPI.getFollowUpsByClientCode({ clientCode, page: 1, size: 100 }),
        pendingMaterialAPI.getFollowUpsByClientCode({ clientCode, page: 1, size: 100 }),
        newOrderAPI.getFollowUpsByClientCode({ clientCode, page: 1, size: 100 })
      ]);

      setPendingOrders(ordersRes.data || []);
      setPendingMaterials(materialsRes.data || []);
      setNewOrders(newOrdersRes.data || []);
    } catch (error: any) {
      toast.error("Error loading client data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add follow-up
  const handleAddFollowUp = async () => {
    if (!followUpMessage || !followUpDate || !followUpStatus || !selectedItemId) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      let apiCall;
      const followUpData = {
        followUpMsg: followUpMessage,
        nextFollowUpDate: followUpDate,
        followUpStatus: followUpStatus
      };

      if (activeTab === "pendingOrders") {
        apiCall = pendingOrderAPI.addFollowUp({
          pendingOrderId: selectedItemId,
          ...followUpData
        });
      } else if (activeTab === "pendingMaterial") {
        apiCall = pendingMaterialAPI.addFollowUp({
          pendingMaterialRecordId: selectedItemId,
          ...followUpData
        });
      } else {
        apiCall = newOrderAPI.addFollowUp({
          newOrderRecordId: selectedItemId,
          ...followUpData
        });
      }

      await apiCall;
      toast.success("Follow-up added successfully");
      
      // Reload client data
      if (selectedClient) {
        await loadClientData(selectedClient.clientCode);
      }
      
      // Reset form
      setShowAddFollowUp(false);
      setFollowUpMessage("");
      setFollowUpDate("");
      setFollowUpStatus("");
      setSelectedItemId("");
    } catch (error: any) {
      toast.error("Failed to add follow-up: " + error.message);
    }
  };

  useEffect(() => {
    if (viewType === "list") {
      loadClients();
    }
  }, [currentPage, pageSize, viewType]);

  // Listen for upload trigger from dashboard
  useEffect(() => {
    const handleShowUpload = () => {
      setViewType("upload");
    };

    window.addEventListener('showUpload', handleShowUpload);
    return () => window.removeEventListener('showUpload', handleShowUpload);
  }, []);

  const filteredClients = clients.filter(
    (client) =>
      client.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.clientCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredClients.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + pageSize);

  const handleViewClient = async (client: Client) => {
    setSelectedClient(client);
    setViewType("detail");
    await loadClientData(client.clientCode);
  };

  const handleBackToList = () => {
    setViewType("list");
    setSelectedClient(null);
    setPendingOrders([]);
    setPendingMaterials([]);
    setNewOrders([]);
  };

  if (viewType === "upload") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setViewType("list")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Upload Excel Files</h1>
          </div>
        </div>
        <div className="p-6">
          <ExcelUpload />
        </div>
      </div>
    );
  }

  if (viewType === "detail" && selectedClient) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={handleBackToList}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                  {selectedClient.clientCode.charAt(0)}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{selectedClient.clientCode}</h1>
                  <p className="text-sm text-gray-600">{selectedClient.clientName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div>
              <div className="mb-6 flex border-b border-border">
                {[
                  { id: "pendingMaterial" as TabType, label: "Pending Material", count: pendingMaterials.length },
                  { id: "pendingOrders" as TabType, label: "Pending Orders", count: pendingOrders.length },
                  { id: "newOrders" as TabType, label: "New Orders", count: newOrders.length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 border-b-2 -mb-px text-sm font-medium transition-colors flex items-center gap-2 ${
                      activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                    <Badge variant="secondary" className="text-xs">
                      {tab.count}
                    </Badge>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {activeTab === "pendingMaterial" &&
                  pendingMaterials.map((item) => (
                    <DetailCard
                      key={item.id}
                      type="material"
                      item={item}
                      onAddFollowUp={(id) => {
                        setSelectedItemId(id);
                        setShowAddFollowUp(true);
                      }}
                    />
                  ))}

                {activeTab === "pendingOrders" &&
                  pendingOrders.map((item) => (
                    <DetailCard
                      key={item.id}
                      type="order"
                      item={item}
                      onAddFollowUp={(id) => {
                        setSelectedItemId(id);
                        setShowAddFollowUp(true);
                      }}
                    />
                  ))}

                {activeTab === "newOrders" &&
                  newOrders.map((item) => (
                    <DetailCard
                      key={item.id}
                      type="design"
                      item={item}
                      onAddFollowUp={(id) => {
                        setSelectedItemId(id);
                        setShowAddFollowUp(true);
                      }}
                    />
                  ))}

                {((activeTab === "pendingMaterial" && pendingMaterials.length === 0) ||
                  (activeTab === "pendingOrders" && pendingOrders.length === 0) ||
                  (activeTab === "newOrders" && newOrders.length === 0)) && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No data available for this section</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Add Follow-up Modal */}
        <Dialog open={showAddFollowUp} onOpenChange={setShowAddFollowUp}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg">Add Follow-up</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-muted-foreground">
                  Message
                </label>
                <Textarea
                  placeholder="Enter message..."
                  value={followUpMessage}
                  onChange={(e) => setFollowUpMessage(e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-muted-foreground">
                  Next Date
                </label>
                <Input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-muted-foreground">Status</label>
                <Select value={followUpStatus} onValueChange={setFollowUpStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setShowAddFollowUp(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddFollowUp}>
                Add Follow-up
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Clients</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search clients..."
                className="pl-10 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              variant="outline"
              onClick={() => setViewType("upload")}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Excel
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {clients.length}
            </div>
            <div className="text-sm text-gray-500">Total Clients</div>
          </div>
          
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {clients.filter(c => c.status !== 'inactive').length}
            </div>
            <div className="text-sm text-gray-500">Active Clients</div>
          </div>
          
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-red-600 mb-1">
              {clients.filter(c => c.status === 'inactive').length}
            </div>
            <div className="text-sm text-gray-500">Inactive Clients</div>
          </div>
          
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {pendingOrders.length + pendingMaterials.length + newOrders.length}
            </div>
            <div className="text-sm text-gray-500">Total Records</div>
          </div>
        </div>

        {/* Clients Table */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-medium text-gray-700">Client Name</TableHead>
                    <TableHead className="font-medium text-gray-700">Client Code</TableHead>
                    <TableHead className="font-medium text-gray-700">Email</TableHead>
                    <TableHead className="font-medium text-gray-700">Phone</TableHead>
                    <TableHead className="font-medium text-gray-700">Status</TableHead>
                    <TableHead className="font-medium text-gray-700 text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedClients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                            {client.clientCode?.charAt(0) || 'C'}
                          </div>
                          <div className="font-medium text-gray-900">{client.clientName || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">{client.clientCode}</TableCell>
                      <TableCell className="text-gray-600">{client.email || 'N/A'}</TableCell>
                      <TableCell className="text-gray-600">{client.phone || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                          {client.status || 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-primary/10"
                            onClick={() => handleViewClient(client)}
                          >
                            <Eye className="h-4 w-4 text-gray-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {/* Pagination */}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
        />
      </div>
    </div>
  );
}

function DetailCard({
  type,
  item,
  onAddFollowUp,
}: {
  type: "material" | "order" | "design";
  item: PendingMaterial | PendingOrder | NewOrder;
  onAddFollowUp: (id: string) => void;
}) {
  const getFields = () => {
    if (type === "material") {
      const material = item as PendingMaterial;
      return [
        { label: "Material Name", value: material.materialName },
        { label: "Status", value: material.status, badge: true },
        { label: "Quantity", value: material.quantity },
        { label: "Remark", value: material.remark },
      ];
    }
    if (type === "order") {
      const order = item as PendingOrder;
      return [
        { label: "Order ID", value: order.orderId },
        { label: "Status", value: order.status, badge: true },
        { label: "Order Date", value: order.orderDate },
        { label: "Gross Weight", value: `${order.grossWt}g` },
        { label: "Collection", value: order.collection },
      ];
    }
    const design = item as NewOrder;
    return [
      { label: "Design Name", value: design.designName },
      { label: "Status", value: design.status, badge: true },
      { label: "Date", value: design.date },
      { label: "Remark", value: design.remark },
    ];
  };

  const getTitle = () => {
    if (type === "material") return "Material Details";
    if (type === "order") return "Order Details";
    return "Design Details";
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border bg-muted px-4 py-3">
          <h3 className="font-medium text-foreground">{getTitle()}</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            {getFields().map((field, i) => (
              <div key={i}>
                <p className="text-sm text-muted-foreground">{field.label}</p>
                {field.badge ? (
                  <Badge
                    variant={getStatusBadgeVariant(field.value)}
                    className="mt-1"
                  >
                    {field.value}
                  </Badge>
                ) : (
                  <p className="font-medium text-foreground mt-1">
                    {field.value}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border bg-muted px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium text-foreground">Follow-ups</h3>
              <span className="text-sm text-muted-foreground">
                ({item.followUps?.length || 0})
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={() => onAddFollowUp(item.id)}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
        <div className="p-4">
          <div className="max-h-64 space-y-3 overflow-y-auto pr-2">
            {item.followUps && item.followUps.length > 0 ? (
              item.followUps.map((followUp, i) => (
                <div key={i} className="border border-border rounded p-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Created: {new Date(followUp.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                      <Calendar className="h-3 w-3" />
                      <span className="font-medium">
                        Next: {new Date(followUp.nextFollowUpDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{followUp.followUpMsg}</p>
                  <Badge variant="outline" className="text-xs">
                    {followUp.followUpStatus}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No follow-ups available
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
