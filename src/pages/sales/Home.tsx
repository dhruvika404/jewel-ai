import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  Package,
  ShoppingCart,
  Box,
  Loader2,
  Plus,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  newOrderAPI,
  pendingOrderAPI,
  pendingMaterialAPI,
} from "@/services/api";
import { toast } from "sonner";
import { usePageHeader } from "@/contexts/PageHeaderProvider";
import { useAuth } from "@/contexts/AuthContext";
import { CreateTaskModal } from "@/components/modals/CreateTaskModal";

interface FollowUp {
  id: string;
  followUpMsg: string;
  nextFollowUpDate: string;
  followUpStatus: string;
  createdAt: string;
  clientCode?: string;
  clientName?: string;
  type?: string;
}

interface OverdueFollowUpItem {
  id: string;
  clientName: string;
  clientCode: string;
  type: string;
  daysOverdue?: number;
  nextFollowUpDate: string;
}

export default function SalesHome() {
  const { setHeader } = usePageHeader();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [overdueFollowups, setOverdueFollowups] = useState<OverdueFollowUpItem[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  // Set header
  useEffect(() => {
    setHeader({
      title: "Dashboard",
      children: (
        <Button
          onClick={() => setShowCreateTaskModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Task
        </Button>
      ),
    });
  }, []);

  // Load all follow-ups
  const loadFollowUps = async () => {
    setLoading(true);
    try {
      const [newOrderRes, pendingOrderRes, pendingMaterialRes] =
        await Promise.all([
          newOrderAPI.getFollowUpsByClientCode({ page: 1, size: 1000 }),
          pendingOrderAPI.getFollowUpsByClientCode({
            page: 1,
            size: 1000,
            clientCode: "",
          }),
          pendingMaterialAPI.getFollowUpsByClientCode({
            page: 1,
            size: 1000,
            clientCode: "",
          }),
        ]);

      const allFollowUps: FollowUp[] = [];
      const allOverdueFollowUps: OverdueFollowUpItem[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const processApiResponse = (res: any, type: string) => {
        if (res.data) {
          res.data.forEach((item: any) => {
            if (item.followUps && item.followUps.length > 0) {
              // Filter by sales executive code if user is sales person
              const shouldInclude =
                user?.role === "admin" ||
                (user?.role === "sales_executive" &&
                  item.salesExecCode === user?.userCode);

              if (shouldInclude) {
                item.followUps.forEach((fu: any) => {
                  const followUp: FollowUp = {
                    ...fu,
                    clientCode: item.clientCode,
                    clientName: item.designName || item.orderId || item.materialName || item.clientCode,
                    type: type,
                  };
                  allFollowUps.push(followUp);

                  // Check for overdue
                  const fuDate = new Date(fu.nextFollowUpDate);
                  fuDate.setHours(0, 0, 0, 0);

                  if (
                    fuDate < today &&
                    fu.followUpStatus?.toLowerCase() !== "completed"
                  ) {
                    const diffTime = Math.abs(today.getTime() - fuDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    allOverdueFollowUps.push({
                      id: fu._id || fu.id || Math.random().toString(),
                      clientName: item.designName || item.orderId || item.materialName || item.clientCode,
                      clientCode: item.clientCode,
                      type: type,
                      daysOverdue: diffDays,
                      nextFollowUpDate: fu.nextFollowUpDate,
                    });
                  }
                });
              }
            }
          });
        }
      };

      processApiResponse(newOrderRes, "New Order");
      processApiResponse(pendingOrderRes, "Pending Order");
      processApiResponse(pendingMaterialRes, "Pending Material");

      setFollowUps(allFollowUps);
      
      // Sort overdue by most overdue and limit to top 6
      setOverdueFollowups(
        allOverdueFollowUps
          .sort((a, b) => (b.daysOverdue || 0) - (a.daysOverdue || 0))
          .slice(0, 6)
      );
      
      calculateCounts(allFollowUps);
    } catch (error: any) {
      console.error("Error loading follow-ups:", error);
      toast.error("Failed to load follow-ups");
    } finally {
      setLoading(false);
    }
  };

  const calculateCounts = (followUpsList: FollowUp[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let todayC = 0;
    let pendingC = 0;
    let overdueC = 0;
    let completedC = 0;

    followUpsList.forEach((fu) => {
      const followUpDate = new Date(fu.nextFollowUpDate);
      followUpDate.setHours(0, 0, 0, 0);

      const isCompleted = fu.followUpStatus?.toLowerCase() === "completed";

      if (isCompleted) {
        completedC++;
      }

      if (followUpDate.getTime() === today.getTime()) {
        todayC++;
      }

      if (!isCompleted && followUpDate >= today) {
        pendingC++;
      }

      if (!isCompleted && followUpDate < today) {
        overdueC++;
      }
    });

    setTodayCount(todayC);
    setPendingCount(pendingC);
    setOverdueCount(overdueC);
    setCompletedCount(completedC);
  };

  useEffect(() => {
    loadFollowUps();
  }, [user]);

  return (
    <div className="pb-6">
      <div className="p-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Today's Follow-ups"
            value={todayCount}
            icon={Clock}
            color="blue"
            loading={loading}
          />
          <StatCard
            label="Pending Follow-ups"
            value={pendingCount}
            icon={Package}
            color="orange"
            loading={loading}
          />
          <StatCard
            label="Overdue Follow-ups"
            value={overdueCount}
            icon={AlertCircle}
            color="red"
            loading={loading}
          />
          <StatCard
            label="Completed Tasks"
            value={completedCount}
            icon={CheckCircle}
            color="emerald"
            loading={loading}
          />
        </div>

        {/* Task Type Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TaskTypeSection
            title="New Orders"
            icon={Package}
            color="emerald"
            followUps={followUps.filter(fu => fu.type === "New Order")}
          />
          <TaskTypeSection
            title="Pending Orders"
            icon={ShoppingCart}
            color="orange"
            followUps={followUps.filter(fu => fu.type === "Pending Order")}
          />
          <TaskTypeSection
            title="Pending Materials"
            icon={Box}
            color="purple"
            followUps={followUps.filter(fu => fu.type === "Pending Material")}
          />
        </div>

        {/* Overdue Follow-ups List */}
        <div className="grid grid-cols-1 gap-6">
          <Card className="border shadow-sm">
            <CardHeader className="bg-gray-50/50 border-b py-3 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                Overdue Follow-ups
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {loading ? (
                  <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Loading overdue follow-ups...</span>
                  </div>
                ) : overdueFollowups.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 italic">
                    No overdue follow-ups at the moment.
                  </div>
                ) : (
                  overdueFollowups.map((item, idx) => (
                    <div
                      key={item.id + idx}
                      className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-sm text-gray-900">
                          {item.clientName} ({item.clientCode})
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {item.type} • Due{" "}
                          {new Date(item.nextFollowUpDate).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge className="bg-red-50 text-red-600 border-red-100 hover:bg-red-50 shadow-none">
                        {item.daysOverdue}d overdue
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateTaskModal
        isOpen={showCreateTaskModal}
        onClose={() => setShowCreateTaskModal(false)}
        onSuccess={loadFollowUps}
      />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, loading }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <Card className="p-4 border-none shadow-sm bg-white ring-1 ring-black/[0.05]">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 ${colors[color]} rounded-full flex items-center justify-center shrink-0`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900">
            {loading ? "..." : value}
          </p>
        </div>
      </div>
    </Card>
  );
}

function TaskTypeSection({ title, icon: Icon, color, followUps }: any) {
  const colors: any = {
    emerald: "text-emerald-500",
    orange: "text-orange-500",
    purple: "text-purple-500",
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pending = followUps.filter((fu: FollowUp) => {
    const fuDate = new Date(fu.nextFollowUpDate);
    fuDate.setHours(0, 0, 0, 0);
    return fu.followUpStatus?.toLowerCase() !== "completed" && fuDate >= today;
  }).length;

  const completed = followUps.filter((fu: FollowUp) => 
    fu.followUpStatus?.toLowerCase() === "completed"
  ).length;

  const overdue = followUps.filter((fu: FollowUp) => {
    const fuDate = new Date(fu.nextFollowUpDate);
    fuDate.setHours(0, 0, 0, 0);
    return fu.followUpStatus?.toLowerCase() !== "completed" && fuDate < today;
  }).length;

  return (
    <Card className="border shadow-sm bg-white overflow-hidden">
      <CardHeader className="bg-gray-50/50 border-b py-3 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Icon className={`w-4 h-4 ${colors[color]}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-gray-400">
              Pending
            </div>
            <div className="text-xl font-bold text-gray-900">{pending}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-gray-400">
              Completed
            </div>
            <div className="text-xl font-bold text-gray-900">{completed}</div>
          </div>
        </div>
        <div className="pt-3 border-t flex items-center justify-between text-xs">
          <span className="text-gray-500 italic">Overdue</span>
          <span className="font-bold text-red-600">{overdue}</span>
        </div>
      </CardContent>
    </Card>
  );
}
