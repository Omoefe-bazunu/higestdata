import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div>
      <PageHeader title="Admin Dashboard" description="Overview of the application." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
        <Card>
            <CardHeader>
                <CardTitle>Total Users</CardTitle>
                <CardDescription>Number of registered users.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-3xl font-bold">1,234</p>
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>Pending Trades</CardTitle>
                <CardDescription>Gift cards awaiting verification.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-3xl font-bold">12</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
