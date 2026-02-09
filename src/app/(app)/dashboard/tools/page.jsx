"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home,
  Repeat,
  Gift,
  RadioTower,
  CreditCard,
  Tv,
  UtilityPole,
  School,
  Ticket,
  Mails,
  Speaker,
  ArrowRight,
} from "lucide-react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import { Badge } from "@/components/ui/badge";

export default function ToolsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [negotiationCount, setNegotiationCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(firestore, "giftCardSubmissions"),
      where("userId", "==", user.uid),
      where("status", "==", "negotiating"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNegotiationCount(snapshot.docs.length);
    });

    return () => unsubscribe();
  }, [user]);

  const toolOptions = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: <Home size={24} />,
      description: "Overview of your account and activities.",
      action: () => router.push("/dashboard"),
      color: "bg-blue-50",
      iconColor: "text-blue-900",
    },
    {
      id: "gift-cards",
      title: "Gift Cards",
      icon: <Gift size={24} />,
      description: "Buy and sell gift cards easily.",
      action: () => router.push("/dashboard/gift-cards"),
      color: "bg-green-50",
      iconColor: "text-green-700",
    },
    {
      id: "gift-cards-negotiate",
      title: "Gift Cards Negotiate",
      icon: <Gift size={24} />,
      description: "Manage your gift card negotiations.",
      action: () => router.push("/dashboard/gift-cards/transactions"),
      color: "bg-amber-50",
      iconColor: "text-amber-700",
      badge: negotiationCount > 0 ? negotiationCount : null,
    },
    {
      id: "airtime-data",
      title: "Airtime & Data",
      icon: <RadioTower size={24} />,
      description: "Purchase airtime and data bundles.",
      action: () => router.push("/dashboard/buy-airtime"),
      color: "bg-yellow-50",
      iconColor: "text-yellow-700",
    },
    {
      id: "cable-tv",
      title: "Cable TV",
      icon: <Tv size={24} />,
      description: "Pay for cable TV subscriptions.",
      action: () => router.push("/dashboard/cable-tv"),
      color: "bg-indigo-50",
      iconColor: "text-indigo-700",
    },
    {
      id: "betting",
      title: "Betting Funding",
      icon: <CreditCard size={24} />,
      description: "Fund your betting accounts instantly.",
      action: () => router.push("/dashboard/betting"),
      color: "bg-red-50",
      iconColor: "text-red-700",
    },
    {
      id: "airtime-to-cash",
      title: "Airtime to Cash",
      icon: <Ticket size={24} />,
      description: "Convert your airtime to cash.",
      action: () => router.push("/dashboard/airtime-to-cash"),
      color: "bg-orange-50",
      iconColor: "text-orange-700",
    },
    {
      id: "bulk-sms",
      title: "Bulk SMS",
      icon: <Mails size={24} />,
      description: "Send bulk SMS to your customers.",
      action: () => router.push("/dashboard/bulksms"),
      color: "bg-teal-50",
      iconColor: "text-teal-700",
    },
    {
      id: "electricity",
      title: "Electricity Bill",
      icon: <UtilityPole size={24} />,
      description: "Pay your electricity bills online.",
      action: () => router.push("/dashboard/electricity-bill"),
      color: "bg-cyan-50",
      iconColor: "text-cyan-700",
    },
    {
      id: "exam-cards",
      title: "Exam Scratch Cards",
      icon: <School size={24} />,
      description: "Purchase exam scratch cards.",
      action: () => router.push("/dashboard/exam-cards"),
      color: "bg-pink-50",
      iconColor: "text-pink-700",
    },
    {
      id: "smm",
      title: "SMM Boost",
      icon: <Speaker size={24} />,
      description: "Boost your social media presence.",
      action: () => router.push("/dashboard/smm-order"),
      color: "bg-violet-50",
      iconColor: "text-violet-700",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-12 md:py-16">
      <div className="max-w-7xl mx-auto">
        {/* Header Banner - Restored Gradient */}
        <div className="bg-gradient-to-r from-blue-950 to-blue-800 rounded-2xl p-8 mb-10 shadow-xl">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white text-center tracking-tight">
            All Services
          </h1>
          <p className="text-blue-100/90 text-center mt-2 font-medium">
            Access all our premium services in one place
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {toolOptions.map((tool) => (
            <div
              key={tool.id}
              onClick={tool.action}
              className="group relative bg-white rounded-2xl p-6 shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between border-2 border-transparent hover:border-blue-900 overflow-hidden"
            >
              {/* Bigger Decorative Circle - Top Right */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-slate-50 rounded-full group-hover:bg-orange-50 transition-all duration-500 ease-in-out" />

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  {/* Icon with Hover Rotation */}
                  <div
                    className={`w-12 h-12 rounded-xl ${tool.color} flex items-center justify-center transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 shadow-sm`}
                  >
                    <div className={`${tool.iconColor}`}>{tool.icon}</div>
                  </div>

                  {/* Notification Badge */}
                  {tool.badge && (
                    <Badge className="bg-red-600 text-white hover:bg-red-600 h-6 w-6 flex items-center justify-center p-0 text-xs font-bold ring-2 ring-white">
                      {tool.badge}
                    </Badge>
                  )}
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-950">
                  {tool.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-10">
                  {tool.description}
                </p>
              </div>

              {/* Bottom Action Area */}
              <div className="relative z-10 flex items-center justify-between text-blue-950 font-bold text-sm group-hover:text-orange-500 transition-colors">
                <span className="tracking-tight">Access Service</span>
                <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
