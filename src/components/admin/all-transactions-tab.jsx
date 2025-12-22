"use client";

import { useState, useEffect } from "react";
import { getAllTransactions } from "@/lib/data";
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
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

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

export default function AllTransactionsTab() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const data = await getAllTransactions();

        // 1. Sort by Date (Newest First)
        // This assumes 'tx.date' or 'tx.createdAt' is a valid date string/timestamp
        const sortedData = data.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date);
          const dateB = new Date(b.createdAt || b.date);
          return dateB - dateA;
        });

        setTransactions(sortedData);
      } catch (err) {
        console.error("Error fetching transactions:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // 2. Search Logic (Includes Date)
  const filteredTransactions = transactions.filter((tx) => {
    const term = searchTerm.toLowerCase();
    const dateStr = tx.date ? tx.date.toString().toLowerCase() : "";
    const descStr = tx.description ? tx.description.toLowerCase() : "";
    const idStr = tx.id ? tx.id.toLowerCase() : "";

    return (
      descStr.includes(term) || idStr.includes(term) || dateStr.includes(term)
    );
  });

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>All User Transactions</CardTitle>
            <CardDescription>
              A complete record of all transactions in the system.
            </CardDescription>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Input
              // Updated placeholder to indicate Date is searchable
              placeholder="Search by description, date, or ID..."
              className="w-full sm:w-80"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell>
                      <Skeleton className="h-6 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-24" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-6 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              : filteredTransactions.map((tx, index) => (
                  // Uses composite key to prevent "duplicate key" error
                  <TableRow key={`${tx.id}-${index}`}>
                    <TableCell className="font-medium">
                      {tx.description}
                      {/* Optional: Show ID for easier searching */}
                      <div className="text-[10px] text-muted-foreground uppercase">
                        {tx.id.slice(0, 8)}...
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {tx.date}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "capitalize",
                          tx.type === "credit"
                            ? "text-green-600"
                            : "text-red-600"
                        )}
                      >
                        {tx.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(tx.status)}>
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-semibold",
                        tx.type === "credit"
                          ? "text-green-600"
                          : "text-foreground"
                      )}
                    >
                      {tx.type === "credit" ? "+" : "-"}₦
                      {Math.abs(tx.amount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
