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
  ShoppingBag,
  ArrowDownRight,
  MessageSquare,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
      ]),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setNegotiations(data);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

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
    router.push("/dashboard/gift-cards");
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

  if (negotiations.length === 0) {
    return (
      <Card className="mb-8 border-none shadow-xl bg-white overflow-hidden ring-1 ring-slate-200">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-slate-50 p-6 mb-6 ring-8 ring-slate-50/50">
            <ShoppingBag className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-blue-950">
            No Pending Negotiations
          </h3>
          <p className="text-slate-500 max-w-[280px] mt-2">
            When an admin proposes a new rate for your trade, it will appear
            here.
          </p>
          <Button
            onClick={handleClick}
            className="bg-blue-950 hover:bg-blue-900 text-white font-bold h-12 px-8 mt-8 shadow-lg shadow-blue-950/20 active:scale-95 transition-all"
          >
            Start New Trade
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 mb-8">
      {negotiations.map((req) => {
        const isAccepted = req.status === "negotiation_accepted";
        const isRejected = req.status === "negotiation_rejected";
        const isPending = req.status === "negotiating";

        return (
          <Card
            key={req.id}
            className={`border-none shadow-2xl overflow-hidden ring-1 animate-in fade-in slide-in-from-top-4 ${
              isAccepted
                ? "ring-green-200"
                : isRejected
                  ? "ring-red-100"
                  : "ring-orange-200"
            }`}
          >
            <CardHeader
              className={`${isAccepted ? "bg-green-50" : isRejected ? "bg-red-50" : "bg-orange-50"} border-b relative`}
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Zap className="h-20 w-20 text-blue-950" />
              </div>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${isAccepted ? "bg-green-600" : isRejected ? "bg-red-600" : "bg-orange-500"} text-white shadow-md`}
                  >
                    {isAccepted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : isRejected ? (
                      <XCircle className="h-5 w-5" />
                    ) : (
                      <AlertCircle className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-blue-950 text-lg">
                      {isAccepted
                        ? "Offer Accepted"
                        : isRejected
                          ? "Offer Declined"
                          : "Action Required: Rate Update"}
                    </CardTitle>
                    <p
                      className={`text-xs font-bold uppercase tracking-wider ${isAccepted ? "text-green-700" : isRejected ? "text-red-700" : "text-orange-700"}`}
                    >
                      {req.giftCardName} • Trade ID: {req.id.slice(-6)}
                    </p>
                  </div>
                </div>
                {isAccepted && (
                  <Badge className="bg-green-600 text-white border-none">
                    Finalizing Payout
                  </Badge>
                )}
                {isRejected && (
                  <Badge
                    variant="destructive"
                    className="border-none shadow-none"
                  >
                    Closed
                  </Badge>
                )}
                {isPending && (
                  <Badge className="bg-blue-950 text-orange-400 border-none">
                    Pending Reply
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-8 space-y-6 bg-white">
              {/* Admin Note Section */}
              <div className="flex gap-4 items-start bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="bg-white p-2 rounded-full shadow-sm border border-slate-100 shrink-0">
                  <MessageSquare className="h-4 w-4 text-blue-950" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Admin Message
                  </p>
                  <p className="text-sm text-slate-700 italic font-medium leading-relaxed">
                    "{req.negotiation.adminReason}"
                  </p>
                </div>
              </div>

              {/* Comparison Hero Section */}
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                <div className="md:col-span-3 group relative overflow-hidden border border-slate-100 rounded-2xl p-5 bg-white shadow-sm transition-all">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Original Offer
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-bold text-slate-400">₦</span>
                    <span className="text-2xl font-black text-slate-400 tracking-tighter line-through decoration-red-400/50 decoration-2">
                      {req.negotiation.originalPayout.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-400 mt-1">
                    Rate: {req.negotiation.originalRate}
                  </p>
                </div>

                <div className="md:col-span-1 flex justify-center">
                  <div className="bg-slate-100 p-2 rounded-full ring-4 ring-white shadow-inner">
                    <ArrowRight className="h-5 w-5 text-slate-400 hidden md:block" />
                    <ArrowDownRight className="h-5 w-5 text-slate-400 block md:hidden" />
                  </div>
                </div>

                <div
                  className={`md:col-span-3 relative overflow-hidden border-2 rounded-2xl p-5 shadow-lg transition-all ${
                    isAccepted
                      ? "border-green-600 bg-green-50/30"
                      : "border-orange-400 bg-orange-50/20"
                  }`}
                >
                  <div
                    className={`absolute top-0 right-0 px-3 py-1 text-[9px] font-black uppercase tracking-tighter text-white rounded-bl-xl ${
                      isAccepted ? "bg-green-600" : "bg-orange-400"
                    }`}
                  >
                    New Proposed Offer
                  </div>
                  <p
                    className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isAccepted ? "text-green-600" : "text-orange-600"}`}
                  >
                    You Get
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-sm font-bold ${isAccepted ? "text-green-600" : "text-orange-600"}`}
                    >
                      ₦
                    </span>
                    <span
                      className={`text-3xl font-black tracking-tighter ${isAccepted ? "text-green-700" : "text-blue-950"}`}
                    >
                      {req.negotiation.proposedPayout.toLocaleString()}
                    </span>
                  </div>
                  <p
                    className={`text-xs font-bold mt-1 ${isAccepted ? "text-green-600" : "text-orange-500"}`}
                  >
                    Rate: {req.negotiation.proposedRate}
                  </p>
                </div>
              </div>

              {isRejected && (
                <div className="flex gap-3 items-center bg-red-50 p-3 rounded-xl border border-red-100 text-sm text-red-700 font-medium">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>
                    You declined this offer: "{req.negotiation.userReason}"
                  </span>
                </div>
              )}

              {isPending && (
                <div className="pt-4 border-t border-slate-100">
                  {rejectingId === req.id ? (
                    <div className="space-y-4 animate-in slide-in-from-bottom-2">
                      <Label className="text-blue-950 font-bold">
                        Why are you declining?
                      </Label>
                      <Input
                        placeholder="e.g., Rate is lower than expected, I'll hold the card."
                        value={userReason}
                        onChange={(e) => setUserReason(e.target.value)}
                        className="h-12 border-slate-200 focus:ring-red-500"
                      />
                      <div className="flex gap-3">
                        <Button
                          variant="ghost"
                          className="flex-1 text-slate-500 font-bold"
                          onClick={() => setRejectingId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1 font-bold h-12"
                          onClick={() => handleDecline(req.id)}
                          disabled={processing}
                        >
                          {processing ? (
                            <Loader className="animate-spin h-4 w-4" />
                          ) : (
                            "Confirm Decline"
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 h-14 border-red-200 text-red-600 font-bold hover:bg-red-50"
                        onClick={() => setRejectingId(req.id)}
                        disabled={processing}
                      >
                        <X className="mr-2 h-5 w-5" /> Decline Offer
                      </Button>
                      <Button
                        className="flex-1 h-14 bg-blue-950 hover:bg-blue-900 text-orange-400 font-bold shadow-xl shadow-blue-950/20 active:scale-95 transition-all"
                        onClick={() => handleAccept(req)}
                        disabled={processing}
                      >
                        <Check className="mr-2 h-5 w-5 text-orange-400" />{" "}
                        Accept New Rate
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {!isPending && (
                <div className="flex items-center justify-center gap-3 py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-widest">
                  <Clock className="h-4 w-4 animate-pulse" />
                  <span>Waiting for Final Admin Confirmation</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

const Label = ({ children, className }) => (
  <p className={`text-sm mb-1.5 ${className}`}>{children}</p>
);
