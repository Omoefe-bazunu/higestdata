import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioTower, Gift, MessageSquare, LifeBuoy } from 'lucide-react';

const actions = [
  { href: '/buy-airtime', label: 'Buy Airtime/Data', icon: RadioTower, variant: 'default' as const },
  { href: '/gift-cards', label: 'Trade Gift Cards', icon: Gift, variant: 'secondary' as const },
  { href: '#', label: 'Live Chat', icon: MessageSquare, variant: 'secondary' as const },
  { href: '#', label: 'Get Support', icon: LifeBuoy, variant: 'outline' as const },
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
