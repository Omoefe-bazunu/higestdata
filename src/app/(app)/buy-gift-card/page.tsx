import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BuyGiftCardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Buy Gift Card" description="Purchase gift cards from various brands." />
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>This feature is currently under development.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">The user interface and logic for buying gift cards will be implemented here. Please check back later!</p>
        </CardContent>
      </Card>
    </div>
  );
}
