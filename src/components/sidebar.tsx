"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  Bitcoin,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  Phone,
  Receipt,
  Repeat,
  ShieldCheck,
  Smartphone,
  Wifi,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

const NavLink = ({ href, children, icon }: { href: string, children: React.ReactNode, icon: React.ReactNode }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
        isActive && "bg-muted text-primary"
      )}
    >
      {icon}
      {children}
    </Link>
  );
};


export default function AppSidebar() {
  const pathname = usePathname();

  const isTradingActive = ['/buy-crypto', '/sell-crypto', '/buy-gift-card', '/sell-gift-card'].includes(pathname);
  const isServicesActive = ['/pay-bills', '/buy-airtime', '/buy-data', '/education', '/airtime-to-cash'].includes(pathname);
  
  return (
    <div className="hidden border-r bg-card md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold font-headline">
            <Banknote className="h-6 w-6 text-primary" />
            <span className="">FinTest</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            <NavLink href="/" icon={<LayoutDashboard className="h-4 w-4" />}>
              Dashboard
            </NavLink>

            <Collapsible defaultOpen={isTradingActive}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3 px-3 my-1">
                  <Bitcoin className="h-4 w-4" />
                  Trading
                  <span className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-sm">
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="ml-7 flex flex-col gap-1">
                <NavLink href="/buy-crypto" icon={<div className="h-4 w-4" />}>Buy Crypto</NavLink>
                <NavLink href="/sell-crypto" icon={<div className="h-4 w-4" />}>Sell Crypto</NavLink>
                <NavLink href="/buy-gift-card" icon={<div className="h-4 w-4" />}>Buy Gift Card</NavLink>
                <NavLink href="/sell-gift-card" icon={<div className="h-4 w-4" />}>Sell Gift Card</NavLink>
              </CollapsibleContent>
            </Collapsible>
            
            <Collapsible defaultOpen={isServicesActive}>
               <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3 px-3 my-1">
                  <Smartphone className="h-4 w-4" />
                  Services
                  <span className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-sm">
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="ml-7 flex flex-col gap-1">
                 <NavLink href="/pay-bills" icon={<Receipt className="h-4 w-4" />}>Pay Bills</NavLink>
                 <NavLink href="/buy-airtime" icon={<Phone className="h-4 w-4" />}>Buy Airtime</NavLink>
                 <NavLink href="/buy-data" icon={<Wifi className="h-4 w-4" />}>Buy Data</NavLink>
                 <NavLink href="/education" icon={<GraduationCap className="h-4 w-4" />}>Education</NavLink>
                 <NavLink href="/airtime-to-cash" icon={<Repeat className="h-4 w-4" />}>Airtime to Cash</NavLink>
              </CollapsibleContent>
            </Collapsible>

             <NavLink href="/fraud-detection" icon={<ShieldCheck className="h-4 w-4" />}>
              Fraud Detection
            </NavLink>
          </nav>
        </div>
      </div>
    </div>
  );
}
