"use client";

import { useState, useEffect } from "react";
import { getFlaggedTransactions } from "@/lib/data";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "../ui/skeleton";

// ✅ Map status to badge variant
function getStatusBadgeVariant(status) {
  switch (status) {
    case "Pending Review":
      return "destructive";
    case "Resolved":
      return "default";
    case "Dismissed":
      return "secondary";
    default:
      return "outline";
  }
}

export default function AdminDashboardTab() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await getFlaggedTransactions();
        setTransactions(data);
      } catch (err) {
        console.error("Error fetching flagged transactions:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      // ⚠️ Update status in Firestore here if you want persistence
      // Example:
      // await updateDoc(doc(firestore, "flaggedTransactions", id), { status });

      // For now, update local state
      setTransactions((prev) =>
        prev.map((tx) => (tx.id === id ? { ...tx, status } : tx))
      );
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Flagged Gift Card Transactions</CardTitle>
        <CardDescription>
          Transactions flagged by the AI for manual review.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">User</TableHead>
              <TableHead className="min-w-[180px]">Details</TableHead>
              <TableHead className="max-w-xs whitespace-nowrap">
                Reason for Flag
              </TableHead>
              <TableHead className="whitespace-nowrap">Date</TableHead>
              <TableHead className="whitespace-nowrap">Status</TableHead>
              <TableHead className="whitespace-nowrap">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-10 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-64" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </TableCell>
                  </TableRow>
                ))
              : transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <div className="font-medium whitespace-nowrap">
                          {tx.user?.name || "Unknown"}
                        </div>
                        <div className="text-sm text-muted-foreground whitespace-nowrap">
                          {tx.user?.email || "No email"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {tx.details}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {tx.reason}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {tx.date ? new Date(tx.date).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(tx.status)}
                        className="w-fit"
                      >
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                            disabled={updatingId === tx.id}
                          >
                            {updatingId === tx.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateStatus(tx.id, "Resolved")
                            }
                          >
                            Approve & Resolve
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateStatus(tx.id, "Dismissed")
                            }
                          >
                            Dismiss Flag
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
