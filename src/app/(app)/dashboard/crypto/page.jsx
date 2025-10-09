"use client";

import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { collection, addDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firestore, storage } from "@/lib/firebaseConfig";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowRightLeft,
  Copy,
  Loader,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getCryptoRates, getCryptoWallets, getWalletBalance } from "@/lib/data";
import { useRouter } from "next/navigation";

// Function to fetch live crypto price from CoinGecko
const fetchLiveCryptoPrice = async (coinId) => {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
    );
    const data = await response.json();
    return data[coinId]?.usd || 0;
  } catch (error) {
    console.error("Error fetching live price:", error);
    return 0;
  }
};

// Function to fetch the live USD to NGN exchange rate from the internal API route
const fetchExchangeRate = async () => {
  try {
    const response = await fetch("/api/exchangeRate");
    if (!response.ok) {
      throw new Error("Failed to fetch exchange rate from internal API");
    }
    const data = await response.json();
    return data.rate || 1;
  } catch (error) {
    console.error("Error fetching exchange rate from API route:", error);
    return 1;
  }
};

// --- CryptoTradeForm Component ---
function CryptoTradeForm({ type, cryptoRates, wallets, exchangeRate }) {
  const [amount, setAmount] = useState("");
  const [crypto, setCrypto] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [userBalance, setUserBalance] = useState(0);
  const [livePrice, setLivePrice] = useState(0);
  const [showInsufficientFundsModal, setShowInsufficientFundsModal] =
    useState(false);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      setIsAuthenticated(!!user);
      if (user) {
        const balance = await getWalletBalance(user.uid);
        setUserBalance(balance);
      }
    });
    return () => unsubscribe();
  }, []);

  const availableCryptos = Object.keys(cryptoRates || {})
    .filter((cryptoId) => wallets[cryptoId])
    .map((cryptoId) => {
      const crypto = cryptoRates[cryptoId];
      const marginKey = Object.keys(crypto).find((k) => k.startsWith("margin"));
      return {
        id: cryptoId,
        name: crypto.name,
        symbol: crypto.symbol,
        margin: marginKey ? crypto[marginKey] : 0,
      };
    });

  useEffect(() => {
    if (availableCryptos.length > 0 && !crypto) {
      setCrypto(availableCryptos[0].id);
    }
  }, [availableCryptos, crypto]);

  useEffect(() => {
    if (crypto) {
      const fetchPrice = async () => {
        setLoadingPrice(true);
        const price = await fetchLiveCryptoPrice(crypto);
        setLivePrice(price);
        setLoadingPrice(false);
      };
      fetchPrice();
    }
  }, [crypto]);

  const selectedCrypto = availableCryptos.find((c) => c.id === crypto);
  const adminMargin = selectedCrypto?.margin || 0;

  // Fixed calculation logic
  let finalPriceUSD, finalPriceNGN;

  if (type === "Buy") {
    // For buying: add margin to the live price (user pays more)
    finalPriceUSD = livePrice * (1 + adminMargin / 100);
    finalPriceNGN = finalPriceUSD * exchangeRate;
  } else {
    // For selling: subtract margin from the live price (user gets less)
    finalPriceUSD = livePrice * (1 - adminMargin / 100);
    finalPriceNGN = finalPriceUSD * exchangeRate;
  }

  let totalUSD = 0,
    totalNGN = 0;
  if (amount && parseFloat(amount) > 0) {
    const units = parseFloat(amount);
    totalUSD = units * finalPriceUSD;
    totalNGN = units * finalPriceNGN;
  }

  useEffect(() => {
    if (formState.message) {
      toast({
        title: formState.errors ? "Submission Failed" : "Submission Received",
        description: formState.message,
        variant: formState.errors ? "destructive" : "default",
      });
      if (!formState.errors) {
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

  const sendAdminNotification = async (orderData) => {
    try {
      // Fetch user email from Firestore
      const userDocRef = doc(firestore, "users", orderData.userId);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists() || !userDoc.data().email) {
        console.error("User email not found");
        return;
      }
      const userEmail = userDoc.data().email;

      const response = await fetch("/api/send-crypto-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderData.orderId,
          orderType: type,
          amount: orderData.calculatedValue,
          crypto: orderData.cryptoName,
          walletAddress: orderData.walletAddress,
          sendingWalletAddress: orderData.sendingWalletAddress,
          userEmail,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to send crypto order notification:", errorText);
      }
    } catch (error) {
      console.error("Error sending crypto order notification:", error);
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

    if (type === "Buy" && totalNGN > userBalance) {
      setShowInsufficientFundsModal(true);
      return;
    }

    const formData = new FormData(e.target);
    const walletAddress = formData.get("walletAddress");
    const sendingWalletAddress = formData.get("sendingWalletAddress");
    const proofFile = formData.get("proof");

    if (type === "Sell" && !proofFile) {
      setFormState({
        message: "Proof of transaction is required for sell orders.",
        errors: { proof: ["Proof file is required"] },
      });
      return;
    }

    // Check file size for proof image (max 5MB)
    if (type === "Sell" && proofFile && proofFile.size > 5 * 1024 * 1024) {
      setFormState({
        message: "Proof image must not exceed 5MB.",
        errors: { proof: ["File size must be 5MB or less"] },
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let proofUrl = null;
      let proofFileName = null;

      // Upload proof file to Firebase Storage for sell orders
      if (type === "Sell" && proofFile) {
        const fileExtension = proofFile.name.split(".").pop();
        proofFileName = `${Date.now()}.${fileExtension}`; // Unique file name
        const storagePath = `crypto-orders/${user.uid}/${proofFileName}`;
        const storageRef = ref(storage, storagePath);

        // Upload the file
        await uploadBytes(storageRef, proofFile);
        // Get the download URL
        proofUrl = await getDownloadURL(storageRef);
      }

      const orderData = {
        userId: user.uid,
        type: type.toLowerCase(),
        crypto: crypto,
        cryptoName: selectedCrypto?.name || crypto,
        cryptoSymbol: selectedCrypto?.symbol || crypto,
        amount: parseFloat(amount),
        livePrice: livePrice,
        adminMargin: adminMargin,
        finalPriceUSD: finalPriceUSD,
        finalPriceNGN: finalPriceNGN,
        totalUSD: totalUSD,
        totalNGN: totalNGN,
        walletAddress: walletAddress,
        sendingWalletAddress: sendingWalletAddress,
        proof: proofUrl || null, // Store the download URL
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(
        collection(firestore, "cryptoOrders"),
        orderData
      );

      const transactionType = type === "Buy" ? "debit" : "credit";
      const transactionDescription = `${
        selectedCrypto?.name || crypto
      } ${type.toLowerCase()}-order`;
      const transactionAmount = totalNGN;

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

      if (type === "Buy") {
        const newBalance = userBalance - totalNGN;
        await updateDoc(doc(firestore, "users", user.uid), {
          walletBalance: newBalance,
        });
        setUserBalance(newBalance);
      }

      await sendAdminNotification({
        orderId: docRef.id,
        crypto: crypto,
        cryptoName: selectedCrypto?.name || crypto,
        amount: parseFloat(amount),
        calculatedValue: totalNGN,
        walletAddress: walletAddress,
        sendingWalletAddress: sendingWalletAddress,
        userId: user.uid,
      });

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
    <>
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
              {availableCryptos.map((coin) => (
                <SelectItem key={coin.id} value={coin.id}>
                  {coin.name} ({coin.symbol})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="amount">
              Amount ({selectedCrypto?.symbol || "Crypto"})
            </Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              placeholder="e.g., 0.5"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={!isAuthenticated}
              required
              step="0.00000001"
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
            <Label htmlFor="total-value">
              {type === "Buy" ? "You'll Pay" : "You'll Receive"}
            </Label>
            <div className="space-y-1">
              <Input
                id="total-value"
                readOnly
                value={`$${totalUSD.toFixed(2)} USD`}
                className="bg-muted"
              />
              <Input
                readOnly
                value={`₦${totalNGN.toLocaleString()} NGN`}
                className="bg-muted"
              />
            </div>
          </div>
        </div>

        {type === "Buy" && isAuthenticated && (
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Wallet Balance</span>
                <span
                  className={`font-semibold ${
                    totalNGN > userBalance ? "text-destructive" : "text-primary"
                  }`}
                >
                  ₦{userBalance.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {type === "Buy" && (
          <div className="space-y-2">
            <Label htmlFor="walletAddress">Your Receiving Wallet Address</Label>
            <Input
              id="walletAddress"
              name="walletAddress"
              type="text"
              placeholder={`Enter your ${
                selectedCrypto?.symbol || "crypto"
              } wallet address`}
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
                  Send your {selectedCrypto?.symbol || "crypto"} to the address
                  below. Your account will be credited after confirmation.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center justify-between gap-2 p-3 rounded-md border bg-background">
                  <code className="text-sm truncate">
                    {wallets?.[crypto] || "Wallet not set"}
                  </code>
                  {wallets?.[crypto] && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopy(wallets[crypto])}
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
                placeholder={`The ${
                  selectedCrypto?.symbol || "crypto"
                } address you sent from`}
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
                accept="image/*"
                className="pt-2"
                disabled={!isAuthenticated}
              />
              {formState.errors?.proof && (
                <p className="text-sm text-destructive">
                  {formState.errors.proof[0]}
                </p>
              )}
            </div>
          </>
        )}

        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Live Market Price</span>
                <span className="font-semibold">
                  {loadingPrice ? (
                    <Loader className="h-4 w-4 animate-spin inline" />
                  ) : (
                    `$${livePrice.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center hidden">
                <span className="text-muted-foreground">Admin Margin</span>
                <span className="font-semibold">
                  {type === "Buy"
                    ? adminMargin > 0
                      ? `+${adminMargin}%`
                      : `${adminMargin}%`
                    : adminMargin > 0
                    ? `-${adminMargin}%`
                    : `${adminMargin}%`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  Exchange Rate (USD/NGN)
                </span>
                <span className="font-semibold">
                  ₦{exchangeRate.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-muted-foreground">
                  {type} Price (1 {selectedCrypto?.symbol})
                </span>
                <span className="font-semibold text-primary">
                  ${finalPriceUSD?.toFixed(2)} USD
                  <br />₦{finalPriceNGN?.toLocaleString()} NGN
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full"
          disabled={
            !isAuthenticated ||
            isSubmitting ||
            !amount ||
            parseFloat(amount) <= 0 ||
            loadingPrice
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

      <Dialog
        open={showInsufficientFundsModal}
        onOpenChange={setShowInsufficientFundsModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insufficient Wallet Balance</DialogTitle>
            <DialogDescription>
              Your current wallet balance (₦{userBalance.toLocaleString()}) is
              insufficient to complete this transaction. You need ₦
              {totalNGN.toLocaleString()} to buy {amount}{" "}
              {selectedCrypto?.symbol}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowInsufficientFundsModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => router.push("/wallet")}>Fund Wallet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// --- CryptoPage Component ---
export default function CryptoPage() {
  const [data, setData] = useState({
    cryptoRates: {},
    wallets: {},
    exchangeRate: 1,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [rates, walletsData, exchangeRateData] = await Promise.all([
          getCryptoRates(),
          getCryptoWallets(),
          fetchExchangeRate(),
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
  }, [toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div>
        <h1 className="text-3xl font-bold font-headline">
          Buy and Sell Crypto Assets
        </h1>
        <p className="text-muted-foreground mt-2">
          Buy and Sell cryptocurrencies at the best rates.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-6 w-6" /> Crypto Trading
          </CardTitle>
          <CardDescription>Complete the form to Buy or Sell</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="buy" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy">Buy Crypto</TabsTrigger>
              <TabsTrigger value="sell">Sell Crypto</TabsTrigger>
            </TabsList>
            <TabsContent value="buy">
              <CryptoTradeForm
                type="Buy"
                cryptoRates={data.cryptoRates}
                wallets={data.wallets}
                exchangeRate={data.exchangeRate}
              />
            </TabsContent>
            <TabsContent value="sell">
              <CryptoTradeForm
                type="Sell"
                cryptoRates={data.cryptoRates}
                wallets={data.wallets}
                exchangeRate={data.exchangeRate}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
