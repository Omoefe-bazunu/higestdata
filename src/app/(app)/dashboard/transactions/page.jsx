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
import {
  Download,
  FileText,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  DollarSign,
} from "lucide-react";

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
    <div className="flex justify-between py-3 border-b last:border-0">
      <span className="text-sm font-semibold text-gray-600">{label}</span>
      <span className={cn("text-sm font-bold", className)}>
        {value || "N/A"}
      </span>
    </div>
  );

  const isPositive = ["funding", "credit"].includes(
    transaction.type?.toLowerCase(),
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="hover:bg-blue-900 hover:text-white transition-all"
        >
          <FileText className="h-4 w-4 mr-1.5" />
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-gray-900">
            Transaction Details
          </DialogTitle>
          <DialogDescription>
            Complete information about this transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          {/* Basic Information */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h3 className="font-black mb-4 text-sm uppercase tracking-wide text-gray-900">
              Basic Information
            </h3>
            <div className="space-y-1">
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
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
              <h3 className="font-black mb-4 text-sm uppercase tracking-wide text-blue-900">
                Service Details
              </h3>
              <div className="space-y-1">
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
            <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
              <h3 className="font-black mb-4 text-sm uppercase tracking-wide text-orange-900">
                Electricity Details
              </h3>
              <div className="space-y-1">
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
            <div className="bg-green-50 p-6 rounded-xl border border-green-200">
              <h3 className="font-black mb-4 text-sm uppercase tracking-wide text-green-900">
                Balance Information
              </h3>
              <div className="space-y-1">
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
            <div className="bg-red-50 p-6 rounded-xl border border-red-200">
              <h3 className="font-black mb-4 text-sm uppercase tracking-wide text-red-900">
                {transaction.error ? "Error Information" : "Rejection Reason"}
              </h3>
              <p className="text-sm text-red-800 font-medium">
                {transaction.error || transaction.reasons}
              </p>
            </div>
          )}

          {/* VTU Response */}
          {transaction.vtuResponse && (
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="font-black mb-4 text-sm uppercase tracking-wide text-gray-900">
                VTU Africa Response
              </h3>
              <div className="space-y-1 text-xs">
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
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              className="border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white"
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
  const [searchTerm, setSearchTerm] = useState("");

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
        orderBy("createdAt", "desc"),
      );
      const snapshot = await getDocs(transactionsQuery);
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
    } catch (error) {
      console.error("Error fetching transactions:", error);
      try {
        const snapshot = await getDocs(
          collection(firestore, "users", userId, "transactions"),
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

  const filteredTransactions = transactions.filter((tx) =>
    tx.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <section className="flex flex-col items-center justify-center min-h-screen bg-white py-20">
        <div className="flex space-x-2">
          <span className="h-3 w-3 bg-blue-900 rounded-full animate-pulse"></span>
          <span className="h-3 w-3 bg-blue-900 rounded-full animate-pulse delay-200"></span>
          <span className="h-3 w-3 bg-blue-900 rounded-full animate-pulse delay-400"></span>
        </div>
      </section>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-fixed bg-center bg-no-repeat pb-24 pt-8 px-4 md:px-12"
      style={{ backgroundImage: `url('/gebg.jpg')` }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 to-blue-800 rounded-2xl p-8 mb-10 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-extrabold text-white">
                Transaction History
              </h1>
              <p className="text-blue-100 opacity-80">
                Review all your past transactions
              </p>
            </div>
            <div className="bg-white/20 text-center lg:text-left backdrop-blur-sm px-6 py-3 rounded-xl">
              <p className="text-blue-100 text-sm font-semibold">
                Total Transactions
              </p>
              <p className="text-3xl font-black text-white">
                {transactions.length}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-green-200">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-4 rounded-xl">
                <ArrowUpRight className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">
                  Total Credits
                </p>
                <p className="text-2xl font-black text-green-600">
                  ₦
                  {transactions
                    .filter((tx) =>
                      ["funding", "credit"].includes(tx.type?.toLowerCase()),
                    )
                    .reduce(
                      (sum, tx) =>
                        sum +
                        (tx.amountCharged ||
                          tx.amountToVTU ||
                          Math.abs(tx.amount) ||
                          0),
                      0,
                    )
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-red-200">
            <div className="flex items-center gap-4">
              <div className="bg-red-100 p-4 rounded-xl">
                <ArrowDownLeft className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">
                  Total Debits
                </p>
                <p className="text-2xl font-black text-red-600">
                  ₦
                  {transactions
                    .filter(
                      (tx) =>
                        !["funding", "credit"].includes(tx.type?.toLowerCase()),
                    )
                    .reduce(
                      (sum, tx) =>
                        sum +
                        (tx.amountCharged ||
                          tx.amountToVTU ||
                          Math.abs(tx.amount) ||
                          0),
                      0,
                    )
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-blue-200">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-4 rounded-xl">
                <Calendar className="w-6 h-6 text-blue-900" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">
                  Transactions this Month
                </p>
                <p className="text-2xl font-black text-blue-900">
                  {
                    transactions.filter((tx) => {
                      const date = tx.createdAt || tx.date;
                      if (!date) return false;
                      try {
                        const txDate = date.toDate
                          ? date.toDate()
                          : date.seconds
                            ? new Date(date.seconds * 1000)
                            : new Date(date);
                        const now = new Date();
                        return (
                          txDate.getMonth() === now.getMonth() &&
                          txDate.getFullYear() === now.getFullYear()
                        );
                      } catch {
                        return false;
                      }
                    }).length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-none">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <CardTitle className="text-2xl font-black text-gray-900">
                All Transactions
              </CardTitle>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search transactions..."
                    className="pl-10 w-full sm:w-64 border-gray-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  className="border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-black text-gray-900">
                      Description
                    </TableHead>
                    <TableHead className="font-black text-gray-900">
                      Date
                    </TableHead>
                    <TableHead className="font-black text-gray-900">
                      Type
                    </TableHead>
                    <TableHead className="font-black text-gray-900">
                      Status
                    </TableHead>
                    <TableHead className="text-right font-black text-gray-900">
                      Amount
                    </TableHead>
                    <TableHead className="text-right font-black text-gray-900">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-12 text-gray-500"
                      >
                        {searchTerm
                          ? "No transactions match your search."
                          : "No transactions found."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((tx) => {
                      const isPositive = ["funding", "credit"].includes(
                        tx.type?.toLowerCase(),
                      );

                      return (
                        <TableRow
                          key={tx.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <TableCell className="font-semibold text-gray-900">
                            {tx.description}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {(() => {
                              const date = tx.createdAt || tx.date;
                              if (!date) return "N/A";
                              try {
                                if (date.toDate)
                                  return date.toDate().toLocaleDateString();
                                if (date.seconds)
                                  return new Date(
                                    date.seconds * 1000,
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
                                "capitalize font-semibold",
                                isPositive ? "text-green-600" : "text-red-600",
                              )}
                            >
                              {tx.type}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusBadgeVariant(tx.status)}
                              className="font-semibold"
                            >
                              {formatStatus(tx.status)}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-black text-lg",
                              isPositive ? "text-green-600" : "text-gray-900",
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
