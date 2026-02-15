"use client";

import { useState } from "react";
import { Bell, BellOff, Check } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function NotificationBell() {
  const { user } = useAuth();
  const { isSubscribed, isLoading, isSupported, subscribe, unsubscribe } =
    usePushNotifications(user);

  if (!isSupported) return null;

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
      toast.success("Push notifications disabled");
    } else {
      const result = await subscribe();
      if (result?.error) {
        toast.error(
          result.error === "Permission denied"
            ? "Please allow notifications in your browser settings"
            : "Failed to enable notifications",
        );
      } else if (result?.success) {
        toast.success("Push notifications enabled!");
      }
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      title={isSubscribed ? "Disable notifications" : "Enable notifications"}
      className={`relative p-2 rounded-xl transition-all ${
        isSubscribed
          ? "bg-blue-900 text-white hover:bg-blue-800"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
      } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : isSubscribed ? (
        <Bell className="w-5 h-5" />
      ) : (
        <BellOff className="w-5 h-5" />
      )}
      {isSubscribed && (
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
      )}
    </button>
  );
}
