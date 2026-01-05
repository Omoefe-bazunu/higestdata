"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTransactions } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function getStatusBadgeVariant(status) {
  switch (status?.toLowerCase()) {
    case "completed":
    case "success":
      return "default";
    case "pending":
    case "processing":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "outline";
  }
}

export default function RecentTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      try {
        const txs = await getTransactions(user.uid);

        const sorted = txs
          .map((tx) => ({
            ...tx,
            sortTime:
              tx.createdAt?.toDate?.() ||
              (tx.createdAt?.seconds
                ? new Date(tx.createdAt.seconds * 1000)
                : 0),
          }))
          .sort((a, b) => b.sortTime - a.sortTime)
          .slice(0, 5);

        setTransactions(sorted);
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      const date =
        timestamp.toDate?.() ||
        new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
      return date.toLocaleDateString("en-GB");
    } catch {
      return "N/A";
    }
  };

  // Get correct amount (supports VTU Africa fields)
  const getDisplayAmount = (tx) => {
    const amount = tx.amountCharged || tx.amountToVTU || tx.amount || 0;
    return Math.abs(amount);
  };

  const getDescription = (tx) => {
    // Check if transaction is positive (funding or credit)
    const isPositive = ["funding", "credit"].includes(tx.type?.toLowerCase());

    return tx.description || (isPositive ? "Wallet Funding" : "Purchase");
  };

  // Check if transaction is positive (funding or credit)
  const isPositiveTransaction = (tx) => {
    return ["funding", "credit"].includes(tx.type?.toLowerCase());
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest transactions.</CardDescription>
        </div>
        <Link href="/dashboard/transactions">
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-20" />
              </li>
            ))
          ) : transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No transactions yet
            </p>
          ) : (
            transactions.map((tx) => {
              const isPositive = isPositiveTransaction(tx);

              return (
                <li key={tx.id} className="flex items-center gap-4">
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full",
                      isPositive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    )}
                  >
                    {isPositive ? (
                      <ArrowDownLeft className="h-5 w-5" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{getDescription(tx)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        "font-semibold",
                        isPositive ? "text-green-600" : "text-foreground"
                      )}
                    >
                      {isPositive ? "+" : "-"}₦
                      {getDisplayAmount(tx).toLocaleString()}
                    </p>
                    <Badge
                      variant={getStatusBadgeVariant(tx.status)}
                      className="mt-1"
                    >
                      {tx.status || "Pending"}
                    </Badge>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
