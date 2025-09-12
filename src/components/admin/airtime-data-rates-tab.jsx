"use client";

import { useState, useEffect } from "react";
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
import { Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "../ui/badge";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
import React from "react";
import { Label } from "../ui/label";

export default function AirtimeDataRatesTab() {
  const [providerDiscounts, setProviderDiscounts] = useState({});
  const [dataPlans, setDataPlans] = useState({});
  const [selectedProvider, setSelectedProvider] = useState("mtn-data");
  const { toast } = useToast();

  // Fetch Airtime discounts
  useEffect(() => {
    async function fetchAirtimeRates() {
      try {
        const res = await fetch("/api/vtpass/airtime");
        const data = await res.json();

        if (data.error) throw new Error(data.error);

        const discounts = {};
        data.content?.variations?.forEach((item) => {
          discounts[item.variation_code] = {
            name: item.name,
            discount: item.fixedPrice || 0,
          };
        });

        setProviderDiscounts(discounts);
      } catch (err) {
        console.error("Error fetching airtime rates:", err);
      }
    }
    fetchAirtimeRates();
  }, []);

  // Fetch Data Plans for selected provider
  useEffect(() => {
    async function fetchDataPlans() {
      try {
        const res = await fetch(
          `/api/vtpass/data?provider=${selectedProvider}`
        );
        const data = await res.json();

        if (data.error) throw new Error(data.error);

        setDataPlans((prev) => ({
          ...prev,
          [selectedProvider]: data.content?.variations || [],
        }));
      } catch (err) {
        console.error("Error fetching data plans:", err);
      }
    }
    fetchDataPlans();
  }, [selectedProvider]);

  const handleDiscountChange = (provider, discount) => {
    setProviderDiscounts((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], discount },
    }));
  };

  const handleDataPlanPriceChange = (provider, planId, price) => {
    setDataPlans((prev) => ({
      ...prev,
      [provider]: prev[provider].map((plan) =>
        plan.variation_code === planId ? { ...plan, fixedPrice: price } : plan
      ),
    }));
  };

  const handleSaveChanges = async () => {
    try {
      // Save Airtime Discounts
      await fetch("/api/rates/airtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerDiscounts }),
      });

      // Save Data Plans
      await fetch("/api/rates/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataPlans }),
      });

      toast({
        title: "✅ Rates Saved",
        description: "Your Airtime & Data plan overrides have been stored.",
      });
    } catch (err) {
      console.error("Error saving rates:", err);
      toast({
        title: "❌ Error",
        description: "Could not save rates. Try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Tabs defaultValue="airtime" className="w-full mt-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="airtime">Airtime Rates</TabsTrigger>
        <TabsTrigger value="data">Data Plan Rates</TabsTrigger>
      </TabsList>

      {/* Airtime Tab */}
      <TabsContent value="airtime">
        <Card>
          <CardHeader>
            <CardTitle>Airtime Purchase Discount</CardTitle>
            <CardDescription>
              Set the discount percentage for airtime purchases per provider.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Network Provider</TableHead>
                  <TableHead>VTPass API Rate</TableHead>
                  <TableHead className="w-48">Your Discount (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.keys(providerDiscounts).map((key) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium">
                      {providerDiscounts[key].name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        ₦{providerDiscounts[key].discount}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={providerDiscounts[key].discount}
                        onChange={(e) =>
                          handleDiscountChange(key, parseFloat(e.target.value))
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Data Tab */}
      <TabsContent value="data">
        <Card>
          <CardHeader>
            <CardTitle>Data Plan Pricing</CardTitle>
            <CardDescription>
              Set the price for data plans for each network provider.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label>Select Provider</Label>
              <Select
                value={selectedProvider}
                onValueChange={(val) => setSelectedProvider(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(dataPlans).map((key) => (
                    <SelectItem key={key} value={key}>
                      {key.toUpperCase()}
                    </SelectItem>
                  ))}
                  <SelectItem value="mtn-data">MTN</SelectItem>
                  <SelectItem value="glo-data">Glo</SelectItem>
                  <SelectItem value="airtel-data">Airtel</SelectItem>
                  <SelectItem value="etisalat-data">9mobile</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data Plan</TableHead>
                  <TableHead className="w-48">Price (₦)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataPlans[selectedProvider]?.map((plan) => (
                  <TableRow key={plan.variation_code}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={plan.fixedPrice}
                        onChange={(e) =>
                          handleDataPlanPriceChange(
                            selectedProvider,
                            plan.variation_code,
                            parseInt(e.target.value)
                          )
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSaveChanges}>
          <Save className="mr-2 h-4 w-4" />
          Save All Changes
        </Button>
      </div>
    </Tabs>
  );
}

// Tabs components
const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;
