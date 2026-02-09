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
import { Save, Loader, Smartphone, RefreshCw, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// VTU Africa standard rates
const NETWORKS = [
  {
    id: "mtn",
    name: "MTN",
    defaultRate: 0.7,
    charge: 30,
    color: "bg-yellow-500",
  },
  {
    id: "airtel",
    name: "Airtel",
    defaultRate: 0.65,
    charge: 35,
    color: "bg-red-500",
  },
  {
    id: "glo",
    name: "Glo",
    defaultRate: 0.55,
    charge: 45,
    color: "bg-green-500",
    maxAmount: 1000,
  },
  {
    id: "9mobile",
    name: "9mobile",
    defaultRate: 0.55,
    charge: 45,
    color: "bg-emerald-600",
  },
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
        doc(firestore, "settings", "airtimeToCashRates"),
      );

      if (ratesDoc.exists()) {
        const data = ratesDoc.data();
        // Remove metadata fields
        const { updatedAt, ...ratesOnly } = data;
        setRates(ratesOnly);
      } else {
        // Initialize with VTU Africa default rates
        initializeDefaultRates();
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

  const initializeDefaultRates = () => {
    const defaultRates = {};
    NETWORKS.forEach((network) => {
      defaultRates[network.id] = {
        rate: network.defaultRate,
        charge: network.charge,
        enabled: true,
      };
    });
    setRates(defaultRates);
  };

  const updateRate = (networkId, field, value) => {
    setRates((prev) => ({
      ...prev,
      [networkId]: {
        ...prev[networkId],
        [field]: field === "rate" ? parseFloat(value) || 0 : value,
        // Auto-calculate charge when rate changes
        ...(field === "rate" && {
          charge: Math.round((1 - (parseFloat(value) || 0)) * 100),
        }),
      },
    }));
  };

  const toggleNetwork = (networkId) => {
    setRates((prev) => ({
      ...prev,
      [networkId]: {
        ...prev[networkId],
        enabled: !prev[networkId]?.enabled,
      },
    }));
  };

  const resetToDefaults = () => {
    initializeDefaultRates();
    toast({
      title: "Reset Complete",
      description: "Rates have been reset to VTU Africa defaults.",
    });
  };

  const saveRates = async () => {
    try {
      setIsSaving(true);

      // Validate rates before saving
      for (const [networkId, networkRate] of Object.entries(rates)) {
        if (!networkRate.rate || networkRate.rate < 0 || networkRate.rate > 1) {
          throw new Error(
            `Invalid rate for ${networkId}. Must be between 0 and 1.`,
          );
        }
      }

      await setDoc(
        doc(firestore, "settings", "airtimeToCashRates"),
        {
          ...rates,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      toast({
        title: "Success",
        description: "Airtime to cash rates saved successfully.",
      });
    } catch (error) {
      console.error("Error saving rates:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save rates.",
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

  const hasChangesFromDefaults = () => {
    return NETWORKS.some((network) => {
      const currentRate = rates[network.id];
      return (
        currentRate?.rate !== network.defaultRate ||
        currentRate?.enabled !== true
      );
    });
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
          <h1 className="text-xl font-bold">Airtime to Cash Rates</h1>
          <p className="text-muted-foreground text-sm">
            Configure conversion rates for airtime to cash services (VTU Africa)
          </p>
        </div>
        <div className="flex gap-2 flex-col">
          <Button
            onClick={resetToDefaults}
            variant="outline"
            disabled={isSaving}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
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
      </div>

      <Alert className="border-orange-200 bg-orange-50">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-800">
          VTU Africa Standard Rates
        </AlertTitle>
        <AlertDescription className="text-orange-700">
          These rates are based on VTU Africa's official documentation. MTN: 30%
          charge (70% to customer), Airtel: 35% (65%), Glo: 45% (55%), 9mobile:
          45% (55%). Glo has a maximum transfer limit of ₦1,000.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Network Conversion Rates</CardTitle>
            <CardDescription>
              Configure rate and status for each network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Network</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Charge</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {NETWORKS.map((network) => {
                  const networkRate = rates[network.id] || {};
                  const isDefault = networkRate.rate === network.defaultRate;

                  return (
                    <TableRow key={network.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${network.color}`}
                          />
                          <div>
                            <div>{network.name}</div>
                            {network.maxAmount && (
                              <div className="text-xs text-muted-foreground">
                                Max: ₦{network.maxAmount}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="1"
                            step="0.01"
                            value={networkRate.rate || 0}
                            onChange={(e) =>
                              updateRate(network.id, "rate", e.target.value)
                            }
                            className="w-20"
                          />
                          {!isDefault && (
                            <Badge variant="outline" className="text-xs">
                              Modified
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {networkRate.charge || network.charge}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={networkRate.enabled ?? true}
                            onCheckedChange={() => toggleNetwork(network.id)}
                          />
                          <span className="text-sm text-muted-foreground">
                            {networkRate.enabled ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rate Preview Calculator</CardTitle>
            <CardDescription>
              See how rates affect customer payments (₦1,000 example)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {NETWORKS.map((network) => {
                const rate = rates[network.id]?.rate || network.defaultRate;
                const enabled = rates[network.id]?.enabled ?? true;
                const testAmount = 1000;
                const receives = calculateCustomerReceives(testAmount, rate);
                const fee = calculateServiceFee(testAmount, rate);

                return (
                  <div
                    key={network.id}
                    className={`p-4 border rounded-lg transition-opacity ${
                      !enabled ? "opacity-50 bg-gray-50" : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${network.color}`}
                        />
                        <span className="font-semibold">{network.name}</span>
                      </div>
                      <Badge variant="outline">
                        {(rate * 100).toFixed(0)}% rate
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Airtime Sent:
                        </span>
                        <span className="font-medium">
                          ₦{testAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Customer Receives:</span>
                        <span className="font-bold">
                          ₦{receives.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>Service Fee:</span>
                        <span className="font-bold">₦{fee.toFixed(2)}</span>
                      </div>
                      {!enabled && (
                        <Badge
                          variant="secondary"
                          className="w-full justify-center mt-2"
                        >
                          Service Disabled
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration Summary</CardTitle>
          <CardDescription>Overview of current rate settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-white">
              <h4 className="font-semibold mb-2 text-sm text-muted-foreground">
                Average Rate
              </h4>
              <p className="text-3xl font-bold">
                {Object.keys(rates).length > 0
                  ? (
                      (Object.values(rates).reduce(
                        (sum, rate) => sum + (rate.rate || 0),
                        0,
                      ) /
                        Object.keys(rates).length) *
                      100
                    ).toFixed(0) + "%"
                  : "0%"}
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-white">
              <h4 className="font-semibold mb-2 text-sm text-muted-foreground">
                Enabled Networks
              </h4>
              <p className="text-3xl font-bold text-green-600">
                {Object.values(rates).filter((rate) => rate.enabled).length}/
                {NETWORKS.length}
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-white">
              <h4 className="font-semibold mb-2 text-sm text-muted-foreground">
                Highest Rate
              </h4>
              <p className="text-3xl font-bold text-purple-600">
                {Object.keys(rates).length > 0
                  ? (
                      Math.max(
                        ...Object.values(rates).map((rate) => rate.rate || 0),
                      ) * 100
                    ).toFixed(0) + "%"
                  : "0%"}
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-gradient-to-br from-orange-50 to-white">
              <h4 className="font-semibold mb-2 text-sm text-muted-foreground">
                Lowest Rate
              </h4>
              <p className="text-3xl font-bold text-orange-600">
                {Object.keys(rates).length > 0
                  ? (
                      Math.min(
                        ...Object.values(rates).map((rate) => rate.rate || 0),
                      ) * 100
                    ).toFixed(0) + "%"
                  : "0%"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Understanding Conversion Rates</CardTitle>
          <CardDescription>
            How rates work in airtime to cash conversions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {NETWORKS.map((network) => (
                <div
                  key={network.id}
                  className="p-4 border rounded-lg space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${network.color}`} />
                    <h4 className="font-semibold">{network.name}</h4>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      <strong>Rate:</strong> {network.defaultRate} (
                      {(network.defaultRate * 100).toFixed(0)}%)
                    </p>
                    <p>
                      <strong>Charge:</strong> {network.charge}%
                    </p>
                    <p>
                      <strong>Example:</strong> Customer sends ₦1,000 → receives
                      ₦{(1000 * network.defaultRate).toFixed(0)}
                    </p>
                    {network.maxAmount && (
                      <p className="text-orange-600">
                        <strong>Max per transfer:</strong> ₦{network.maxAmount}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Important:</strong> Higher rates attract more customers
                but reduce profit margins. Lower rates increase profits but may
                drive customers to competitors. These VTU Africa standard rates
                represent typical market rates. Monitor transaction volume and
                adjust carefully based on business goals.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
