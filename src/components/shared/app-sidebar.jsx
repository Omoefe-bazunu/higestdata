"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Repeat,
  Gift,
  ShieldCheck,
  RadioTower,
  CreditCard,
  LogOut,
  Settings,
  Bitcoin,
  X,
  Tv,
  UtilityPole,
  School,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/transactions", label: "Transactions", icon: Repeat },
  { href: "/dashboard/gift-cards", label: "Gift Cards", icon: Gift },
  // { href: "/dashboard/crypto", label: "Crypto Trade", icon: Bitcoin },
  { href: "/dashboard/buy-airtime", label: "Airtime & Data", icon: RadioTower },
  { href: "/dashboard/cable-tv", label: "Cable Tv", icon: Tv },
  { href: "/dashboard/betting", label: "Betting Funding", icon: CreditCard },
  {
    href: "/dashboard/electricity-bill",
    label: "Electricity Bill",
    icon: UtilityPole,
  },
  {
    href: "/dashboard/scratch-cards",
    label: "Exam Scratch Cards",
    icon: School,
  },
];

export default function AppSidebar({ onLinkClick }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href) => pathname === href;

  return (
    <aside className="h-full w-full flex flex-col bg-card border-r">
      {/* Mobile Header - only show when it's mobile sidebar */}
      {onLinkClick && (
        <div className="flex justify-between items-center p-4 border-b md:hidden">
          <div className="flex items-center gap-2">
            <Image
              src="/logow.png"
              alt="Highest Data"
              width={24}
              height={24}
              priority
            />
            <span className="font-bold text-sm">Menu</span>
          </div>
          <button
            onClick={onLinkClick}
            className="p-2 hover:bg-muted rounded-md transition-colors"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>
      )}

      <nav className="flex-1 px-4 py-4 mt-4">
        <ul className="space-y-2">
          {navItems
            .filter((item) => !item.admin)
            .map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link href={href} onClick={onLinkClick}>
                  <Button
                    variant={isActive(href) ? "secondary" : "ghost"}
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
      {/* This section is to allow users make changes to personla data or logout. Its not needed for now cuz there's already a sign out in the navbar */}
      <div className="mt-auto p-4 border-t hidden">
        <Button
          variant="ghost"
          className="w-full justify-start mb-2"
          onClick={onLinkClick}
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive-foreground hover:bg-destructive"
          onClick={() => {
            logout();
            if (onLinkClick) onLinkClick();
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
