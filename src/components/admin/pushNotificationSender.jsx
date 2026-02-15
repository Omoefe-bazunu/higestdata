"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Send, Bell, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function PushNotificationSender() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/dashboard");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API}/api/notifications`);
      const data = await res.json();
      if (data.success) setHistory(data.data);
    } catch {
      // silent fail
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setLastResult(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API}/api/admin/push/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, body, url }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Sent to ${data.sent} device(s)`);
        setLastResult(data);
        setTitle("");
        setBody("");
        setUrl("/dashboard");
        fetchHistory();
      } else {
        toast.error(data.error || "Failed to send");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSending(false);
    }
  };

  const formatDate = (ts) => {
    if (!ts) return "—";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString("en-NG", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">
          Push Notifications
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Send a browser push notification to all subscribed users instantly.
        </p>
      </div>

      {/* Compose Form */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow p-6 mb-8">
        <h2 className="text-lg font-black text-gray-900 mb-5 flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-900" /> Compose Notification
        </h2>
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <Label className="font-semibold text-gray-700 mb-1 block">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 🎉 New rates available!"
              maxLength={80}
              required
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {title.length}/80
            </p>
          </div>

          <div>
            <Label className="font-semibold text-gray-700 mb-1 block">
              Message <span className="text-red-500">*</span>
            </Label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="e.g. Check out our updated gift card rates — trade now for the best value."
              rows={3}
              maxLength={200}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {body.length}/200
            </p>
          </div>

          <div>
            <Label className="font-semibold text-gray-700 mb-1 block">
              Click URL{" "}
              <span className="text-gray-400 font-normal">
                (where it opens)
              </span>
            </Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/dashboard or https://..."
            />
          </div>

          {/* Preview */}
          {(title || body) && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Preview
              </p>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-900 rounded-lg shrink-0 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">
                    {title || "Title"}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {body || "Message body..."}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    highestdata.com.ng
                  </p>
                </div>
              </div>
            </div>
          )}

          {lastResult && (
            <div className="flex items-center gap-4 bg-green-50 border border-green-200 rounded-xl p-3 text-sm">
              <Users className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-green-700">
                Delivered to <strong>{lastResult.sent}</strong> device(s).
                {lastResult.failed > 0 && (
                  <span className="text-yellow-600 ml-2">
                    {lastResult.failed} failed (expired subscriptions cleaned
                    up).
                  </span>
                )}
              </span>
            </div>
          )}

          <Button
            type="submit"
            disabled={sending || !title.trim() || !body.trim()}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold h-12"
          >
            {sending ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" /> Send to All Users
              </span>
            )}
          </Button>
        </form>
      </div>

      {/* History */}
      <div>
        <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-400" /> Sent History
        </h2>
        {loadingHistory ? (
          <div className="text-gray-400 text-sm py-4">Loading...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200 text-sm">
            No notifications sent yet.
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((n) => (
              <div
                key={n.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{n.title}</p>
                    <p className="text-gray-500 text-sm mt-0.5">{n.body}</p>
                    {n.url && (
                      <p className="text-xs text-blue-500 mt-1">→ {n.url}</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 shrink-0 mt-0.5">
                    {formatDate(n.sentAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
