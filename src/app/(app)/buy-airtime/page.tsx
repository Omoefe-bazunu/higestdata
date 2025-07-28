import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function PurchaseForm({ type }: { type: 'Airtime' | 'Data' }) {
    return (
        <form className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="network">Network Provider</Label>
                <Select name="network">
                    <SelectTrigger id="network">
                        <SelectValue placeholder="Select Network" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="mtn">MTN</SelectItem>
                        <SelectItem value="glo">Glo</SelectItem>
                        <SelectItem value="airtel">Airtel</SelectItem>
                        <SelectItem value="9mobile">9mobile</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" type="tel" placeholder="08012345678" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="amount">{type === 'Airtime' ? 'Amount' : 'Data Plan'}</Label>
                {type === 'Airtime' ? (
                     <Input id="amount" name="amount" type="number" placeholder="e.g., 1000" />
                ) : (
                    <Select name="data-plan">
                        <SelectTrigger id="data-plan">
                            <SelectValue placeholder="Select Data Plan" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1gb">1.5GB - 30 Days - ₦1,000</SelectItem>
                            <SelectItem value="5gb">5GB - 30 Days - ₦2,500</SelectItem>
                            <SelectItem value="10gb">12GB - 30 Days - ₦5,000</SelectItem>
                        </SelectContent>
                    </Select>
                )}
            </div>
            
            <p className="text-sm text-muted-foreground">The amount will be deducted from your wallet balance.</p>

            <Button type="submit" className="w-full">
                Purchase {type}
            </Button>
        </form>
    )
}

export default function BuyAirtimePage() {
    return (
        <div className="space-y-8 max-w-md mx-auto">
            <div>
                <h1 className="text-3xl font-bold font-headline">Buy Airtime & Data</h1>
                <p className="text-muted-foreground">
                    Instantly top up any phone number. It's fast and easy.
                </p>
            </div>
            
            <Tabs defaultValue="airtime" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="airtime">Airtime</TabsTrigger>
                    <TabsTrigger value="data">Data</TabsTrigger>
                </TabsList>
                <TabsContent value="airtime">
                    <Card>
                        <CardHeader>
                            <CardTitle>Buy Airtime</CardTitle>
                            <CardDescription>Enter details to top up airtime.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <PurchaseForm type="Airtime" />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="data">
                    <Card>
                         <CardHeader>
                            <CardTitle>Buy Data</CardTitle>
                            <CardDescription>Choose a data plan that suits you.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <PurchaseForm type="Data" />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
