import { getWalletBalance } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default async function WalletSummary() {
  const balance = await getWalletBalance();

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-muted-foreground font-medium">Wallet Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-4xl md:text-5xl font-bold font-headline text-primary whitespace-nowrap">
            ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground w-full">
                    <ArrowUpRight className="mr-2 h-5 w-5" />
                    Fund Wallet
                </Button>
                <Button size="lg" variant="outline" className="w-full">
                    <ArrowDownLeft className="mr-2 h-5 w-5" />
                    Withdraw
                </Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
