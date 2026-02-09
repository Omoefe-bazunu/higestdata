"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Home,
  Repeat,
  Gift,
  RadioTower,
  Tv,
  UtilityPole,
  School,
  Mails,
  Ticket,
  Speaker,
  CreditCard,
} from "lucide-react";
import { IoPersonCircle } from "react-icons/io5";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  {
    href: "/dashboard/buy-airtime",
    label: "Data & Airtime",
    icon: RadioTower,
    color: "from-blue-500 to-blue-600",
    shadow: "shadow-blue-200",
  },
  {
    href: "/dashboard/gift-cards",
    label: "Gift Cards",
    icon: Gift,
    color: "from-orange-400 to-orange-600",
    shadow: "shadow-orange-200",
  },
  {
    href: "/dashboard/cable-tv",
    label: "Cable TV",
    icon: Tv,
    color: "from-purple-500 to-purple-600",
    shadow: "shadow-purple-200",
  },
  {
    href: "/dashboard/betting",
    label: "Betting",
    icon: CreditCard,
    color: "from-emerald-500 to-emerald-600",
    shadow: "shadow-emerald-200",
  },
  {
    href: "/dashboard/electricity-bill",
    label: "Electricity",
    icon: UtilityPole,
    color: "from-amber-400 to-amber-600",
    shadow: "shadow-amber-200",
  },
  {
    href: "/dashboard/airtime-to-cash",
    label: "Airtime 2 Cash",
    icon: Ticket,
    color: "from-rose-500 to-rose-600",
    shadow: "shadow-rose-200",
  },
  {
    href: "/dashboard/smm-order",
    label: "SMM Boost",
    icon: Speaker,
    color: "from-blue-600 to-indigo-600",
    shadow: "shadow-indigo-200",
  },
  {
    href: "/dashboard/bulksms",
    label: "Bulk SMS",
    icon: Mails,
    color: "from-cyan-500 to-blue-500",
    shadow: "shadow-cyan-200",
  },
  {
    href: "/dashboard/exam-cards",
    label: "Exam Pins",
    icon: School,
    color: "from-slate-700 to-slate-900",
    shadow: "shadow-slate-300",
  },
  {
    href: "/dashboard/transactions",
    label: "History",
    icon: Repeat,
    color: "from-orange-500 to-red-500",
    shadow: "shadow-red-100",
  },
  {
    href: "/dashboard/profile",
    label: "Profile",
    icon: IoPersonCircle,
    color: "from-blue-900 to-black",
    shadow: "shadow-gray-300",
  },
];

export default function QuickActionsHub() {
  const { user } = useAuth();
  const [negotiationCount, setNegotiationCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(firestore, "giftCardSubmissions"),
      where("userId", "==", user.uid),
      where("status", "==", "negotiating"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) =>
      setNegotiationCount(snapshot.docs.length),
    );
    return () => unsubscribe();
  }, [user]);

  return (
    <div className="w-full">
      {/* Dynamic Header Section */}
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-950 tracking-tight">
            Welcome,{" "}
            <span className="text-orange-500 capitalize">
              {user?.displayName?.split(" ")[0] || "Member"}
            </span>
          </h1>
          <p className="text-slate-500 font-medium">
            What would you like to do today?
          </p>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-white">
          <IoPersonCircle size={32} className="text-blue-950" />
        </div>
      </div>

      {/* Modern Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-8">
        {navItems.map(({ href, label, icon: Icon, color, shadow }) => (
          <Link key={href} href={href} className="group relative">
            <div
              className={`glass-card relative h-40 md:h-48 rounded-[2.5rem] p-6 flex flex-col items-center justify-center transition-all duration-500 group-hover:scale-[1.03] group-hover:shadow-2xl ${shadow} group-hover:border-white/60`}
            >
              {/* Icon Blob */}
              <div
                className={`mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg transition-transform duration-500 group-hover:rotate-12`}
              >
                <Icon size={28} strokeWidth={2.5} />
              </div>

              {/* Label */}
              <span className="font-bold text-blue-950 text-sm md:text-base text-center leading-tight">
                {label}
              </span>

              {/* Glowing Indicator for active/notifs */}
              {label === "Gift Cards" && negotiationCount > 0 && (
                <div className="absolute top-4 right-6 flex items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-[10px] font-black text-white">
                    {negotiationCount}
                  </span>
                </div>
              )}

              {/* Inner subtle glare */}
              <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-white/0 to-white/20 pointer-events-none" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
