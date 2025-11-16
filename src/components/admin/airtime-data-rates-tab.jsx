"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import { getAuth } from "firebase/auth";
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
import { Save, Loader, Plus, Trash2, Download } from "lucide-react";
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

// eBills rates configuration
const EBILLS_RATES = {
  airtime: {
    mtn: { name: "MTN VTU Airtime" },
    glo: { name: "Glo VTU Airtime" },
    airtel: { name: "Airtel VTU Airtime" },
    "9mobile": { name: "9mobile VTU Airtime" },
  },
  data: {
    mtn: { name: "MTN Data" },
    airtel: { name: "Airtel Data" },
    glo: { name: "Glo Data" },
    "9mobile": { name: "9mobile Data" },
    smile: { name: "Smile Data" },
  },
  tv: {
    dstv: { name: "DStv" },
    gotv: { name: "GOtv" },
    startimes: { name: "Startimes" },
    showmax: { name: "Showmax" },
  },
};

export default function AdminRatesDashboard() {
  const [airtimeRates, setAirtimeRates] = useState({});
  const [dataRates, setDataRates] = useState({});
  const [tvRates, setTvRates] = useState({});
  const [selectedProvider, setSelectedProvider] = useState("mtn");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    try {
      setIsLoading(true);

      const airtimeDoc = await getDoc(
        doc(firestore, "settings", "airtimeRates")
      );
      if (airtimeDoc.exists()) {
        setAirtimeRates(airtimeDoc.data().rates || {});
      } else {
        // Default airtime rates with 2% profit margin
        const defaultAirtimeRates = Object.keys(EBILLS_RATES.airtime).reduce(
          (acc, network) => ({
            ...acc,
            [network]: {
              name: EBILLS_RATES.airtime[network].name,
              discountPercentage: 2,
            },
          }),
          {}
        );
        setAirtimeRates(defaultAirtimeRates);
      }

      const dataDoc = await getDoc(doc(firestore, "settings", "dataRates"));
      if (dataDoc.exists()) {
        setDataRates(dataDoc.data().rates || {});
      } else {
        const defaultDataRates = Object.keys(EBILLS_RATES.data).reduce(
          (acc, provider) => ({
            ...acc,
            [provider]: { name: EBILLS_RATES.data[provider].name, plans: {} },
          }),
          {}
        );
        setDataRates(defaultDataRates);
      }

      const tvDoc = await getDoc(doc(firestore, "settings", "tvRates"));
      if (tvDoc.exists()) {
        setTvRates(tvDoc.data().rates || {});
      } else {
        const defaultTvRates = Object.keys(EBILLS_RATES.tv).reduce(
          (acc, provider) => ({
            ...acc,
            [provider]: {
              name: EBILLS_RATES.tv[provider].name,
              plans: {},
            },
          }),
          {}
        );
        setTvRates(defaultTvRates);
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

  const fetchRatesFromEBills = async (serviceType) => {
    try {
      setIsFetchingRates(true);
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in.",
          variant: "destructive",
        });
        return;
      }

      const token = await user.getIdToken();

      // For airtime, just set default percentage rates
      if (serviceType === "airtime") {
        const newRates = Object.keys(EBILLS_RATES.airtime).reduce(
          (acc, provider) => {
            return {
              ...acc,
              [provider]: {
                name: EBILLS_RATES.airtime[provider].name,
                discountPercentage: 2, // Default 2% discount
              },
            };
          },
          {}
        );
        setAirtimeRates(newRates);
        toast({
          title: "Success",
          description: "Airtime rates initialized with 2% discount",
        });
        return;
      }

      const response = await fetch(
        "https://higestdata-proxy.onrender.com/api/vtu/fetch-rates",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: serviceType,
            provider: serviceType === "tv" ? selectedProvider : undefined,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch rates");
      }

      // Update data or TV rates with fetched plans
      if (serviceType === "data") {
        const newDataRates = { ...dataRates };
        Object.keys(result.rates).forEach((provider) => {
          const newPlans = {};
          Object.keys(result.rates[provider]).forEach((planId) => {
            const basePrice =
              parseFloat(result.rates[provider][planId].price) || 0;
            const profit = basePrice * 0.02; // Default 2% profit
            newPlans[planId] = {
              name: result.rates[provider][planId].name,
              basePrice,
              profit,
              finalPrice: basePrice + profit,
            };
          });
          newDataRates[provider] = {
            name: EBILLS_RATES.data[provider]?.name || provider.toUpperCase(),
            plans: newPlans,
          };
        });
        setDataRates(newDataRates);
      } else if (serviceType === "tv") {
        const newTvRates = { ...tvRates };
        const provider = selectedProvider;
        const newPlans = {};
        Object.keys(result.rates[provider] || {}).forEach((planId) => {
          const basePrice =
            parseFloat(result.rates[provider][planId].price) || 0;
          const profit = basePrice * 0.02;
          newPlans[planId] = {
            name: result.rates[provider][planId].name,
            basePrice,
            profit,
            finalPrice: basePrice + profit,
          };
        });
        newTvRates[provider] = {
          name: EBILLS_RATES.tv[provider]?.name || provider.toUpperCase(),
          plans: newPlans,
        };
        setTvRates(newTvRates);
      }

      toast({
        title: "Success",
        description: `${
          serviceType === "data" ? "Data" : "TV"
        } rates fetched from eBills`,
      });
    } catch (error) {
      console.error("Error fetching rates:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch rates",
        variant: "destructive",
      });
    } finally {
      setIsFetchingRates(false);
    }
  };

  const updateAirtimeRate = (network, value) => {
    setAirtimeRates((prev) => ({
      ...prev,
      [network]: {
        ...prev[network],
        discountPercentage: parseFloat(value) || 0,
      },
    }));
  };

  const updateDataRate = (network, planId, field, value) => {
    setDataRates((prev) => ({
      ...prev,
      [network]: {
        ...prev[network],
        plans: {
          ...prev[network]?.plans,
          [planId]: {
            ...prev[network]?.plans?.[planId],
            [field]: field === "name" ? value : parseFloat(value) || 0,
            finalPrice:
              field === "basePrice"
                ? (parseFloat(value) || 0) +
                  (prev[network]?.plans?.[planId]?.profit || 0)
                : field === "profit"
                ? (prev[network]?.plans?.[planId]?.basePrice || 0) +
                  (parseFloat(value) || 0)
                : prev[network]?.plans?.[planId]?.finalPrice || 0,
          },
        },
      },
    }));
  };

  const removeDataPlan = (network, planId) => {
    setDataRates((prev) => {
      const newRates = { ...prev };
      if (newRates[network]?.plans) {
        delete newRates[network].plans[planId];
      }
      return newRates;
    });
  };

  const addDataPlan = (network) => {
    const planId = `plan_${Date.now()}`;
    setDataRates((prev) => ({
      ...prev,
      [network]: {
        ...prev[network],
        plans: {
          ...prev[network]?.plans,
          [planId]: {
            name: "New Data Plan",
            basePrice: 1000,
            profit: 50,
            finalPrice: 1050,
          },
        },
      },
    }));
  };

  const updateTVRate = (provider, planId, field, value) => {
    setTvRates((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        plans: {
          ...prev[provider]?.plans,
          [planId]: {
            ...prev[provider]?.plans?.[planId],
            [field]: field === "name" ? value : parseFloat(value) || 0,
            finalPrice:
              field === "basePrice"
                ? (parseFloat(value) || 0) +
                  (prev[provider]?.plans?.[planId]?.profit || 0)
                : field === "profit"
                ? (prev[provider]?.plans?.[planId]?.basePrice || 0) +
                  (parseFloat(value) || 0)
                : prev[provider]?.plans?.[planId]?.finalPrice || 0,
          },
        },
      },
    }));
  };

  const removeTVPlan = (provider, planId) => {
    setTvRates((prev) => {
      const newRates = { ...prev };
      if (newRates[provider]?.plans) {
        delete newRates[provider].plans[planId];
      }
      return newRates;
    });
  };

  const addTVPlan = (provider) => {
    const planId = `plan_${Date.now()}`;
    setTvRates((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        plans: {
          ...prev[provider]?.plans,
          [planId]: {
            name: "New TV Plan",
            basePrice: 5000,
            profit: 200,
            finalPrice: 5200,
          },
        },
      },
    }));
  };

  const saveAllRates = async () => {
    try {
      setIsSaving(true);

      await setDoc(
        doc(firestore, "settings", "airtimeRates"),
        { rates: airtimeRates, updatedAt: new Date().toISOString() },
        { merge: true }
      );

      await setDoc(
        doc(firestore, "settings", "dataRates"),
        { rates: dataRates, updatedAt: new Date().toISOString() },
        { merge: true }
      );

      await setDoc(
        doc(firestore, "settings", "tvRates"),
        { rates: tvRates, updatedAt: new Date().toISOString() },
        { merge: true }
      );

      toast({
        title: "Success",
        description: "All rates saved successfully.",
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
            Manage airtime, data, and cable TV pricing
          </p>
        </div>
        <div className="w-fit">
          <Button onClick={saveAllRates} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
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
          <TabsTrigger value="data">Data Plans</TabsTrigger>
          <TabsTrigger value="tv">TV Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="airtime" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Airtime Rates</CardTitle>
                  <CardDescription>
                    Set discount percentage for each network. Users pay less
                    than the airtime value they receive.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => fetchRatesFromEBills("airtime")}
                  disabled={isFetchingRates}
                  variant="outline"
                  size="sm"
                >
                  {isFetchingRates ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Initialize Rates
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Network</TableHead>
                    <TableHead>Discount Percentage (%)</TableHead>
                    <TableHead>Example: ₦1000 Airtime</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.keys(airtimeRates).map((network) => {
                    const discountPercentage =
                      airtimeRates[network]?.discountPercentage || 0;
                    const exampleAmount = 1000;
                    const exampleCharge =
                      exampleAmount * (1 - discountPercentage / 100);

                    return (
                      <TableRow key={network}>
                        <TableCell className="font-medium">
                          {airtimeRates[network]?.name || network}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.1"
                              value={discountPercentage}
                              onChange={(e) =>
                                updateAirtimeRate(network, e.target.value)
                              }
                              className="w-24"
                            />
                            <span className="text-sm text-muted-foreground">
                              %
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant="secondary">
                              User Pays: ₦{exampleCharge.toLocaleString()}
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              Airtime Received: ₦
                              {exampleAmount.toLocaleString()} | Discount: ₦
                              {(exampleAmount - exampleCharge).toFixed(2)}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Data Plans</CardTitle>
                  <CardDescription>
                    Manage data plans and pricing for each provider
                  </CardDescription>
                </div>
                <div className="flex items-center flex-col md:flex-row gap-2">
                  <Select
                    value={selectedProvider}
                    onValueChange={setSelectedProvider}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(EBILLS_RATES.data).map((provider) => (
                        <SelectItem key={provider} value={provider}>
                          {EBILLS_RATES.data[provider].name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => fetchRatesFromEBills("data")}
                    disabled={isFetchingRates}
                    variant="outline"
                    size="sm"
                  >
                    {isFetchingRates ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Fetch eBills
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={() => addDataPlan(selectedProvider)}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Plan
                </Button>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan Name</TableHead>
                      <TableHead>Base Price (₦)</TableHead>
                      <TableHead>Profit (₦)</TableHead>
                      <TableHead>Final Price (₦)</TableHead>
                      <TableHead>Margin %</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.keys(dataRates[selectedProvider]?.plans || {}).map(
                      (planId) => (
                        <TableRow key={planId}>
                          <TableCell>
                            <Input
                              value={
                                dataRates[selectedProvider]?.plans[planId]
                                  ?.name || ""
                              }
                              onChange={(e) =>
                                updateDataRate(
                                  selectedProvider,
                                  planId,
                                  "name",
                                  e.target.value
                                )
                              }
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={
                                dataRates[selectedProvider]?.plans[planId]
                                  ?.basePrice || 0
                              }
                              onChange={(e) =>
                                updateDataRate(
                                  selectedProvider,
                                  planId,
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
                              value={
                                dataRates[selectedProvider]?.plans[planId]
                                  ?.profit || 0
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
                              {(
                                dataRates[selectedProvider]?.plans[planId]
                                  ?.finalPrice || 0
                              ).toLocaleString()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {dataRates[selectedProvider]?.plans[planId]
                                ?.basePrice > 0
                                ? (
                                    ((dataRates[selectedProvider]?.plans[planId]
                                      ?.profit || 0) /
                                      dataRates[selectedProvider]?.plans[planId]
                                        ?.basePrice) *
                                    100
                                  ).toFixed(1)
                                : 0}
                              %
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                removeDataPlan(selectedProvider, planId)
                              }
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tv" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>TV Plans</CardTitle>
                  <CardDescription>
                    Manage TV plans and pricing for each provider
                  </CardDescription>
                </div>
                <div className="flex items-center flex-col md:flex-row gap-2">
                  <Select
                    value={selectedProvider}
                    onValueChange={setSelectedProvider}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(EBILLS_RATES.tv).map((provider) => (
                        <SelectItem key={provider} value={provider}>
                          {EBILLS_RATES.tv[provider].name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => fetchRatesFromEBills("tv")}
                    disabled={isFetchingRates}
                    variant="outline"
                    size="sm"
                  >
                    {isFetchingRates ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Fetch eBills
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={() => addTVPlan(selectedProvider)}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Plan
                </Button>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan Name</TableHead>
                      <TableHead>Base Price (₦)</TableHead>
                      <TableHead>Profit (₦)</TableHead>
                      <TableHead>Final Price (₦)</TableHead>
                      <TableHead>Margin %</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.keys(tvRates[selectedProvider]?.plans || {}).map(
                      (planId) => (
                        <TableRow key={planId}>
                          <TableCell>
                            <Input
                              value={
                                tvRates[selectedProvider]?.plans[planId]
                                  ?.name || ""
                              }
                              onChange={(e) =>
                                updateTVRate(
                                  selectedProvider,
                                  planId,
                                  "name",
                                  e.target.value
                                )
                              }
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={
                                tvRates[selectedProvider]?.plans[planId]
                                  ?.basePrice || 0
                              }
                              onChange={(e) =>
                                updateTVRate(
                                  selectedProvider,
                                  planId,
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
                              value={
                                tvRates[selectedProvider]?.plans[planId]
                                  ?.profit || 0
                              }
                              onChange={(e) =>
                                updateTVRate(
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
                              {(
                                tvRates[selectedProvider]?.plans[planId]
                                  ?.finalPrice || 0
                              ).toLocaleString()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {tvRates[selectedProvider]?.plans[planId]
                                ?.basePrice > 0
                                ? (
                                    ((tvRates[selectedProvider]?.plans[planId]
                                      ?.profit || 0) /
                                      tvRates[selectedProvider]?.plans[planId]
                                        ?.basePrice) *
                                    100
                                  ).toFixed(1)
                                : 0}
                              %
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                removeTVPlan(selectedProvider, planId)
                              }
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Configuration Summary</CardTitle>
          <CardDescription>Overview of current pricing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Airtime Networks</h4>
              <p className="text-sm text-muted-foreground mb-3">
                {Object.keys(airtimeRates).length} networks
              </p>
              <div className="space-y-1">
                {Object.values(airtimeRates).map((rate, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span>{rate.name}</span>
                    <span className="font-medium">
                      {rate.discountPercentage}% discount
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Data Providers</h4>
              <p className="text-sm text-muted-foreground mb-3">
                {Object.keys(dataRates).length} providers
              </p>
              <div className="space-y-1">
                {Object.keys(dataRates).map((provider) => (
                  <div key={provider} className="flex justify-between text-xs">
                    <span>{dataRates[provider]?.name}</span>
                    <span className="font-medium">
                      {Object.keys(dataRates[provider]?.plans || {}).length}{" "}
                      plans
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">TV Providers</h4>
              <p className="text-sm text-muted-foreground mb-3">
                {Object.keys(tvRates).length} providers
              </p>
              <div className="space-y-1">
                {Object.keys(tvRates).map((provider) => (
                  <div key={provider} className="flex justify-between text-xs">
                    <span>{tvRates[provider]?.name}</span>
                    <span className="font-medium">
                      {Object.keys(tvRates[provider]?.plans || {}).length} plans
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
