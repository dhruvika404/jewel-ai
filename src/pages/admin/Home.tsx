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
import {
  dashboardAPI,
  newOrderAPI,
  pendingOrderAPI,
  pendingMaterialAPI,
} from "@/services/api";
import { toast } from "sonner";
import { usePageHeader } from "@/contexts/PageHeaderProvider";
import { CreateTaskModal } from "@/components/modals/CreateTaskModal";

interface SystemStats {
  todaysTotalPendingFollowUps: number;
  todaysTotalTakenFollowUps: number;
  last7daysTotalPendingFollowUps: number;

  todaysTotalPendingFollowUpsOfPendingOrder: number;
  todaysTotalTakenFollowUpsOfPendingOrder: number;
  last7DayPendingFollowUpsOfPendingOrder: number;

  todaysTotalPendingFollowUpsOfPendingMaterial: number;
  todaysTotalTakenFollowUpsOfPendingMaterial: number;
  last7DayPendingFollowUpsOfPendingMaterial: number;

  todaysTotalPendingFollowUpsOfNewOrder: number;
  todaysTotalTakenFollowUpsOfNewOrder: number;
  last7DayPendingFollowUpsOfNewOrder: number;
}

export default function AdminHome() {
  const { setHeader } = usePageHeader();

  const [loading, setLoading] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  const [systemStats, setSystemStats] = useState<SystemStats>({
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

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes] = await Promise.all([
        dashboardAPI.getOverview(),
        newOrderAPI.getFollowUpsByClientCode({ page: 1, size: 500 }),
        pendingOrderAPI.getFollowUpsByClientCode({
          page: 1,
          size: 500,
        }),
        pendingMaterialAPI.getFollowUpsByClientCode({
          page: 1,
          size: 500,
        }),
      ]);

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
  }, []);

  return (
    <div className="p-6 space-y-8">
      {/* ===== TOP SUMMARY ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Follow-ups Due Today"
          value={systemStats.todaysTotalPendingFollowUps}
          icon={Clock}
          color="blue"
          loading={loading}
        />
        <StatCard
          label="Follow-ups Completed Today"
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

      {/* ===== DETAILED BREAKDOWN ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BreakdownSection
          title="Pending Orders Follow-ups"
          icon={ShoppingCart}
          color="emerald"
          pending={systemStats.todaysTotalPendingFollowUpsOfPendingOrder}
          taken={systemStats.todaysTotalTakenFollowUpsOfPendingOrder}
          last7={systemStats.last7DayPendingFollowUpsOfPendingOrder}
        />

        <BreakdownSection
          title="Pending Material Follow-ups"
          icon={Database}
          color="orange"
          pending={systemStats.todaysTotalPendingFollowUpsOfPendingMaterial}
          taken={systemStats.todaysTotalTakenFollowUpsOfPendingMaterial}
          last7={systemStats.last7DayPendingFollowUpsOfPendingMaterial}
        />

        <BreakdownSection
          title="New Order Follow-ups"
          icon={FileSpreadsheet}
          color="purple"
          pending={systemStats.todaysTotalPendingFollowUpsOfNewOrder}
          taken={systemStats.todaysTotalTakenFollowUpsOfNewOrder}
          last7={systemStats.last7DayPendingFollowUpsOfNewOrder}
        />
      </div>

      <CreateTaskModal
        isOpen={showCreateTaskModal}
        onClose={() => setShowCreateTaskModal(false)}
        onSuccess={loadData}
      />
    </div>
  );
}

/* ================= COMPONENTS ================= */

function StatCard({ label, value, icon: Icon, color, loading }: any) {
  const colors: any = {
    blue: "bg-blue-100 text-blue-600",
    emerald: "bg-emerald-100 text-emerald-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <Card className="p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${colors[color]}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
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
}: any) {
  const colors: any = {
    emerald: "text-emerald-600",
    orange: "text-orange-600",
    purple: "text-purple-600",
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b bg-gray-50 py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className={`w-4 h-4 ${colors[color]}`} />
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-[11px] text-gray-500">Due Today</p>
            <p className="text-xl font-bold">{pending}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-500">Completed Today</p>
            <p className="text-xl font-bold">{taken}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-500">Pending (7 Days)</p>
            <p className="text-xl font-bold">{last7}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
