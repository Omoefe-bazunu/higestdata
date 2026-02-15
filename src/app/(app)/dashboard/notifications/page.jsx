"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, ChevronLeft, ExternalLink, Loader } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const {
    isSubscribed,
    isLoading: subLoading,
    isSupported,
    subscribe,
    unsubscribe,
  } = usePushNotifications(user);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API}/api/notifications`);
      const data = await res.json();
      if (data.success) setNotifications(data.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePush = async () => {
    if (isSubscribed) {
      await unsubscribe();
      toast.success("Push notifications disabled");
    } else {
      const result = await subscribe();
      if (result?.error === "Permission denied") {
        toast.error("Allow notifications in your browser settings first");
      } else if (result?.success) {
        toast.success("Push notifications enabled!");
      }
    }
  };

  const formatDate = (ts) => {
    if (!ts) return "";
    const date = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div
      className="min-h-screen bg-cover bg-fixed bg-center bg-no-repeat pb-24 pt-8 px-4 md:pt-12 md:px-12"
      style={{ backgroundImage: `url('/gebg.jpg')` }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-950 to-blue-800 rounded-2xl p-6 mb-10 max-w-7xl mx-auto shadow-2xl">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white text-center">
          Notifications
        </h1>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back */}
        <button
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center text-sm font-medium   group"
        >
          <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        {/* Push Toggle Card */}
        {isSupported && (
          <div className="bg-white/95 rounded-2xl shadow-lg p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  isSubscribed ? "bg-blue-900" : "bg-gray-100"
                }`}
              >
                <Bell
                  className={`w-6 h-6 ${
                    isSubscribed ? "text-white" : "text-gray-400"
                  }`}
                />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">
                  Push Notifications
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isSubscribed
                    ? "You'll receive browser alerts when we send updates"
                    : "Enable to get instant browser alerts"}
                </p>
              </div>
            </div>
            <button
              onClick={handleTogglePush}
              disabled={subLoading}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                isSubscribed
                  ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                  : "bg-blue-900 text-white hover:bg-blue-800"
              } ${subLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {subLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : isSubscribed ? (
                "Disable"
              ) : (
                "Enable"
              )}
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="bg-white/95 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-black text-gray-900">Recent Announcements</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Last 20 messages from Highest Data
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader className="w-6 h-6 animate-spin text-blue-900" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Bell className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium text-sm">No notifications yet</p>
              <p className="text-xs mt-1">Check back later for updates</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {notifications.map((n, i) => (
                <a
                  key={n.id}
                  href={n.url || "/dashboard"}
                  className="flex gap-4 px-6 py-5 hover:bg-gray-50 transition-colors group"
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-blue-900 flex items-center justify-center shrink-0 mt-0.5">
                    <Bell className="w-5 h-5 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-gray-900 text-sm leading-snug">
                        {n.title}
                      </p>
                      <span className="text-xs text-gray-400 shrink-0 mt-0.5">
                        {formatDate(n.sentAt)}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                      {n.body}
                    </p>
                    {n.url && n.url !== "/dashboard" && (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600 mt-2 font-medium group-hover:underline">
                        View details
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
