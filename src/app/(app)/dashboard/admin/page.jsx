"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Zap,
  Globe,
  Smartphone,
  Trophy,
  GraduationCap,
  MessageSquare,
  Mail,
  LogOut,
  ChevronRight,
  Menu,
  X,
  ShieldAlert,
  Loader2,
  Clock,
  Settings,
  BellIcon,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Tab Components
import AllTransactionsTab from "@/components/admin/all-transactions-tab";
import ElectricityRatesForm from "@/components/admin/electricity-bill-rates-tab";
import NewsletterSender from "@/components/admin/newsletter-sender";
import GiftCardRatesTab from "@/components/admin/gift-card-rates-tab";
import AirtimeDataRatesTab from "@/components/admin/airtime-data-rates-tab";
import PendingRequestsTab from "@/components/admin/pending-requests-tab";
import BettingRatesTab from "@/components/admin/betting-rates-tab";
import ExamCardRatesPage from "@/components/admin/exam-rates-tab";
import AdminUsersManagement from "@/components/admin/UsersData";
import AirtimeToCashRatesPage from "@/components/admin/airtime-to-cash-rates-tab";
import BulkSmsRate from "@/components/admin/bulksms-rates-tab";
import SmmAdmin from "@/components/admin/smm-admin";
import DeletionRequestsPage from "@/components/admin/DeletionRequests";
import WalletAdjustment from "@/components/admin/WalletAdjustment";
import BannerManager from "@/components/admin/BannerManager";
import PushNotificationSender from "@/components/admin/pushNotificationSender";

export default function AdminDashboard() {
  const [activeMenu, setActiveMenu] = useState("transactions");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userToken, setUserToken] = useState("");

  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Authentication Logic
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else {
        setCheckingAuth(false);
        user.getIdToken().then((token) => setUserToken(token));
      }
    }
  }, [user, authLoading, router]);

  const menuItems = [
    { id: "users", label: "Users Data", icon: Users },
    { id: "transactions", label: "Transactions", icon: LayoutDashboard },
    { id: "gift-cards", label: "Gift Card Rates", icon: CreditCard },
    { id: "airtime-data", label: "Airtime/Data", icon: Smartphone },
    { id: "electricity", label: "Electricity", icon: Zap },
    { id: "betting", label: "Betting Rates", icon: Trophy },
    { id: "exam-cards", label: "Exam Cards", icon: GraduationCap },
    { id: "airtime-cash", label: "Airtime 2 Cash", icon: RefreshCcwIcon },
    { id: "bulksms", label: "Bulk SMS", icon: MessageSquare },
    { id: "pending-requests", label: "Pending", icon: Clock },
    { id: "bulk-email", label: "Bulk Email", icon: Mail },
    { id: "smm-rates", label: "SMM Admin", icon: Globe },
    { id: "deletion-requests", label: "Deletion Requests", icon: ShieldAlert },
    { id: "wallet-adjustment", label: "Wallet Adjustment", icon: Settings },
    { id: "banner-manager", label: "Banner Manager", icon: LayoutDashboard },
    {
      id: "push-notifications",
      label: "Push Notifications",
      icon: BellIcon,
      component: PushNotificationSender,
    },
  ];

  const handleAdminAuth = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const adminDoc = await getDoc(doc(firestore, "admin", "adminAccess"));
      if (!adminDoc.exists()) throw new Error("Admin credentials not found.");

      const adminData = adminDoc.data();
      if (adminData.email === email && adminData.password === password) {
        setIsAdminAuthenticated(true);
        toast({ title: "Success", description: "Admin session verified." });
      } else {
        toast({
          title: "Failed",
          description: "Invalid credentials.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (id) => {
    setActiveMenu(id);
    setIsMobileMenuOpen(false);
  };

  if (authLoading || checkingAuth) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#FDFDFD]">
        <Loader2 className="animate-spin text-blue-950 mb-4" size={40} />
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">
          Verifying Session...
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#FDFDFD]">
      {/* SECONDARY ADMIN AUTH MODAL */}
      <Dialog open={!isAdminAuthenticated} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-[425px] border-none shadow-2xl"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="font-syne font-bold text-2xl uppercase tracking-tighter">
              Admin Access
            </DialogTitle>
            <DialogDescription className="font-jakarta text-xs uppercase tracking-widest opacity-60">
              Verify credentials to access the system core.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdminAuth} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label className="font-jakarta font-bold text-[10px] uppercase tracking-widest opacity-60">
                Email Address
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-jakarta font-bold text-[10px] uppercase tracking-widest opacity-60">
                Master Password
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 border-slate-200"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 bg-blue-950 font-bold uppercase text-xs tracking-widest"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Enter Command Center"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {isAdminAuthenticated && (
        <div className="flex">
          {/* MOBILE TOP BAR */}
          <div className="lg:hidden fixed top-28 left-0 right-0 h-16 bg-white border-b border-slate-100 z-[60] flex items-center justify-between px-6">
            <h1 className="font-syne font-black text-lg text-blue-950 uppercase tracking-tighter">
              ADMIN MENU
            </h1>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-blue-950"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* SIDEBAR */}
          <aside
            className={`fixed top-28 left-0 bottom-0 w-72 bg-white border-r border-slate-100 p-6 flex flex-col transition-transform duration-300 ease-in-out z-[70] lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
          >
            <div className="mb-10 px-4 mt-8 lg:mt-0">
              <h1 className="font-syne text-2xl font-bold text-blue-950 hidden lg:block uppercase tracking-tighter">
                HIGHEST DATA
              </h1>
              <p className="text-[10px] font-jakarta font-bold uppercase tracking-widest opacity-40">
                Admin Panel
              </p>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-sm transition-all ${
                      activeMenu === item.id
                        ? "bg-blue-950 text-white shadow-lg shadow-blue-950/20"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} />
                      <span className="font-jakarta font-bold text-[10px] uppercase tracking-widest">
                        {item.label}
                      </span>
                    </div>
                    {activeMenu === item.id && <ChevronRight size={14} />}
                  </button>
                );
              })}
            </nav>

            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-4 text-red-500 font-bold text-[10px] uppercase tracking-widest mt-auto border-t border-slate-100 hover:bg-red-50 transition-all"
            >
              <LogOut size={18} /> Sign Out
            </button>
          </aside>

          {/* MAIN CONTENT */}
          <main className="flex-1 p-6 lg:p-12 overflow-x-hidden pt-24 lg:pt-12">
            <header className="mb-10">
              <h2 className="font-syne text-3xl font-bold text-blue-950 uppercase tracking-tighter">
                {menuItems.find((i) => i.id === activeMenu)?.label}
              </h2>
              <div className="h-1 w-12 bg-orange-400 mt-2"></div>
            </header>

            <div className="animate-fade-in">
              {activeMenu === "users" && <AdminUsersManagement />}
              {activeMenu === "transactions" && <AllTransactionsTab />}
              {activeMenu === "gift-cards" && <GiftCardRatesTab />}
              {activeMenu === "airtime-data" && <AirtimeDataRatesTab />}
              {activeMenu === "electricity" && <ElectricityRatesForm />}
              {activeMenu === "betting" && <BettingRatesTab />}
              {activeMenu === "exam-cards" && <ExamCardRatesPage />}
              {activeMenu === "airtime-cash" && <AirtimeToCashRatesPage />}
              {activeMenu === "bulksms" && <BulkSmsRate />}
              {activeMenu === "pending-requests" && <PendingRequestsTab />}
              {activeMenu === "bulk-email" && <NewsletterSender />}
              {activeMenu === "smm-rates" && <SmmAdmin userToken={userToken} />}
              {activeMenu === "deletion-requests" && <DeletionRequestsPage />}
              {activeMenu === "wallet-adjustment" && <WalletAdjustment />}
              {activeMenu === "banner-manager" && <BannerManager />}
              {activeMenu === "push-notifications" && (
                <PushNotificationSender />
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

// Internal icons helper
const RefreshCcwIcon = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
);
