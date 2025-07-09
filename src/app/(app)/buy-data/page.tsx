
import { PageHeader } from "@/components/page-header";
import { BuyDataForm } from "@/components/buy-data-form";

export default function BuyDataPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Buy Data" description="Get internet data bundles for any network." />
      <BuyDataForm />
    </div>
  );
}
