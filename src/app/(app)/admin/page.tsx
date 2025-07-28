import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminDashboardTab from '@/components/admin/admin-dashboard-tab';
import AllTransactionsTab from '@/components/admin/all-transactions-tab';
import CryptoSettingsTab from '@/components/admin/crypto-settings-tab';
import GiftCardRatesTab from '@/components/admin/gift-card-rates-tab';
import AirtimeDataRatesTab from '@/components/admin/airtime-data-rates-tab';

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage system settings, review transactions, and set rates.
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="transactions">All Transactions</TabsTrigger>
          <TabsTrigger value="crypto">Crypto Rates</TabsTrigger>
          <TabsTrigger value="gift-cards">Gift Card Rates</TabsTrigger>
          <TabsTrigger value="airtime-data">Airtime/Data Rates</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="mt-8">
          <AdminDashboardTab />
        </TabsContent>
        <TabsContent value="transactions" className="mt-8">
          <AllTransactionsTab />
        </TabsContent>
        <TabsContent value="crypto" className="mt-8">
          <CryptoSettingsTab />
        </TabsContent>
        <TabsContent value="gift-cards" className="mt-8">
          <GiftCardRatesTab />
        </TabsContent>
        <TabsContent value="airtime-data" className="mt-8">
          <AirtimeDataRatesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
