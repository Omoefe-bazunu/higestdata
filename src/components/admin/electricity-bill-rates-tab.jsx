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
      setError("Please enter a valid service charge percentage.");
      setIsSubmitting(false);
      return;
    }

    if (chargeValue > 100) {
      setError("Service charge percentage cannot exceed 100%.");
      setIsSubmitting(false);
      return;
    }

    try {
      await setDoc(doc(firestore, "settings", "electricityRates"), {
        serviceCharge: chargeValue,
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
          Configure the service charge percentage for electricity bill payments.
        </p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Electricity Service Charge</CardTitle>
          <CardDescription>
            Set the service charge percentage applied to electricity purchases.
            This charge will be added to the electricity amount.
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
              <Label htmlFor="serviceCharge">Service Charge Percentage *</Label>
              <Input
                id="serviceCharge"
                type="number"
                value={serviceCharge}
                onChange={(e) => setServiceCharge(e.target.value)}
                placeholder="Enter percentage (e.g., 10 for 10%)"
                step="0.1"
                min="0"
                max="100"
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the service charge percentage (0-100%). Example: 10 for
                10% service charge.
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Example Calculation:</h4>
              <p className="text-sm">
                If customer purchases ₦5,000 electricity with{" "}
                {serviceCharge || "0"}% service charge:
              </p>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Electricity Amount:</span>
                  <span>₦5,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Charge ({serviceCharge || "0"}%):</span>
                  <span>
                    ₦
                    {(
                      (5000 * (parseFloat(serviceCharge) || 0)) /
                      100
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>Total Charged:</span>
                  <span>
                    ₦
                    {(
                      5000 *
                      (1 + (parseFloat(serviceCharge) || 0) / 100)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Service Charge"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default ElectricityRatesForm;
