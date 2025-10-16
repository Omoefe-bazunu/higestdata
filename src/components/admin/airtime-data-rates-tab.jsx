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

// eBills rates configuration (excluding ePINs)
const EBILLS_RATES = {
  airtime: {
    mtn: { name: "MTN VTU Airtime", discount: 2.5 },
    glo: { name: "Glo VTU Airtime", discount: 3.0 },
    airtel: { name: "Airtel VTU Airtime", discount: 3.0 },
    "9mobile": { name: "9mobile VTU Airtime", discount: 3.0 },
  },
  data: {
    mtn: { name: "MTN Data", discount: 1.0 },
    "mtn-sme": { name: "MTN Data (SME)", discount: 10.0 },
    airtel: { name: "Airtel Data", discount: 1.0 },
    "airtel-sme": { name: "Airtel Data (SME)", discount: 10.0 },
    glo: { name: "Glo Data", discount: 2.0 },
    "glo-sme": { name: "Glo Data (SME)", discount: 10.0 },
    "9mobile": { name: "9mobile Data", discount: 2.0 },
    "9mobile-sme": { name: "9mobile Data (SME)", discount: 10.0 },
    smile: { name: "Smile Data", discount: 3.0 },
  },
  tv: {
    dstv: { name: "DStv", discount: 1.0, serviceFee: 0 },
    gotv: { name: "GOtv", discount: 1.0, serviceFee: 0 },
    startimes: { name: "Startimes", discount: 1.5, serviceFee: 0 },
    showmax: { name: "Showmax", discount: 1.0, serviceFee: 0 },
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
        const defaultAirtimeRates = Object.keys(EBILLS_RATES.airtime).reduce(
          (acc, network) => ({
            ...acc,
            [network]: {
              name: EBILLS_RATES.airtime[network].name,
              basePrice: 100,
              profit: 2,
              finalPrice: 102,
            },
          }),
          {}
        );
        setAirtimeRates(defaultAirtimeRates);
      }

      const dataDoc = await getDoc(doc(firestore, "settings", "dataRates"));
      if (dataDoc.exists()) {
        setDataRates(dataDoc.data().rates || {});
      }

      const tvDoc = await getDoc(doc(firestore, "settings", "tvRates"));
      if (tvDoc.exists()) {
        setTvRates(tvDoc.data().rates || {});
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

      // For airtime, use static rates from EBILLS_RATES
      if (serviceType === "airtime") {
        const ratesConfig = EBILLS_RATES.airtime;
        const newRates = Object.keys(ratesConfig).reduce((acc, provider) => {
          const discount = ratesConfig[provider].discount / 100;
          const basePrice = 100; // Base price per ₦100
          const discountedPrice = basePrice * (1 - discount);
          const profit = basePrice * 0.02; // Default 2% profit margin
          return {
            ...acc,
            [provider]: {
              name: ratesConfig[provider].name,
              basePrice: discountedPrice,
              profit,
              finalPrice: discountedPrice + profit,
            },
          };
        }, {});
        setAirtimeRates(newRates);
        toast({
          title: "Success",
          description: "Airtime rates fetched from eBills",
        });
        return;
      }

      const response = await fetch("/api/vtu/fetch-rates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: serviceType }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch rates");
      }

      // Apply current discounts to fetched plans
      if (serviceType === "data") {
        const newDataRates = { ...dataRates };
        Object.keys(result.rates).forEach((provider) => {
          const currentDiscount = dataRates[provider]?.discount || 0;
          const newPlans = {};
          Object.keys(result.rates[provider]).forEach((planId) => {
            const basePrice = result.rates[provider][planId].price;
            const discountedPrice = basePrice * (1 - currentDiscount / 100);
            const profit = basePrice * 0.02;
            newPlans[planId] = {
              name: result.rates[provider][planId].name,
              basePrice: discountedPrice,
              profit,
              finalPrice: discountedPrice + profit,
            };
          });
          newDataRates[provider] = {
            discount: currentDiscount,
            plans: newPlans,
          };
        });
        setDataRates(newDataRates);
      } else if (serviceType === "tv") {
        const newTvRates = { ...tvRates };
        Object.keys(result.rates).forEach((provider) => {
          const currentDiscount = tvRates[provider]?.discount || 0;
          const newPlans = {};
          Object.keys(result.rates[provider]).forEach((planId) => {
            const basePrice = result.rates[provider][planId].price;
            const discountedPrice = basePrice * (1 - currentDiscount / 100);
            const profit = basePrice * 0.02;
            newPlans[planId] = {
              name: result.rates[provider][planId].name,
              basePrice: discountedPrice,
              profit,
              finalPrice: discountedPrice + profit,
            };
          });
          newTvRates[provider] = {
            discount: currentDiscount,
            plans: newPlans,
          };
        });
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

  const updateProviderDiscount = (serviceType, provider, discount) => {
    const parsedDiscount = parseFloat(discount) || 0;
    if (serviceType === "data") {
      setDataRates((prev) => {
        const newPlans = {};
        Object.keys(prev[provider]?.plans || {}).forEach((planId) => {
          const oldDiscount = prev[provider].discount || 0;
          const basePrice =
            prev[provider].plans[planId].basePrice / (1 - oldDiscount / 100);
          const discountedPrice = basePrice * (1 - parsedDiscount / 100);
          newPlans[planId] = {
            ...prev[provider].plans[planId],
            basePrice: discountedPrice,
            finalPrice:
              discountedPrice + (prev[provider].plans[planId]?.profit || 0),
          };
        });
        return {
          ...prev,
          [provider]: {
            discount: parsedDiscount,
            plans: newPlans,
          },
        };
      });
    } else if (serviceType === "tv") {
      setTvRates((prev) => {
        const newPlans = {};
        Object.keys(prev[provider]?.plans || {}).forEach((planId) => {
          const oldDiscount = prev[provider].discount || 0;
          const basePrice =
            prev[provider].plans[planId].basePrice / (1 - oldDiscount / 100);
          const discountedPrice = basePrice * (1 - parsedDiscount / 100);
          newPlans[planId] = {
            ...prev[provider].plans[planId],
            basePrice: discountedPrice,
            finalPrice:
              discountedPrice + (prev[provider].plans[planId]?.profit || 0),
          };
        });
        return {
          ...prev,
          [provider]: {
            discount: parsedDiscount,
            plans: newPlans,
          },
        };
      });
    }
  };

  const addDataPlan = (network) => {
    const planId = `plan_${Date.now()}`;
    setDataRates((prev) => ({
      ...prev,
      [network]: {
        discount: prev[network]?.discount || 0,
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

  const addTVPlan = (provider) => {
    const planId = `plan_${Date.now()}`;
    setTvRates((prev) => ({
      ...prev,
      [provider]: {
        discount: prev[provider]?.discount || 0,
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
            Manage airtime, data, and cable TV pricing from eBills
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
                    Set airtime prices and profit margins
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
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Network</TableHead>
                    <TableHead>Base Price (₦)</TableHead>
                    <TableHead>Profit (₦)</TableHead>
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
                          ₦
                          {(
                            airtimeRates[network]?.finalPrice || 0
                          ).toLocaleString()}
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

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Data Rates</CardTitle>
                  <CardDescription>
                    Set data discounts for each provider
                  </CardDescription>
                </div>
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
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Network</TableHead>
                    <TableHead>Base Discount (%)</TableHead>
                    <TableHead>Final Discount (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.keys(EBILLS_RATES.data).map((provider) => (
                    <TableRow key={provider}>
                      <TableCell className="font-medium">
                        {EBILLS_RATES.data[provider].name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {EBILLS_RATES.data[provider].discount.toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={dataRates[provider]?.discount || 0}
                          onChange={(e) =>
                            updateProviderDiscount(
                              "data",
                              provider,
                              e.target.value
                            )
                          }
                          className="w-24"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tv" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>TV Rates</CardTitle>
                  <CardDescription>
                    Set TV discounts and service fees for each provider
                  </CardDescription>
                </div>
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
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Network</TableHead>
                    <TableHead>Base Discount (%)</TableHead>
                    <TableHead>Base Service Fee (₦)</TableHead>
                    <TableHead>Final Discount (%)</TableHead>
                    <TableHead>Final Service Fee (₦)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.keys(EBILLS_RATES.tv).map((provider) => (
                    <TableRow key={provider}>
                      <TableCell className="font-medium">
                        {EBILLS_RATES.tv[provider].name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {EBILLS_RATES.tv[provider].discount.toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          ₦
                          {EBILLS_RATES.tv[
                            provider
                          ].serviceFee.toLocaleString()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={tvRates[provider]?.discount || 0}
                          onChange={(e) =>
                            updateProviderDiscount(
                              "tv",
                              provider,
                              e.target.value
                            )
                          }
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={tvRates[provider]?.serviceFee || 0}
                          onChange={(e) =>
                            updateProviderServiceFee(
                              "tv",
                              provider,
                              e.target.value
                            )
                          }
                          className="w-24"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                      ₦{rate.finalPrice.toLocaleString()}
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
                      {dataRates[provider]?.discount || 0}% discount
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
                      {tvRates[provider]?.discount || 0}% discount, ₦
                      {tvRates[provider]?.serviceFee || 0} fee
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
