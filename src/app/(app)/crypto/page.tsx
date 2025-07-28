
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRightLeft } from 'lucide-react';

function CryptoTradeForm({ type }: { type: 'Buy' | 'Sell' }) {
    const [amount, setAmount] = useState('');
    const [crypto, setCrypto] = useState('BTC');
    const rate = 65432.10; // Mock rate for BTC

    const calculatedValue = amount ? (parseFloat(amount) / rate).toFixed(8) : '0.00';

    return (
        <form className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="crypto">Cryptocurrency</Label>
                <Select name="crypto" value={crypto} onValueChange={setCrypto}>
                    <SelectTrigger id="crypto">
                        <SelectValue placeholder="Select Crypto" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                        <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                        <SelectItem value="USDT">Tether (USDT)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                    <Label htmlFor="amount">{type === 'Buy' ? 'Amount to Spend (USD)' : 'Amount to Sell (USD)'}</Label>
                    <Input id="amount" name="amount" type="number" placeholder="e.g., 100" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                
                <div className="text-center sm:hidden">
                    <ArrowRightLeft className="h-4 w-4 text-muted-foreground mx-auto" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="crypto-value">{type === 'Buy' ? 'You Get (approx.)' : 'You Send (approx.)'}</Label>
                    <Input id="crypto-value" readOnly value={`${calculatedValue} ${crypto}`} className="bg-muted" />
                </div>
            </div>
            
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Current Rate</span>
                  <span className="font-semibold text-primary">1 {crypto} ≈ ${rate.toLocaleString()}</span>
                </div>
                 <div className="flex justify-between items-center text-sm mt-2">
                  <span className="text-muted-foreground">Transaction Fee</span>
                  <span className="font-semibold">0.5%</span>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full">
                {type} Crypto
            </Button>
        </form>
    )
}

export default function CryptoPage() {
    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold font-headline">Trade Cryptocurrency</h1>
                <p className="text-muted-foreground">
                    Instantly buy and sell top cryptocurrencies at the best rates.
                </p>
            </div>
            
            <Card>
                <Tabs defaultValue="buy" className="w-full">
                    <CardHeader>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="buy">Buy</TabsTrigger>
                            <TabsTrigger value="sell">Sell</TabsTrigger>
                        </TabsList>
                    </CardHeader>
                    <CardContent>
                        <TabsContent value="buy">
                            <CardTitle className="mb-2 text-2xl">Buy Crypto</CardTitle>
                            <CardDescription className="mb-6">Select a currency and enter the amount you wish to purchase.</CardDescription>
                            <CryptoTradeForm type="Buy" />
                        </TabsContent>
                        <TabsContent value="sell">
                            <CardTitle className="mb-2 text-2xl">Sell Crypto</CardTitle>
                            <CardDescription className="mb-6">Your wallet will be credited instantly upon confirmation.</CardDescription>
                            <CryptoTradeForm type="Sell" />
                        </TabsContent>
                    </CardContent>
                </Tabs>
            </Card>
        </div>
    );
}
