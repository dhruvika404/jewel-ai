import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  ShoppingCart,
  Database,
  FileSpreadsheet,
  Plus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, subDays } from "date-fns";
import { dashboardAPI } from "@/services/api";
import { toast } from "sonner";
import { usePageHeader } from "@/contexts/PageHeaderProvider";
import { CreateTaskModal } from "@/components/modals/CreateTaskModal";
import { useAuth } from "@/contexts/AuthContext";

interface StatCardProps {
  label: string;
  value: number;
  icon: any;
  color: "blue" | "emerald" | "orange" | "purple" | "red";
  loading: boolean;
}

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role !== "sales_executive";
  const { setHeader } = usePageHeader();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [systemStats, setSystemStats] = useState({
    todaysTotalPendingFollowUps: 0,
    todaysTotalTakenFollowUps: 0,
    last7daysTotalPendingFollowUps: 0,
    todaysTotalPendingFollowUpsOfPendingOrder: 0,
    todaysTotalTakenFollowUpsOfPendingOrder: 0,
    last7DayPendingFollowUpsOfPendingOrder: 0,
    todaysTotalPendingFollowUpsOfPendingMaterial: 0,
    todaysTotalTakenFollowUpsOfPendingMaterial: 0,
    last7DayPendingFollowUpsOfPendingMaterial: 0,
    todaysTotalPendingFollowUpsOfNewOrder: 0,
    todaysTotalTakenFollowUpsOfNewOrder: 0,
    last7DayPendingFollowUpsOfNewOrder: 0,
  });

  useEffect(() => {
    setHeader({
      title: "Dashboard",
      children: isAdmin ? (
        <Button
          onClick={() => setShowCreateTaskModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Task
        </Button>
      ) : undefined,
    });
  }, [isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (!isAdmin && user?.userCode) {
        params.salesExecCode = user.userCode;
      }
      const statsRes = await dashboardAPI.getOverview(params);
      if (statsRes?.data) {
        setSystemStats(statsRes.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSectionClick = (
    type: string,
    filterType: "due" | "completed" | "pending7",
  ) => {
    let endpoint = "";
    if (type === "Pending Orders Follow-ups") endpoint = "pending-order";
    else if (type === "Pending Material Follow-ups")
      endpoint = "pending-material";
    else if (type === "New Order Follow-ups") endpoint = "new-order";

    const today = format(new Date(), "yyyy-MM-dd");
    let params = `?startDate=${today}&endDate=${today}`;

    if (filterType === "due") {
      params += `&todayDueFollowUp=true`;
    } else if (filterType === "completed") {
      params += `&todayCompletedFollowUp=true`;
    } else if (filterType === "pending7") {
      const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
      params = `?startDate=${sevenDaysAgo}&endDate=${today}&sevenDayPendingFollowUp=true`;
    }
    navigate(`/followups/${endpoint}${params}`);
  };

  return (
    <div className="p-6 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Due Today Follow-ups"
          value={systemStats.todaysTotalPendingFollowUps}
          icon={Clock}
          color="blue"
          loading={loading}
        />
        <StatCard
          label="Today's Taken Follow-ups"
          value={systemStats.todaysTotalTakenFollowUps}
          icon={CheckCircle}
          color="emerald"
          loading={loading}
        />
        <StatCard
          label="Pending Follow-ups (Last 7 Days)"
          value={systemStats.last7daysTotalPendingFollowUps}
          icon={AlertCircle}
          color="orange"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BreakdownSection
          title="New Order Follow-ups"
          icon={FileSpreadsheet}
          color="purple"
          pending={systemStats.todaysTotalPendingFollowUpsOfNewOrder}
          taken={systemStats.todaysTotalTakenFollowUpsOfNewOrder}
          last7={systemStats.last7DayPendingFollowUpsOfNewOrder}
          onStatClick={(filterType: any) =>
            handleSectionClick("New Order Follow-ups", filterType)
          }
        />
        <BreakdownSection
          title="Pending Orders Follow-ups"
          icon={ShoppingCart}
          color="emerald"
          pending={systemStats.todaysTotalPendingFollowUpsOfPendingOrder}
          taken={systemStats.todaysTotalTakenFollowUpsOfPendingOrder}
          last7={systemStats.last7DayPendingFollowUpsOfPendingOrder}
          onStatClick={(filterType: any) =>
            handleSectionClick("Pending Orders Follow-ups", filterType)
          }
        />
        <BreakdownSection
          title="Pending Material Follow-ups"
          icon={Database}
          color="orange"
          pending={systemStats.todaysTotalPendingFollowUpsOfPendingMaterial}
          taken={systemStats.todaysTotalTakenFollowUpsOfPendingMaterial}
          last7={systemStats.last7DayPendingFollowUpsOfPendingMaterial}
          onStatClick={(filterType: any) =>
            handleSectionClick("Pending Material Follow-ups", filterType)
          }
        />
      </div>

      {isAdmin && (
        <CreateTaskModal
          isOpen={showCreateTaskModal}
          onClose={() => setShowCreateTaskModal(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, loading }: StatCardProps) {
  const colors: any = {
    blue: "bg-blue-100 text-blue-600",
    emerald: "bg-emerald-100 text-emerald-600",
    orange: "bg-orange-100 text-orange-600",
    purple: "bg-purple-100 text-purple-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <Card className="p-4 shadow-sm border-none ring-1 ring-black/[0.05] bg-white">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${colors[color]}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold">{loading ? "..." : value}</p>
        </div>
      </div>
    </Card>
  );
}

function BreakdownSection({
  title,
  icon: Icon,
  color,
  pending,
  taken,
  last7,
  onStatClick,
}: any) {
  const colors: any = {
    emerald: "text-emerald-600",
    orange: "text-orange-600",
    purple: "text-purple-600",
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b bg-gray-50 py-3 px-4 rounded-t-lg">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className={`w-4 h-4 ${colors[color]}`} />
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div
            className={`p-2 rounded transition-colors ${
              pending > 0
                ? "cursor-pointer hover:bg-gray-50"
                : "cursor-not-allowed"
            }`}
            onClick={pending > 0 ? () => onStatClick("due") : undefined}
          >
            <p className="text-[12px] text-gray-500">Due Today</p>
            <p className="text-xl font-bold">{pending}</p>
          </div>
          <div
            className={`p-2 rounded transition-colors ${
              taken > 0
                ? "cursor-pointer hover:bg-gray-50"
                : "cursor-not-allowed"
            }`}
            onClick={taken > 0 ? () => onStatClick("completed") : undefined}
          >
            <p className="text-[12px] text-gray-500">Today's Taken</p>
            <p className="text-xl font-bold">{taken}</p>
          </div>
          <div
            className={`p-2 rounded transition-colors ${
              last7 > 0
                ? "cursor-pointer hover:bg-gray-50"
                : "cursor-not-allowed"
            }`}
            onClick={last7 > 0 ? () => onStatClick("pending7") : undefined}
          >
            <p className="text-[12px] text-gray-500">Pending (7 Days)</p>
            <p className="text-xl font-bold">{last7}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
