'use client';

import { useState, useEffect } from 'react';
import { getCryptoRates } from '@/lib/data';
import type { CryptoCoin } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CryptoSettingsTab() {
  const [rates, setRates] = useState<CryptoCoin[]>([]);
  const [profitMargin, setProfitMargin] = useState(2.5);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const data = await getCryptoRates();
      setRates(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleSave = () => {
    // Simulate saving to a backend
    console.log('Saving profit margin:', profitMargin);
    toast({
      title: 'Settings Saved',
      description: `Crypto profit margin has been set to ${profitMargin}%.`,
    });
  };

  const calculateSellPrice = (price: number) => {
    return price * (1 - profitMargin / 100);
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Cryptocurrency Rate Settings</CardTitle>
        <CardDescription>Set the profit margin for crypto transactions based on live market data.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-4">
            <h3 className="font-semibold text-lg">Profit Margin</h3>
            <div className="space-y-2">
              <Label htmlFor="profit-margin">Margin (%)</Label>
              <Input
                id="profit-margin"
                type="number"
                value={profitMargin}
                onChange={(e) => setProfitMargin(parseFloat(e.target.value))}
                step="0.1"
              />
            </div>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save Margin
            </Button>
             <p className="text-sm text-muted-foreground">This margin will be deducted from the market price to calculate your sell price.</p>
          </div>
          <div className="md:col-span-2">
            <h3 className="font-semibold text-lg">Live Price Preview</h3>
            <p className="text-sm text-muted-foreground mb-4">This table shows the final sell price after applying the margin.</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead className="text-right">Market Price</TableHead>
                  <TableHead className="text-right">Your Sell Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-6 w-20 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-6 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  rates.map((coin) => (
                    <TableRow key={coin.id}>
                      <TableCell className="font-medium">{coin.name}</TableCell>
                      <TableCell className="text-right">${coin.price.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        ${calculateSellPrice(coin.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
