"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  query,
  where,
  increment,
} from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import { Badge } from "@/components/ui/badge";

// Updated to handle both String URLs and Object {url: '...'} structures
const ImageGallery = ({ images }) => {
  if (!images?.length)
    return (
      <span className="text-sm text-muted-foreground italic">
        No images attached
      </span>
    );

  return (
    <div className="flex gap-2 overflow-x-auto py-2">
      {images.map((img, i) => {
        // Safe check: supports both legacy string arrays and new object arrays
        const src = typeof img === "string" ? img : img?.url;

        if (!src) return null;

        return (
          <a key={i} href={src} target="_blank" rel="noreferrer">
            <img
              src={src}
              className="h-20 w-20 object-cover rounded-md border hover:scale-105 transition-transform cursor-pointer bg-slate-100"
              alt={`Evidence ${i + 1}`}
            />
          </a>
        );
      })}
    </div>
  );
};

export default function PendingRequestsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [selectedReq, setSelectedReq] = useState(null);

  // Negotiation State
  const [showNegotiateDialog, setShowNegotiateDialog] = useState(false);
  const [negotiateRate, setNegotiateRate] = useState("");
  const [negotiateReason, setNegotiateReason] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const snapshot = await getDocs(
        collection(firestore, "giftCardSubmissions")
      );
      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((r) =>
          [
            "pending",
            "flagged",
            "negotiating",
            "negotiation_accepted",
            "negotiation_rejected",
          ].includes(r.status)
        )
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      setRequests(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const sendNotification = async (
    req,
    status,
    amountOverride = null,
    details = null,
    reason = null
  ) => {
    try {
      let userEmail = req.userEmail;
      if (!userEmail) {
        const userDoc = await getDoc(doc(firestore, "users", req.userId));
        if (userDoc.exists()) userEmail = userDoc.data().email;
      }

      const finalAmount =
        amountOverride !== null ? amountOverride : req.payoutNaira;

      await fetch("/api/send-user-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: req.userId,
          status: status,
          type: "giftCard",
          itemName: req.giftCardName,
          amount: finalAmount,
          userEmail: userEmail,
          reason: reason,
          negotiationDetails: details,
        }),
      });
    } catch (error) {
      console.error("Failed to send email", error);
    }
  };

  const handleNegotiateSubmit = async () => {
    if (!selectedReq || !negotiateRate || !negotiateReason) {
      toast({
        title: "Missing Info",
        description: "Rate and Reason are required.",
        variant: "destructive",
      });
      return;
    }

    const newRate = parseFloat(negotiateRate);
    const newPayout = newRate * selectedReq.faceValue;

    if (isNaN(newRate) || newRate <= 0) return;

    setUpdating((prev) => ({ ...prev, [selectedReq.id]: true }));
    try {
      await updateDoc(doc(firestore, "giftCardSubmissions", selectedReq.id), {
        status: "negotiating",
        negotiation: {
          originalRate: selectedReq.ratePerUnit,
          originalPayout: selectedReq.payoutNaira,
          proposedRate: newRate,
          proposedPayout: newPayout,
          adminReason: negotiateReason,
          status: "open",
          createdAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      });

      await sendNotification(
        selectedReq,
        "negotiating",
        newPayout,
        { newRate, newPayout },
        negotiateReason
      );

      toast({ title: "Offer Sent", description: "User has been notified." });
      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedReq.id ? { ...r, status: "negotiating" } : r
        )
      );
      setShowNegotiateDialog(false);
      setSelectedReq(null);
    } catch (err) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUpdating((prev) => ({ ...prev, [selectedReq.id]: false }));
    }
  };

  const updateStatus = async (reqId, action, reason = null) => {
    setUpdating((prev) => ({ ...prev, [reqId]: true }));
    try {
      const req = requests.find((r) => r.id === reqId);
      const userRef = doc(firestore, "users", req.userId);
      const subRef = doc(firestore, "giftCardSubmissions", reqId);

      let finalStatus = action === "approve" ? "approved" : "rejected";
      let payoutAmount = req.payoutNaira;
      let finalRate = req.ratePerUnit;

      if (req.status === "negotiation_accepted" && action === "approve") {
        payoutAmount = req.negotiation.proposedPayout;
        finalRate = req.negotiation.proposedRate;

        await updateDoc(subRef, {
          ratePerUnit: finalRate,
          payoutNaira: payoutAmount,
          "negotiation.status": "completed",
        });
      }

      await updateDoc(subRef, {
        status: finalStatus,
        rejectionReason: reason,
        updatedAt: new Date().toISOString(),
      });

      if (finalStatus === "approved") {
        await updateDoc(userRef, {
          walletBalance: increment(payoutAmount),
        });
      }

      const txQuery = query(
        collection(firestore, "users", req.userId, "transactions"),
        where("relatedSubmissionId", "==", reqId)
      );
      const txSnap = await getDocs(txQuery);
      if (!txSnap.empty) {
        await updateDoc(txSnap.docs[0].ref, {
          status: finalStatus === "approved" ? "Completed" : "Failed",
          amount: payoutAmount,
          failureReason: reason,
        });
      }

      await sendNotification(req, finalStatus, payoutAmount, null, reason);

      setRequests((prev) => prev.filter((r) => r.id !== reqId));
      toast({ title: "Success", description: `Request ${finalStatus}.` });
      setSelectedReq(null); // Close modal on success
      setRejectionReason(""); // Reset reason
    } catch (err) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUpdating((prev) => ({ ...prev, [reqId]: false }));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            Pending
          </Badge>
        );
      case "negotiating":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Negotiating...
          </Badge>
        );
      case "negotiation_accepted":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            User Accepted Offer
          </Badge>
        );
      case "negotiation_rejected":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            User Declined Offer
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Pending & Negotiating</CardTitle>
          <CardDescription>
            Manage sell orders and counter-offers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Card</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Payout (Current)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-12 w-full" />
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No pending requests.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-mono text-xs">
                      {req.userId.slice(0, 5)}...
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{req.giftCardName}</div>
                      <div className="text-xs text-muted-foreground">
                        {req.cardType}
                      </div>
                    </TableCell>
                    <TableCell>
                      {req.currency} {req.faceValue}
                    </TableCell>
                    <TableCell>
                      {req.status === "negotiating" ? (
                        <span className="text-muted-foreground line-through decoration-red-500">
                          ₦{req.payoutNaira.toLocaleString()}
                        </span>
                      ) : req.status === "negotiation_accepted" ? (
                        <span className="text-green-600 font-bold">
                          ₦{req.negotiation.proposedPayout.toLocaleString()}
                        </span>
                      ) : (
                        `₦${req.payoutNaira.toLocaleString()}`
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedReq(req);
                          setRejectionReason(""); // Reset reason when opening
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" /> Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog
        open={!!selectedReq && !showNegotiateDialog}
        onOpenChange={(o) => !o && setSelectedReq(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
          </DialogHeader>

          {selectedReq && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm p-4 bg-slate-50 rounded-lg">
                <div>
                  <Label className="text-muted-foreground">Card</Label>
                  <div className="font-medium">
                    {selectedReq.giftCardName} ({selectedReq.cardType})
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Face Value</Label>
                  <div className="font-medium">
                    {selectedReq.currency} {selectedReq.faceValue}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Original Rate</Label>
                  <div className="font-medium">{selectedReq.ratePerUnit}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Original Payout
                  </Label>
                  <div className="font-medium">
                    ₦{selectedReq.payoutNaira.toLocaleString()}
                  </div>
                </div>
                {selectedReq.rateTag && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Tag</Label>
                    <div>
                      <Badge variant="secondary">{selectedReq.rateTag}</Badge>
                    </div>
                  </div>
                )}
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Card Code</Label>
                  <div className="font-mono bg-white border px-2 py-1 rounded select-all break-all">
                    {selectedReq.cardCode || "N/A"}
                  </div>
                </div>
              </div>

              {selectedReq.status === "negotiation_accepted" && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-md">
                  <h4 className="font-bold text-green-800 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" /> User Accepted New Offer
                  </h4>
                  <p className="text-sm mt-1 text-green-700">
                    User accepted{" "}
                    <strong>₦{selectedReq.negotiation.proposedRate}</strong>{" "}
                    (Payout: ₦
                    {selectedReq.negotiation.proposedPayout.toLocaleString()}).
                  </p>
                </div>
              )}

              {selectedReq.status === "negotiation_rejected" && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-md">
                  <h4 className="font-bold text-red-800 flex items-center gap-2">
                    <XCircle className="h-4 w-4" /> User Declined Offer
                  </h4>
                  <p className="text-sm mt-1 text-red-700">
                    Reason: "{selectedReq.negotiation.userReason}"
                  </p>
                </div>
              )}

              <div>
                <Label className="mb-2 block">Card Images</Label>
                <div className="border rounded-lg p-2 bg-slate-50">
                  <ImageGallery images={selectedReq.imageUrls} />
                </div>
              </div>

              <div className="flex flex-col gap-4 border-t pt-4">
                {/* Rejection Section */}
                <div className="flex flex-col sm:flex-row gap-2 bg-red-50 p-3 rounded-lg border border-red-100">
                  <Input
                    placeholder="Enter reason to enable Reject button..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="bg-white"
                  />
                  <Button
                    variant="destructive"
                    disabled={
                      updating[selectedReq.id] || !rejectionReason.trim()
                    }
                    onClick={() =>
                      updateStatus(selectedReq.id, "reject", rejectionReason)
                    }
                  >
                    Reject Order
                  </Button>
                </div>

                {/* Approval / Negotiation Section */}
                <div className="flex justify-between items-center gap-4">
                  {selectedReq.status !== "negotiation_accepted" && (
                    <Button
                      variant="outline"
                      className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() => {
                        setNegotiateRate(
                          selectedReq.negotiation?.proposedRate || ""
                        );
                        setShowNegotiateDialog(true);
                      }}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {selectedReq.status === "negotiating"
                        ? "Update Offer"
                        : "Renegotiate"}
                    </Button>
                  )}

                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={
                      selectedReq.status === "negotiating" ||
                      updating[selectedReq.id]
                    }
                    onClick={() => updateStatus(selectedReq.id, "approve")}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {selectedReq.status === "negotiation_accepted"
                      ? "Confirm New Payout"
                      : "Approve Original"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showNegotiateDialog} onOpenChange={setShowNegotiateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renegotiate Rate</DialogTitle>
            <DialogDescription>
              Propose a new rate. User will be notified via email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-100 rounded">
              <div>
                <span className="text-xs text-muted-foreground">
                  Current Rate
                </span>
                <div className="font-bold">{selectedReq?.ratePerUnit}</div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">
                  Current Payout
                </span>
                <div className="font-bold">
                  ₦{selectedReq?.payoutNaira?.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>New Rate (per {selectedReq?.currency})</Label>
              <Input
                type="number"
                value={negotiateRate}
                onChange={(e) => setNegotiateRate(e.target.value)}
                placeholder="e.g. 950"
              />
            </div>

            {negotiateRate && (
              <div className="text-right text-sm text-green-600 font-medium">
                New Payout: ₦
                {(
                  parseFloat(negotiateRate) * (selectedReq?.faceValue || 0)
                ).toLocaleString()}
              </div>
            )}

            <div className="space-y-2">
              <Label>Reason for change</Label>
              <Textarea
                placeholder="e.g. Card is used, Rate dropped..."
                value={negotiateReason}
                onChange={(e) => setNegotiateReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNegotiateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleNegotiateSubmit}
              disabled={updating[selectedReq?.id]}
            >
              Send Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
