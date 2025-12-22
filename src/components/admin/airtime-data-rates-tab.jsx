"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader, Save, Download, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Real Cable TV Plans from VTU docs
const CABLE_PLANS = {
  gotv: [
    { id: "gotv_smallie", name: "GOtv Smallie", basePrice: 1900 },
    { id: "gotv_jinja", name: "GOtv Jinja", basePrice: 3900 },
    { id: "gotv_jolli", name: "GOtv Jolli", basePrice: 5800 },
    { id: "gotv_max", name: "GOtv Max", basePrice: 8500 },
  ],
  dstv: [
    { id: "dstv_padi", name: "DStv Padi", basePrice: 4400 },
    { id: "dstv_yanga", name: "DStv Yanga", basePrice: 6000 },
    { id: "dstv_confam", name: "DStv Confam", basePrice: 11000 },
    { id: "dstv_compact", name: "DStv Compact", basePrice: 19000 },
    { id: "dstv_compact_plus", name: "DStv Compact Plus", basePrice: 30000 },
    { id: "dstv_premium", name: "DStv Premium", basePrice: 44500 },
  ],
  startimes: [
    { id: "startimes_nova", name: "Startimes Nova", basePrice: 1900 },
    { id: "startimes_basic", name: "Startimes Basic", basePrice: 3700 },
    { id: "startimes_smart", name: "Startimes Smart", basePrice: 4700 },
    { id: "startimes_classic", name: "Startimes Classic", basePrice: 5500 },
    { id: "startimes_super", name: "Startimes Super", basePrice: 9000 },
  ],
};

export default function AdminRatesDashboard() {
  const [airtimeRates, setAirtimeRates] = useState({});
  const [dataRates, setDataRates] = useState({});
  const [tvRates, setTvRates] = useState({});
  const [selectedDataProvider, setSelectedDataProvider] = useState("MTNSME");
  const [selectedTvProvider, setSelectedTvProvider] = useState("gotv");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAllRates();
  }, []);

  const loadAllRates = async () => {
    setIsLoading(true);
    const [a, d, t] = await Promise.all([
      getDoc(doc(firestore, "settings", "airtimeRates")),
      getDoc(doc(firestore, "settings", "dataRates")),
      getDoc(doc(firestore, "settings", "tvRates")),
    ]);
    setAirtimeRates(a.exists() ? a.data().rates || {} : {});
    setDataRates(d.exists() ? d.data().rates || {} : {});
    setTvRates(t.exists() ? t.data().rates || {} : {});
    setIsLoading(false);
  };

  const initializeAirtime = () => {
    const defaults = {
      mtn: { name: "MTN", discountPercentage: 3 },
      airtel: { name: "Airtel", discountPercentage: 3 },
      glo: { name: "Glo", discountPercentage: 3 },
      "9mobile": { name: "9mobile", discountPercentage: 3 },
    };
    setAirtimeRates(defaults);
    toast({ title: "Done", description: "Airtime rates initialized" });
  };

  const initializeDataPlans = async () => {
    setIsFetching(true);
    const provider = selectedDataProvider; // e.g., 'MTN' or 'mtn'

    try {
      // Fetch fresh plans from Ebills via our backend proxy
      // Note: We convert provider to lowercase for the API call
      const res = await fetch(
        `https://higestdata-proxy.onrender.com/api/ebills/variations?service_id=${provider.toLowerCase()}`
      );
      const json = await res.json();

      if (!json.data || !Array.isArray(json.data)) {
        throw new Error("Invalid response from Ebills");
      }

      const source = json.data;
      const plans = {};

      source.forEach((p) => {
        // Ebills returns: variation_id, data_plan, price
        // DOCS CONFIRMATION: The correct field for the name is 'data_plan'

        const basePrice = parseFloat(p.price);
        const profit = Math.round(basePrice * 0.05); // Default 5% profit

        plans[p.variation_id] = {
          // UPDATE: Use 'data_plan' strictly. 'name' does not exist in the API docs.
          name: p.data_plan || "Unknown Plan",
          variation_id: p.variation_id,
          basePrice: basePrice,
          profit,
          finalPrice: basePrice + profit,
        };
      });

      setDataRates((prev) => ({
        ...prev,
        [provider]: { name: provider.toUpperCase(), plans },
      }));

      toast({
        title: "Success",
        description: `${provider} plans loaded from Ebills`,
      });
    } catch (error) {
      console.error("Failed to load plans:", error);
      toast({
        title: "Error",
        description: "Failed to fetch plans from Ebills",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const initializeTvPlans = async () => {
    setIsFetching(true);
    const provider = selectedTvProvider; // 'dstv', 'gotv', or 'startimes'

    try {
      const res = await fetch(
        `https://higestdata-proxy.onrender.com/api/ebills/tv-variations?service_id=${provider}`
      );
      const json = await res.json();

      if (!json.data || !Array.isArray(json.data)) {
        throw new Error("Invalid response from provider");
      }

      const plans = {};
      json.data.forEach((p) => {
        // Handle various possible price keys from Ebills
        const basePrice = parseFloat(p.amount || p.price || 0);
        const profit = 100; // Default profit

        // Handle missing name keys (variation_name, name, or description)
        const planName =
          p.name || p.variation_name || p.description || "Unnamed Plan";

        plans[p.variation_id] = {
          name: planName,
          basePrice: basePrice,
          profit,
          finalPrice: basePrice + profit,
        };
      });

      setTvRates((prev) => ({
        ...prev,
        [provider]: { name: provider.toUpperCase(), plans },
      }));

      toast({
        title: "Success",
        description: `${provider.toUpperCase()} plans loaded from Ebills`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to fetch plans",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  // Update functions (airtime, data, tv) - unchanged logic
  const updateAirtime = (net, val) =>
    setAirtimeRates((p) => ({
      ...p,
      [net]: { ...p[net], discountPercentage: Number(val) || 0 },
    }));
  const updateData = (prov, id, field, val) => {
    setDataRates((p) => ({
      ...p,
      [prov]: {
        ...p[prov],
        plans: {
          ...p[prov]?.plans,
          [id]: {
            ...p[prov]?.plans?.[id],
            [field]: field === "name" ? val : Number(val) || 0,
            finalPrice:
              field === "basePrice"
                ? Number(val) + (p[prov]?.plans?.[id]?.profit || 0)
                : field === "profit"
                ? (p[prov]?.plans?.[id]?.basePrice || 0) + Number(val)
                : p[prov]?.plans?.[id]?.finalPrice,
          },
        },
      },
    }));
  };
  const updateTv = (prov, id, field, val) => {
    setTvRates((p) => ({
      ...p,
      [prov]: {
        ...p[prov],
        plans: {
          ...p[prov]?.plans,
          [id]: {
            ...p[prov]?.plans?.[id],
            [field]: field === "name" ? val : Number(val) || 0,
            finalPrice:
              field === "basePrice"
                ? Number(val) + (p[prov]?.plans?.[id]?.profit || 0)
                : field === "profit"
                ? (p[prov]?.plans?.[id]?.basePrice || 0) + Number(val)
                : p[prov]?.plans?.[id]?.finalPrice,
          },
        },
      },
    }));
  };

  const addDataPlan = () => {
    const id = `custom_${Date.now()}`;
    setDataRates((p) => ({
      ...p,
      [selectedDataProvider]: {
        ...p[selectedDataProvider],
        plans: {
          ...p[selectedDataProvider]?.plans,
          [id]: {
            name: "Custom",
            basePrice: 1000,
            profit: 50,
            finalPrice: 1050,
          },
        },
      },
    }));
  };
  const addTvPlan = () => {
    const id = `custom_${Date.now()}`;
    setTvRates((p) => ({
      ...p,
      [selectedTvProvider]: {
        ...p[selectedTvProvider],
        plans: {
          ...p[selectedTvProvider]?.plans,
          [id]: {
            name: "Custom Plan",
            basePrice: 5000,
            profit: 200,
            finalPrice: 5200,
          },
        },
      },
    }));
  };

  const removeData = (prov, id) =>
    setDataRates((p) => {
      delete p[prov]?.plans?.[id];
      return { ...p };
    });
  const removeTv = (prov, id) =>
    setTvRates((p) => {
      delete p[prov]?.plans?.[id];
      return { ...p };
    });

  const saveAll = async () => {
    setIsSaving(true);
    await Promise.all([
      setDoc(
        doc(firestore, "settings", "airtimeRates"),
        { rates: airtimeRates },
        { merge: true }
      ),
      setDoc(
        doc(firestore, "settings", "dataRates"),
        { rates: dataRates },
        { merge: true }
      ),
      setDoc(
        doc(firestore, "settings", "tvRates"),
        { rates: tvRates },
        { merge: true }
      ),
    ]);
    toast({ title: "Saved", description: "All rates updated" });
    setIsSaving(false);
  };

  if (isLoading)
    return (
      <div className="flex justify-center p-12">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">VTU Rates Management</h1>
          <p className="text-muted-foreground">Airtime • Data • Cable TV</p>
        </div>
        <Button onClick={saveAll} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save All"}
        </Button>
      </div>

      <Tabs defaultValue="airtime">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="airtime">Airtime</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="tv">TV</TabsTrigger>
        </TabsList>

        {/* AIRTIME TAB */}
        <TabsContent value="airtime">
          <Card>
            <CardHeader className="flex-row justify-between">
              <div>
                <CardTitle>Airtime Discount Rates</CardTitle>
              </div>
              <Button onClick={initializeAirtime} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" /> Initialize
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Network</TableHead>
                    <TableHead>Discount %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.keys(airtimeRates).map((net) => (
                    <TableRow key={net}>
                      <TableCell>{airtimeRates[net].name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={airtimeRates[net].discountPercentage || 0}
                          onChange={(e) => updateAirtime(net, e.target.value)}
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

        {/* DATA TAB */}
        <TabsContent value="data">
          <Card>
            <CardHeader className="flex-row justify-between">
              <CardTitle>Data Plans</CardTitle>
              <div className="flex gap-2">
                <Select
                  value={selectedDataProvider}
                  onValueChange={setSelectedDataProvider}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mtn">MTN</SelectItem>
                    <SelectItem value="airtel">Airtel</SelectItem>
                    <SelectItem value="glo">Glo</SelectItem>
                    <SelectItem value="9mobile">9mobile</SelectItem>
                    <SelectItem value="smile">Smile</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={initializeDataPlans}
                  disabled={isFetching}
                  variant="outline"
                >
                  {isFetching ? (
                    <Loader className="mr-2" />
                  ) : (
                    <Download className="mr-2" />
                  )}{" "}
                  Load Plans
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={addDataPlan}
                variant="outline"
                size="sm"
                className="mb-4"
              >
                <Plus /> Add Custom
              </Button>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Base ₦</TableHead>
                    <TableHead>Profit ₦</TableHead>
                    <TableHead>Sell ₦</TableHead>
                    <TableHead>Remove</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(
                    dataRates[selectedDataProvider]?.plans || {}
                  ).map(([id, p]) => (
                    <TableRow key={id}>
                      <TableCell>
                        <Input
                          value={p.name}
                          onChange={(e) =>
                            updateData(
                              selectedDataProvider,
                              id,
                              "name",
                              e.target.value
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={p.basePrice}
                          onChange={(e) =>
                            updateData(
                              selectedDataProvider,
                              id,
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
                          value={p.profit}
                          onChange={(e) =>
                            updateData(
                              selectedDataProvider,
                              id,
                              "profit",
                              e.target.value
                            )
                          }
                          className="w-32"
                        />
                      </TableCell>
                      <TableCell>₦{p.finalPrice?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeData(selectedDataProvider, id)}
                        >
                          <Trash2 className="text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TV TAB */}
        <TabsContent value="tv">
          <Card>
            <CardHeader className="flex-row justify-between">
              <CardTitle>Cable TV Plans</CardTitle>
              <div className="flex gap-2">
                <Select
                  value={selectedTvProvider}
                  onValueChange={setSelectedTvProvider}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gotv">GOtv</SelectItem>
                    <SelectItem value="dstv">DStv</SelectItem>
                    <SelectItem value="startimes">Startimes</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={initializeTvPlans}
                  disabled={isFetching}
                  variant="outline"
                >
                  {isFetching ? (
                    <Loader className="mr-2" />
                  ) : (
                    <Download className="mr-2" />
                  )}{" "}
                  Load Plans
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={addTvPlan}
                variant="outline"
                size="sm"
                className="mb-4"
              >
                <Plus /> Add Custom
              </Button>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Base ₦</TableHead>
                    <TableHead>Profit ₦</TableHead>
                    <TableHead>Sell ₦</TableHead>
                    <TableHead>Remove</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Inside <TabsContent value="tv"> -> <TableBody> */}
                  {Object.entries(tvRates[selectedTvProvider]?.plans || {}).map(
                    ([id, p]) => (
                      <TableRow key={id}>
                        <TableCell>
                          <Input
                            value={p.name || ""}
                            onChange={(e) =>
                              updateTv(
                                selectedTvProvider,
                                id,
                                "name",
                                e.target.value
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={p.basePrice || 0}
                            onChange={(e) =>
                              updateTv(
                                selectedTvProvider,
                                id,
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
                            value={p.profit || 0}
                            onChange={(e) =>
                              updateTv(
                                selectedTvProvider,
                                id,
                                "profit",
                                e.target.value
                              )
                            }
                            className="w-32"
                          />
                        </TableCell>
                        <TableCell>
                          ₦{(p.finalPrice || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTv(selectedTvProvider, id)}
                          >
                            <Trash2 className="text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
