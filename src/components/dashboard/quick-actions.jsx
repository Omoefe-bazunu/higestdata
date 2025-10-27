import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RadioTower,
  Gift,
  Bitcoin,
  CreditCard,
  Tv,
  UtilityPole,
  School,
} from "lucide-react";

const actions = [
  {
    href: "/dashboard/buy-airtime",
    label: "Buy Airtime/Data",
    icon: RadioTower,
    variant: "default",
  },
  {
    href: "/dashboard/gift-cards",
    label: "Trade Gift Cards",
    icon: Gift,
    variant: "secondary",
  },
  // {
  //   href: "/dashboard/crypto",
  //   label: "Trade Crypt",
  //   icon: Bitcoin,
  //   variant: "secondary",
  // },
  {
    href: "/dashboard/betting",
    label: "Fund Betting A/C",
    icon: CreditCard,
    variant: "secondary",
  },
  {
    href: "/dashboard/cable-tv",
    label: "Renew your Cable Tv",
    icon: Tv,
    variant: "outline",
  },
  {
    href: "/dashboard/electricity-bill",
    label: " Electricity Recharge",
    icon: UtilityPole,
    variant: "outline",
  },
  {
    href: "/dashboard/exam-cards",
    label: "Buy Scratch Cards",
    icon: School,
    variant: "secondary",
  },
];

export default function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map(({ href, label, icon: Icon, variant }) => (
            <Link href={href} key={label}>
              <Button variant={variant} className="w-full h-24 flex-col gap-2">
                <Icon className="h-6 w-6" />
                <span className="text-xs text-center">{label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
