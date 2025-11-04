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
  switch (status) {
    case "Completed":
      return "default";
    case "Pending":
      return "secondary";
    case "Failed":
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

        // Sort by createdAt (Timestamp) or date — newest first
        const sorted = txs
          .map((tx) => ({
            ...tx,
            sortTime:
              tx.createdAt?.toDate?.() ||
              (tx.createdAt?.seconds
                ? new Date(tx.createdAt.seconds * 1000)
                : new Date(tx.date || 0)),
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

  const formatDate = (date) => {
    if (!date) return "N/A";
    try {
      if (date.toDate) return date.toDate().toLocaleDateString("en-GB");
      if (date.seconds)
        return new Date(date.seconds * 1000).toLocaleDateString("en-GB");
      return new Date(date).toLocaleDateString("en-GB");
    } catch {
      return String(date);
    }
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
          {loading
            ? Array.from({ length: 3 }).map((_, idx) => (
                <li key={idx} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <div className="text-right space-y-2">
                    <Skeleton className="h-4 w-16 ml-auto" />
                    <Skeleton className="h-4 w-12 ml-auto" />
                  </div>
                </li>
              ))
            : transactions.map((tx) => (
                <li key={tx.id} className="flex items-center gap-4">
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full",
                      tx.type === "credit"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    )}
                  >
                    {tx.type === "credit" ? (
                      <ArrowDownLeft className="h-5 w-5" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{tx.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(tx.createdAt || tx.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        "font-semibold",
                        tx.type === "credit"
                          ? "text-green-600"
                          : "text-foreground"
                      )}
                    >
                      {tx.type === "credit" ? "+" : ""}₦
                      {Math.abs(tx.amount).toFixed(2)}
                    </p>
                    <Badge
                      variant={getStatusBadgeVariant(tx.status)}
                      className="mt-1"
                    >
                      {tx.status}
                    </Badge>
                  </div>
                </li>
              ))}
        </ul>
      </CardContent>
    </Card>
  );
}
