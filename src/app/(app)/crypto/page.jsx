"use client";

import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRightLeft, Copy, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { getCryptoRates, getCryptoWallets, getExchangeRate } from "@/lib/data";

// --- CryptoTradeForm Component ---
function CryptoTradeForm({ type, cryptoRates, wallets, exchangeRate }) {
  const [amount, setAmount] = useState("");
  const [crypto, setCrypto] = useState(""); // State for selected crypto symbol
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const { toast } = useToast();

  // Check authentication status
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  // Initialize crypto state only once after initial render or when cryptoRates/wallets change.
  // Crucially, 'crypto' is NOT a dependency here to prevent infinite loops.
  useEffect(() => {
    if (
      cryptoRates &&
      cryptoRates.length > 0 &&
      !crypto &&
      Object.keys(wallets).length > 0
    ) {
      // Only set if 'crypto' is not already set
      // Set initial crypto to the first one that has a wallet address
      const initialCrypto = cryptoRates.find((coin) => wallets?.[coin.id]);
      setCrypto(initialCrypto ? initialCrypto.symbol : cryptoRates[0]?.symbol);
    }
  }, [cryptoRates, wallets]); // Remove 'crypto' from dependencies

  // Get selected crypto object by symbol
  const selectedCrypto = cryptoRates?.find((c) => c.symbol === crypto);
  const usdRate = selectedCrypto?.finalPrice || 0;
  const ngnRate = usdRate * (exchangeRate || 1);

  // Conversion logic
  let calculatedValue;
  if (type === "Buy") {
    calculatedValue = amount
      ? (parseFloat(amount) / ngnRate).toFixed(8)
      : "0.00";
  } else {
    calculatedValue = amount
      ? (parseFloat(amount) * ngnRate).toFixed(2)
      : "0.00";
  }

  // Handle submission feedback
  useEffect(() => {
    if (formState.message) {
      toast({
        title: formState.errors ? "Submission Failed" : "Submission Received",
        description: formState.message,
        variant: formState.errors ? "destructive" : "default",
      });
      if (!formState.errors) {
        // Clear form on success
        setAmount("");
      }
    }
  }, [formState, toast]);

  const handleCopy = (address) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Copied to clipboard!",
      description: "Wallet address has been copied.",
    });
  };

  // Send email notification function (assuming this is correctly implemented)
  const sendAdminNotification = async (orderData) => {
    // ... (your existing sendAdminNotification implementation)
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderType: type,
          crypto: orderData.crypto,
          amount: orderData.amount,
          calculatedValue: orderData.calculatedValue,
          walletAddress: orderData.walletAddress,
          sendingWalletAddress: orderData.sendingWalletAddress,
          userId: orderData.userId,
          adminEmails: process.env.NEXT_PUBLIC_ADMINEMAIL,
        }),
      });

      if (!response.ok) {
        console.error("Failed to send admin notification");
      } else {
        console.log("Admin notification sent successfully");
      }
    } catch (error) {
      console.error("Error sending admin notification:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to trade cryptocurrency.",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setFormState({
        message: "Please enter a valid amount.",
        errors: { amount: ["Valid amount is required"] },
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData(e.target);
      const walletAddress = formData.get("walletAddress");
      const sendingWalletAddress = formData.get("sendingWalletAddress");
      const proof = formData.get("proof");

      const orderData = {
        userId: user.uid,
        type: type.toLowerCase(),
        crypto: crypto, // This is now the symbol
        cryptoName: selectedCrypto?.name || crypto,
        amount: parseFloat(amount),
        rate: usdRate,
        calculatedValue: calculatedValue,
        walletAddress: walletAddress, // For 'Buy' type
        sendingWalletAddress: sendingWalletAddress, // For 'Sell' type
        proof: proof ? proof.name : null, // For 'Sell' type
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      // Save to Firestore - cryptoOrders collection
      const docRef = await addDoc(
        collection(firestore, "cryptoOrders"),
        orderData
      );
      console.log("Crypto order saved with ID:", docRef.id);

      // Create transaction record in user's subcollection
      const transactionType = type === "Buy" ? "debit" : "credit";
      const transactionDescription = `${
        selectedCrypto?.name || crypto
      } ${type.toLowerCase()}-order`;

      const transactionAmount =
        type === "Buy" ? parseFloat(amount) : parseFloat(amount) * ngnRate;

      const transactionData = {
        userId: user.uid,
        description: transactionDescription,
        amount: transactionAmount,
        type: transactionType,
        status: "Pending",
        date: new Date().toLocaleDateString(),
        createdAt: new Date().toISOString(),
        relatedOrderId: docRef.id,
        relatedOrderType: "crypto",
      };

      await addDoc(
        collection(firestore, "users", user.uid, "transactions"),
        transactionData
      );
      console.log("Transaction record created");

      // Send admin notification
      try {
        await sendAdminNotification({
          orderId: docRef.id,
          crypto: crypto, // This is now the symbol
          cryptoName: selectedCrypto?.name || crypto,
          amount: parseFloat(amount),
          calculatedValue: calculatedValue,
          walletAddress: walletAddress,
          sendingWalletAddress: sendingWalletAddress,
          userId: user.uid,
        });
      } catch (emailError) {
        console.error("Failed to send admin notification:", emailError);
      }

      setFormState({
        message: `${type} order submitted successfully. Your transaction is being processed.`,
      });
    } catch (err) {
      console.error("Order submission error:", err);
      setFormState({
        message: "Failed to process order.",
        errors: { server: ["An unexpected error occurred: " + err.message] },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {!isAuthenticated && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please sign in to trade cryptocurrency.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="crypto">Cryptocurrency</Label>

        <Select
          name="crypto"
          value={crypto}
          onValueChange={setCrypto}
          disabled={!isAuthenticated}
        >
          <SelectTrigger id="crypto">
            <SelectValue placeholder="Select Crypto" />
          </SelectTrigger>
          <SelectContent>
            {cryptoRates
              ?.filter((coin) => wallets?.[coin.id]) // ✅ use id to filter wallets
              .map(
                (
                  coin // Use coin.symbol for value
                ) => (
                  <SelectItem key={coin.id} value={coin.symbol}>
                    {coin.name} ({coin.symbol})
                  </SelectItem>
                )
              )}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        <div className="space-y-2">
          <Label htmlFor="amount">
            {type === "Buy"
              ? "Amount to Spend (NGN)"
              : `Amount to Sell (${crypto})`}
          </Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            placeholder={type === "Buy" ? "e.g., 50000" : "e.g., 0.5"}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={!isAuthenticated}
            required
            step={type === "Buy" ? "1" : "0.00000001"}
          />
          {formState.errors?.amount && (
            <p className="text-sm text-destructive">
              {formState.errors.amount[0]}
            </p>
          )}
        </div>

        <div className="text-center sm:hidden">
          <ArrowRightLeft className="h-4 w-4 text-muted-foreground mx-auto" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="crypto-value">
            {type === "Buy" ? "You Get (approx.)" : "You Receive (approx.)"}
          </Label>
          <Input
            id="crypto-value"
            readOnly
            value={`${calculatedValue} ${type === "Buy" ? crypto : "NGN"}`}
            className="bg-muted"
          />
        </div>
      </div>

      {type === "Buy" && (
        <div className="space-y-2">
          <Label htmlFor="walletAddress">Your Receiving Wallet Address</Label>
          <Input
            id="walletAddress"
            name="walletAddress"
            type="text"
            placeholder={`Enter your ${crypto} wallet address`}
            disabled={!isAuthenticated}
            required
          />
        </div>
      )}

      {type === "Sell" && (
        <>
          <Card className="bg-muted/50">
            <CardHeader className="p-4">
              <CardDescription>
                Send your {crypto} to the address below. Your account will be
                credited after confirmation.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-center justify-between gap-2 p-3 rounded-md border bg-background">
                <code className="text-sm truncate">
                  {wallets?.[selectedCrypto?.id] || "Wallet not set"}{" "}
                  {/* Access wallet using selectedCrypto.id */}
                </code>
                {wallets?.[selectedCrypto?.id] && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(wallets[selectedCrypto.id])}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          <div className="space-y-2">
            <Label htmlFor="sendingWalletAddress">
              Your Sending Wallet Address
            </Label>
            <Input
              id="sendingWalletAddress"
              name="sendingWalletAddress"
              type="text"
              placeholder={`The ${crypto} address you sent from`}
              disabled={!isAuthenticated}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proof">Upload Screenshot Proof</Label>
            <Input
              id="proof"
              name="proof"
              type="file"
              className="pt-2"
              disabled={!isAuthenticated}
            />
          </div>
        </>
      )}

      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Current Rate</span>
            <span className="font-semibold text-primary">
              1 {crypto} ≈ ₦{ngnRate ? ngnRate.toLocaleString() : "0"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        className="w-full"
        disabled={
          !isAuthenticated || isSubmitting || !amount || parseFloat(amount) <= 0
        }
      >
        {isSubmitting ? (
          <>
            <Loader className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `${type} Crypto`
        )}
      </Button>

      {formState.message && (
        <Alert variant={formState.errors ? "destructive" : "default"}>
          {formState.errors ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {formState.errors ? "Submission Failed" : "Order Received"}
          </AlertTitle>
          <AlertDescription>{formState.message}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}

// --- CryptoPage Component ---
export default function CryptoPage() {
  const [data, setData] = useState({
    cryptoRates: [],
    wallets: {},
    exchangeRate: 1,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); // Ensure loading is true at the start of fetch
        const [rates, walletsData, exchangeRateData] = await Promise.all([
          getCryptoRates(),
          getCryptoWallets(),
          getExchangeRate(),
        ]);
        setData({
          cryptoRates: rates,
          wallets: walletsData,
          exchangeRate: exchangeRateData,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load crypto data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]); // `toast` is stable and unlikely to change, but good practice to include if used

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-headline">
          Trade Cryptocurrency
        </h1>
        <p className="text-muted-foreground">
          Instantly buy and sell top cryptocurrencies at the best rates.
        </p>
      </div>

      <Card>
        <Tabs defaultValue="buy" className="w-full">
          <CardHeader>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy">Buy</TabsTrigger>
              <TabsTrigger value="sell">Sell</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="buy">
              <CardTitle className="mb-2 text-2xl">Buy Crypto</CardTitle>
              <CardDescription className="mb-6">
                Select a currency and enter the amount you wish to purchase.
              </CardDescription>
              <CryptoTradeForm
                type="Buy"
                cryptoRates={data.cryptoRates}
                wallets={data.wallets}
                exchangeRate={data.exchangeRate}
              />
            </TabsContent>
            <TabsContent value="sell">
              <CardTitle className="mb-2 text-2xl">Sell Crypto</CardTitle>
              <CardDescription className="mb-6">
                Your wallet will be credited instantly upon confirmation.
              </CardDescription>
              <CryptoTradeForm
                type="Sell"
                cryptoRates={data.cryptoRates}
                wallets={data.wallets}
                exchangeRate={data.exchangeRate}
              />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
