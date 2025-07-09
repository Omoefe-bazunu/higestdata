
import { PageHeader } from "@/components/page-header";
import { EducationPaymentForm } from "@/components/education-payment-form";

export default function EducationPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Education Payments" description="Purchase WAEC/JAMB result checker pins." />
      <EducationPaymentForm />
    </div>
  );
}
