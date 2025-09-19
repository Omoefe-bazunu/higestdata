"use client";

import { useState, useEffect } from "react";
import { getCryptoRates } from "@/lib/data";
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
import { ArrowUp, ArrowDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function CryptoRates() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getCryptoRates();
        setRates(data);
      } catch (error) {
        console.error("Failed to fetch crypto rates:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crypto Rates</CardTitle>
        <CardDescription>
          Live prices for top cryptocurrencies
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Asset</TableHead>
              <TableHead className="text-right text-xs">Price</TableHead>
              <TableHead className="hidden text-xs sm:table-cell text-right text-nowrap">
                24h Change
              </TableHead>
              <TableHead className="text-right text-xs sr-only sm:not-sr-only">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-right">
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </TableCell>
                    <TableCell className="text-right sr-only sm:not-sr-only">
                      <Skeleton className="h-9 w-24 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              : rates.map((coin) => (
                  <TableRow key={coin.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{coin.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {coin.symbol}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₦{Number(coin.price).toLocaleString()}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "hidden sm:table-cell text-right",
                        coin.change24h >= 0 ? "text-green-600" : "text-red-600"
                      )}
                    >
                      <div className="flex items-center justify-end gap-1">
                        {coin.change24h >= 0 ? (
                          <ArrowUp className="h-4 w-4" />
                        ) : (
                          <ArrowDown className="h-4 w-4" />
                        )}
                        {Math.abs(coin.change24h)}%
                      </div>
                    </TableCell>
                    <TableCell className="text-right sr-only sm:not-sr-only">
                      <Button variant="outline" size="sm">
                        Trade
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
