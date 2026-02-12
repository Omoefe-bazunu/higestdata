"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DeletionRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [adminReason, setAdminReason] = useState({});

  useEffect(() => {
    if (!user) return;
    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/deletion-requests`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      if (data.success) setRequests(data.data);
    } catch (err) {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (userId, action) => {
    const reason = adminReason[userId] || "";
    if (action === "reject" && !reason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setResolving(`${userId}-${action}`);
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/deletion-requests/${userId}/resolve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action, adminReason: reason }),
        },
      );
      const data = await res.json();
      if (data.success) {
        toast.success(
          `Request ${action === "approve" ? "approved" : "rejected"} successfully`,
        );
        fetchRequests();
      } else {
        toast.error(data.error || "Failed to resolve");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setResolving(null);
    }
  };

  const statusBadge = (status) => {
    if (status === "pending")
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    if (status === "approved")
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      );
    if (status === "rejected")
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </Badge>
      );
  };

  if (loading)
    return (
      <div className="flex justify-center py-20 text-gray-400">Loading...</div>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-gray-900 mb-2">
        Account Deletion Requests
      </h1>
      <p className="text-gray-500 mb-8">
        Review and action user account deletion requests.
      </p>

      {requests.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          No deletion requests found.
        </div>
      )}

      <div className="space-y-4">
        {requests.map((req) => (
          <div
            key={req.id}
            className="bg-white rounded-2xl shadow border border-gray-100 p-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="font-bold text-gray-900">{req.name}</p>
                <p className="text-sm text-gray-500">{req.email}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Submitted:{" "}
                  {req.createdAt?.toDate?.()?.toLocaleDateString() || "—"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {statusBadge(req.status)}
                <button
                  onClick={() =>
                    setExpanded(expanded === req.id ? null : req.id)
                  }
                  className="text-gray-400 hover:text-gray-700"
                >
                  {expanded === req.id ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {expanded === req.id && (
              <div className="mt-5 border-t pt-5 space-y-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                    User's Reason
                  </p>
                  <p className="text-gray-700 bg-gray-50 rounded-xl p-3 text-sm">
                    {req.reason}
                  </p>
                </div>

                {req.status === "rejected" && req.adminReason && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                      Admin Rejection Reason
                    </p>
                    <p className="text-red-600 bg-red-50 rounded-xl p-3 text-sm">
                      {req.adminReason}
                    </p>
                  </div>
                )}

                {req.status === "pending" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">
                        Admin Reason (required for rejection)
                      </label>
                      <textarea
                        value={adminReason[req.id] || ""}
                        onChange={(e) =>
                          setAdminReason((prev) => ({
                            ...prev,
                            [req.id]: e.target.value,
                          }))
                        }
                        placeholder="Enter reason (required if rejecting)..."
                        rows={3}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleResolve(req.id, "approve")}
                        disabled={resolving === `${req.id}-approve`}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {resolving === `${req.id}-approve`
                          ? "Approving..."
                          : "Approve"}
                      </Button>
                      <Button
                        onClick={() => handleResolve(req.id, "reject")}
                        disabled={resolving === `${req.id}-reject`}
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        {resolving === `${req.id}-reject`
                          ? "Rejecting..."
                          : "Reject"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
