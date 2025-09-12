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
  const { toast } = useToast();
  const adminEmails = process.env.NEXT_PUBLIC_ADMINEMAIL?.split(",") || [];

  // Fetch gift card and crypto requests
  useEffect(() => {
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
        setGiftCardRequests(giftCardData);

        // Fetch crypto requests
        const cryptoSnapshot = await getDocs(
          collection(firestore, "cryptoRequests")
        );
        const cryptoData = cryptoSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(
            (req) => req.status === "pending" || req.status === "flagged"
          );
        setCryptoRequests(cryptoData);
      } catch (err) {
        console.error("Error fetching requests:", err);
        toast({
          title: "Error",
          description: "Failed to load requests.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchRequests();
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
        type === "giftCard" ? "giftCardSubmissions" : "cryptoRequests";

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
        where("relatedSubmissionId", "==", requestId)
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
          const newBalance = currentBalance + request.payoutNaira;

          await updateDoc(userDocRef, {
            walletBalance: newBalance,
            updatedAt: new Date().toISOString(),
          });
        }
      }

      // Send email
      await sendUserNotification(
        request.userId,
        newStatus === "accepted" ? "approved" : "rejected",
        type,
        request.giftCardName || request.cryptoName,
        request.payoutNaira || request.amount,
        invalidReasons[requestId]
      );

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

  return (
    <Tabs defaultValue="gift-cards" className="w-full mt-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="gift-cards">Gift Card Requests</TabsTrigger>
        <TabsTrigger value="crypto">Crypto Requests</TabsTrigger>
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
                        <Skeleton className="h-6 w-20 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : giftCardRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No pending gift card requests.
                    </TableCell>
                  </TableRow>
                ) : (
                  giftCardRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>{req.giftCardName}</TableCell>
                      <TableCell>${req.faceValue.toFixed(2)}</TableCell>
                      <TableCell>₦{req.payoutNaira.toLocaleString()}</TableCell>
                      <TableCell>{req.status}</TableCell>
                      <TableCell>
                        {new Date(req.submittedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Reason for invalid"
                          value={invalidReasons[req.id] || ""}
                          onChange={(e) =>
                            handleInvalidReasonChange(req.id, e.target.value)
                          }
                          disabled={updating[req.id]}
                        />
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

      {/* Crypto Requests Tab */}
      <TabsContent value="crypto">
        <Card>
          <CardHeader>
            <CardTitle>Crypto Requests</CardTitle>
            <CardDescription>
              Review pending or flagged crypto buy/sell requests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead>Invalid Reason</TableHead>
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
                        <Skeleton className="h-6 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : cryptoRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No pending crypto requests.
                    </TableCell>
                  </TableRow>
                ) : (
                  cryptoRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>{req.type || "N/A"}</TableCell>
                      <TableCell>{req.amount || "N/A"}</TableCell>
                      <TableCell>{req.status}</TableCell>
                      <TableCell>
                        {new Date(req.submittedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Reason for invalid"
                          value={invalidReasons[req.id] || ""}
                          onChange={(e) =>
                            handleInvalidReasonChange(req.id, e.target.value)
                          }
                          disabled={updating[req.id]}
                        />
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
  );
}
