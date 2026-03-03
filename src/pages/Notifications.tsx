import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Bell,
  Calendar,
  User,
  ChevronRight,
  Clock,} from "lucide-react";
import { sharedAPI } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSocket } from "@/contexts/SocketContext";
import { usePageHeader } from "@/contexts/PageHeaderProvider";
import { toast } from "sonner";

interface Reminder {
  uuid: string;
  task: string;
  reminderTime: string;
  entityId: string;
  entityType: string;
  status: string;
  userData?: {
    name: string;
    userCode: string;
  };
}

export default function Notifications() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket, setNotificationCount } = useSocket();
  const { setHeader } = usePageHeader();
  const navigate = useNavigate();

  useEffect(() => {
    setHeader({
      title: "Notifications",
    });
  }, []);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const res = await sharedAPI.getReminders({ page: 1, size: 50 });
      if (res.success && res.data?.data) {
        setReminders(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching reminders:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
    setNotificationCount(0);
    if (socket) {
      const handleSocketReminder = () => {
        console.log("Notifications: Refreshing list due to socket event");
        fetchReminders();
      };

      socket.on("reminder-triggered", handleSocketReminder);
      return () => {
        socket.off("reminder-triggered", handleSocketReminder);
      };
    }
  }, [socket]);

  const handleNotificationClick = (reminder: Reminder) => {
    let path = "/followups";
    const queryParam = reminder.entityId ? `?tokenId=${reminder.entityId}` : "";
    if (reminder.entityType === "newOrders") path = `/followups/new-order${queryParam}`;
    else if (reminder.entityType === "pendingOrders") path = `/followups/pending-order${queryParam}`;
    else if (reminder.entityType === "pendingMaterials") path = `/followups/pending-material${queryParam}`;
    else if (reminder.entityType === "cadOrders") path = `/followups/cad-order${queryParam}`;
    navigate(path);
  };

  return (
    <div className="p-6 w-full space-y-6">
      <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="text-sm font-medium text-gray-500">
            Recent Reminders
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500">Loading your notifications...</p>
            </div>
          ) : reminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="p-4 bg-gray-50 rounded-full text-gray-400">
                <Bell className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-gray-500 font-medium">No notifications yet</p>
              <p className="text-sm text-gray-400 max-w-[200px] text-center">
                When you have reminders, they'll show up here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {reminders.map((reminder) => (
                <div
                  key={reminder.uuid}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors group flex items-start gap-4"
                  onClick={() => handleNotificationClick(reminder)}
                >
                  <div className="mt-1 p-2 bg-blue-50 text-blue-600 rounded-full group-hover:bg-blue-100 transition-colors">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900 line-clamp-1">
                        {reminder.task}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                        {reminder.entityType.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(reminder.reminderTime), "PPP p")}
                      </span>
                      {reminder.userData && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {reminder.userData.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors mt-2" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
