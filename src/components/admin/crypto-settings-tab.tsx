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
import { Save, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const initialWallets = {
    BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    ETH: '0x1234567890123456789012345678901234567890',
    USDT: '0xabcdef1234567890abcdef1234567890abcdef',
}

export default function CryptoSettingsTab() {
  const [rates, setRates] = useState<CryptoCoin[]>([]);
  const [profitMargin, setProfitMargin] = useState(2.5);
  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState(initialWallets);
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
    console.log('Saving settings:', { profitMargin, wallets });
    toast({
      title: 'Settings Saved',
      description: `Crypto settings and wallet addresses have been updated.`,
    });
  };

  const handleWalletChange = (symbol: keyof typeof wallets, address: string) => {
    setWallets(prev => ({...prev, [symbol]: address }));
  }

  const calculateSellPrice = (price: number) => {
    return price * (1 - profitMargin / 100);
  };
  
  const handleCopy = (address: string) => {
        navigator.clipboard.writeText(address);
        toast({
            title: "Copied to clipboard!",
            description: "Wallet address has been copied.",
        });
    }

  return (
    <div className="space-y-6">
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Company Wallet Addresses</CardTitle>
          <CardDescription>These are the wallet addresses displayed to users when they sell crypto.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {Object.entries(wallets).map(([symbol, address]) => (
                <div key={symbol} className="space-y-2">
                    <Label htmlFor={`${symbol}-wallet`}>{symbol} Wallet Address</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            id={`${symbol}-wallet`}
                            value={address}
                            onChange={(e) => handleWalletChange(symbol as keyof typeof wallets, e.target.value)}
                        />
                         <Button type="button" variant="ghost" size="icon" onClick={() => handleCopy(address)}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ))}
        </CardContent>
      </Card>
      
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
      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save All Settings
        </Button>
      </div>
    </div>
  );
}
