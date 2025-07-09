
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  DollarSign,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NavLink = ({ href, children, icon }: { href: string, children: React.ReactNode, icon: React.ReactNode }) => {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);

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


export function AdminSidebar() {
  
  return (
    <div className="hidden border-r bg-card md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold font-headline">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="">Admin</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            <NavLink href="/admin/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>
              Dashboard
            </NavLink>
            <NavLink href="/admin/users" icon={<Users className="h-4 w-4" />}>
              Users
            </NavLink>
             <NavLink href="/admin/trades" icon={<Banknote className="h-4 w-4" />}>
              Trades
            </NavLink>
             <NavLink href="/admin/rates" icon={<DollarSign className="h-4 w-4" />}>
              Service Rates
            </NavLink>
          </nav>
        </div>
        <div className="mt-auto p-4">
             <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                Back to App
              </Link>
          </div>
      </div>
    </div>
  );
}
