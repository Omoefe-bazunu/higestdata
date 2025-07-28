'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Repeat, Gift, ShieldCheck, CreditCard, RadioTower, LogOut, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

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
       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-primary">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
      </svg>
      <span className="text-xl font-bold font-headline text-primary">Highest Data</span>
    </div>
  )
}


export default function AppSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  return (
    <aside className="h-full w-64 flex flex-col bg-card border-r">
      <Logo />
      <nav className="flex-1 px-4 py-4">
        <ul className="space-y-2">
          {navItems.filter(item => !item.admin).map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link href={href}>
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
                    <Link href={href}>
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
         <Button variant="ghost" className="w-full justify-start">
            <Settings className="mr-2 h-4 w-4" />
            Settings
        </Button>
        <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
        </Button>
      </div>
    </aside>
  );
}
