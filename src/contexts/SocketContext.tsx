import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

interface SocketContextType {
  socket: Socket | null;
  notificationCount: number;
  setNotificationCount: React.Dispatch<React.SetStateAction<number>>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const userId = user?.uuid || user?.id;
    if (userId && userId !== "1") {
      const token = localStorage.getItem("jewelai_token");
      const socketInstance = io(import.meta.env.VITE_BASE_URL, {
        auth: {
          token: token,
        },
        extraHeaders: {
          "x-auth-token": token || "",
          "ngrok-skip-browser-warning": "true",
        },
        transports: ["polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      socketInstance.on("connect", () => {
        console.log("Socket: Connected successfully (ID:", socketInstance.id + ")");
        if (Notification.permission === "default") {
          Notification.requestPermission();
        }
      });

      socketInstance.on("disconnect", (reason) => {
        console.log("Socket: Disconnected. Reason:", reason);
      });

      socketInstance.on("reconnect_attempt", () => {
        console.log("Socket: Attempting to reconnect...");
      });

      socketInstance.on("connect_error", (err) => {
        console.error("Socket: Connection failed", err.message);
      });

      socketInstance.on("reminder-triggered", (data: { 
        message: string; 
        count: number;
        notificationCount?: number;
        entityType?: string;
        entityId?: string;
        task?: string;
      }) => {
        console.log("Socket: Notification received", data);
        
        const fullMessage = data.message || (data.task ? `Reminder for: ${data.task}` : "New Reminder!");
        
        toast.info(fullMessage, {
          duration: Infinity,
          action: {
            label: "View",
            onClick: () => {
              let path = "/notifications";
              if (data.entityType) {
                const queryParam = data.entityId ? `?id=${data.entityId}` : "";
                if (data.entityType === "newOrders") path = `/followups/new-order${queryParam}`;
                else if (data.entityType === "pendingOrders") path = `/followups/pending-order${queryParam}`;
                else if (data.entityType === "pendingMaterials") path = `/followups/pending-material${queryParam}`;
                else if (data.entityType === "cadOrders") path = `/followups/cad-order${queryParam}`;
              }
              window.location.href = path;
            },
          },
        });
        
        if (Notification.permission === "granted") {
          const notification = new Notification("Jewel AI Reminder", {
            body: fullMessage,
            icon: "/favicon.ico", 
          });

          notification.onclick = () => {
            window.focus();
            let path = "/notifications";
            if (data.entityType) {
              if (data.entityType === "newOrders") path = "/followups/new-order";
              else if (data.entityType === "pendingOrders") path = "/followups/pending-order";
              else if (data.entityType === "pendingMaterials") path = "/followups/pending-material";
              else if (data.entityType === "cadOrders") path = "/followups/cad-order";
            }
            window.location.href = path;
          };
        }

        const incomingCount = data.notificationCount !== undefined ? data.notificationCount : data.count;
        if (incomingCount !== undefined) {
          setNotificationCount((prev) => prev + incomingCount);
        }
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [user?.uuid, user?.id]);

  return (
    <SocketContext.Provider value={{ socket, notificationCount, setNotificationCount }}>
      {children}
    </SocketContext.Provider>
  );
};
