import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AirtimeToCashPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Airtime to Cash" description="Convert your excess airtime into cash." />
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>This feature is currently under development.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">The user interface and logic for converting airtime to cash will be implemented here. Please check back later!</p>
        </CardContent>
      </Card>
    </div>
  );
}
