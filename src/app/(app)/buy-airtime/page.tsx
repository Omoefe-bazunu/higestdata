
import { PageHeader } from "@/components/page-header";
import { BuyAirtimeForm } from "@/components/buy-airtime-form";

export default function BuyAirtimePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Buy Airtime" description="Top up any mobile phone instantly." />
      <BuyAirtimeForm />
    </div>
  );
}
