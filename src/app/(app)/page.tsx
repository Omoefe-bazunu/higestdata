import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { mockTransactions } from "@/lib/data";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <PageHeader title="Dashboard" description="Welcome back, here's a summary of your account." />
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Wallet Balance</CardTitle>
            <CardDescription>Your total account balance.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-headline text-primary">$1,250.75</div>
            <p className="text-xs text-muted-foreground mt-2">
              Equivalent to 0.018 BTC
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Fraud Protection</CardTitle>
            <CardDescription>Your account security status.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-accent text-accent-foreground">Active</Badge>
                <p className="text-sm font-medium">AI monitoring is enabled.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            A log of your recent account activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <div className="font-medium">{tx.asset}</div>
                  </TableCell>
                  <TableCell>{tx.type}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn({
                        "text-green-600 border-green-600": tx.status === "Completed",
                        "text-yellow-600 border-yellow-600": tx.status === "Pending",
                        "text-red-600 border-red-600": tx.status === "Failed",
                      })}
                    >
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{tx.date}</TableCell>
                  <TableCell className="text-right">
                    ${tx.amountInUSD.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
