import { PageHeader } from "@/components/page-header";
import { BuyGiftCardForm } from "@/components/buy-gift-card-form";

export default function BuyGiftCardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Buy Gift Card" description="Purchase gift cards from various brands." />
      <BuyGiftCardForm />
    </div>
  );
}
