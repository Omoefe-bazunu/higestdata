import { FraudDetectionForm } from "@/components/fraud-detection-form";
import { PageHeader } from "@/components/page-header";

export default function FraudDetectionPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Fraud Detection"
        description="Use our AI to analyze transactions for fraudulent activity."
      />
      <FraudDetectionForm />
    </div>
  )
}
