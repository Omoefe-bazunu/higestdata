"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Repeat,
  Gift,
  RadioTower,
  CreditCard,
  LogOut,
  Settings,
  X,
  Tv,
  UtilityPole,
  School,
  Shield,
  Mails,
  Ticket,
  Speaker,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { IoPersonCircle } from "react-icons/io5";
// Import Firebase for notification tracking
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/transactions", label: "Transactions", icon: Repeat },
  { href: "/dashboard/gift-cards", label: "Gift Cards", icon: Gift },
  {
    href: "/dashboard/gift-cards/transactions",
    label: "Gift Cards Negotiate",
    icon: Gift,
  },
  { href: "/dashboard/buy-airtime", label: "Airtime & Data", icon: RadioTower },
  { href: "/dashboard/cable-tv", label: "Cable Tv", icon: Tv },
  { href: "/dashboard/betting", label: "Betting Funding", icon: CreditCard },
  {
    href: "/dashboard/airtime-to-cash",
    label: "Airtime to Cash",
    icon: Ticket,
  },
  {
    href: "/dashboard/bulksms",
    label: "Bulk SMS",
    icon: Mails,
  },
  {
    href: "/dashboard/electricity-bill",
    label: "Electricity Bill",
    icon: UtilityPole,
  },
  {
    href: "/dashboard/exam-cards",
    label: "Exam Scratch Cards",
    icon: School,
  },
  {
    href: "/dashboard/smm-order",
    label: "SMM Boost",
    icon: Speaker,
  },
  // {
  //   href: "/dashboard/kyc",
  //   label: "KYC status",
  //   icon: Shield,
  // },
  {
    href: "/dashboard/profile",
    label: "Your Profile",
    icon: IoPersonCircle,
  },
];

export default function AppSidebar({ onLinkClick }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [negotiationCount, setNegotiationCount] = useState(0);

  const isActive = (href) => pathname === href;

  // Real-time listener for negotiating status
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(firestore, "giftCardSubmissions"),
      where("userId", "==", user.uid),
      where("status", "==", "negotiating")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNegotiationCount(snapshot.docs.length);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <aside className="h-full w-full flex flex-col bg-card border-r">
      {/* Mobile Header */}
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

      <nav className="flex-1 px-4 py-4 mt-4 overflow-y-auto">
        <ul className="space-y-2">
          {navItems
            .filter((item) => !item.admin)
            .map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link href={href} onClick={onLinkClick}>
                  <Button
                    variant={isActive(href) ? "secondary" : "ghost"}
                    className="w-full justify-start relative flex items-center"
                  >
                    <Icon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left truncate">{label}</span>

                    {/* Red Notification Badge */}
                    {label === "Gift Cards Negotiate" &&
                      negotiationCount > 0 && (
                        <span className="ml-auto bg-red-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full animate-in fade-in zoom-in">
                          {negotiationCount}
                        </span>
                      )}
                  </Button>
                </Link>
              </li>
            ))}
        </ul>
      </nav>

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
