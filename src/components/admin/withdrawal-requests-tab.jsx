"use client";

import { useState, useEffect } from "react";
import { firestore as db } from "@/lib/firebaseConfig";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  runTransaction,
  where,
  getDocs,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminWithdrawals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState({});

  useEffect(() => {
    const q = query(
      collection(db, "withdrawalRequests"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRequests(data);
    });

    return () => unsub();
  }, []);

  const handleAction = async (request, action) => {
    const requestId = request.id;
    setLoading((prev) => ({ ...prev, [requestId]: true }));

    try {
      const newStatus = action === "complete" ? "completed" : "failed";
      const userRef = doc(db, "users", request.userId);
      const withdrawalRef = doc(db, "withdrawalRequests", requestId);

      // Fetch transaction docs BEFORE transaction
      const txQuery = query(
        collection(db, "users", request.userId, "transactions"),
        where("reference", "==", request.reference)
      );
      const txSnapshot = await getDocs(txQuery);
      const txDocs = txSnapshot.docs;

      await runTransaction(db, async (tx) => {
        // === ALL READS FIRST ===
        const userSnap = await tx.get(userRef);
        if (!userSnap.exists()) throw new Error("User not found");

        const currentBalance = userSnap.data()?.walletBalance || 0;
        let newBalance = currentBalance;

        // Deduct on complete
        if (action === "complete") {
          if (currentBalance < request.totalAmount) {
            throw new Error("Insufficient balance");
          }
          newBalance = currentBalance - request.totalAmount;
        }

        // Refund on reject
        if (action === "reject") {
          newBalance = currentBalance + request.totalAmount;
        }

        // === ALL WRITES AFTER ===
        tx.update(withdrawalRef, {
          status: newStatus,
          processedAt: new Date(),
        });

        tx.update(userRef, { walletBalance: newBalance });

        // Update all matching transaction docs
        txDocs.forEach((docSnap) => {
          tx.update(docSnap.ref, { status: newStatus });
        });
      });

      // Notify user
      await fetch("/api/withdrawal/notify-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: request.userEmail,
          userName: request.userName,
          amount: request.amount,
          status: newStatus,
          reference: request.reference,
          bankName: request.bankName,
          accountNumber: request.accountNumber,
        }),
      });

      toast.success(`Withdrawal ${newStatus}`);
    } catch (err) {
      console.error("Error processing withdrawal:", err);
      toast.error(err.message || "Failed to process withdrawal");
    } finally {
      setLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdrawal Requests</CardTitle>
        <CardDescription>Manage user withdrawal requests</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium">User</th>
                <th className="text-left p-3 font-medium">Contact</th>
                <th className="text-left p-3 font-medium">Amount</th>
                <th className="text-left p-3 font-medium">Wallet Balance</th>
                <th className="text-left p-3 font-medium">Bank Details</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center p-8 text-muted-foreground"
                  >
                    No withdrawal requests
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{req.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {req.userId}
                        </p>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        <p>{req.userEmail}</p>
                        <p className="text-muted-foreground">{req.userPhone}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="font-semibold">
                          ₦{req.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Fee: ₦{req.fee} | Total: ₦
                          {req.totalAmount.toLocaleString()}
                        </p>
                      </div>
                    </td>
                    <td className="p-3">
                      ₦{req.walletBalance.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        <p className="font-medium">{req.bankName}</p>
                        <p>{req.accountNumber}</p>
                        <p className="text-muted-foreground">
                          {req.accountName}
                        </p>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          req.status
                        )}`}
                      >
                        {req.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-sm">
                      {req.createdAt?.toDate().toLocaleString()}
                    </td>
                    <td className="p-3">
                      {req.status === "pending" ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAction(req, "complete")}
                            disabled={loading[req.id]}
                          >
                            {loading[req.id] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleAction(req, "reject")}
                            disabled={loading[req.id]}
                          >
                            {loading[req.id] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Processed
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
