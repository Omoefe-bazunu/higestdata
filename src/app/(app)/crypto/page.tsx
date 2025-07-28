
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRightLeft, Copy, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock admin wallet addresses, in a real app this would come from a secure source
const ADMIN_WALLETS = {
    BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    ETH: '0x1234567890123456789012345678901234567890',
    USDT: '0xabcdef1234567890abcdef1234567890abcdef',
};

const CRYPTO_OPTIONS = [
    { value: 'BTC', label: 'Bitcoin (BTC)' },
    { value: 'ETH', label: 'Ethereum (ETH)' },
    { value: 'USDT', label: 'Tether (USDT)' },
]


function CryptoTradeForm({ type }: { type: 'Buy' | 'Sell' }) {
    const [amount, setAmount] = useState('');
    const [crypto, setCrypto] = useState('BTC');
    const rate = 65432.10; // Mock rate for BTC
    const { toast } = useToast();

    const calculatedValue = amount ? (parseFloat(amount) / rate).toFixed(8) : '0.00';
    
    const handleCopy = (address: string) => {
        navigator.clipboard.writeText(address);
        toast({
            title: "Copied to clipboard!",
            description: "Wallet address has been copied.",
        });
    }

    const selectedCrypto = CRYPTO_OPTIONS.find(c => c.value === crypto);

    return (
        <form className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="crypto">Cryptocurrency</Label>
                <Select name="crypto" value={crypto} onValueChange={setCrypto}>
                    <SelectTrigger id="crypto">
                         <SelectValue placeholder="Select Crypto">
                            {selectedCrypto ? selectedCrypto.label : 'Select Crypto'}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {CRYPTO_OPTIONS.map(option => (
                             <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
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

            {type === 'Buy' && (
                <div className="space-y-2">
                    <Label htmlFor="walletAddress">Your Receiving Wallet Address</Label>
                    <Input id="walletAddress" name="walletAddress" type="text" placeholder={`Enter your ${crypto} wallet address`} />
                </div>
            )}
            
            {type === 'Sell' && (
                <>
                    <Card className="bg-muted/50">
                        <CardHeader className="p-4">
                            <CardDescription>Send your {crypto} to the address below. Your account will be credited after confirmation.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="flex items-center justify-between gap-2 p-3 rounded-md border bg-background">
                                <code className="text-sm truncate">{ADMIN_WALLETS[crypto as keyof typeof ADMIN_WALLETS]}</code>
                                <Button type="button" variant="ghost" size="icon" onClick={() => handleCopy(ADMIN_WALLETS[crypto as keyof typeof ADMIN_WALLETS])}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                     <div className="space-y-2">
                        <Label htmlFor="sendingWalletAddress">Your Sending Wallet Address</Label>
                        <Input id="sendingWalletAddress" name="sendingWalletAddress" type="text" placeholder={`The ${crypto} address you sent from`} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="proof">Upload Screenshot Proof</Label>
                        <Input id="proof" name="proof" type="file" className="pt-2" />
                    </div>
                </>
            )}
            
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Current Rate</span>
                  <span className="font-semibold text-primary">1 {crypto} ≈ ${rate.toLocaleString()}</span>
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
