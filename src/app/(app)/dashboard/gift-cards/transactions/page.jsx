"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuth } from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import {
  AlertCircle,
  Check,
  X,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  ShoppingBag, // Added for the empty state icon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function GiftCardNegotiation() {
  const [negotiations, setNegotiations] = useState([]);
  const [userReason, setUserReason] = useState("");
  const [rejectingId, setRejectingId] = useState(null);
  const [processing, setProcessing] = useState(false);

  const auth = getAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(firestore, "giftCardSubmissions"),
      where("userId", "==", auth.currentUser.uid),
      where("status", "in", [
        "negotiating",
        "negotiation_accepted",
        "negotiation_rejected",
      ])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setNegotiations(data);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  // Helper to send email to admin
  const notifyAdmin = async (req, status, reason = null) => {
    try {
      const user = auth.currentUser;
      await fetch("/api/send-user-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          status: status,
          type: "giftCard",
          itemName: req.giftCardName,
          amount: req.faceValue,
          reason: reason,
          negotiationDetails: {
            newRate: req.negotiation.proposedRate,
            newPayout: req.negotiation.proposedPayout,
          },
        }),
      });
    } catch (e) {
      console.error("Failed to notify admin", e);
    }
  };

  const handleClick = () => {
    router.push("/dashboard/gift-cards"); // Use .push() to navigate
  };

  const handleAccept = async (req) => {
    setProcessing(true);
    try {
      await updateDoc(doc(firestore, "giftCardSubmissions", req.id), {
        status: "negotiation_accepted",
        "negotiation.status": "accepted",
        updatedAt: new Date().toISOString(),
      });

      await notifyAdmin(req, "negotiation_accepted");

      toast({
        title: "Accepted",
        description: "Offer accepted. Waiting for final admin approval.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to accept offer.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async (reqId) => {
    if (!userReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please tell us why you are declining.",
        variant: "destructive",
      });
      return;
    }
    setProcessing(true);
    try {
      const req = negotiations.find((r) => r.id === reqId);

      await updateDoc(doc(firestore, "giftCardSubmissions", reqId), {
        status: "negotiation_rejected",
        "negotiation.status": "rejected",
        "negotiation.userReason": userReason,
        updatedAt: new Date().toISOString(),
      });

      if (req) await notifyAdmin(req, "negotiation_rejected", userReason);

      toast({ title: "Declined", description: "Offer rejected." });
      setRejectingId(null);
      setUserReason("");
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to decline.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  // --- UPDATED: Show Empty State instead of null ---
  if (negotiations.length === 0) {
    return (
      <Card className="mb-8 border-dashed bg-slate-50/50">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
          <div className="rounded-full bg-slate-100 p-3 mb-3">
            <ShoppingBag className="h-6 w-6 text-slate-400" />
          </div>
          <p className="font-medium text-slate-900">No Pending Negotiations</p>
          <p className="text-sm">Start an Order to get started.</p>
          <button
            onClick={handleClick}
            className=" bg-blue-900 text-white py-2 px-8 rounded mt-4"
          >
            Submit Order
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 mb-8">
      {negotiations.map((req) => {
        // Determine Styles based on Status
        const isAccepted = req.status === "negotiation_accepted";
        const isRejected = req.status === "negotiation_rejected";
        const isPending = req.status === "negotiating";

        let borderColor = "border-blue-500";
        let headerBg = "bg-blue-50";
        let icon = <AlertCircle className="h-5 w-5 text-blue-800" />;
        let title = "Action Required: Rate Negotiation";

        if (isAccepted) {
          borderColor = "border-green-500";
          headerBg = "bg-green-50";
          icon = <CheckCircle className="h-5 w-5 text-green-800" />;
          title = "Offer Accepted";
        } else if (isRejected) {
          borderColor = "border-red-200";
          headerBg = "bg-red-50";
          icon = <XCircle className="h-5 w-5 text-red-800" />;
          title = "Offer Declined";
        }

        return (
          <Card
            key={req.id}
            className={`border-2 ${borderColor} shadow-lg animate-in fade-in slide-in-from-top-4`}
          >
            <CardHeader className={`${headerBg} pb-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {icon}
                  <CardTitle className="text-lg">{title}</CardTitle>
                </div>
                {isAccepted && (
                  <Badge className="bg-green-600">Pending Final Approval</Badge>
                )}
                {isRejected && (
                  <Badge variant="destructive">Sent to Admin</Badge>
                )}
              </div>
              <CardDescription
                className={
                  isRejected
                    ? "text-red-700"
                    : isAccepted
                    ? "text-green-700"
                    : "text-blue-700"
                }
              >
                {isPending &&
                  `The admin has proposed a new rate for your ${req.giftCardName} transaction.`}
                {isAccepted &&
                  `You accepted the new rate. The admin will finalize the payment shortly.`}
                {isRejected &&
                  `You rejected the offer. The admin will review your response.`}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Admin Message */}
                <div className="bg-slate-50 p-3 rounded-md border text-sm text-slate-700 italic">
                  <span className="font-semibold not-italic text-slate-900">
                    Admin Message:{" "}
                  </span>
                  "{req.negotiation.adminReason}"
                </div>

                {/* Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="border rounded-lg p-4 opacity-60">
                    <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                      Original Offer
                    </div>
                    <div className="text-lg font-bold">
                      ₦{req.negotiation.originalPayout.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Rate: {req.negotiation.originalRate}
                    </div>
                  </div>

                  <div className="hidden md:flex justify-center">
                    <ArrowRight
                      className={`h-6 w-6 ${
                        isAccepted ? "text-green-500" : "text-blue-500"
                      }`}
                    />
                  </div>

                  <div
                    className={`border-2 rounded-lg p-4 relative overflow-hidden ${
                      isAccepted
                        ? "border-green-600 bg-green-50"
                        : "border-green-500 bg-green-50/50"
                    }`}
                  >
                    <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-bl">
                      NEW
                    </div>
                    <div className="text-xs font-semibold text-green-800 uppercase mb-1">
                      New Offer
                    </div>
                    <div className="text-2xl font-bold text-green-700">
                      ₦{req.negotiation.proposedPayout.toLocaleString()}
                    </div>
                    <div className="text-sm text-green-800">
                      Rate: {req.negotiation.proposedRate}
                    </div>
                  </div>
                </div>

                {/* User Reason Display (If Rejected) */}
                {isRejected && (
                  <div className="bg-red-50 border border-red-100 p-3 rounded text-sm text-red-800">
                    <strong>Your Response:</strong> "
                    {req.negotiation.userReason}"
                  </div>
                )}

                {/* Action Buttons (Only show if still negotiating) */}
                {isPending && (
                  <>
                    {rejectingId === req.id ? (
                      <div className="space-y-3 pt-2 border-t">
                        <p className="text-sm font-medium">
                          Why are you declining?
                        </p>
                        <Input
                          placeholder="e.g., Rate is too low, I will sell elsewhere..."
                          value={userReason}
                          onChange={(e) => setUserReason(e.target.value)}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRejectingId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDecline(req.id)}
                            disabled={processing}
                          >
                            Confirm Reject
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3 pt-2">
                        <Button
                          variant="outline"
                          className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                          onClick={() => setRejectingId(req.id)}
                          disabled={processing}
                        >
                          <X className="mr-2 h-4 w-4" /> Decline
                        </Button>
                        <Button
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleAccept(req)}
                          disabled={processing}
                        >
                          <Check className="mr-2 h-4 w-4" /> Accept New Rate
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {/* Status Footer for Completed Actions */}
                {!isPending && (
                  <div className="flex items-center justify-center gap-2 pt-2 text-sm text-muted-foreground border-t">
                    <Clock className="h-4 w-4" />
                    <span>Waiting for admin to process next step...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
