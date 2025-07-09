import { SellGiftCardForm } from "@/components/sell-gift-card-form";
import { PageHeader } from "@/components/page-header";

export default function SellGiftCardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Sell Gift Card" description="Exchange your gift cards for instant cash." />
      <SellGiftCardForm />
    </div>
  );
}
