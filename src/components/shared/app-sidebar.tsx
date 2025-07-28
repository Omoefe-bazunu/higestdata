'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Repeat, Gift, ShieldCheck, CreditCard, RadioTower, LogOut, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/transactions', label: 'Transactions', icon: Repeat },
  { href: '/gift-cards', label: 'Gift Cards', icon: Gift },
  { href: '/buy-airtime', label: 'Airtime & Data', icon: RadioTower },
  { href: '/admin', label: 'Admin Panel', icon: ShieldCheck, admin: true },
];


function Logo() {
  return (
    <div className="flex items-center gap-2 p-4 border-b">
       <Image
  src="https://firebasestorage.googleapis.com/v0/b/higestdata.firebasestorage.app/o/HIGHEST%20ICON%20COLORED.png?alt=media&token=4946037d-3ef0-4f52-a671-88a6e732ac1e"
  alt="Website Logo"
  width={32}
  height={32}
  priority
  className="object-contain"
/>
      <span className="text-xl font-bold font-headline text-primary">Highest Data</span>
    </div>
  )
}

interface AppSidebarProps {
  onLinkClick?: () => void;
}

export default function AppSidebar({ onLinkClick }: AppSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  return (
    <aside className="h-full w-64 flex flex-col bg-card border-r">
      <Logo />
      <nav className="flex-1 px-4 py-4">
        <ul className="space-y-2">
          {navItems.filter(item => !item.admin).map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link href={href} onClick={onLinkClick}>
                <Button
                  variant={isActive(href) ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {label}
                </Button>
              </Link>
            </li>
          ))}
        </ul>
        <Separator className="my-4" />
        <ul className="space-y-2">
            {navItems.filter(item => item.admin).map(({ href, label, icon: Icon }) => (
                <li key={href}>
                    <Link href={href} onClick={onLinkClick}>
                        <Button
                        variant={isActive(href) ? 'secondary' : 'ghost'}
                        className="w-full justify-start"
                        >
                        <Icon className="mr-2 h-4 w-4" />
                        {label}
                        </Button>
                    </Link>
                </li>
            ))}
        </ul>

      </nav>
      <div className="mt-auto p-4 border-t">
         <Button variant="ghost" className="w-full justify-start" onClick={onLinkClick}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
        </Button>
        <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive" onClick={onLinkClick}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
        </Button>
      </div>
    </aside>
  );
}
