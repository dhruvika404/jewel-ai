import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import {
  Search,
  Plus,
  Calendar,
  Users,
  Package,
  ShoppingCart,
  Sparkles,
  ChevronRight,
  Clock,
  MessageSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FollowUp {
  lastFollowUp: string;
  nextFollowUp: string;
  message: string;
}

interface MaterialItem {
  materialName: string;
  status: string;
  quantity: string;
  remark: string;
  followUps: FollowUp[];
}

interface OrderItem {
  orderId: string;
  status: string;
  orderDate: string;
  grossWt: string;
  collection: string;
  followUps: FollowUp[];
}

interface NewOrderItem {
  designName: string;
  status: string;
  date: string;
  remark: string;
  followUps: FollowUp[];
}

interface Client {
  code: string;
  name: string;
  pendingMaterial: MaterialItem[];
  pendingOrders: OrderItem[];
  newOrders: NewOrderItem[];
}

const clientsData: Client[] = [
  {
    code: "CL001",
    name: "XYZ Jewelers",
    pendingMaterial: [
      {
        materialName: "Gold Bullion",
        status: "Completed",
        quantity: "100 Units",
        remark: "Wait for quality confirmation",
        followUps: [
          {
            lastFollowUp: "12-12-2025",
            nextFollowUp: "25-12-2025",
            message: "Need updated inventory list",
          },
          {
            lastFollowUp: "05-12-2025",
            nextFollowUp: "25-12-2025",
            message: "Awaiting material confirmation",
          },
          {
            lastFollowUp: "01-11-2025",
            nextFollowUp: "01-01-2026",
            message: "Supply delay updates",
          },
        ],
      },
    ],
    pendingOrders: [
      {
        orderId: "MO/25-26/15668",
        status: "Pending",
        orderDate: "22/12/2025",
        grossWt: "42.75",
        collection: "New Collection",
        followUps: [
          {
            lastFollowUp: "15-12-2025",
            nextFollowUp: "25-12-2025",
            message: "Please approve order #1024",
          },
          {
            lastFollowUp: "09-12-2025",
            nextFollowUp: "18-12-2025",
            message: "Confirm shipment for customer",
          },
          {
            lastFollowUp: "09-12-2025",
            nextFollowUp: "12-12-2025",
            message: "Review payment details",
          },
        ],
      },
    ],
    newOrders: [
      {
        designName: "Modern Emerald",
        status: "In Review",
        date: "12/12/2025",
        remark: "Final samples for review",
        followUps: [
          {
            lastFollowUp: "10-12-2025",
            nextFollowUp: "29-12-2025",
            message: "Confirmed design samples",
          },
          {
            lastFollowUp: "05-12-2025",
            nextFollowUp: "02-09-2025",
            message: "Request feedback",
          },
          {
            lastFollowUp: "01-09-2025",
            nextFollowUp: "05-12-2025",
            message: "Send estimate for review",
          },
        ],
      },
    ],
  },
  {
    code: "CL002",
    name: "ABC Gold",
    pendingMaterial: [
      {
        materialName: "Silver Bars",
        status: "Pending",
        quantity: "250 Units",
        remark: "Verify purity specifications",
        followUps: [
          {
            lastFollowUp: "15-11-2025",
            nextFollowUp: "20-11-2025",
            message: "Dealer applied updated specifications",
          },
        ],
      },
    ],
    pendingOrders: [
      {
        orderId: "MO/25-26/14205",
        status: "Pending",
        orderDate: "20-11-2025",
        grossWt: "38.50",
        collection: "Classic Gold",
        followUps: [
          {
            lastFollowUp: "20-11-2025",
            nextFollowUp: "20-12-2025",
            message: "Dealer applied order #1026",
          },
        ],
      },
    ],
    newOrders: [
      {
        designName: "Royal Diamond",
        status: "Completed",
        date: "20-11-2025",
        remark: "Draft confirmed details",
        followUps: [
          {
            lastFollowUp: "20-11-2025",
            nextFollowUp: "20-11-2025",
            message: "Draft confirmed details",
          },
        ],
      },
    ],
  },
  {
    code: "CL003",
    name: "PQR Diamonds",
    pendingMaterial: [
      {
        materialName: "Platinum Wire",
        status: "In Transit",
        quantity: "75 Units",
        remark: "Awaiting switch confirmation",
        followUps: [
          {
            lastFollowUp: "20-12-2025",
            nextFollowUp: "20-11-2025",
            message: "Under carrier of order #4005",
          },
        ],
      },
    ],
    pendingOrders: [
      {
        orderId: "MO/25-26/14005",
        status: "Processing",
        orderDate: "09-12-2025",
        grossWt: "52.30",
        collection: "Premium Series",
        followUps: [
          {
            lastFollowUp: "09-12-2025",
            nextFollowUp: "20-12-2025",
            message: "Under carrier of order #4005",
          },
        ],
      },
    ],
    newOrders: [
      {
        designName: "Sapphire Elite",
        status: "Approved",
        date: "16-12-2025",
        remark: "Send proposal for retailer",
        followUps: [
          {
            lastFollowUp: "16-12-2025",
            nextFollowUp: "10-12-2025",
            message: "Send proposal for retailer",
          },
        ],
      },
    ],
  },
];

type TabType = "pendingMaterial" | "pendingOrders" | "newOrders";

const getStatusBadgeVariant = (status: string) => {
  const statusLower = status.toLowerCase();
  if (statusLower === "completed" || statusLower === "approved")
    return "success";
  if (statusLower === "pending" || statusLower === "in review")
    return "pending";
  if (statusLower === "processing" || statusLower === "in transit")
    return "warning";
  return "secondary";
};

export default function AdminClients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("pendingMaterial");
  const [showAddFollowUp, setShowAddFollowUp] = useState(false);
  const [addFollowUpCategory, setAddFollowUpCategory] =
    useState<TabType | null>(null);
  const [followUpMessage, setFollowUpMessage] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpStatus, setFollowUpStatus] = useState("");

  const filteredClients = clientsData.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLatestFollowUpInfo = (
    items: MaterialItem[] | OrderItem[] | NewOrderItem[]
  ) => {
    if (items.length === 0)
      return { lastFollowUp: "-", nextFollowUp: "-", message: "-" };
    const latestFollowUp = items[0].followUps[0];
    return {
      lastFollowUp: latestFollowUp.lastFollowUp,
      nextFollowUp: latestFollowUp.nextFollowUp,
      message: latestFollowUp.message,
    };
  };

  const stats = [
    {
      label: "Total Clients",
      value: clientsData.length,
      icon: Users,
      color: "text-primary",
    },
    {
      label: "Pending Materials",
      value: clientsData.reduce((acc, c) => acc + c.pendingMaterial.length, 0),
      icon: Package,
      color: "text-blue-500",
    },
    {
      label: "Pending Orders",
      value: clientsData.reduce((acc, c) => acc + c.pendingOrders.length, 0),
      icon: ShoppingCart,
      color: "text-amber-500",
    },
    {
      label: "New Orders",
      value: clientsData.reduce((acc, c) => acc + c.newOrders.length, 0),
      icon: Sparkles,
      color: "text-emerald-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  Client Overview
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage follow-ups and orders
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="group animate-fade-up rounded-xl border border-border bg-card p-4 shadow-soft transition-all duration-300 hover:shadow-card"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-lg bg-muted p-2 transition-colors group-hover:bg-accent`}
                >
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Card
          className="animate-fade-up overflow-hidden border-border shadow-card"
          style={{ animationDelay: "200ms" }}
        >
          <CardHeader className="border-b border-border bg-muted/30 px-6 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by client name or code..."
                className="pl-10 bg-background border-border focus:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Pending Material
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Pending Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      New Orders
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredClients.map((client, index) => {
                    const materialInfo = getLatestFollowUpInfo(
                      client.pendingMaterial
                    );
                    const ordersInfo = getLatestFollowUpInfo(
                      client.pendingOrders
                    );
                    const newOrdersInfo = getLatestFollowUpInfo(
                      client.newOrders
                    );
                    return (
                      <tr
                        key={client.code}
                        className="group animate-fade-up bg-card transition-colors hover:bg-muted/30"
                        style={{ animationDelay: `${(index + 4) * 50}ms` }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                              {client.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {client.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {client.code}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <FollowUpCell {...materialInfo} />
                        </td>
                        <td className="px-6 py-4">
                          <FollowUpCell {...ordersInfo} />
                        </td>
                        <td className="px-6 py-4">
                          <FollowUpCell {...newOrdersInfo} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            onClick={() => {
                              setSelectedClient(client);
                              setActiveTab("pendingMaterial");
                            }}
                            size="sm"
                            className="group-hover:shadow-card"
                          >
                            View
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog
        open={!!selectedClient}
        onOpenChange={() => setSelectedClient(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border-border bg-card">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {selectedClient?.name.charAt(0)}
              </div>
              <div>
                <span className="text-foreground">{selectedClient?.name}</span>
                <p className="text-sm font-normal text-muted-foreground">
                  {selectedClient?.code}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedClient && (
            <div className="mt-4">
              <div className="mb-6 flex gap-1 rounded-lg bg-muted/50 p-1">
                {[
                  {
                    id: "pendingMaterial" as TabType,
                    label: "Pending Material",
                    icon: Package,
                  },
                  {
                    id: "pendingOrders" as TabType,
                    label: "Pending Orders",
                    icon: ShoppingCart,
                  },
                  {
                    id: "newOrders" as TabType,
                    label: "New Orders",
                    icon: Sparkles,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-card text-foreground shadow-soft"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {activeTab === "pendingMaterial" &&
                  selectedClient.pendingMaterial.map((item, idx) => (
                    <DetailCard
                      key={idx}
                      title="Material Details"
                      fields={[
                        { label: "Material Name", value: item.materialName },
                        { label: "Status", value: item.status, isBadge: true },
                        { label: "Quantity", value: item.quantity },
                        { label: "Remark", value: item.remark },
                      ]}
                      followUps={item.followUps}
                      onAddFollowUp={() => {
                        setAddFollowUpCategory("pendingMaterial");
                        setShowAddFollowUp(true);
                      }}
                    />
                  ))}

                {activeTab === "pendingOrders" &&
                  selectedClient.pendingOrders.map((item, idx) => (
                    <DetailCard 
                      key={idx}
                      title="Order Details"
                      fields={[
                        { label: "Order ID", value: item.orderId },
                        { label: "Status", value: item.status, isBadge: true },
                        { label: "Order Date", value: item.orderDate },
                        { label: "Gross Weight", value: `${item.grossWt}g` },
                        {
                          label: "Collection",
                          value: item.collection,
                          fullWidth: true,
                        },
                      ]}
                      followUps={item.followUps}
                      onAddFollowUp={() => {
                        setAddFollowUpCategory("pendingOrders");
                        setShowAddFollowUp(true);
                      }}
                    />
                  ))}

                {activeTab === "newOrders" &&
                  selectedClient.newOrders.map((item, idx) => (
                    <DetailCard
                      key={idx}
                      title="Design Details"
                      fields={[
                        { label: "Design Name", value: item.designName },
                        { label: "Status", value: item.status, isBadge: true },
                        { label: "Date", value: item.date },
                        { label: "Remark", value: item.remark },
                      ]}
                      followUps={item.followUps}
                      onAddFollowUp={() => {
                        setAddFollowUpCategory("newOrders");
                        setShowAddFollowUp(true);
                      }}
                    />
                  ))}
              </div>
            </div>
          )}

          <DialogFooter className="mt-6 border-t border-border pt-4">
            <Button onClick={() => setSelectedClient(null)} variant="outline">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showAddFollowUp}
        onOpenChange={() => {
          setShowAddFollowUp(false);
          setAddFollowUpCategory(null);
          setFollowUpMessage("");
          setFollowUpDate("");
          setFollowUpStatus("");
        }}
      >
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Add Follow-up
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Follow-up Message
              </label>
              <Textarea
                placeholder="Enter your message..."
                value={followUpMessage}
                onChange={(e) => setFollowUpMessage(e.target.value)}
                rows={3}
                className="border-border bg-background focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Next Follow-up Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="pl-10 border-border bg-background focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Status
              </label>
              <Select value={followUpStatus} onValueChange={setFollowUpStatus}>
                <SelectTrigger className="border-border bg-background">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-6 border-t border-border pt-4">
            <Button
              onClick={() => {
                setShowAddFollowUp(false);
                setAddFollowUpCategory(null);
                setFollowUpMessage("");
                setFollowUpDate("");
                setFollowUpStatus("");
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowAddFollowUp(false);
                setAddFollowUpCategory(null);
                setFollowUpMessage("");
                setFollowUpDate("");
                setFollowUpStatus("");
              }}
            >
              <Plus className="h-4 w-4" />
              Add Follow-up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FollowUpCell({
  lastFollowUp,
  nextFollowUp,
  message,
}: {
  lastFollowUp: string;
  nextFollowUp: string;
  message: string;
}) {
  return (
    <div className="space-y-1.5 text-xs">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>Last: {lastFollowUp}</span>
      </div>
      <div className="flex items-center gap-1.5 text-primary">
        <Calendar className="h-3 w-3" />
        <span className="font-medium">Next: {nextFollowUp}</span>
      </div>
      <div className="flex items-start gap-1.5 text-foreground">
        <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
        <span className="line-clamp-2">{message}</span>
      </div>
    </div>
  );
}

interface DetailField {
  label: string;
  value: string;
  isBadge?: boolean;
  fullWidth?: boolean;
}

function DetailCard({
  title,
  fields,
  followUps,
  onAddFollowUp,
}: {
  title: string;
  fields: DetailField[];
  followUps: FollowUp[];
  onAddFollowUp: () => void;
}) {
  return (
    <div className="animate-scale-in overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border bg-muted/30 px-4 py-3">
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      <div className="p-4">
        <div className="mb-4 grid grid-cols-2 gap-4">
          {fields.map((field, i) => (
            <div key={i} className={field.fullWidth ? "col-span-2" : ""}>
              <p className="mb-1 text-xs text-muted-foreground">
                {field.label}
              </p>
              {field.isBadge ? (
                <Badge variant={getStatusBadgeVariant(field.value)}>
                  {field.value}
                </Badge>
              ) : (
                <p className="font-medium text-foreground">{field.value}</p>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Follow-up History
          </p>
          {followUps.map((f, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-muted/20 p-3 transition-colors hover:bg-muted/40"
            >
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Last: {f.lastFollowUp}</span>
                </div>
                <div className="flex items-center gap-2 text-primary">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="font-medium">Next: {f.nextFollowUp}</span>
                </div>
                <div className="flex items-start gap-2 sm:col-span-2">
                  <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-foreground">{f.message}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={onAddFollowUp}
          className="mt-4"
          size="sm"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          Add Follow-up
        </Button>
      </div>
    </div>
  );
}
