import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SellGiftCardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Sell Gift Card" description="Exchange your gift cards for cash." />
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>This feature is currently under development.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">The user interface and logic for selling gift cards will be implemented here. Please check back later!</p>
        </CardContent>
      </Card>
    </div>
  );
}
