"use client";

import { useEffect, useState } from "react";
import { getWalletBalance } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function WalletSummary() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetchBalance() {
      try {
        const amount = await getWalletBalance(user.uid);
        setBalance(amount);
      } catch (err) {
        console.error("Failed to fetch wallet balance:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBalance();
  }, [user]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-muted-foreground text-center font-medium">
          Wallet Balance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:items-center sm:justify-between gap-4">
          {loading ? (
            <Skeleton className="h-10 w-48 mx-auto" />
          ) : (
            <p className="text-4xl md:text-5xl text-center font-bold font-headline text-primary whitespace-nowrap">
              ₦
              {balance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground w-full"
            >
              <ArrowUpRight className="mr-2 h-5 w-5" />
              Fund Wallet
            </Button>
            <Button size="lg" variant="outline" className="w-full">
              <ArrowDownLeft className="mr-2 h-5 w-5" />
              Withdraw
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
