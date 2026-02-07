"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { firestore } from "@/lib/firebaseConfig";
import {
  doc,
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import WithdrawalModal from "@/components/WithdrawalModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import FundingModal from "@/components/FundingModal";

export default function WalletSummary() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [fundingDialogOpen, setFundingDialogOpen] = useState(false);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);

  // Fetch wallet balance and transactions
  useEffect(() => {
    if (!user) return;

    // Subscribe to wallet balance changes
    const userRef = doc(firestore, "users", user.uid);
    const unsubscribeBalance = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setBalance(docSnap.data().walletBalance || 0);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching wallet balance:", error);
        toast.error("Failed to load wallet balance");
        setLoading(false);
      },
    );

    // Subscribe to recent transactions
    const transactionsRef = collection(
      firestore,
      "users",
      user.uid,
      "transactions",
    );
    const q = query(transactionsRef, orderBy("createdAt", "desc"), limit(5));

    const unsubscribeTransactions = onSnapshot(
      q,
      (snapshot) => {
        const txs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTransactions(txs);
      },
      (error) => {
        console.error("Error fetching transactions:", error);
      },
    );

    return () => {
      unsubscribeBalance();
      unsubscribeTransactions();
    };
  }, [user]);

  return (
    <>
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
              {/* Fund Wallet Button */}
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/80 text-accent-foreground w-full"
                onClick={() => setFundingDialogOpen(true)}
              >
                <ArrowUpRight className="mr-2 h-5 w-5" />
                Fund Wallet
              </Button>

              {/* Withdraw Button */}
              <Button
                size="lg"
                variant="outline"
                className="w-full"
                onClick={() => setWithdrawalDialogOpen(true)}
              >
                <ArrowDownLeft className="mr-2 h-5 w-5" />
                Withdraw
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Funding Modal */}
      <FundingModal
        open={fundingDialogOpen}
        onOpenChange={setFundingDialogOpen}
      />
      {/* Withdrawal Modal */}
      <WithdrawalModal
        open={withdrawalDialogOpen}
        onOpenChange={setWithdrawalDialogOpen}
      />
    </>
  );
}
