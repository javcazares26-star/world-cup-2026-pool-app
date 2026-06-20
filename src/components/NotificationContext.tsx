"use client";
import { createContext, useContext, useState, useCallback } from "react";
import { Toast } from "./Toast";

export interface Notification {
  id: string;
  type: "goal" | "leaderboard" | "info" | "success" | "warning" | "lock";
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id">) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id">): string => {
      const id = Math.random().toString(36).substring(2, 11);
      const newNotification: Notification = {
        ...notification,
        id,
        duration: notification.duration ?? 6000, // Default 6 seconds
      };

      setNotifications((prev) => [...prev, newNotification]);

      // Auto-remove after duration
      if (newNotification.duration! > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, newNotification.duration!);
      }

      return id;
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearAll }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
        {notifications.map((notification) => (
          <Toast
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
}
