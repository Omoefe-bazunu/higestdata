"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import AllTransactionsTab from "@/components/admin/all-transactions-tab";
import CryptoSettingsTab from "@/components/admin/crypto-settings-tab";
import GiftCardRatesTab from "@/components/admin/gift-card-rates-tab";
import AirtimeDataRatesTab from "@/components/admin/airtime-data-rates-tab";
import PendingRequestsTab from "@/components/admin/pending-requests-tab";
import BettingRatesTab from "@/components/admin/betting-rates-tab";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("transactions");

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage system settings, review transactions, and set rates.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value)}
        className="w-full"
      >
        <div className="block md:hidden">
          <Select
            value={activeTab}
            onValueChange={(value) => setActiveTab(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a tab" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transactions">All Transactions</SelectItem>
              <SelectItem value="crypto">Crypto Rates</SelectItem>
              <SelectItem value="gift-cards">Gift Card Rates</SelectItem>
              <SelectItem value="airtime-data">Airtime/Data Rates</SelectItem>
              <SelectItem value="betting">Betting Rates</SelectItem>
              <SelectItem value="pending-requests">Pending Requests</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="hidden md:block">
          <TabsList className="flex flex-wrap justify-start gap-2 md:gap-4 p-1">
            <TabsTrigger value="transactions">All Transactions</TabsTrigger>
            <TabsTrigger value="crypto">Crypto Rates</TabsTrigger>
            <TabsTrigger value="gift-cards">Gift Card Rates</TabsTrigger>
            <TabsTrigger value="airtime-data">Airtime/Data Rates</TabsTrigger>
            <TabsTrigger value="betting">Betting Rates</TabsTrigger>
            <TabsTrigger value="pending-requests">Pending Requests</TabsTrigger>
          </TabsList>
        </div>
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
        <TabsContent value="betting" className="mt-8">
          <BettingRatesTab />
        </TabsContent>
        <TabsContent value="pending-requests" className="mt-8">
          <PendingRequestsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
