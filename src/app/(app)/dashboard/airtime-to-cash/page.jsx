"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { doc, getDoc, onSnapshot, collection } from "firebase/firestore";
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
import {
  Loader,
  AlertTriangle,
  Wallet,
  Smartphone,
  ArrowRightLeft,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const NETWORKS = [
  { id: "mtn", name: "MTN" },
  { id: "airtel", name: "Airtel" },
  { id: "glo", name: "Glo" },
  { id: "9mobile", name: "9mobile" },
];

function AirtimeToCashForm({ user, router }) {
  const [network, setNetwork] = useState("");
  const [sender, setSender] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [sitePhone, setSitePhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [serviceAvailable, setServiceAvailable] = useState(false);
  const [conversionRates, setConversionRates] = useState({});
  const [transactionHistory, setTransactionHistory] = useState([]);
  const { toast } = useToast();

  const isAuthenticated = !!user;

  useEffect(() => {
    if (user) {
      fetchConversionRates();
      fetchTransactionHistory();
    }
  }, [user]);

  const fetchConversionRates = async () => {
    try {
      const ratesDoc = await getDoc(
        doc(firestore, "settings", "airtimeToCashRates")
      );
      if (ratesDoc.exists()) {
        setConversionRates(ratesDoc.data() || {});
      }
    } catch (error) {
      console.error("Error fetching conversion rates:", error);
    }
  };

  const fetchTransactionHistory = async () => {
    try {
      const transactionsRef = collection(
        firestore,
        "users",
        user.uid,
        "transactions"
      );
      const unsubscribe = onSnapshot(transactionsRef, (snapshot) => {
        const transactions = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((txn) => txn.type === "airtime_cash")
          .sort(
            (a, b) =>
              new Date(b.createdAt?.toDate()) - new Date(a.createdAt?.toDate())
          );
        setTransactionHistory(transactions);
      });
      return unsubscribe;
    } catch (error) {
      console.error("Error fetching transaction history:", error);
    }
  };

  const verifyServiceAvailability = async () => {
    if (!network) return;
    setIsVerifying(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User not authenticated");

      const token = await currentUser.getIdToken(true);

      const response = await fetch(
        "https://higestdata-proxy.onrender.com/api/airtime-cash/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ network }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setServiceAvailable(true);
        toast({
          title: "Service Available",
          description: `${network.toUpperCase()} airtime to cash service is available`,
        });
      } else {
        setServiceAvailable(false);
        toast({
          title: "Service Unavailable",
          description: result.error || "Service not available for this network",
          variant: "destructive",
        });
      }
    } catch (error) {
      setServiceAvailable(false);
      toast({
        title: "Verification Failed",
        description: "Unable to verify service availability",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const getConversionRate = () => {
    return conversionRates[network]?.rate || 0.7; // Default 70% if not set
  };

  const getAmountToReceive = () => {
    const amt = parseFloat(amount) || 0;
    const rate = getConversionRate();
    return amt * rate;
  };

  const getServiceFee = () => {
    const amt = parseFloat(amount) || 0;
    const rate = getConversionRate();
    return amt * (1 - rate);
  };

  const isSubmitDisabled = () => {
    const amt = parseFloat(amount) || 0;
    return (
      !isAuthenticated ||
      !network ||
      !sender ||
      !senderNumber ||
      !amt ||
      amt < 100 ||
      amt > 10000 ||
      !serviceAvailable ||
      isSubmitting ||
      isVerifying
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue.",
        variant: "destructive",
      });
      return;
    }

    const amt = parseFloat(amount);
    if (!amt || amt < 100 || amt > 10000) {
      toast({
        title: "Invalid Amount",
        description: "Please enter an amount between ₦100 and ₦10,000.",
        variant: "destructive",
      });
      return;
    }

    if (!serviceAvailable) {
      toast({
        title: "Service Unavailable",
        description:
          "Please verify service availability for this network first.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User not authenticated");

      const token = await currentUser.getIdToken(true);
      const ref = `AIR2CASH_${currentUser.uid}_${Date.now()}`;

      const transactionPayload = {
        network,
        sender,
        sendernumber: senderNumber,
        amount: amt,
        ref,
        webhookURL: "https://higestdata-proxy.onrender.com/webhook/vtu",
      };

      if (sitePhone) transactionPayload.sitephone = sitePhone;

      const response = await fetch(
        "https://higestdata-proxy.onrender.com/api/airtime-cash/convert",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(transactionPayload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Conversion failed");
      }

      if (result.success) {
        toast({
          title: "Conversion Request Received!",
          description: `Your ${network.toUpperCase()} airtime conversion request has been submitted. You will receive ₦${getAmountToReceive().toLocaleString()} once processed.`,
        });

        // Reset form
        setNetwork("");
        setSender("");
        setSenderNumber("");
        setAmount("");
        setSitePhone("");
        setServiceAvailable(false);

        // Refresh transaction history
        fetchTransactionHistory();
      } else {
        throw new Error(result.error || "Conversion failed");
      }
    } catch (error) {
      console.error("Conversion error:", error);
      toast({
        title: "Conversion Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" />
                Convert Airtime to Cash
              </CardTitle>
              <CardDescription>
                Convert your airtime to cash instantly. Send airtime and receive
                cash in return.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Smartphone className="h-4 w-4" />
                <AlertTitle>How it works</AlertTitle>
                <AlertDescription>
                  Send airtime from your phone and receive cash equivalent.
                  You'll be credited once the transaction is verified.
                </AlertDescription>
              </Alert>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="network">Network *</Label>
                  <div className="flex gap-2">
                    <Select
                      value={network}
                      onValueChange={(value) => {
                        setNetwork(value);
                        setServiceAvailable(false);
                      }}
                      required
                    >
                      <SelectTrigger id="network">
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                      <SelectContent>
                        {NETWORKS.map((net) => (
                          <SelectItem key={net.id} value={net.id}>
                            {net.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={verifyServiceAvailability}
                      disabled={!network || isVerifying}
                      variant="outline"
                    >
                      {isVerifying ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        "Check"
                      )}
                    </Button>
                  </div>
                  {serviceAvailable && (
                    <Badge variant="success" className="mt-1">
                      ✓ Service Available
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sender">Your Name *</Label>
                  <Input
                    id="sender"
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senderNumber">Your Phone Number *</Label>
                  <Input
                    id="senderNumber"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Airtime Amount (₦) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount to convert"
                    min="100"
                    max="10000"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum: ₦100, Maximum: ₦10,000
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sitePhone">
                    Destination Number (Optional)
                  </Label>
                  <Input
                    id="sitePhone"
                    value={sitePhone}
                    onChange={(e) => setSitePhone(e.target.value)}
                    placeholder="Leave empty to use default"
                  />
                  <p className="text-xs text-muted-foreground">
                    Specific number to send airtime to (optional)
                  </p>
                </div>

                {amount && parseFloat(amount) >= 100 && (
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Airtime to Send:</span>
                      <span className="font-medium">
                        ₦{parseFloat(amount).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Conversion Rate:</span>
                      <span className="font-medium">
                        {(getConversionRate() * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Service Fee:</span>
                      <span className="font-medium">
                        ₦{getServiceFee().toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold">
                        <span>You Receive:</span>
                        <span className="text-lg text-green-600">
                          ₦{getAmountToReceive().toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitDisabled()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Convert Airtime to Cash"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Conversions</CardTitle>
              <CardDescription>
                Your recent airtime to cash transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactionHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No conversion history yet
                </div>
              ) : (
                <div className="space-y-3">
                  {transactionHistory.slice(0, 5).map((txn) => (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {txn.network?.toUpperCase()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {txn.amount} → ₦{txn.creditAmount || "Pending"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {txn.createdAt?.toDate().toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          txn.status === "completed"
                            ? "success"
                            : txn.status === "processing"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {txn.status || "processing"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversion Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {NETWORKS.map((net) => (
                  <div
                    key={net.id}
                    className="flex justify-between items-center p-2 border rounded"
                  >
                    <span className="font-medium">{net.name}</span>
                    <Badge variant="outline">
                      {((conversionRates[net.id]?.rate || 0.7) * 100).toFixed(
                        0
                      )}
                      %
                    </Badge>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Rates are subject to change. Actual amount received may vary
                based on network conditions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

export default function AirtimeToCashPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsub = auth.onAuthStateChanged((usr) => {
      if (usr) {
        setUser(usr);
        setAuthChecked(true);
      } else {
        router.replace("/login");
      }
    });
    return () => unsub();
  }, [router]);

  if (!authChecked) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 mt-4">
      <div>
        <h1 className="text-3xl font-bold font-headline">Airtime to Cash</h1>
        <p className="text-muted-foreground">
          Convert your airtime to cash instantly. Send airtime, receive money.
        </p>
      </div>

      <AirtimeToCashForm user={user} router={router} />
    </div>
  );
}
