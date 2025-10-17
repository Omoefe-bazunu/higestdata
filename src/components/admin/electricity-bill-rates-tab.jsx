"use client";

import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import { useRouter } from "next/navigation";
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
import { Loader, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

function ElectricityRatesForm() {
  const [serviceCharge, setServiceCharge] = useState("");
  const [chargeType, setChargeType] = useState("percentage");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchRates();
        setAuthChecked(true);
      } else {
        router.replace("/login");
      }
    });
    return () => unsub();
  }, [router]);

  const fetchRates = async () => {
    try {
      const ratesDoc = await getDoc(
        doc(firestore, "settings", "electricityRates")
      );
      if (ratesDoc.exists()) {
        const data = ratesDoc.data();
        setServiceCharge(data.serviceCharge?.toString() || "");
        setChargeType(data.chargeType || "percentage");
      }
    } catch (error) {
      console.error("Error fetching electricity rates:", error);
      toast({
        title: "Error",
        description: "Failed to load current rates.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const chargeValue = parseFloat(serviceCharge);
    if (isNaN(chargeValue) || chargeValue < 0) {
      setError("Please enter a valid service charge.");
      setIsSubmitting(false);
      return;
    }

    if (chargeType === "percentage" && chargeValue > 100) {
      setError("Percentage charge cannot exceed 100%.");
      setIsSubmitting(false);
      return;
    }

    try {
      await setDoc(doc(firestore, "settings", "electricityRates"), {
        serviceCharge: chargeValue,
        chargeType,
        updatedAt: serverTimestamp(),
      });
      toast({
        title: "Success",
        description: "Electricity rates updated successfully.",
      });
    } catch (error) {
      console.error("Error updating electricity rates:", error);
      toast({
        title: "Error",
        description: "Failed to update rates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <h1 className="text-3xl font-bold font-headline">
          Set Electricity Rates
        </h1>
        <p className="text-muted-foreground">
          Configure the service charge for electricity bill payments.
        </p>
      </div>

      <Card className="max-w-md ">
        <CardHeader>
          <CardTitle>Electricity Rates</CardTitle>
          <CardDescription>
            Set the service charge applied to electricity purchases.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="serviceCharge">Service Charge *</Label>
              <Input
                id="serviceCharge"
                type="number"
                value={serviceCharge}
                onChange={(e) => setServiceCharge(e.target.value)}
                placeholder="Enter charge amount"
                step="0.01"
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the service charge (e.g., 10 for 10% or 100 for ₦100).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chargeType">Charge Type *</Label>
              <Select value={chargeType} onValueChange={setChargeType} required>
                <SelectTrigger id="chargeType">
                  <SelectValue placeholder="Select charge type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose whether the charge is a percentage or fixed amount.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Rates"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default ElectricityRatesForm;
