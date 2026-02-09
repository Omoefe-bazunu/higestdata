"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import {
  FileText,
  User,
  Activity,
  CheckCircle,
  AlertCircle,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import WithdrawalModal from "@/components/WithdrawalModal";
import FundingModal from "@/components/FundingModal";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 16) return "Good Afternoon";
  if (hour < 21) return "Good Evening";
  return "Good Night";
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [fundingDialogOpen, setFundingDialogOpen] = useState(false);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);

  const greeting = getGreeting();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const ref = doc(firestore, "users", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          setUserData(data);
          if (!data.isVerified) {
            setShowVerificationModal(true);
          }
        } else {
          setUserData({
            name: user.displayName || "User",
            walletBalance: 0,
            isVerified: false,
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user]);

  const recheckVerification = async () => {
    if (!user) return;
    try {
      const ref = doc(firestore, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        if (data.isVerified) {
          setShowVerificationModal(false);
        }
      }
    } catch (err) {
      console.error("Error rechecking verification:", err);
    }
  };

  const handleBusinessTools = () => router.push("/dashboard/tools");
  const handleProfile = () => router.push("/dashboard/profile");
  const handleTransactions = () => router.push("/dashboard/transactions");

  if (loading || !userData) {
    return (
      <section className="flex flex-col items-center justify-center min-h-screen bg-white py-20">
        <div className="flex space-x-2">
          <span className="h-3 w-3 bg-blue-900 rounded-full animate-pulse"></span>
          <span className="h-3 w-3 bg-blue-900 rounded-full animate-pulse delay-200"></span>
          <span className="h-3 w-3 bg-blue-900 rounded-full animate-pulse delay-400"></span>
        </div>
      </section>
    );
  }

  return (
    <>
      <Dialog open={showVerificationModal} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <DialogTitle className="text-center text-xl">
              Email Verification Required
            </DialogTitle>
            <DialogDescription className="text-center">
              Please verify your email address to access your dashboard and
              start using all features.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="bg-muted p-4 rounded-lg text-sm text-center">
              <p className="font-medium mb-1">Verification code sent to:</p>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>

            <Button
              onClick={() => router.push("/verify-account")}
              className="w-full bg-orange-400 hover:bg-orange-500 text-white"
              size="lg"
            >
              Verify Email Now
            </Button>

            <Button
              onClick={recheckVerification}
              variant="outline"
              className="w-full"
            >
              I've Already Verified
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div
        className={`min-h-screen bg-cover bg-fixed bg-center bg-no-repeat pb-24 pt-8 px-4 md:pt-12 md:px-12 ${
          showVerificationModal ? "pointer-events-none blur-sm" : ""
        }`}
        style={{ backgroundImage: `url('/gebg.jpg')` }}
      >
        <div className="bg-gradient-to-r from-blue-950 to-blue-800 rounded-2xl p-6 mb-10 max-w-7xl mx-auto shadow-2xl transform transition-all">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white text-center">
            Dashboard
          </h1>
        </div>

        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-blue-900/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-blue-900" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        {greeting}, {userData.name.split(" ")[0]}!
                      </h2>
                      <p className="text-sm text-gray-600">{user?.email}</p>
                    </div>
                  </div>
                  {userData.isVerified ? (
                    <div className=" text-green-800 ">
                      <CheckCircle className="w-4 h-4 mr-1.5" />
                    </div>
                  ) : (
                    <div className=" text-yellow-800 ">
                      <AlertCircle className="w-4 h-4 mr-1.5" />
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    {new Date().getHours() < 12
                      ? "Wish you the best experience with our services"
                      : "Here's a summary of your account today."}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-950 to-blue-800 rounded-2xl shadow-xl p-8 flex flex-col justify-center text-white relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>

              <div className="z-10">
                <div className="flex items-center gap-5 mb-6">
                  <div className="bg-white/20 p-4 rounded-2xl">
                    <Wallet className="w-8 h-8 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Wallet Balance</h2>
                    <span className="text-3xl font-mono font-black text-white mt-1 block">
                      ₦{(userData.walletBalance || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setWithdrawalDialogOpen(true)}
                    className="flex-1 bg-green-500 hover:bg-white/30 text-white px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowUpFromLine className="w-4 h-4" />
                    Withdraw
                  </button>
                  <button
                    onClick={() => setFundingDialogOpen(true)}
                    className="flex-1 bg-orange-400 hover:bg-orange-500 text-white px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                    Fund
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              onClick={handleBusinessTools}
              className="bg-white/95 rounded-2xl shadow-lg p-6 flex flex-col items-start justify-between hover:border-blue-900 border-2 border-transparent transition-all duration-300 cursor-pointer group"
            >
              <div className="mb-6">
                <div className="bg-blue-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-900 transition-colors">
                  <FileText className="w-8 h-8 text-blue-900 group-hover:text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Services</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Buy airtime, data, electricity bills, & more.
                </p>
              </div>
              <button className="w-full bg-gray-100 text-blue-900 font-bold py-3 rounded-xl group-hover:bg-blue-900 group-hover:text-white transition-all">
                Open Tools
              </button>
            </div>

            <div
              onClick={handleProfile}
              className="bg-white/95 rounded-2xl shadow-lg p-6 flex flex-col items-start justify-between hover:border-blue-900 border-2 border-transparent transition-all duration-300 cursor-pointer group"
            >
              <div className="mb-6">
                <div className="bg-orange-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-400 transition-colors">
                  <User className="w-8 h-8 text-orange-400 group-hover:text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  User Profile
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Manage your account and personal information.
                </p>
              </div>
              <button className="w-full bg-gray-100 text-orange-400 font-bold py-3 rounded-xl group-hover:bg-orange-400 group-hover:text-white transition-all">
                View Profile
              </button>
            </div>

            <div
              onClick={handleTransactions}
              className="bg-white/95 rounded-2xl shadow-lg p-6 flex flex-col items-start justify-between hover:border-blue-900 border-2 border-transparent transition-all duration-300 cursor-pointer group"
            >
              <div className="mb-6">
                <div className="bg-blue-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-900 transition-colors">
                  <Activity className="w-8 h-8 text-blue-900 group-hover:text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  Transactions History
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  View your transaction history and quick actions.
                </p>
              </div>
              <button className="w-full bg-gray-100 text-blue-900 font-bold py-3 rounded-xl group-hover:bg-blue-900 group-hover:text-white transition-all">
                View Transactions
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Funding Modal */}
      <FundingModal
        open={fundingDialogOpen}
        onOpenChange={setFundingDialogOpen}
      />

      {/* Withdrawal Modal */}
      <WithdrawalModal
        open={withdrawalDialogOpen}
        onOpenChange={setWithdrawalDialogOpen}
      />
    </>
  );
}
