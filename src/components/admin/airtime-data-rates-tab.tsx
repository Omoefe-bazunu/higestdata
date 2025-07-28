'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '../ui/badge';

const mockVtPassData = {
  mtn: { name: 'MTN', discount: 1.5 },
  glo: { name: 'Glo', discount: 2.0 },
  airtel: { name: 'Airtel', discount: 1.8 },
  '9mobile': { name: '9mobile', discount: 1.7 },
};

const mockDataPlans = {
  mtn: [
    { id: 'mtn-1', name: '1.5GB - 30 Days', price: 1000 },
    { id: 'mtn-2', name: '5GB - 30 Days', price: 2500 },
  ],
  glo: [
    { id: 'glo-1', name: '2GB - 30 Days', price: 1000 },
    { id: 'glo-2', name: '8GB - 30 Days', price: 3000 },
  ],
  airtel: [
    { id: 'airtel-1', name: '1GB - 30 Days', price: 1000 },
    { id: 'airtel-2', name: '6GB - 30 Days', price: 2500 },
  ],
  '9mobile': [
    { id: '9mobile-1', name: '1.2GB - 30 Days', price: 1000 },
    { id: '9mobile-2', name: '7GB - 30 Days', price: 3000 },
  ],
}

type ProviderKey = keyof typeof mockVtPassData;

export default function AirtimeDataRatesTab() {
  const [providerDiscounts, setProviderDiscounts] = useState(mockVtPassData);
  const [dataPlans, setDataPlans] = useState(mockDataPlans);
  const [selectedProvider, setSelectedProvider] = useState<ProviderKey>('mtn');
  const { toast } = useToast();

  const handleDiscountChange = (provider: ProviderKey, discount: number) => {
    setProviderDiscounts(prev => ({
      ...prev,
      [provider]: { ...prev[provider], discount },
    }));
  };
  
  const handleDataPlanPriceChange = (provider: ProviderKey, planId: string, price: number) => {
    setDataPlans(prev => ({
        ...prev,
        [provider]: prev[provider].map(plan => plan.id === planId ? { ...plan, price } : plan)
    }))
  }

  const handleSaveChanges = () => {
    console.log('Saving Airtime/Data rates:', {providerDiscounts, dataPlans});
    toast({
      title: 'Rates Saved',
      description: `Airtime and Data rates have been updated.`,
    });
  }

  return (
    <Tabs defaultValue="airtime" className="w-full mt-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="airtime">Airtime Rates</TabsTrigger>
        <TabsTrigger value="data">Data Plan Rates</TabsTrigger>
      </TabsList>
      <TabsContent value="airtime">
        <Card>
          <CardHeader>
            <CardTitle>Airtime Purchase Discount</CardTitle>
            <CardDescription>Set the discount percentage for airtime purchases per provider. This is based on VTPass rates.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Network Provider</TableHead>
                        <TableHead>VTPass API Discount</TableHead>
                        <TableHead className="w-48">Your Discount (%)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {(Object.keys(providerDiscounts) as ProviderKey[]).map(key => (
                        <TableRow key={key}>
                            <TableCell className="font-medium">{providerDiscounts[key].name}</TableCell>
                            <TableCell>
                                <Badge variant="secondary">{mockVtPassData[key].discount}%</Badge>
                            </TableCell>
                            <TableCell>
                                <Input 
                                    type="number" 
                                    value={providerDiscounts[key].discount}
                                    onChange={(e) => handleDiscountChange(key, parseFloat(e.target.value))}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="data">
        <Card>
          <CardHeader>
            <CardTitle>Data Plan Pricing</CardTitle>
            <CardDescription>Set the price for data plans for each network provider.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
                <Label>Select Provider</Label>
                <Select value={selectedProvider} onValueChange={(val) => setSelectedProvider(val as ProviderKey)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a provider" />
                    </SelectTrigger>
                    <SelectContent>
                        {(Object.keys(dataPlans) as ProviderKey[]).map(key => (
                            <SelectItem key={key} value={key}>{providerDiscounts[key].name}</SelectItem>
                        ))}
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
                    {dataPlans[selectedProvider].map(plan => (
                        <TableRow key={plan.id}>
                            <TableCell className="font-medium">{plan.name}</TableCell>
                            <TableCell>
                                 <Input 
                                    type="number" 
                                    value={plan.price}
                                    onChange={(e) => handleDataPlanPriceChange(selectedProvider, plan.id, parseInt(e.target.value))}
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

// Dummy components for Tabs to avoid errors since they are used here
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"
import React from 'react';
import { Label } from '../ui/label';

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName
