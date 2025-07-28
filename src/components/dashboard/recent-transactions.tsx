import Link from 'next/link';
import { getTransactions } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
        case 'Completed': return 'default';
        case 'Pending': return 'secondary';
        case 'Failed': return 'destructive';
        default: return 'outline';
    }
}

export default async function RecentTransactions() {
  const transactions = await getTransactions();
  const recent = transactions.slice(0, 4);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest transactions.</CardDescription>
        </div>
        <Link href="/transactions">
            <Button variant="ghost" size="sm">View All</Button>
        </Link>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {recent.map((tx) => (
            <li key={tx.id} className="flex items-center gap-4">
              <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full",
                  tx.type === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              )}>
                {tx.type === 'credit' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <p className="font-medium">{tx.description}</p>
                <p className="text-sm text-muted-foreground">{tx.date}</p>
              </div>
              <div className="text-right">
                <p className={cn("font-semibold", tx.type === 'credit' ? 'text-green-600' : 'text-foreground')}>
                  {tx.type === 'credit' ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                </p>
                <Badge variant={getStatusBadgeVariant(tx.status)} className="mt-1">{tx.status}</Badge>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
