import { PageHeader } from "@/components/page-header";
import { AirtimeToCashForm } from "@/components/airtime-to-cash-form";

export default function AirtimeToCashPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Airtime to Cash" description="Convert your excess airtime into cash." />
      <AirtimeToCashForm />
    </div>
  );
}
