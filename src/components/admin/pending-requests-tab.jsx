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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Eye, ExternalLink } from "lucide-react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { firestore } from "@/lib/firebaseConfig";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
import React from "react";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export default function PendingRequestsTab() {
  const [giftCardRequests, setGiftCardRequests] = useState([]);
  const [cryptoRequests, setCryptoRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [invalidReasons, setInvalidReasons] = useState({});
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { toast } = useToast();
  const adminEmails = process.env.NEXT_PUBLIC_ADMINEMAIL?.split(",") || [];

  // Fetch gift card and crypto requests
  useEffect(() => {
    let isMounted = true;

    async function fetchRequests() {
      try {
        setLoading(true);
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          toast({
            title: "Authentication Error",
            description: "You must be logged in to view requests.",
            variant: "destructive",
          });
          return;
        }

        // Fetch gift card requests
        const giftCardSnapshot = await getDocs(
          collection(firestore, "giftCardSubmissions")
        );
        const giftCardData = giftCardSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(
            (req) => req.status === "pending" || req.status === "flagged"
          );

        // Fetch crypto orders
        const cryptoSnapshot = await getDocs(
          collection(firestore, "cryptoOrders")
        );
        const cryptoData = cryptoSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(
            (req) => req.status === "pending" || req.status === "flagged"
          );

        if (isMounted) {
          setGiftCardRequests(giftCardData);
          setCryptoRequests(cryptoData);
        }
      } catch (err) {
        console.error("Error fetching requests:", err);
        toast({
          title: "Error",
          description: "Failed to load requests.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchRequests();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  // Send email notification to user
  const sendUserNotification = async (
    userId,
    status,
    type,
    itemName,
    amount,
    reason = null
  ) => {
    try {
      const response = await fetch("/api/send-user-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          status,
          type,
          itemName,
          amount,
          reason,
        }),
      });

      if (!response.ok) {
        console.error("Failed to send user notification");
      } else {
        console.log("User notification sent successfully");
      }
    } catch (error) {
      console.error("Error sending user notification:", error);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (requestId, newStatus, type) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user || !adminEmails.includes(user.email)) {
      toast({
        title: "Permission Error",
        description: "You are not authorized to update requests.",
        variant: "destructive",
      });
      return;
    }

    if (newStatus === "invalid" && !invalidReasons[requestId]?.trim()) {
      toast({
        title: "Invalid Input",
        description:
          "Please provide a reason for marking the request as invalid.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdating((prev) => ({ ...prev, [requestId]: true }));

      const collectionName =
        type === "giftCard" ? "giftCardSubmissions" : "cryptoOrders";

      const requests = type === "giftCard" ? giftCardRequests : cryptoRequests;
      const request = requests.find((req) => req.id === requestId);
      if (!request) {
        throw new Error("Request not found");
      }

      // Update submission status
      const docRef = doc(firestore, collectionName, requestId);
      const updateData = {
        status: newStatus === "accepted" ? "approved" : "invalid",
        updatedAt: new Date().toISOString(),
      };

      if (newStatus === "invalid") {
        updateData.invalidReason = invalidReasons[requestId];
      }

      await updateDoc(docRef, updateData);

      // Update related transaction status
      const transactionsQuery = query(
        collection(firestore, "users", request.userId, "transactions"),
        where(
          type === "giftCard" ? "relatedSubmissionId" : "relatedOrderId",
          "==",
          requestId
        )
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);

      if (!transactionsSnapshot.empty) {
        const transactionDoc = transactionsSnapshot.docs[0];
        const transactionUpdateData = {
          status: newStatus === "accepted" ? "Completed" : "Not Approved",
          updatedAt: new Date().toISOString(),
        };

        if (newStatus === "invalid") {
          transactionUpdateData.reasons = invalidReasons[requestId];
        }

        await updateDoc(transactionDoc.ref, transactionUpdateData);
      }

      // If approved, update user's wallet balance
      if (newStatus === "accepted") {
        const userDocRef = doc(firestore, "users", request.userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const currentBalance = userDoc.data().walletBalance || 0;
          let newBalance = currentBalance;

          // For gift cards, add the payout amount
          if (type === "giftCard") {
            newBalance = currentBalance + request.payoutNaira;
          } else if (type === "crypto") {
            // For crypto sell orders, add the NGN amount to wallet
            if (request.type === "sell") {
              newBalance = currentBalance + request.totalNGN;
            }
            // For crypto buy orders, the balance was already deducted during order creation
          }

          await updateDoc(userDocRef, {
            walletBalance: newBalance,
            updatedAt: new Date().toISOString(),
          });
        }
      }

      // Send email notification
      const itemName =
        request.giftCardName || `${request.cryptoName} (${request.type})`;
      const amount = request.payoutNaira || request.totalNGN || request.amount;

      await sendUserNotification(
        request.userId,
        newStatus === "accepted" ? "approved" : "rejected",
        type,
        itemName,
        amount,
        invalidReasons[requestId]
      );

      // Remove from local state
      if (type === "giftCard") {
        setGiftCardRequests((prev) =>
          prev.filter((req) => req.id !== requestId)
        );
      } else {
        setCryptoRequests((prev) => prev.filter((req) => req.id !== requestId));
      }

      setInvalidReasons((prev) => {
        const newReasons = { ...prev };
        delete newReasons[requestId];
        return newReasons;
      });

      toast({
        title: "Status Updated",
        description: `Request ${
          newStatus === "accepted" ? "approved" : "rejected"
        }.`,
      });
    } catch (err) {
      console.error("Error updating status:", err);
      toast({
        title: "Error",
        description: "Failed to update request status.",
        variant: "destructive",
      });
    } finally {
      setUpdating((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  // Handle invalid reason input
  const handleInvalidReasonChange = (requestId, value) => {
    setInvalidReasons((prev) => ({ ...prev, [requestId]: value }));
  };

  // Handle view details
  const handleViewDetails = (request, type) => {
    setSelectedRequest({ ...request, requestType: type });
    setShowDetailsModal(true);
  };

  return (
    <>
      <Tabs defaultValue="gift-cards" className="w-full mt-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gift-cards">Gift Card Requests</TabsTrigger>
          <TabsTrigger value="crypto">Crypto Orders</TabsTrigger>
        </TabsList>

        {/* Gift Card Requests Tab */}
        <TabsContent value="gift-cards">
          <Card>
            <CardHeader>
              <CardTitle>Gift Card Requests</CardTitle>
              <CardDescription>
                Review and update the status of pending or flagged gift card
                requests.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gift Card</TableHead>
                    <TableHead>Face Value (USD)</TableHead>
                    <TableHead>Payout (NGN)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>Invalid Reason</TableHead>
                    <TableHead>Full Details</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-6 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-20 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : giftCardRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        No pending gift card requests.
                      </TableCell>
                    </TableRow>
                  ) : (
                    giftCardRequests.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell>{req.giftCardName}</TableCell>
                        <TableCell>
                          ${req.faceValue?.toFixed(2) || "N/A"}
                        </TableCell>
                        <TableCell>
                          ₦{req.payoutNaira?.toLocaleString() || "N/A"}
                        </TableCell>
                        <TableCell>{req.status}</TableCell>
                        <TableCell>
                          {req.submittedAt || req.createdAt
                            ? new Date(
                                req.submittedAt || req.createdAt
                              ).toLocaleString()
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Reason for invalid"
                            value={invalidReasons[req.id] || ""}
                            onChange={(e) =>
                              handleInvalidReasonChange(req.id, e.target.value)
                            }
                            disabled={updating[req.id]}
                            className="w-40"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(req, "giftCard")}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <Select
                            onValueChange={(value) =>
                              handleStatusUpdate(req.id, value, "giftCard")
                            }
                            disabled={updating[req.id]}
                          >
                            <SelectTrigger className="w-32 ml-auto">
                              <SelectValue placeholder="Update status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="accepted">Accept</SelectItem>
                              <SelectItem value="invalid">
                                Mark Invalid
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Crypto Orders Tab */}
        <TabsContent value="crypto">
          <Card>
            <CardHeader>
              <CardTitle>Crypto Orders</CardTitle>
              <CardDescription>
                Review pending or flagged crypto buy/sell orders.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Crypto</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Total (NGN)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>Invalid Reason</TableHead>
                    <TableHead>Full Details</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-6 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-20 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : cryptoRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center">
                        No pending crypto orders.
                      </TableCell>
                    </TableRow>
                  ) : (
                    cryptoRequests.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell>
                          {req.cryptoName || req.crypto} (
                          {req.cryptoSymbol || "N/A"})
                        </TableCell>
                        <TableCell className="capitalize">
                          {req.type || "N/A"}
                        </TableCell>
                        <TableCell>{req.amount || "N/A"}</TableCell>
                        <TableCell>
                          ₦{req.totalNGN?.toLocaleString() || "N/A"}
                        </TableCell>
                        <TableCell>{req.status}</TableCell>
                        <TableCell>
                          {req.submittedAt || req.createdAt
                            ? new Date(
                                req.submittedAt || req.createdAt
                              ).toLocaleString()
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Reason for invalid"
                            value={invalidReasons[req.id] || ""}
                            onChange={(e) =>
                              handleInvalidReasonChange(req.id, e.target.value)
                            }
                            disabled={updating[req.id]}
                            className="w-40"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(req, "crypto")}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <Select
                            onValueChange={(value) =>
                              handleStatusUpdate(req.id, value, "crypto")
                            }
                            disabled={updating[req.id]}
                          >
                            <SelectTrigger className="w-32 ml-auto">
                              <SelectValue placeholder="Update status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="accepted">Accept</SelectItem>
                              <SelectItem value="invalid">
                                Mark Invalid
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRequest?.requestType === "giftCard"
                ? "Gift Card Request Details"
                : "Crypto Order Details"}
            </DialogTitle>
            <DialogDescription>
              Full details of the submitted request
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {selectedRequest.requestType === "giftCard" ? (
                // Gift Card Details
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">Gift Card Name</Label>
                    <p>{selectedRequest.giftCardName}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Face Value (USD)</Label>
                    <p>${selectedRequest.faceValue?.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Payout (NGN)</Label>
                    <p>₦{selectedRequest.payoutNaira?.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Exchange Rate</Label>
                    <p>₦{selectedRequest.exchangeRate?.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Rate Percentage</Label>
                    <p>{selectedRequest.ratePercentage}%</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Status</Label>
                    <p className="capitalize">{selectedRequest.status}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">User ID</Label>
                    <p className="text-xs">{selectedRequest.userId}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Submitted At</Label>
                    <p>
                      {new Date(
                        selectedRequest.submittedAt || selectedRequest.createdAt
                      ).toLocaleString()}
                    </p>
                  </div>
                  {selectedRequest.imageUrl && (
                    <div className="space-y-2">
                      <Label className="font-semibold">Card Image</Label>
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <img
                          src={selectedRequest.imageUrl}
                          alt="Gift Card"
                          className="max-w-full h-auto max-h-96 rounded-md mx-auto shadow-md"
                        />
                        <div className="mt-2 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(selectedRequest.imageUrl, "_blank")
                            }
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Full Size
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Crypto Order Details
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">Cryptocurrency</Label>
                    <p>
                      {selectedRequest.cryptoName} (
                      {selectedRequest.cryptoSymbol})
                    </p>
                  </div>
                  <div>
                    <Label className="font-semibold">Order Type</Label>
                    <p className="capitalize">{selectedRequest.type}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Amount</Label>
                    <p>
                      {selectedRequest.amount} {selectedRequest.cryptoSymbol}
                    </p>
                  </div>
                  <div>
                    <Label className="font-semibold">Live Price (USD)</Label>
                    <p>${selectedRequest.livePrice?.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Final Price (USD)</Label>
                    <p>${selectedRequest.finalPriceUSD?.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Final Price (NGN)</Label>
                    <p>₦{selectedRequest.finalPriceNGN?.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Total (USD)</Label>
                    <p>${selectedRequest.totalUSD?.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Total (NGN)</Label>
                    <p>₦{selectedRequest.totalNGN?.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Admin Margin</Label>
                    <p>{selectedRequest.adminMargin}%</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Status</Label>
                    <p className="capitalize">{selectedRequest.status}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="font-semibold">Wallet Address</Label>
                    <p className="text-xs break-all">
                      {selectedRequest.walletAddress || "N/A"}
                    </p>
                  </div>
                  {selectedRequest.sendingWalletAddress && (
                    <div className="col-span-2">
                      <Label className="font-semibold">
                        Sending Wallet Address
                      </Label>
                      <p className="text-xs break-all">
                        {selectedRequest.sendingWalletAddress}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="font-semibold">User ID</Label>
                    <p className="text-xs">{selectedRequest.userId}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Created At</Label>
                    <p>
                      {new Date(selectedRequest.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {selectedRequest.proof && (
                    <div className="col-span-2">
                      <Label className="font-semibold">Proof File</Label>
                      <p>{selectedRequest.proof}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
