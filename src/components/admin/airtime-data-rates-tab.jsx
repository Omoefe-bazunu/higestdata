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

// Real VTU Africa Data Plans (Portal Owners price = basePrice)
const VTU_DATA_PLANS = {
  MTNSME: [
    { id: "500W", size: "500MB", validity: "7 Days", basePrice: 490 },
    { id: "1000D", size: "1GB", validity: "7 Days", basePrice: 780 },
    { id: "1500W", size: "1.5GB", validity: "7 Days", basePrice: 975 },
    { id: "6000W", size: "6GB", validity: "7 Days", basePrice: 2460 },
    { id: "2000", size: "2GB", validity: "30 Days", basePrice: 1540 },
    { id: "3000", size: "3GB", validity: "30 Days", basePrice: 2310 },
    { id: "3500", size: "3.5GB", validity: "30 Days", basePrice: 2450 },
    { id: "5000", size: "5GB", validity: "30 Days", basePrice: 3850 },
    { id: "7000", size: "7GB", validity: "30 Days", basePrice: 3450 },
    { id: "10000", size: "10GB", validity: "30 Days", basePrice: 4470 },
  ],
  MTNAWOOF: [
    { id: "500D", size: "500MB", validity: "1 Day", basePrice: 690 },
    { id: "1000D", size: "1GB", validity: "1 Day", basePrice: 490 },
    { id: "1500D", size: "1.5GB", validity: "2 Days", basePrice: 590 },
    { id: "1400W", size: "1.4GB", validity: "7 Days", basePrice: 1756 },
    { id: "6000W", size: "6GB", validity: "7 Days", basePrice: 2430 },
    { id: "11000W", size: "11GB", validity: "7 Days", basePrice: 3400 },
    { id: "1800", size: "1.8GB", validity: "30 Days", basePrice: 5865 },
    { id: "10000", size: "10GB", validity: "30 Days", basePrice: 5865 },
    { id: "7000", size: "7GB", validity: "30 Days", basePrice: 6860 },
    { id: "6750", size: "6.75GB", validity: "30 Days", basePrice: 2920 },
  ],
  MTNGIFT: [
    { id: "40", size: "40MB", validity: "1 Day", basePrice: 52 },
    { id: "75", size: "75MB", validity: "1 Day", basePrice: 76 },
    { id: "500", size: "500MB", validity: "7 Days", basePrice: 490 },
    { id: "750", size: "750MB", validity: "3 Days", basePrice: 440 },
    { id: "1000D", size: "1GB", validity: "1 Day", basePrice: 490 },
    { id: "2000D", size: "2GB", validity: "2 Days", basePrice: 735 },
    { id: "2501D", size: "2.5GB", validity: "1 Day", basePrice: 735 },
    { id: "2500D", size: "2.5GB", validity: "2 Days", basePrice: 880 },
    { id: "3200D", size: "3.2GB", validity: "2 Days", basePrice: 980 },
    { id: "1000W", size: "1GB", validity: "7 Days", basePrice: 780 },
    { id: "1500W", size: "1.5GB", validity: "7 Days", basePrice: 975 },
    { id: "6000W", size: "6GB", validity: "7 Days", basePrice: 2415 },
    { id: "2000", size: "2GB", validity: "30 Days", basePrice: 1465 },
    { id: "2700", size: "2.7GB", validity: "30 Days", basePrice: 1950 },
    { id: "3500", size: "3.5GB", validity: "30 Days", basePrice: 2425 },
    { id: "5000", size: "5GB", validity: "30 Days", basePrice: 2580 },
    { id: "7000", size: "7GB", validity: "30 Days", basePrice: 3445 },
    { id: "10000", size: "10GB", validity: "30 Days", basePrice: 4375 },
    { id: "12500", size: "12.5GB", validity: "30 Days", basePrice: 5430 },
    { id: "16500", size: "16.5GB", validity: "30 Days", basePrice: 6355 },
    { id: "20000", size: "20GB", validity: "30 Days", basePrice: 7500 },
    { id: "25000", size: "25GB", validity: "30 Days", basePrice: 8900 },
    { id: "36000", size: "36GB", validity: "30 Days", basePrice: 10800 },
    { id: "75000", size: "75GB", validity: "30 Days", basePrice: 17470 },
  ],
  AIRTELSME: [
    { id: "150", size: "150MB", validity: "1 Day", basePrice: 65 },
    { id: "300", size: "300MB", validity: "2 Days", basePrice: 114 },
    { id: "600", size: "600MB", validity: "2 Days", basePrice: 220 },
    { id: "1000D", size: "1GB", validity: "1 Day", basePrice: 358 },
    { id: "3000W", size: "3GB", validity: "7 Days", basePrice: 1070 },
    { id: "7000W", size: "7GB", validity: "7 Days", basePrice: 2035 },
    { id: "4000", size: "4GB", validity: "30 Days", basePrice: 2450 },
    { id: "10000", size: "10GB", validity: "30 Days", basePrice: 3100 },
    { id: "13000", size: "13GB", validity: "30 Days", basePrice: 4925 },
  ],
  AIRTELCG: [
    { id: "100", size: "100MB", validity: "7 Days", basePrice: 105 },
    { id: "300", size: "300MB", validity: "7 Days", basePrice: 270 },
    { id: "500", size: "500MB", validity: "30 Days", basePrice: 490 },
    { id: "1000", size: "1GB", validity: "30 Days", basePrice: 980 },
    { id: "2000", size: "2GB", validity: "30 Days", basePrice: 1960 },
    { id: "5000", size: "5GB", validity: "30 Days", basePrice: 4900 },
    { id: "10000", size: "10GB", validity: "30 Days", basePrice: 9800 },
    { id: "15000", size: "15GB", validity: "30 Days", basePrice: 14700 },
    { id: "20000", size: "20GB", validity: "30 Days", basePrice: 19600 },
    { id: "250000", size: "250GB", validity: "30 Days", basePrice: 250000 },
  ],
  AIRTELGIFT: [
    { id: "75", size: "75MB", validity: "1 Day", basePrice: 79.9 },
    { id: "200", size: "200MB", validity: "3 Days", basePrice: 206 },
    { id: "500", size: "500MB", validity: "3 Days", basePrice: 496 },
    { id: "1000D", size: "1GB", validity: "1 Day", basePrice: 495 },
    { id: "1500D", size: "1.5GB", validity: "2 Days", basePrice: 595 },
    { id: "3000D", size: "3GB", validity: "2 Days", basePrice: 990 },
    { id: "1000W", size: "1GB", validity: "7 Days", basePrice: 790 },
    { id: "1500W", size: "1.5GB", validity: "7 Days", basePrice: 995 },
    { id: "6000W", size: "6GB", validity: "7 Days", basePrice: 2493 },
    { id: "2000", size: "2GB", validity: "30 Days", basePrice: 1485 },
    { id: "3000", size: "3GB", validity: "30 Days", basePrice: 1980 },
    { id: "4000", size: "4GB", validity: "30 Days", basePrice: 2502 },
    { id: "8000", size: "8GB", validity: "30 Days", basePrice: 2993 },
    { id: "10000", size: "10GB", validity: "30 Days", basePrice: 3990 },
    { id: "13000", size: "13GB", validity: "30 Days", basePrice: 4973 },
    { id: "18000", size: "18GB", validity: "30 Days", basePrice: 6000 },
    { id: "25000", size: "25GB", validity: "30 Days", basePrice: 8055 },
    { id: "35000", size: "35GB", validity: "30 Days", basePrice: 10000 },
    { id: "60000", size: "60GB", validity: "30 Days", basePrice: 15275 },
  ],
  GLOSME: [
    { id: "50", size: "50MB", validity: "1 Day", basePrice: 52 },
    { id: "125", size: "125MB", validity: "1 Day", basePrice: 98 },
    { id: "260", size: "260MB", validity: "2 Days", basePrice: 192 },
    { id: "350", size: "350MB", validity: "1 Day", basePrice: 100 },
    { id: "750N", size: "750MB", validity: "Night", basePrice: 119 },
    { id: "750", size: "750MB", validity: "1 Day", basePrice: 205 },
    { id: "1250D", size: "1.25GB", validity: "Sunday", basePrice: 200 },
    { id: "1500D", size: "1.5GB", validity: "1 Day", basePrice: 300 },
    { id: "2500D", size: "2.5GB", validity: "2 Days", basePrice: 500 },
    { id: "10000W", size: "10GB", validity: "7 Days", basePrice: 2000 },
  ],
  GLOCG: [
    { id: "200", size: "200MB", validity: "14 Days", basePrice: 90 },
    { id: "500", size: "500MB", validity: "30 Days", basePrice: 210 },
    { id: "1000", size: "1GB", validity: "30 Days", basePrice: 408 },
    { id: "2000", size: "2GB", validity: "30 Days", basePrice: 816 },
    { id: "3000", size: "3GB", validity: "30 Days", basePrice: 1225 },
    { id: "5000", size: "5GB", validity: "30 Days", basePrice: 2040 },
    { id: "10000", size: "10GB", validity: "30 Days", basePrice: 4050 },
  ],
  GLOGIFT: [
    { id: "50", size: "50MB", validity: "1 Day", basePrice: 51 },
    { id: "150", size: "150MB", validity: "1 Day", basePrice: 97 },
    { id: "350", size: "350MB", validity: "1 Day", basePrice: 191 },
    { id: "1000W", size: "1GB", validity: "14 Days", basePrice: 470 },
    { id: "3900", size: "3.9GB", validity: "30 Days", basePrice: 945 },
    { id: "7500", size: "7.5GB", validity: "30 Days", basePrice: 2380 },
    { id: "9000", size: "9.2GB", validity: "30 Days", basePrice: 1905 },
    { id: "10000", size: "10.8GB", validity: "30 Days", basePrice: 2865 },
    { id: "14000", size: "14GB", validity: "30 Days", basePrice: 3830 },
    { id: "18000", size: "18GB", validity: "30 Days", basePrice: 4760 },
  ],
  "9MOBILESME": [
    { id: "250", size: "250MB", validity: "14 Days", basePrice: 81 },
    { id: "500", size: "500MB", validity: "30 Days", basePrice: 135 },
    { id: "3500", size: "3.5GB", validity: "30 Days", basePrice: 905 },
    { id: "7000", size: "7GB", validity: "30 Days", basePrice: 1750 },
    { id: "15000", size: "15GB", validity: "30 Days", basePrice: 3100 },
  ],
  "9MOBILECG": [
    { id: "500", size: "500MB", validity: "30 Days", basePrice: 147 },
    { id: "1000", size: "1GB", validity: "30 Days", basePrice: 285 },
    { id: "1500", size: "1.5GB", validity: "30 Days", basePrice: 435 },
    { id: "2000", size: "2GB", validity: "30 Days", basePrice: 570 },
    { id: "3000", size: "3GB", validity: "30 Days", basePrice: 855 },
    { id: "4000", size: "4GB", validity: "30 Days", basePrice: 1140 },
    { id: "4500", size: "4.5GB", validity: "30 Days", basePrice: 1283 },
    { id: "5000", size: "5GB", validity: "30 Days", basePrice: 1425 },
    { id: "10000", size: "10GB", validity: "30 Days", basePrice: 2850 },
    { id: "11000", size: "11GB", validity: "30 Days", basePrice: 4125 },
    { id: "15000", size: "15GB", validity: "30 Days", basePrice: 4275 },
    { id: "20000", size: "20GB", validity: "30 Days", basePrice: 5700 },
    { id: "25000", size: "25GB", validity: "30 Days", basePrice: 7125 },
    { id: "30000", size: "30GB", validity: "30 Days", basePrice: 8550 },
    { id: "40000", size: "40GB", validity: "30 Days", basePrice: 11350 },
  ],
  "9MOBILEGIFT": [
    { id: "25", size: "25MB", validity: "1 Day", basePrice: 87 },
    { id: "2000D", size: "2GB", validity: "1 Day", basePrice: 850 },
    { id: "100", size: "100MB", validity: "7 Days", basePrice: 187 },
    { id: "250", size: "250MB", validity: "14 Days", basePrice: 160 },
    { id: "350", size: "350MB", validity: "7 Days", basePrice: 594 },
    { id: "1500W", size: "1.5GB", validity: "7 Days", basePrice: 705 },
    { id: "7000W", size: "7GB", validity: "7 Days", basePrice: 2510 },
    { id: "500", size: "500MB", validity: "14 Days", basePrice: 320 },
    { id: "5000W", size: "5GB", validity: "14 Days", basePrice: 2350 },
    { id: "1500", size: "1.5GB", validity: "30 Days", basePrice: 1660 },
    { id: "2000", size: "2GB", validity: "30 Days", basePrice: 1984 },
    { id: "3000", size: "3GB", validity: "30 Days", basePrice: 2480 },
    { id: "4500", size: "4.5GB", validity: "30 Days", basePrice: 3320 },
    { id: "5500", size: "5.5GB", validity: "30 Days", basePrice: 6840 },
    { id: "11000", size: "11GB", validity: "30 Days", basePrice: 6630 },
    { id: "15000", size: "15GB", validity: "30 Days", basePrice: 8300 },
    { id: "25000", size: "25GB", validity: "30 Days", basePrice: 17820 },
  ],
};

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

  const initializeDataPlans = () => {
    setIsFetching(true);
    const provider = selectedDataProvider;
    const source = VTU_DATA_PLANS[provider] || [];

    const plans = {};
    source.forEach((p) => {
      const profit = Math.round(p.basePrice * 0.05);
      plans[p.id] = {
        name: `${p.size} (${p.validity})`, // ← This was missing!
        size: p.size,
        validity: p.validity,
        basePrice: p.basePrice,
        profit,
        finalPrice: p.basePrice + profit,
      };
    });

    setDataRates((prev) => ({
      ...prev,
      [provider]: { name: provider, plans },
    }));
    toast({ title: "Success", description: `${provider} plans loaded` });
    setIsFetching(false);
  };

  const initializeTvPlans = () => {
    setIsFetching(true);
    const provider = selectedTvProvider;
    const source = CABLE_PLANS[provider] || [];

    const plans = {};
    source.forEach((p) => {
      const profit = Math.round(p.basePrice * 0.03);
      plans[p.id] = {
        name: p.name,
        basePrice: p.basePrice,
        profit,
        finalPrice: p.basePrice + profit,
      };
    });

    setTvRates((prev) => ({
      ...prev,
      [provider]: { name: provider.toUpperCase(), plans },
    }));
    toast({ title: "Success", description: `${provider} plans loaded` });
    setIsFetching(false);
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
                    {Object.keys(VTU_DATA_PLANS).map((k) => (
                      <SelectItem key={k} value={k}>
                        {k}
                      </SelectItem>
                    ))}
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
                  {Object.entries(tvRates[selectedTvProvider]?.plans || {}).map(
                    ([id, p]) => (
                      <TableRow key={id}>
                        <TableCell>
                          <Input
                            value={p.name}
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
                            value={p.basePrice}
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
                            value={p.profit}
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
                        <TableCell>₦{p.finalPrice?.toLocaleString()}</TableCell>
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
