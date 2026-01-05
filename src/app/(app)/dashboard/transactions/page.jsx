"use client";

import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Download, FileText } from "lucide-react";

function getStatusBadgeVariant(status) {
  switch (status) {
    case "Completed":
    case "success":
    case "successful":
      return "default";
    case "Pending":
    case "pending":
    case "processing":
      return "secondary";
    case "Failed":
    case "failed":
    case "Not Approved":
      return "destructive";
    default:
      return "outline";
  }
}

function formatStatus(status) {
  if (!status) return "Unknown";
  const statusMap = {
    success: "Completed",
    successful: "Completed",
    pending: "Pending",
    processing: "Processing",
    failed: "Failed",
  };
  return statusMap[status.toLowerCase()] || status;
}

function formatDate(date) {
  if (!date) return "N/A";
  try {
    if (date.toDate) return date.toDate().toLocaleDateString();
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
    return new Date(date).toLocaleDateString();
  } catch {
    return String(date);
  }
}

function TransactionDetailsModal({ transaction }) {
  const DetailRow = ({ label, value, className = "" }) => (
    <div className="flex justify-between py-2 border-b last:border-0">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-semibold", className)}>
        {value || "N/A"}
      </span>
    </div>
  );

  // Check if transaction is positive (funding or credit)
  const isPositive = ["funding", "credit"].includes(
    transaction.type?.toLowerCase()
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-1" />
          Full Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>
            Complete information about this transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Basic Information */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide">
              Basic Information
            </h3>
            <div className="space-y-2">
              <DetailRow label="Transaction ID" value={transaction.id} />
              <DetailRow label="Description" value={transaction.description} />
              <DetailRow
                label="Amount"
                value={`${isPositive ? "+" : "-"}₦${(
                  transaction.amountCharged ||
                  transaction.amountToVTU ||
                  Math.abs(transaction.amount) ||
                  0
                ).toLocaleString()}`}
                className={isPositive ? "text-green-600" : "text-red-600"}
              />
              <DetailRow
                label="Type"
                value={transaction.type?.toUpperCase()}
                className={isPositive ? "text-green-600" : "text-red-600"}
              />
              <DetailRow
                label="Status"
                value={formatStatus(transaction.status)}
              />
              <DetailRow
                label="Date"
                value={formatDate(transaction.createdAt || transaction.date)}
              />
              {transaction.createdAt && (
                <DetailRow
                  label="Created At"
                  value={formatDate(transaction.createdAt)}
                />
              )}
            </div>
          </div>

          {/* Service-Specific Details */}
          {(transaction.serviceType ||
            transaction.network ||
            transaction.provider) && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide">
                Service Details
              </h3>
              <div className="space-y-2">
                {transaction.serviceType && (
                  <DetailRow
                    label="Service Type"
                    value={transaction.serviceType.toUpperCase()}
                  />
                )}
                {transaction.network && (
                  <DetailRow
                    label="Network/Provider"
                    value={transaction.network}
                  />
                )}
                {transaction.provider && (
                  <DetailRow label="Provider" value={transaction.provider} />
                )}
                {transaction.phone && (
                  <DetailRow label="Phone Number" value={transaction.phone} />
                )}
                {transaction.customerId && (
                  <DetailRow
                    label="Customer/Meter ID"
                    value={transaction.customerId}
                  />
                )}
                {transaction.variationId && (
                  <DetailRow
                    label="Plan/Variation"
                    value={transaction.variationId}
                  />
                )}
                {transaction.requestId && (
                  <DetailRow label="Request ID" value={transaction.requestId} />
                )}
              </div>
            </div>
          )}

          {/* Electricity-Specific Details */}
          {transaction.serviceType === "electricity" && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide">
                Electricity Details
              </h3>
              <div className="space-y-2">
                {transaction.customerName && (
                  <DetailRow
                    label="Customer Name"
                    value={transaction.customerName}
                  />
                )}
                {transaction.customerAddress && (
                  <DetailRow
                    label="Customer Address"
                    value={transaction.customerAddress}
                  />
                )}
                {transaction.electricityAmount && (
                  <DetailRow
                    label="Electricity Amount"
                    value={`₦${transaction.electricityAmount.toLocaleString()}`}
                  />
                )}
                {transaction.serviceCharge !== undefined && (
                  <DetailRow
                    label="Service Charge"
                    value={`₦${transaction.serviceCharge.toLocaleString()}`}
                  />
                )}
              </div>
            </div>
          )}

          {/* Balance Information */}
          {(transaction.previousBalance !== undefined ||
            transaction.newBalance !== undefined) && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide">
                Balance Information
              </h3>
              <div className="space-y-2">
                {transaction.previousBalance !== undefined && (
                  <DetailRow
                    label="Previous Balance"
                    value={`₦${transaction.previousBalance.toLocaleString()}`}
                  />
                )}
                {transaction.newBalance !== undefined && (
                  <DetailRow
                    label="New Balance"
                    value={`₦${transaction.newBalance.toLocaleString()}`}
                  />
                )}
              </div>
            </div>
          )}

          {/* Error/Rejection Information */}
          {(transaction.error || transaction.reasons) && (
            <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-destructive">
                {transaction.error ? "Error Information" : "Rejection Reason"}
              </h3>
              <p className="text-sm">
                {transaction.error || transaction.reasons}
              </p>
            </div>
          )}

          {/* eBills Response */}
          {transaction.vtuResponse && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide">
                VTU Africa Response
              </h3>
              <div className="space-y-2 text-xs">
                {transaction.vtuResponse.description?.Status && (
                  <DetailRow
                    label="Status"
                    value={transaction.vtuResponse.description.Status}
                  />
                )}
                {transaction.vtuResponse.description?.ProductName && (
                  <DetailRow
                    label="Product"
                    value={transaction.vtuResponse.description.ProductName}
                  />
                )}
                {transaction.vtuResponse.description?.Token && (
                  <DetailRow
                    label="Token"
                    value={transaction.vtuResponse.description.Token}
                  />
                )}
                {transaction.vtuResponse.description?.message && (
                  <DetailRow
                    label="Message"
                    value={transaction.vtuResponse.description.message}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {transaction.status === "Not Approved" && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              onClick={() =>
                (window.location.href = "mailto:info@higher.com.ng")
              }
            >
              Contact Admin
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        await fetchTransactions(user.uid);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchTransactions = async (userId) => {
    try {
      const transactionsQuery = query(
        collection(firestore, "users", userId, "transactions"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(transactionsQuery);
      let transactionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Client-side sort fallback
      transactionsData.sort((a, b) => {
        const getTime = (obj) => {
          const ts = obj.createdAt || obj.date;
          if (!ts) return 0;
          if (ts.toDate) return ts.toDate().getTime();
          if (ts.seconds) return ts.seconds * 1000;
          return new Date(ts).getTime() || 0;
        };
        return getTime(b) - getTime(a);
      });

      setTransactions(transactionsData);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      try {
        const snapshot = await getDocs(
          collection(firestore, "users", userId, "transactions")
        );
        let transactionsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        transactionsData.sort((a, b) => {
          const getTime = (obj) => {
            const ts = obj.createdAt || obj.date;
            if (!ts) return 0;
            if (ts.toDate) return ts.toDate().getTime();
            if (ts.seconds) return ts.seconds * 1000;
            return new Date(ts).getTime() || 0;
          };
          return getTime(b) - getTime(a);
        });

        setTransactions(transactionsData);
      } catch (fallbackError) {
        console.error("Error fetching transactions (fallback):", fallbackError);
      }
    }
  };

  if (loading) {
    return <div className="space-y-8">Loading...</div>;
  }

  return (
    <div className="space-y-8 mt-4">
      <div>
        <h1 className="text-3xl font-bold font-headline">
          Transaction History
        </h1>
        <p className="text-muted-foreground">
          Review all your past transactions.
        </p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <CardTitle>All Transactions</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <Input
                placeholder="Search transactions..."
                className="w-full sm:w-64"
              />
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => {
                  // Check if transaction is positive (funding or credit)
                  const isPositive = ["funding", "credit"].includes(
                    tx.type?.toLowerCase()
                  );

                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">
                        {tx.description}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const date = tx.createdAt || tx.date;
                          if (!date) return "N/A";
                          try {
                            if (date.toDate)
                              return date.toDate().toLocaleDateString();
                            if (date.seconds)
                              return new Date(
                                date.seconds * 1000
                              ).toLocaleDateString();
                            return new Date(date).toLocaleDateString();
                          } catch {
                            return String(date);
                          }
                        })()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "capitalize",
                            isPositive ? "text-green-600" : "text-red-600"
                          )}
                        >
                          {tx.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(tx.status)}>
                          {formatStatus(tx.status)}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-semibold",
                          isPositive ? "text-green-600" : "text-foreground"
                        )}
                      >
                        {isPositive ? "+" : "-"}₦
                        {(
                          tx.amountCharged ||
                          tx.amountToVTU ||
                          Math.abs(tx.amount) ||
                          0
                        ).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <TransactionDetailsModal transaction={tx} />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
