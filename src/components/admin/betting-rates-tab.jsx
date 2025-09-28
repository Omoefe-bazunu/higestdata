"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function BettingRatesTab() {
  const [bettingRate, setBettingRate] = useState({
    serviceCharge: 0,
    chargeType: "fixed", // "fixed" or "percentage"
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load existing betting rates on component mount
  useEffect(() => {
    loadBettingRates();
  }, []);

  // Load betting rates from Firestore
  const loadBettingRates = async () => {
    try {
      setIsLoading(true);
      const ratesDoc = await getDoc(doc(firestore, "settings", "bettingRates"));

      if (ratesDoc.exists()) {
        const data = ratesDoc.data();
        setBettingRate({
          serviceCharge: data.serviceCharge || 0,
          chargeType: data.chargeType || "fixed",
        });
      } else {
        // Initialize with default rates
        const defaultRates = {
          serviceCharge: 50, // Default ₦50 service charge
          chargeType: "fixed",
        };
        setBettingRate(defaultRates);
      }
    } catch (error) {
      console.error("Error loading betting rates:", error);
      toast({
        title: "Error",
        description: "Failed to load betting rates. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save betting rates to Firestore
  const saveBettingRates = async () => {
    try {
      setIsSaving(true);

      await setDoc(doc(firestore, "settings", "bettingRates"), {
        serviceCharge: parseFloat(bettingRate.serviceCharge) || 0,
        chargeType: bettingRate.chargeType,
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: "Success",
        description: "Betting rates have been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving betting rates:", error);
      toast({
        title: "Error",
        description: "Failed to save betting rates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate example total for different amounts
  const calculateExampleTotal = (amount) => {
    const baseAmount = parseFloat(amount);
    const serviceCharge = parseFloat(bettingRate.serviceCharge) || 0;

    if (bettingRate.chargeType === "percentage") {
      return baseAmount + (baseAmount * serviceCharge) / 100;
    } else {
      return baseAmount + serviceCharge;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading betting rates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Betting Service Rates</h2>
          <p className="text-muted-foreground">
            Configure service charges for betting account funding
          </p>
        </div>
        <Button onClick={saveBettingRates} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Rate Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Service Charge Configuration
            </CardTitle>
            <CardDescription>
              Set the service charge for betting account funding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chargeType">Charge Type</Label>
              <select
                id="chargeType"
                value={bettingRate.chargeType}
                onChange={(e) =>
                  setBettingRate((prev) => ({
                    ...prev,
                    chargeType: e.target.value,
                  }))
                }
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="fixed">Fixed Amount (₦)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceCharge">
                Service Charge{" "}
                {bettingRate.chargeType === "percentage" ? "(%)" : "(₦)"}
              </Label>
              <Input
                id="serviceCharge"
                type="number"
                value={bettingRate.serviceCharge}
                onChange={(e) =>
                  setBettingRate((prev) => ({
                    ...prev,
                    serviceCharge: e.target.value,
                  }))
                }
                placeholder={
                  bettingRate.chargeType === "percentage"
                    ? "e.g., 2.5"
                    : "e.g., 50"
                }
                min="0"
                step={bettingRate.chargeType === "percentage" ? "0.1" : "1"}
              />
              <p className="text-xs text-muted-foreground">
                {bettingRate.chargeType === "percentage"
                  ? "Percentage of the betting amount to charge as service fee"
                  : "Fixed amount in Naira to charge as service fee"}
              </p>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Current Configuration:</p>
              <Badge variant="secondary">
                {bettingRate.chargeType === "percentage"
                  ? `${bettingRate.serviceCharge}% of amount`
                  : `₦${bettingRate.serviceCharge} fixed charge`}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Example Calculations Card */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing Examples</CardTitle>
            <CardDescription>
              See how your rates affect customer charges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[500, 1000, 2000, 5000, 10000].map((amount) => (
                <div
                  key={amount}
                  className="flex justify-between items-center p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      ₦{amount.toLocaleString()} Funding
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Service charge:{" "}
                      {bettingRate.chargeType === "percentage"
                        ? `${bettingRate.serviceCharge}%`
                        : `₦${bettingRate.serviceCharge}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      ₦{calculateExampleTotal(amount).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total charged
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Note:</strong> The total amount shown will be deducted
                from the user's wallet. The original betting amount will be
                credited to their betting account.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Information */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Summary</CardTitle>
          <CardDescription>
            Overview of your current betting service configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <h4 className="font-semibold mb-2">Charge Type</h4>
              <Badge variant="outline" className="text-lg">
                {bettingRate.chargeType === "percentage"
                  ? "Percentage"
                  : "Fixed Amount"}
              </Badge>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <h4 className="font-semibold mb-2">Service Charge</h4>
              <Badge variant="secondary" className="text-lg">
                {bettingRate.chargeType === "percentage"
                  ? `${bettingRate.serviceCharge}%`
                  : `₦${parseFloat(
                      bettingRate.serviceCharge || 0
                    ).toLocaleString()}`}
              </Badge>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <h4 className="font-semibold mb-2">Example (₦1,000)</h4>
              <Badge variant="default" className="text-lg">
                ₦{calculateExampleTotal(1000).toLocaleString()} total
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
