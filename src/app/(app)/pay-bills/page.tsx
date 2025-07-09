import { PageHeader } from "@/components/page-header";
import { PayBillsForm } from "@/components/pay-bills-form";

export default function PayBillsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Pay Bills" description="Pay for electricity, TV, and other utilities." />
      <PayBillsForm />
    </div>
  );
}
