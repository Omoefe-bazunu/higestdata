"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Repeat,
  Gift,
  ShieldCheck,
  RadioTower,
  LogOut,
  Settings,
  Bitcoin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { use } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/transactions", label: "Transactions", icon: Repeat },
  { href: "/gift-cards", label: "Gift Cards", icon: Gift },
  { href: "/crypto", label: "Crypto Trade", icon: Bitcoin },
  { href: "/buy-airtime", label: "Airtime & Data", icon: RadioTower },
  { href: "/admin", label: "Admin Panel", icon: ShieldCheck, admin: true },
];

// Load admin emails from env
const adminEmails = (process.env.NEXT_PUBLIC_ADMINEMAIL || "")
  .split(",")
  .map((email) => email.trim().toLowerCase());

function Logo() {
  return (
    <div className="flex items-center gap-2 p-4 border-b mt-4">
      <Image
        src="https://firebasestorage.googleapis.com/v0/b/higestdata.firebasestorage.app/o/HIGHEST%20ICON%20COLORED.png?alt=media&token=4946037d-3ef0-4f52-a671-88a6e732ac1e"
        alt="Website Logo"
        width={32}
        height={32}
        priority
        className="object-contain"
      />
      <span className="text-xl font-bold font-headline text-primary">
        Highest Data
      </span>
    </div>
  );
}

export default function AppSidebar({ onLinkClick }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href) => pathname === href;

  // Check if current user email is in the admin list
  const isAdmin = user?.email && adminEmails.includes(user.email.toLowerCase());

  return (
    <aside className="h-full w-64 flex flex-col bg-card border-r py-20">
      <Logo />
      <nav className="flex-1 px-4 py-4">
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

        {isAdmin && (
          <>
            <Separator className="my-4" />
            <ul className="space-y-2">
              {navItems
                .filter((item) => item.admin)
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
          </>
        )}
      </nav>

      <div className="mt-auto p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={onLinkClick}
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-white"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
