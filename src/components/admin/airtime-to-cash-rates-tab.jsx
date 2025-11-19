"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import { getAuth } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Save, Loader, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const NETWORKS = [
  { id: "mtn", name: "MTN" },
  { id: "airtel", name: "Airtel" },
  { id: "glo", name: "Glo" },
  { id: "9mobile", name: "9mobile" },
];

export default function AirtimeToCashRatesPage() {
  const [rates, setRates] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        loadRates();
        setAuthChecked(true);
      } else {
        router.replace("/login");
      }
    });
    return () => unsub();
  }, [router]);

  const loadRates = async () => {
    try {
      setIsLoading(true);
      const ratesDoc = await getDoc(
        doc(firestore, "settings", "airtimeToCashRates")
      );

      if (ratesDoc.exists()) {
        setRates(ratesDoc.data() || {});
      } else {
        // Initialize with default rates
        const defaultRates = {};
        NETWORKS.forEach((network) => {
          defaultRates[network.id] = { rate: 0.7, enabled: true };
        });
        setRates(defaultRates);
      }
    } catch (error) {
      console.error("Error loading rates:", error);
      toast({
        title: "Error",
        description: "Failed to load rates.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateRate = (networkId, field, value) => {
    setRates((prev) => ({
      ...prev,
      [networkId]: {
        ...prev[networkId],
        [field]: field === "rate" ? parseFloat(value) || 0 : value,
      },
    }));
  };

  const saveRates = async () => {
    try {
      setIsSaving(true);
      await setDoc(
        doc(firestore, "settings", "airtimeToCashRates"),
        {
          ...rates,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      toast({
        title: "Success",
        description: "Airtime to cash rates saved successfully.",
      });
    } catch (error) {
      console.error("Error saving rates:", error);
      toast({
        title: "Error",
        description: "Failed to save rates.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const calculateCustomerReceives = (amount, rate) => {
    return amount * rate;
  };

  const calculateServiceFee = (amount, rate) => {
    return amount * (1 - rate);
  };

  if (!authChecked || isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Airtime to Cash Rates</h1>
          <p className="text-muted-foreground">
            Configure conversion rates for airtime to cash services
          </p>
        </div>
        <Button onClick={saveRates} disabled={isSaving}>
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

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Conversion Rates</CardTitle>
            <CardDescription>
              Set the conversion rate for each network (0.0 to 1.0)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Network</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {NETWORKS.map((network) => (
                  <TableRow key={network.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        {network.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={rates[network.id]?.rate || 0}
                        onChange={(e) =>
                          updateRate(network.id, "rate", e.target.value)
                        }
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          rates[network.id]?.enabled ? "success" : "destructive"
                        }
                      >
                        {rates[network.id]?.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rate Preview</CardTitle>
            <CardDescription>
              See how rates affect customer payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="previewAmount">Test Amount (₦)</Label>
                <Input
                  id="previewAmount"
                  type="number"
                  defaultValue="1000"
                  min="100"
                  max="10000"
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                {NETWORKS.map((network) => {
                  const rate = rates[network.id]?.rate || 0;
                  const testAmount = 1000; // Fixed test amount for preview
                  const receives = calculateCustomerReceives(testAmount, rate);
                  const fee = calculateServiceFee(testAmount, rate);

                  return (
                    <div key={network.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{network.name}</span>
                        <Badge variant="outline">
                          {(rate * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Airtime Sent:</span>
                          <span>₦{testAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Customer Receives:</span>
                          <span className="text-green-600">
                            ₦{receives.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Service Fee:</span>
                          <span className="text-red-600">
                            ₦{fee.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration Summary</CardTitle>
          <CardDescription>Current rate configuration overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Average Rate</h4>
              <p className="text-3xl font-bold">
                {(
                  Object.values(rates).reduce(
                    (sum, rate) => sum + (rate.rate || 0),
                    0
                  ) / Object.keys(rates).length
                ).toFixed(2)}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Enabled Networks</h4>
              <p className="text-3xl font-bold">
                {Object.values(rates).filter((rate) => rate.enabled).length}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Highest Rate</h4>
              <p className="text-3xl font-bold">
                {Math.max(
                  ...Object.values(rates).map((rate) => rate.rate || 0)
                ).toFixed(2)}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Lowest Rate</h4>
              <p className="text-3xl font-bold">
                {Math.min(
                  ...Object.values(rates).map((rate) => rate.rate || 0)
                ).toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rate Configuration Guide</CardTitle>
          <CardDescription>Understanding conversion rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Rate = 0.7 (70%)</h4>
                <p className="text-sm text-muted-foreground">
                  Customer sends ₦1,000 airtime, receives ₦700 cash. Service
                  fee: ₦300
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Rate = 0.8 (80%)</h4>
                <p className="text-sm text-muted-foreground">
                  Customer sends ₦1,000 airtime, receives ₦800 cash. Service
                  fee: ₦200
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Rate = 0.6 (60%)</h4>
                <p className="text-sm text-muted-foreground">
                  Customer sends ₦1,000 airtime, receives ₦600 cash. Service
                  fee: ₦400
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Higher rates are more attractive to
              customers but lower your profit margin. Find the right balance
              based on market competition and operational costs.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
