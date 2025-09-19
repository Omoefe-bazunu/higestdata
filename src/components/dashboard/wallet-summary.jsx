"use client";

import { useEffect, useState } from "react";
import { getWalletBalance } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import {
  createVirtualAccount,
  initiateWithdrawal,
  getNigerianBanks,
  getWalletTransactions,
} from "@/lib/flutterwaveWalletService";
import { doc, getDoc } from "firebase/firestore";
import { firestore as db } from "@/lib/firebaseConfig";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner"; // or your preferred toast library

export default function WalletSummary() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fundingLoading, setFundingLoading] = useState(false);
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [banks, setBanks] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Virtual account details
  const [virtualAccount, setVirtualAccount] = useState(null);
  const [copied, setCopied] = useState(false);

  // Withdrawal form state
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: "",
    bankCode: "",
    accountNumber: "",
    accountName: "",
  });

  // Dialog states
  const [fundingDialogOpen, setFundingDialogOpen] = useState(false);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);

  // Fetch wallet balance and user data
  useEffect(() => {
    if (!user) return;

    async function fetchWalletData() {
      try {
        const amount = await getWalletBalance(user.uid);
        setBalance(amount);

        // Get user's virtual account if exists
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().virtualAccount) {
          setVirtualAccount(userDoc.data().virtualAccount);
        }

        // Fetch recent transactions
        const userTransactions = await getWalletTransactions(user.uid, 10);
        setTransactions(userTransactions);
      } catch (err) {
        console.error("Failed to fetch wallet data:", err);
        toast.error("Failed to load wallet data");
      } finally {
        setLoading(false);
      }
    }

    fetchWalletData();
  }, [user]);

  // Fetch Nigerian banks when withdrawal dialog opens
  useEffect(() => {
    if (withdrawalDialogOpen && banks.length === 0) {
      async function fetchBanks() {
        try {
          const bankList = await getNigerianBanks();
          setBanks(bankList);
        } catch (error) {
          console.error("Error fetching banks:", error);
          toast.error("Failed to load banks");
        }
      }
      fetchBanks();
    }
  }, [withdrawalDialogOpen, banks.length]);

  // Handle creating virtual account for funding
  const handleCreateVirtualAccount = async () => {
    if (!user) return;

    setFundingLoading(true);
    try {
      // You'll need to collect user's BVN in your user profile
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      if (!userData.bvn) {
        toast.error(
          "BVN is required to create virtual account. Please update your profile."
        );
        return;
      }

      const account = await createVirtualAccount(user.uid, {
        ...userData,
        uid: user.uid,
        firstName:
          userData.firstName || user.displayName?.split(" ")[0] || "User",
        lastName:
          userData.lastName || user.displayName?.split(" ")[1] || "Customer",
        email: user.email,
      });

      setVirtualAccount(account);
      toast.success("Virtual account created successfully!");
    } catch (error) {
      console.error("Error creating virtual account:", error);
      toast.error(error.message || "Failed to create virtual account");
    } finally {
      setFundingLoading(false);
    }
  };

  // Handle withdrawal
  const handleWithdrawal = async (e) => {
    e.preventDefault();

    if (!user) return;

    const amount = parseFloat(withdrawalForm.amount);

    if (amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount > balance) {
      toast.error("Insufficient wallet balance");
      return;
    }

    if (!withdrawalForm.bankCode || !withdrawalForm.accountNumber) {
      toast.error("Please fill in all required fields");
      return;
    }

    setWithdrawalLoading(true);
    try {
      await initiateWithdrawal(user.uid, amount, {
        bankCode: withdrawalForm.bankCode,
        accountNumber: withdrawalForm.accountNumber,
        accountName: withdrawalForm.accountName,
      });

      // Update local balance immediately
      setBalance((prev) => prev - amount);

      // Reset form
      setWithdrawalForm({
        amount: "",
        bankCode: "",
        accountNumber: "",
        accountName: "",
      });

      setWithdrawalDialogOpen(false);
      toast.success(
        "Withdrawal initiated successfully! Funds will be sent to your account shortly."
      );
    } catch (error) {
      console.error("Error initiating withdrawal:", error);
      toast.error(error.message || "Failed to initiate withdrawal");
    } finally {
      setWithdrawalLoading(false);
    }
  };

  // Copy account number to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Account number copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

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
            {/* Fund Wallet Dialog */}
            <Dialog
              open={fundingDialogOpen}
              onOpenChange={setFundingDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground w-full"
                >
                  <ArrowUpRight className="mr-2 h-5 w-5" />
                  Fund Wallet
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Fund Your Wallet</DialogTitle>
                </DialogHeader>

                {virtualAccount ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Transfer Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Bank:</span>
                          <span className="font-medium">
                            {virtualAccount.account_bank_name}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Account Number:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {virtualAccount.account_number}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(virtualAccount.account_number)
                              }
                            >
                              {copied ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span>Account Name:</span>
                          <span className="font-medium">
                            {virtualAccount.note?.replace(
                              "Please make a bank transfer to ",
                              ""
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p>• Transfer any amount to this account</p>
                      <p>• Your wallet will be credited automatically</p>
                      <p>• This account is permanent and reusable</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <p>
                      Create a dedicated account number to fund your wallet
                      easily
                    </p>
                    <Button
                      onClick={handleCreateVirtualAccount}
                      disabled={fundingLoading}
                      className="w-full"
                    >
                      {fundingLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Virtual Account
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Withdraw Dialog */}
            <Dialog
              open={withdrawalDialogOpen}
              onOpenChange={setWithdrawalDialogOpen}
            >
              <DialogTrigger asChild>
                <Button size="lg" variant="outline" className="w-full">
                  <ArrowDownLeft className="mr-2 h-5 w-5" />
                  Withdraw
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Withdraw to Bank Account</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleWithdrawal} className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Amount (₦)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="100"
                      max={balance}
                      value={withdrawalForm.amount}
                      onChange={(e) =>
                        setWithdrawalForm((prev) => ({
                          ...prev,
                          amount: e.target.value,
                        }))
                      }
                      placeholder="Enter amount"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Available: ₦{balance.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="bank">Select Bank</Label>
                    <Select
                      value={withdrawalForm.bankCode}
                      onValueChange={(value) =>
                        setWithdrawalForm((prev) => ({
                          ...prev,
                          bankCode: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose your bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {banks.map((bank) => (
                          <SelectItem key={bank.code} value={bank.code}>
                            {bank.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      type="text"
                      value={withdrawalForm.accountNumber}
                      onChange={(e) =>
                        setWithdrawalForm((prev) => ({
                          ...prev,
                          accountNumber: e.target.value,
                        }))
                      }
                      placeholder="Enter account number"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="accountName">Account Name</Label>
                    <Input
                      id="accountName"
                      type="text"
                      value={withdrawalForm.accountName}
                      onChange={(e) =>
                        setWithdrawalForm((prev) => ({
                          ...prev,
                          accountName: e.target.value,
                        }))
                      }
                      placeholder="Enter account name"
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setWithdrawalDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={withdrawalLoading}
                      className="flex-1"
                    >
                      {withdrawalLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Withdraw
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Recent Transactions */}
          {transactions.length > 0 && (
            <div className="w-full mt-6">
              <h3 className="text-lg font-semibold mb-3">
                Recent Transactions
              </h3>
              <div className="space-y-2">
                {transactions.slice(0, 5).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {transaction.type === "funding" ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDownLeft className="h-4 w-4 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium capitalize">
                          {transaction.type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.createdAt
                            ?.toDate?.()
                            ?.toLocaleDateString() || "Recent"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          transaction.type === "funding"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "funding" ? "+" : "-"}₦
                        {transaction.amount.toLocaleString()}
                      </p>
                      <p
                        className={`text-xs capitalize ${
                          transaction.status === "completed"
                            ? "text-green-600"
                            : transaction.status === "pending"
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
