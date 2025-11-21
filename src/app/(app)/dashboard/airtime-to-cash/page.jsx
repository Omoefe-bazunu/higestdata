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
  Smartphone,
  ArrowRightLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const NETWORKS = [
  {
    id: "mtn",
    name: "MTN",
    transferCode: "*600*recipient number*amount*pin#",
    changePinCode: "*600*default pin*new pin*new pin#",
  },
  {
    id: "airtel",
    name: "Airtel",
    transferCode: "Dial *432*1*amount*phone*pin#",
    changePinCode: "Contact customer care",
  },
  {
    id: "glo",
    name: "Glo",
    transferCode: "*131*recipient number*amount*pin#",
    changePinCode: "*132*default pin*new pin*new pin#",
    maxAmount: 1000,
  },
  {
    id: "9mobile",
    name: "9mobile",
    transferCode: "*223*pin*amount*number#",
    changePinCode: "*247*default pin*new pin#",
  },
];

function AirtimeToCashForm({ user, router }) {
  const [network, setNetwork] = useState("");
  const [sender, setSender] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [serviceData, setServiceData] = useState(null);
  const [conversionRates, setConversionRates] = useState({});
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const { toast } = useToast();

  const isAuthenticated = !!user;

  useEffect(() => {
    if (user) {
      fetchConversionRates();
      const unsubscribe = fetchTransactionHistory();
      return () => unsubscribe && unsubscribe();
    }
  }, [user]);

  // Timer countdown effect
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setShowInstructions(false);
            setCurrentTransaction(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const fetchConversionRates = async () => {
    try {
      const response = await fetch(
        "https://higestdata-proxy.onrender.com/api/airtime-cash/rates"
      );
      const result = await response.json();
      if (result.success) {
        setConversionRates(result.data || {});
      }
    } catch (error) {
      console.error("Error fetching conversion rates:", error);
    }
  };

  const fetchTransactionHistory = () => {
    try {
      const transactionsRef = collection(
        firestore,
        "users",
        user.uid,
        "transactions"
      );
      return onSnapshot(transactionsRef, (snapshot) => {
        const transactions = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((txn) => txn.type === "airtime_cash")
          .sort(
            (a, b) =>
              (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)
          );
        setTransactionHistory(transactions);
      });
    } catch (error) {
      console.error("Error fetching transaction history:", error);
    }
  };

  const verifyServiceAvailability = async () => {
    if (!network) return;
    setIsVerifying(true);
    setServiceData(null);

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
        setServiceData(result.data);
        toast({
          title: "Service Available",
          description: `${network.toUpperCase()} airtime to cash service is available`,
        });
      } else {
        setServiceData(null);
        toast({
          title: "Service Unavailable",
          description: result.error || "Service not available for this network",
          variant: "destructive",
        });
      }
    } catch (error) {
      setServiceData(null);
      toast({
        title: "Verification Failed",
        description: "Unable to verify service availability",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const getNetworkConfig = () => {
    return NETWORKS.find((n) => n.id === network);
  };

  const getConversionRate = () => {
    return conversionRates[network]?.rate || 0.7;
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isSubmitDisabled = () => {
    const amt = parseFloat(amount) || 0;
    const networkConfig = getNetworkConfig();
    const maxAmount = networkConfig?.maxAmount || 10000;

    return (
      !isAuthenticated ||
      !network ||
      !sender ||
      !senderNumber ||
      !amt ||
      amt < 100 ||
      amt > maxAmount ||
      !serviceData ||
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
    const networkConfig = getNetworkConfig();
    const maxAmount = networkConfig?.maxAmount || 10000;

    if (!amt || amt < 100 || amt > maxAmount) {
      toast({
        title: "Invalid Amount",
        description: `Please enter an amount between ₦100 and ₦${maxAmount.toLocaleString()}.`,
        variant: "destructive",
      });
      return;
    }

    if (!serviceData) {
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
      const ref = `A2C_${currentUser.uid}_${Date.now()}`;

      const transactionPayload = {
        network,
        sender,
        sendernumber: senderNumber,
        amount: amt,
        ref,
        sitephone: serviceData.phoneNumber, // Use phone from verification
      };

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
        setCurrentTransaction({
          reference: result.data.reference,
          amount: amt,
          network: network.toUpperCase(),
          phoneNumber: serviceData.phoneNumber,
          expectedCredit: result.data.expectedCredit,
        });
        setShowInstructions(true);
        setTimeRemaining(30 * 60); // 30 minutes

        toast({
          title: "Request Submitted!",
          description: "Please transfer airtime within 30 minutes",
        });

        // Don't reset form yet - keep it visible with instructions
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

  const resetForm = () => {
    setNetwork("");
    setSender("");
    setSenderNumber("");
    setAmount("");
    setServiceData(null);
    setShowInstructions(false);
    setCurrentTransaction(null);
    setTimeRemaining(0);
  };

  return (
    <>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {!showInstructions ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5" />
                  Convert Airtime to Cash
                </CardTitle>
                <CardDescription>
                  Convert your airtime to cash instantly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="px-4 bg-red-600 text-white">
                  <AlertTitle>Important Notes</AlertTitle>
                  <AlertDescription className="text-xs space-y-1">
                    <p>1. Minimum: ₦100 | Maximum: ₦10,000 (Glo: ₦1,000)</p>
                    <p>2. Transfer airtime within 30 minutes</p>
                    <p>
                      3. Transfer airtime to the number provided before filling
                      and submitting the form
                    </p>
                    <p>
                      4. Only airtime transfers accepted (no recharge cards)
                    </p>
                    <p>5. Ensure you have transfer PIN set up</p>
                  </AlertDescription>
                </Alert>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="network">Select Network *</Label>
                    <div className="flex gap-2">
                      <Select
                        value={network}
                        onValueChange={(value) => {
                          setNetwork(value);
                          setServiceData(null);
                        }}
                        required
                      >
                        <SelectTrigger id="network">
                          <SelectValue placeholder="Choose your network" />
                        </SelectTrigger>
                        <SelectContent>
                          {NETWORKS.map((net) => (
                            <SelectItem key={net.id} value={net.id}>
                              {net.name}
                              {net.maxAmount && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  (Max: ₦{net.maxAmount})
                                </span>
                              )}
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
                          "Verify"
                        )}
                      </Button>
                    </div>
                    {serviceData && (
                      <Alert className="mt-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-600">
                          Service Available
                        </AlertTitle>
                        <AlertDescription className="text-xs">
                          Transfer to:{" "}
                          <strong>{serviceData.phoneNumber}</strong>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sender">Your Full Name *</Label>
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
                      placeholder="Phone number sending airtime"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Number you'll transfer airtime from
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount to Convert (₦) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      min="100"
                      max={getNetworkConfig()?.maxAmount || 10000}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Min: ₦100 | Max: ₦
                      {(
                        getNetworkConfig()?.maxAmount || 10000
                      ).toLocaleString()}
                    </p>
                  </div>

                  {amount && parseFloat(amount) >= 100 && (
                    <Card className="bg-muted">
                      <CardContent className="pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Airtime to Send:</span>
                          <span className="font-semibold">
                            ₦{parseFloat(amount).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Conversion Rate:</span>
                          <Badge variant="outline">
                            {(getConversionRate() * 100).toFixed(0)}%
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm text-red-600">
                          <span>Service Fee:</span>
                          <span>-₦{getServiceFee().toLocaleString()}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-base">
                          <span>You Receive:</span>
                          <span className="text-green-600">
                            ₦{getAmountToReceive().toLocaleString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
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
                      "Proceed to Convert"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <Clock className="h-5 w-5" />
                  Transfer Airtime Now
                </CardTitle>
                <CardDescription>
                  Time remaining:{" "}
                  <strong className="text-lg">
                    {formatTime(timeRemaining)}
                  </strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Action Required</AlertTitle>
                  <AlertDescription>
                    Transfer <strong>₦{currentTransaction?.amount}</strong>{" "}
                    airtime to{" "}
                    <strong>{currentTransaction?.phoneNumber}</strong> within 30
                    minutes
                  </AlertDescription>
                </Alert>

                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      {currentTransaction?.network} Transfer Instructions
                    </h4>
                    <div className="text-sm space-y-2">
                      <p>
                        1. Dial:{" "}
                        <code className="bg-white px-2 py-1 rounded">
                          {getNetworkConfig()?.transferCode}
                        </code>
                      </p>
                      <p>
                        2. Enter recipient:{" "}
                        <strong>{currentTransaction?.phoneNumber}</strong>
                      </p>
                      <p>
                        3. Enter amount:{" "}
                        <strong>₦{currentTransaction?.amount}</strong>
                      </p>
                      <p>4. Enter your transfer PIN</p>
                      <p>5. Confirm the transfer</p>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Expected Credit:</strong> ₦
                    {currentTransaction?.expectedCredit?.toLocaleString()}
                  </p>
                  <p>
                    <strong>Reference:</strong> {currentTransaction?.reference}
                  </p>
                </div>

                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Do not close this page. Your wallet will be credited
                    automatically once we receive the airtime.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="w-full"
                >
                  Cancel & Start New Conversion
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Transfer Instructions Card */}
          <Card>
            <CardHeader>
              <CardTitle>How to Transfer Airtime</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {NETWORKS.map((net) => (
                <div key={net.id} className="p-3 border rounded-lg space-y-1">
                  <h4 className="font-semibold">{net.name}</h4>
                  <p className="text-xs">
                    <strong>Transfer:</strong> {net.transferCode}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Change PIN:</strong> {net.changePinCode}
                  </p>
                  {net.maxAmount && (
                    <Badge variant="secondary" className="text-xs">
                      Max: ₦{net.maxAmount}
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Rates</CardTitle>
              <CardDescription>Current rates by network</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {NETWORKS.map((net) => {
                  const rate = conversionRates[net.id];
                  return (
                    <div
                      key={net.id}
                      className="flex justify-between items-center p-3 border rounded-lg"
                    >
                      <div>
                        <span className="font-medium">{net.name}</span>
                        <p className="text-xs text-muted-foreground">
                          {rate?.charge || 30}% charge
                        </p>
                      </div>
                      <Badge variant={rate?.enabled ? "success" : "secondary"}>
                        {((rate?.rate || 0.7) * 100).toFixed(0)}% to you
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Conversions</CardTitle>
              <CardDescription>Your transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              {transactionHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No conversions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactionHistory.slice(0, 10).map((txn) => (
                    <div
                      key={txn.id}
                      className="flex items-start justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {txn.network?.toUpperCase()}
                          </span>
                          <Badge
                            variant={
                              txn.status === "completed"
                                ? "success"
                                : txn.status === "processing"
                                ? "secondary"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {txn.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Sent: ₦{txn.amount?.toLocaleString()} → Received:{" "}
                          {txn.creditAmount
                            ? `₦${txn.creditAmount.toLocaleString()}`
                            : "Pending"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {txn.createdAt?.toDate()?.toLocaleString()}
                        </p>
                      </div>
                      {txn.status === "completed" && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                      {txn.status === "failed" && (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  ))}
                </div>
              )}
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
          Convert your airtime to cash instantly and get credited to your wallet
        </p>
      </div>

      <AirtimeToCashForm user={user} router={router} />
    </div>
  );
}
