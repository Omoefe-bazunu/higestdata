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
  const s = status?.toLowerCase() || "";
  if (s === "completed" || s === "success" || s === "paid") return "default";
  if (s === "pending" || s === "processing") return "secondary";
  if (s === "failed" || s === "cancelled") return "destructive";
  return "outline";
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

        // Sort strictly by createdAt (Newest First)
        const sortedData = data.sort((a, b) => {
          const timeA = a.createdAt?.toDate
            ? a.createdAt.toDate()
            : new Date(a.createdAt || 0);
          const timeB = b.createdAt?.toDate
            ? b.createdAt.toDate()
            : new Date(b.createdAt || 0);
          return timeB - timeA;
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

  // Search Filter
  const filteredTransactions = transactions.filter((tx) => {
    const term = searchTerm.toLowerCase();
    const dateStr = tx.date ? tx.date.toString().toLowerCase() : "";
    const descStr = tx.description ? tx.description.toLowerCase() : "";
    const idStr = tx.id ? tx.id.toLowerCase() : "";
    const typeStr = tx.type ? tx.type.toLowerCase() : "";
    const refStr = tx.reference ? tx.reference.toLowerCase() : "";
    const amountStr = tx.amount ? tx.amount.toString() : "";

    return (
      descStr.includes(term) ||
      idStr.includes(term) ||
      dateStr.includes(term) ||
      typeStr.includes(term) ||
      refStr.includes(term) ||
      amountStr.includes(term)
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
              placeholder="Search by description, date, ref, amount..."
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
              {/* Amount Column Header */}
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
              : filteredTransactions.map((tx, index) => {
                  // Determine coloring based on transaction type
                  const isCredit =
                    tx.normalizedType === "Credit" ||
                    tx.type === "funding" ||
                    tx.type === "credit";

                  return (
                    <TableRow key={`${tx.id}-${index}`}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{tx.description}</span>
                          <span className="text-[10px] text-muted-foreground uppercase">
                            {tx.reference || tx.id.slice(0, 8)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {tx.date}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "capitalize font-medium",
                            isCredit ? "text-green-600" : "text-red-600"
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
                      {/* Amount Column Row */}
                      <TableCell
                        className={cn(
                          "text-right font-bold",
                          isCredit ? "text-green-600" : "text-foreground"
                        )}
                      >
                        {isCredit ? "+" : "-"}₦
                        {Math.abs(tx.amount).toLocaleString("en-NG", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
