// components/AdminRatesDashboard.js
// Updated admin dashboard for managing VTU rates with profit margins

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
import { Save, Loader, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

export default function AdminRatesDashboard() {
  // State management for different service rates
  const [airtimeRates, setAirtimeRates] = useState({});
  const [dataRates, setDataRates] = useState({});
  const [tvRates, setTvRates] = useState({});
  const [selectedProvider, setSelectedProvider] = useState("mtn");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load existing rates on component mount
  useEffect(() => {
    loadRates();
  }, []);

  // Load all rates from Firestore
  const loadRates = async () => {
    try {
      setIsLoading(true);

      // Load airtime rates
      const airtimeDoc = await getDoc(
        doc(firestore, "settings", "airtimeRates")
      );
      if (airtimeDoc.exists()) {
        setAirtimeRates(airtimeDoc.data().rates || {});
      } else {
        // Initialize with default airtime rates
        const defaultAirtimeRates = {
          mtn: { name: "MTN", basePrice: 100, profit: 2, finalPrice: 102 },
          glo: { name: "Glo", basePrice: 100, profit: 2, finalPrice: 102 },
          airtel: {
            name: "Airtel",
            basePrice: 100,
            profit: 2,
            finalPrice: 102,
          },
          "9mobile": {
            name: "9mobile",
            basePrice: 100,
            profit: 2,
            finalPrice: 102,
          },
        };
        setAirtimeRates(defaultAirtimeRates);
      }

      // Load data rates
      const dataDoc = await getDoc(doc(firestore, "settings", "dataRates"));
      if (dataDoc.exists()) {
        setDataRates(dataDoc.data().rates || {});
      }

      // Load TV rates
      const tvDoc = await getDoc(doc(firestore, "settings", "tvRates"));
      if (tvDoc.exists()) {
        setTvRates(tvDoc.data().rates || {});
      }
    } catch (error) {
      console.error("Error loading rates:", error);
      toast({
        title: "Error",
        description: "Failed to load rates. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update airtime rate
  const updateAirtimeRate = (network, field, value) => {
    setAirtimeRates((prev) => ({
      ...prev,
      [network]: {
        ...prev[network],
        [field]: field === "name" ? value : parseFloat(value) || 0,
        finalPrice:
          field === "basePrice"
            ? (parseFloat(value) || 0) + (prev[network]?.profit || 0)
            : field === "profit"
            ? (prev[network]?.basePrice || 0) + (parseFloat(value) || 0)
            : prev[network]?.finalPrice || 0,
      },
    }));
  };

  // Add new data plan
  const addDataPlan = (network) => {
    const planId = `plan_${Date.now()}`;
    setDataRates((prev) => ({
      ...prev,
      [network]: {
        ...prev[network],
        [planId]: {
          name: "New Data Plan",
          basePrice: 1000,
          profit: 50,
          finalPrice: 1050,
        },
      },
    }));
  };

  // Update data plan rate
  const updateDataRate = (network, planId, field, value) => {
    setDataRates((prev) => ({
      ...prev,
      [network]: {
        ...prev[network],
        [planId]: {
          ...prev[network]?.[planId],
          [field]: field === "name" ? value : parseFloat(value) || 0,
          finalPrice:
            field === "basePrice"
              ? (parseFloat(value) || 0) +
                (prev[network]?.[planId]?.profit || 0)
              : field === "profit"
              ? (prev[network]?.[planId]?.basePrice || 0) +
                (parseFloat(value) || 0)
              : prev[network]?.[planId]?.finalPrice || 0,
        },
      },
    }));
  };

  // Remove data plan
  const removeDataPlan = (network, planId) => {
    setDataRates((prev) => {
      const newRates = { ...prev };
      if (newRates[network]) {
        delete newRates[network][planId];
      }
      return newRates;
    });
  };

  // Add new TV plan
  const addTVPlan = (provider) => {
    const planId = `plan_${Date.now()}`;
    setTvRates((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [planId]: {
          name: "New TV Plan",
          basePrice: 5000,
          profit: 200,
          finalPrice: 5200,
        },
      },
    }));
  };

  // Update TV plan rate
  const updateTVRate = (provider, planId, field, value) => {
    setTvRates((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [planId]: {
          ...prev[provider]?.[planId],
          [field]: field === "name" ? value : parseFloat(value) || 0,
          finalPrice:
            field === "basePrice"
              ? (parseFloat(value) || 0) +
                (prev[provider]?.[planId]?.profit || 0)
              : field === "profit"
              ? (prev[provider]?.[planId]?.basePrice || 0) +
                (parseFloat(value) || 0)
              : prev[provider]?.[planId]?.finalPrice || 0,
        },
      },
    }));
  };

  // Remove TV plan
  const removeTVPlan = (provider, planId) => {
    setTvRates((prev) => {
      const newRates = { ...prev };
      if (newRates[provider]) {
        delete newRates[provider][planId];
      }
      return newRates;
    });
  };

  // Save all rates to Firestore
  const saveAllRates = async () => {
    try {
      setIsSaving(true);

      // Save airtime rates
      await setDoc(doc(firestore, "settings", "airtimeRates"), {
        rates: airtimeRates,
        updatedAt: new Date().toISOString(),
      });

      // Save data rates
      await setDoc(doc(firestore, "settings", "dataRates"), {
        rates: dataRates,
        updatedAt: new Date().toISOString(),
      });

      // Save TV rates
      await setDoc(doc(firestore, "settings", "tvRates"), {
        rates: tvRates,
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: "Success",
        description: "All rates have been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving rates:", error);
      toast({
        title: "Error",
        description: "Failed to save rates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading rates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="text-3xl font-bold">VTU Rates Management</h1>
          <p className="text-muted-foreground">
            Set base prices and profit margins for all VTU services
          </p>
        </div>
        <div className=" w-fit">
          <Button onClick={saveAllRates} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin " />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save All Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="airtime" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="airtime">Airtime Rates</TabsTrigger>
          <TabsTrigger value="data">Data Plan Rates</TabsTrigger>
          <TabsTrigger value="tv">TV Rates</TabsTrigger>
        </TabsList>

        {/* Airtime Rates Tab */}
        <TabsContent value="airtime">
          <Card>
            <CardHeader>
              <CardTitle>Airtime Rates Configuration</CardTitle>
              <CardDescription>
                Set base prices and profit margins for airtime top-ups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Network</TableHead>
                    <TableHead>Base Price (₦)</TableHead>
                    <TableHead>Profit Margin (₦)</TableHead>
                    <TableHead>Final Price (₦)</TableHead>
                    <TableHead>Margin %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.keys(airtimeRates).map((network) => (
                    <TableRow key={network}>
                      <TableCell className="font-medium">
                        {airtimeRates[network]?.name || network}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={airtimeRates[network]?.basePrice || 0}
                          onChange={(e) =>
                            updateAirtimeRate(
                              network,
                              "basePrice",
                              e.target.value
                            )
                          }
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={airtimeRates[network]?.profit || 0}
                          onChange={(e) =>
                            updateAirtimeRate(network, "profit", e.target.value)
                          }
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          ₦{airtimeRates[network]?.finalPrice || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {airtimeRates[network]?.basePrice > 0
                            ? (
                                ((airtimeRates[network]?.profit || 0) /
                                  airtimeRates[network]?.basePrice) *
                                100
                              ).toFixed(1)
                            : 0}
                          %
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Plans Tab */}
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data Plan Rates Configuration</CardTitle>
              <CardDescription>
                Manage data plan pricing for each network provider
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label>Select Network Provider</Label>
                <div className="flex gap-2 mt-2">
                  <Select
                    value={selectedProvider}
                    onValueChange={setSelectedProvider}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mtn">MTN</SelectItem>
                      <SelectItem value="glo">Glo</SelectItem>
                      <SelectItem value="airtel">Airtel</SelectItem>
                      <SelectItem value="9mobile">9mobile</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => addDataPlan(selectedProvider)}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Plan
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan Name</TableHead>
                    <TableHead>Base Price (₦)</TableHead>
                    <TableHead>Profit (₦)</TableHead>
                    <TableHead>Final Price (₦)</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataRates[selectedProvider] &&
                    Object.keys(dataRates[selectedProvider]).map((planId) => (
                      <TableRow key={planId}>
                        <TableCell>
                          <Input
                            type="text"
                            value={
                              dataRates[selectedProvider][planId]?.name || ""
                            }
                            onChange={(e) =>
                              updateDataRate(
                                selectedProvider,
                                planId,
                                "name",
                                e.target.value
                              )
                            }
                            className="w-40"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={
                              dataRates[selectedProvider][planId]?.basePrice ||
                              0
                            }
                            onChange={(e) =>
                              updateDataRate(
                                selectedProvider,
                                planId,
                                "basePrice",
                                e.target.value
                              )
                            }
                            className="w-28"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={
                              dataRates[selectedProvider][planId]?.profit || 0
                            }
                            onChange={(e) =>
                              updateDataRate(
                                selectedProvider,
                                planId,
                                "profit",
                                e.target.value
                              )
                            }
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            ₦
                            {dataRates[selectedProvider][planId]?.finalPrice ||
                              0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() =>
                              removeDataPlan(selectedProvider, planId)
                            }
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  {(!dataRates[selectedProvider] ||
                    Object.keys(dataRates[selectedProvider]).length === 0) && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground"
                      >
                        No data plans configured. Click "Add Plan" to start.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TV Subscription Tab */}
        <TabsContent value="tv">
          <Card>
            <CardHeader>
              <CardTitle>TV Subscription Rates Configuration</CardTitle>
              <CardDescription>
                Manage cable TV subscription pricing for each provider
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label>Select TV Provider</Label>
                <div className="flex gap-2 mt-2">
                  <Select
                    value={selectedProvider}
                    onValueChange={setSelectedProvider}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dstv">DSTV</SelectItem>
                      <SelectItem value="gotv">GoTV</SelectItem>
                      <SelectItem value="startimes">Startimes</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => addTVPlan(selectedProvider)} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Plan
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Package Name</TableHead>
                    <TableHead>Base Price (₦)</TableHead>
                    <TableHead>Profit (₦)</TableHead>
                    <TableHead>Final Price (₦)</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tvRates[selectedProvider] &&
                    Object.keys(tvRates[selectedProvider]).map((planId) => (
                      <TableRow key={planId}>
                        <TableCell>
                          <Input
                            type="text"
                            value={
                              tvRates[selectedProvider][planId]?.name || ""
                            }
                            onChange={(e) =>
                              updateTVRate(
                                selectedProvider,
                                planId,
                                "name",
                                e.target.value
                              )
                            }
                            className="w-48"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={
                              tvRates[selectedProvider][planId]?.basePrice || 0
                            }
                            onChange={(e) =>
                              updateTVRate(
                                selectedProvider,
                                planId,
                                "basePrice",
                                e.target.value
                              )
                            }
                            className="w-32"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={
                              tvRates[selectedProvider][planId]?.profit || 0
                            }
                            onChange={(e) =>
                              updateTVRate(
                                selectedProvider,
                                planId,
                                "profit",
                                e.target.value
                              )
                            }
                            className="w-28"
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            ₦
                            {tvRates[selectedProvider][planId]?.finalPrice || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() =>
                              removeTVPlan(selectedProvider, planId)
                            }
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  {(!tvRates[selectedProvider] ||
                    Object.keys(tvRates[selectedProvider]).length === 0) && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground"
                      >
                        No TV plans configured. Click "Add Plan" to start.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Configuration Summary</CardTitle>
          <CardDescription>
            Overview of your current pricing structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Airtime Networks</h4>
              <p className="text-sm text-muted-foreground">
                {Object.keys(airtimeRates).length} networks configured
              </p>
              <div className="mt-2 space-y-1">
                {Object.values(airtimeRates).map((rate, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span>{rate.name}</span>
                    <span>₦{rate.finalPrice}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Data Plans</h4>
              <p className="text-sm text-muted-foreground">
                {Object.values(dataRates).reduce(
                  (total, network) => total + Object.keys(network).length,
                  0
                )}{" "}
                plans configured
              </p>
              <div className="mt-2 space-y-1">
                {Object.keys(dataRates).map((network) => (
                  <div key={network} className="flex justify-between text-xs">
                    <span>{network.toUpperCase()}</span>
                    <span>
                      {Object.keys(dataRates[network] || {}).length} plans
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">TV Subscriptions</h4>
              <p className="text-sm text-muted-foreground">
                {Object.values(tvRates).reduce(
                  (total, provider) => total + Object.keys(provider).length,
                  0
                )}{" "}
                packages configured
              </p>
              <div className="mt-2 space-y-1">
                {Object.keys(tvRates).map((provider) => (
                  <div key={provider} className="flex justify-between text-xs">
                    <span>{provider.toUpperCase()}</span>
                    <span>
                      {Object.keys(tvRates[provider] || {}).length} packages
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
