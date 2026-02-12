"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { firestore, storage } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Upload,
  Key,
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function UserProfile() {
  const router = useRouter();
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteStatus, setDeleteStatus] = useState(null); // null | 'pending' | 'approved' | 'rejected'
  const [deleteRejectedReason, setDeleteRejectedReason] = useState("");
  const [submitingDelete, setSubmitingDelete] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function fetchUserData() {
      try {
        const userRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setName(data.name || "");
          setPhoneNumber(data.phoneNumber || "");
          if (data.deletionRequest) {
            setDeleteStatus(data.deletionRequest.status);
            setDeleteReason(data.deletionRequest.reason || "");
            setDeleteRejectedReason(data.deletionRequest.rejectedReason || "");
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [user]);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setSaving(true);
    try {
      const userRef = doc(firestore, "users", user.uid);
      await updateDoc(userRef, { name: name.trim() });

      setUserData({ ...userData, name: name.trim() });
      toast.success("Name updated successfully");
    } catch (error) {
      console.error("Error updating name:", error);
      toast.error("Failed to update name");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePhoneNumber = async (e) => {
    e.preventDefault();
    if (!user || !phoneNumber.trim()) return;

    setSaving(true);
    try {
      const userRef = doc(firestore, "users", user.uid);
      await updateDoc(userRef, { phoneNumber: phoneNumber.trim() });

      setUserData({ ...userData, phoneNumber: phoneNumber.trim() });
      toast.success("Phone number updated successfully");
    } catch (error) {
      console.error("Error updating phone number:", error);
      toast.error("Failed to update phone number");
    } finally {
      setSaving(false);
    }
  };

  const handleRequestDeletion = async (e) => {
    e.preventDefault();
    if (!deleteReason.trim()) return;
    setSubmitingDelete(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/account/request-deletion`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
          body: JSON.stringify({ reason: deleteReason }),
        },
      );
      const data = await res.json();
      if (data.success) {
        setDeleteStatus("pending");
        toast.success(
          "Deletion request submitted. You'll be notified of the decision.",
        );
      } else {
        toast.error(data.error || "Failed to submit request");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setSubmitingDelete(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;

    setSaving(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast.success(
        "Password reset link sent to your email (Check Spam folder)",
      );
    } catch (error) {
      console.error("Error sending reset email:", error);
      toast.error("Failed to send reset email");
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Please upload an image smaller than 2MB");
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `profilePictures/${user.uid}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      const userRef = doc(firestore, "users", user.uid);
      await updateDoc(userRef, { photoURL });

      setUserData({ ...userData, photoURL });
      toast.success("Profile picture updated");
    } catch (error) {
      console.error("Error uploading picture:", error);
      toast.error("Failed to upload picture");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
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

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">No account data found.</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-fixed bg-center bg-no-repeat pb-24 pt-8 px-4 md:px-12"
      style={{ backgroundImage: `url('/gebg.jpg')` }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-950 to-blue-800 rounded-2xl p-8 mb-10 shadow-xl flex flex-row items-center justify-center">
          <div className="text-center ">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white">
              My Profile
            </h1>
            <p className="text-blue-100 opacity-80">
              Manage your account and verification
            </p>
          </div>
          {/* <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 hover:bg-red-500 hover:text-white rounded-xl transition-all font-bold shadow-lg"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button> */}
        </div>

        {/* Main Grid: User Info & Verification Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* User Info Card */}
          <div className="lg:col-span-1 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-blue-900/10 flex flex-col items-center text-center">
            <div className="relative mb-6">
              <Avatar className="h-28 w-28 border-4 border-blue-900/20">
                <AvatarImage src={userData.photoURL} alt={userData.name} />
                <AvatarFallback className="text-4xl font-black bg-gradient-to-br from-blue-900 to-blue-800 text-white">
                  {userData.name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="picture"
                className="absolute bottom-0 right-0 bg-orange-400 hover:bg-orange-500 text-white p-2 rounded-full cursor-pointer shadow-lg transition-all"
              >
                <Upload className="h-4 w-4" />
              </label>
              <input
                id="picture"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePictureUpload}
                disabled={uploading}
              />
            </div>

            <h2 className="text-2xl font-black text-gray-900 mb-1">
              {userData.name || "User"}
            </h2>
            <p className="text-gray-500 mb-1 font-medium">{user.email}</p>
            {userData.phoneNumber && (
              <p className="text-gray-400 text-sm">{userData.phoneNumber}</p>
            )}
            {uploading && (
              <p className="text-xs text-orange-400 mt-2">Uploading...</p>
            )}
          </div>

          {/* Verification Status Card */}
          <div className="lg:col-span-2 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-blue-900/10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h3 className="text-xl font-black text-gray-900">
                  Verification Status
                </h3>
                <p className="text-gray-500 text-sm">
                  Your account verification details
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email Verification */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`p-3 rounded-xl ${userData.isVerified ? "bg-green-100" : "bg-yellow-100"}`}
                  >
                    <Mail
                      className={`w-5 h-5 ${userData.isVerified ? "text-green-600" : "text-yellow-600"}`}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Email Status
                    </p>
                    <p className="text-gray-900 font-bold">
                      {userData.isVerified ? "Verified" : "Not Verified"}
                    </p>
                  </div>
                </div>
                <Badge
                  className={`${
                    userData.isVerified
                      ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
                      : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200"
                  }`}
                >
                  {userData.isVerified ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1.5" />
                      Email Verified
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 mr-1.5" />
                      Pending Verification
                    </>
                  )}
                </Badge>
              </div>

              {/* KYC Verification */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`p-3 rounded-xl ${
                      userData.kycStatus === "approved"
                        ? "bg-green-100"
                        : userData.kycStatus === "pending"
                          ? "bg-yellow-100"
                          : "bg-gray-100"
                    }`}
                  >
                    <Shield
                      className={`w-5 h-5 ${
                        userData.kycStatus === "approved"
                          ? "text-green-600"
                          : userData.kycStatus === "pending"
                            ? "text-yellow-600"
                            : "text-gray-600"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      KYC Status
                    </p>
                    <p className="text-gray-900 font-bold capitalize">
                      {userData.kycStatus || "Not Started"}
                    </p>
                  </div>
                </div>
                <Badge
                  className={`${
                    userData.kycStatus === "approved"
                      ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
                      : userData.kycStatus === "pending"
                        ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200"
                  }`}
                >
                  {userData.kycStatus === "approved" ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1.5" />
                      KYC Approved
                    </>
                  ) : userData.kycStatus === "pending" ? (
                    <>
                      <Clock className="h-3 w-3 mr-1.5" />
                      KYC Pending
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1.5" />
                      KYC Not Started
                    </>
                  )}
                </Badge>
              </div>

              {/* BVN Verification */}
              {userData.bvnVerified !== undefined && (
                <div className="bg-gray-50 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`p-3 rounded-xl ${userData.bvnVerified ? "bg-green-100" : "bg-gray-100"}`}
                    >
                      <Shield
                        className={`w-5 h-5 ${userData.bvnVerified ? "text-green-600" : "text-gray-600"}`}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        BVN Status
                      </p>
                      <p className="text-gray-900 font-bold">
                        {userData.bvnVerified ? "Verified" : "Not Verified"}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={`${
                      userData.bvnVerified
                        ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200"
                    }`}
                  >
                    {userData.bvnVerified ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1.5" />
                        BVN Verified
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1.5" />
                        BVN Not Verified
                      </>
                    )}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Account Details Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-blue-900/10 mb-12">
          <h3 className="text-2xl font-black text-gray-900 mb-6">
            Account Details
          </h3>

          <div className="space-y-6">
            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-900" />
                Email Address
              </Label>
              <Input
                value={userData.email}
                disabled
                className="bg-gray-50 border-gray-200"
              />
            </div>

            {/* Name */}
            {/* Name */}
            <form onSubmit={handleUpdateName} className="space-y-2">
              <Label
                htmlFor="name"
                className="text-gray-700 font-semibold flex items-center gap-2"
              >
                <UserIcon className="w-4 h-4 text-blue-900" />
                Full Name
              </Label>
              <div
                className={`${userData.kycStatus !== "approved" ? "pointer-events-none opacity-70" : ""} flex gap-2`}
              >
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={
                    saving ||
                    name === userData.name ||
                    userData.kycStatus !== "approved"
                  }
                  className="bg-blue-900 hover:bg-blue-800 text-white"
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
              {userData.kycStatus !== "approved" && (
                <p className="text-xs text-gray-400">
                  Name can only be edited after KYC approval.
                </p>
              )}
            </form>

            {/* Phone Number */}
            <form onSubmit={handleUpdatePhoneNumber} className="space-y-2">
              <Label
                htmlFor="phoneNumber"
                className="text-gray-700 font-semibold flex items-center gap-2"
              >
                <Phone className="w-4 h-4 text-blue-900" />
                Phone Number
              </Label>
              <div className="flex gap-2">
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+234 800 000 0000"
                  required
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={saving || phoneNumber === userData.phoneNumber}
                  className="bg-blue-900 hover:bg-blue-800 text-white"
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* Data Deletion Request Section */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-red-100 mb-12">
        <h3 className="text-2xl font-black text-gray-900 mb-2">
          Request Account Deletion
        </h3>
        <p className="text-gray-500 text-sm mb-6">
          Submit a request to delete your account and all associated data. An
          admin will review your request.
        </p>

        {deleteStatus === "pending" && (
          <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
            <Clock className="text-yellow-500 w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold text-yellow-800">Request Pending</p>
              <p className="text-sm text-yellow-600">
                Your deletion request is under review. You will be notified once
                a decision is made.
              </p>
            </div>
          </div>
        )}

        {deleteStatus === "approved" && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <CheckCircle className="text-green-500 w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold text-green-800">Request Approved</p>
              <p className="text-sm text-green-600">
                Your account deletion has been approved and will be processed
                shortly.
              </p>
            </div>
          </div>
        )}

        {deleteStatus === "rejected" && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <XCircle className="text-red-500 w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold text-red-800">Request Rejected</p>
              <p className="text-sm text-red-600">
                Reason: {deleteRejectedReason || "No reason provided."}
              </p>
              <p className="text-xs text-red-400 mt-1">
                You may submit a new request below.
              </p>
            </div>
          </div>
        )}

        {(!deleteStatus || deleteStatus === "rejected") && (
          <form onSubmit={handleRequestDeletion} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">
                Reason for Deletion
              </Label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Please explain why you want your account deleted..."
                required
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
              />
            </div>
            <Button
              type="submit"
              disabled={submitingDelete || !deleteReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {submitingDelete ? "Submitting..." : "Submit Deletion Request"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
