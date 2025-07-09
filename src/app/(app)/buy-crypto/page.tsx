import { PageHeader } from "@/components/page-header";
import { BuyCryptoForm } from "@/components/buy-crypto-form";

export default function BuyCryptoPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Buy Crypto" description="Purchase cryptocurrencies instantly." />
      <BuyCryptoForm />
    </div>
  );
}
