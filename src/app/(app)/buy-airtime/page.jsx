"use client";

import { useState, useRef, useEffect } from "react";
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
import Image from "next/image";
import { CheckCircle, Loader, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

// ✅ Reusable form
function PurchaseForm({ type, user }) {
  const [network, setNetwork] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [dataPlan, setDataPlan] = useState("");
  const [provider, setProvider] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState({});
  const { toast } = useToast();

  const isAuthenticated = !!user;

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

    setIsSubmitting(true);

    try {
      // Transaction description + amount mapping
      let description = "";
      let txnAmount = 0;

      if (type === "Airtime") {
        description = `${network} airtime top-up`;
        txnAmount = parseFloat(amount || 0);
      } else if (type === "Data") {
        description = `${network} data purchase (${dataPlan})`;
        txnAmount = dataPlan.includes("1.5GB")
          ? 1000
          : dataPlan.includes("5GB")
          ? 2500
          : dataPlan.includes("12GB")
          ? 5000
          : 0;
      } else if (type === "Cable") {
        description = `${provider} subscription for ${cardNumber}`;
        txnAmount = parseFloat(amount || 0);
      }

      if (!txnAmount || txnAmount <= 0) {
        setFormState({
          errors: { amount: ["Enter a valid amount/plan"] },
          message: "Invalid input",
        });
        return;
      }

      const transactionData = {
        userId: user.uid,
        description,
        amount: txnAmount,
        type: "debit",
        status: "Pending",
        date: new Date().toLocaleDateString(),
        createdAt: new Date().toISOString(),
        relatedSubmissionType: type.toLowerCase(),
      };

      await addDoc(
        collection(firestore, "users", user.uid, "transactions"),
        transactionData
      );

      setFormState({ message: `${type} purchase submitted successfully.` });
      setNetwork("");
      setPhone("");
      setAmount("");
      setDataPlan("");
      setProvider("");
      setCardNumber("");
    } catch (err) {
      console.error("Submission error:", err);
      setFormState({
        errors: { server: [err.message] },
        message: "Failed to process transaction.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {type !== "Cable" && (
        <div className="space-y-2">
          <Label htmlFor="network">Network Provider</Label>
          <Select value={network} onValueChange={setNetwork}>
            <SelectTrigger id="network">
              <SelectValue placeholder="Select Network" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mtn">MTN</SelectItem>
              <SelectItem value="glo">Glo</SelectItem>
              <SelectItem value="airtel">Airtel</SelectItem>
              <SelectItem value="9mobile">9mobile</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {type === "Cable" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="provider">Cable Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger id="provider">
                <SelectValue placeholder="Select Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dstv">DSTV</SelectItem>
                <SelectItem value="gotv">GoTV</SelectItem>
                <SelectItem value="startimes">Startimes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardNumber">Smart Card Number</Label>
            <Input
              id="cardNumber"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="e.g., 1234567890"
            />
          </div>
        </>
      )}

      {type !== "Cable" && (
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08012345678"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="amount">
          {type === "Airtime"
            ? "Amount"
            : type === "Cable"
            ? "Amount"
            : "Data Plan"}
        </Label>
        {type === "Airtime" || type === "Cable" ? (
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g., 1000"
          />
        ) : (
          <Select value={dataPlan} onValueChange={setDataPlan}>
            <SelectTrigger id="data-plan">
              <SelectValue placeholder="Select Data Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1.5GB">1.5GB - 30 Days - ₦1,000</SelectItem>
              <SelectItem value="5GB">5GB - 30 Days - ₦2,500</SelectItem>
              <SelectItem value="12GB">12GB - 30 Days - ₦5,000</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        The amount will be deducted from your wallet balance.
      </p>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || !isAuthenticated}
      >
        {isSubmitting ? (
          <>
            <Loader className="mr-2 h-4 w-4 animate-spin" /> Submitting...
          </>
        ) : (
          `Purchase ${type}`
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
            {formState.errors ? "Submission Failed" : "Submission Received"}
          </AlertTitle>
          <AlertDescription>{formState.message}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}

export default function BuyAirtimePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsub = auth.onAuthStateChanged((usr) => setUser(usr));
    return () => unsub();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">
          Buy Airtime, Data & Cable
        </h1>
        <p className="text-muted-foreground">
          Instantly top up or pay subscriptions. Fast, easy, and reliable.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="p-6 md:p-8">
            <Tabs defaultValue="airtime" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="airtime">Airtime</TabsTrigger>
                <TabsTrigger value="data">Data</TabsTrigger>
                <TabsTrigger value="cable">Cable TV</TabsTrigger>
              </TabsList>

              <TabsContent value="airtime">
                <CardHeader className="px-0">
                  <CardTitle>Buy Airtime</CardTitle>
                  <CardDescription>
                    Enter details to top up airtime.
                  </CardDescription>
                </CardHeader>
                <PurchaseForm type="Airtime" user={user} />
              </TabsContent>

              <TabsContent value="data">
                <CardHeader className="px-0">
                  <CardTitle>Buy Data</CardTitle>
                  <CardDescription>
                    Choose a data plan that suits you.
                  </CardDescription>
                </CardHeader>
                <PurchaseForm type="Data" user={user} />
              </TabsContent>

              <TabsContent value="cable">
                <CardHeader className="px-0">
                  <CardTitle>Cable TV Subscription</CardTitle>
                  <CardDescription>
                    Pay for your cable subscription.
                  </CardDescription>
                </CardHeader>
                <PurchaseForm type="Cable" user={user} />
              </TabsContent>
            </Tabs>
          </div>

          <div className="bg-muted/50 p-8 md:p-12 flex flex-col justify-center">
            <div className="relative aspect-video mb-8 rounded-lg overflow-hidden">
              <Image
                src="https://placehold.co/600x400.png"
                alt="Mobile services illustration"
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
            <h3 className="text-xl font-semibold mb-4 text-secondary-foreground">
              Seamlessly Connected
            </h3>
            <p className="text-muted-foreground mb-4">
              Stay online and entertained. Recharge anytime, anywhere.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Instant delivery on all services</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Secure payments from your wallet</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Competitive rates and reliable plans</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
