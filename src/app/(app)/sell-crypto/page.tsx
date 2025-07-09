import { PageHeader } from "@/components/page-header";
import { SellCryptoForm } from "@/components/sell-crypto-form";

export default function SellCryptoPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Sell Crypto" description="Sell your cryptocurrencies for cash." />
      <SellCryptoForm />
    </div>
  );
}
