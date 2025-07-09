import { RatesForm } from "@/components/admin/rates-form";
import { PageHeader } from "@/components/page-header";

export default function RatesPage() {
    return (
        <div>
            <PageHeader title="Service Rates" description="Set the buying and selling rates for services." />
            <RatesForm />
        </div>
    )
}
