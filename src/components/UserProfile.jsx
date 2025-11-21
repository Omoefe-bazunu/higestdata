"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { firestore, storage } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { toast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, Upload, Key } from "lucide-react";

export default function UserProfile() {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

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
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }

    fetchUserData();
  }, [user]);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setLoading(true);
    try {
      const userRef = doc(firestore, "users", user.uid);
      await updateDoc(userRef, { name: name.trim() });

      setUserData({ ...userData, name: name.trim() });
      toast({ title: "Success", description: "Name updated successfully" });
    } catch (error) {
      console.error("Error updating name:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update name",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePhoneNumber = async (e) => {
    e.preventDefault();
    if (!user || !phoneNumber.trim()) return;

    setLoading(true);
    try {
      const userRef = doc(firestore, "users", user.uid);
      await updateDoc(userRef, { phoneNumber: phoneNumber.trim() });

      setUserData({ ...userData, phoneNumber: phoneNumber.trim() });
      toast({
        title: "Success",
        description: "Phone number updated successfully",
      });
    } catch (error) {
      console.error("Error updating phone number:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update phone number",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({
        title: "Email Sent",
        description:
          "Password reset link sent to your email (Also Check Spam folder)",
      });
    } catch (error) {
      console.error("Error sending reset email:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send reset email",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
      });
      return;
    }

    setUploading(true);
    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `profilePictures/${user.uid}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      // Update Firestore
      const userRef = doc(firestore, "users", user.uid);
      await updateDoc(userRef, { photoURL });

      setUserData({ ...userData, photoURL });
      toast({ title: "Success", description: "Profile picture updated" });
    } catch (error) {
      console.error("Error uploading picture:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload picture",
      });
    } finally {
      setUploading(false);
    }
  };

  if (!userData) return <p>Loading profile...</p>;

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Manage your account details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Picture */}
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={userData.photoURL} alt={userData.name} />
            <AvatarFallback className="text-2xl">
              {userData.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <Label htmlFor="picture" className="cursor-pointer">
              <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading..." : "Change Picture"}
              </div>
            </Label>
            <Input
              id="picture"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfilePictureUpload}
              disabled={uploading}
            />
            <p className="text-xs text-muted-foreground mt-1">Max size: 2MB</p>
          </div>
        </div>

        {/* Email (Read-only) */}
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={userData.email} disabled />
        </div>

        {/* Name */}
        <form onSubmit={handleUpdateName} className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <div className="flex gap-2">
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
            <Button type="submit" disabled={loading || name === userData.name}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>

        {/* Phone Number */}
        <form onSubmit={handleUpdatePhoneNumber} className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <div className="flex gap-2">
            <Input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+234 800 000 0000"
              required
            />
            <Button
              type="submit"
              disabled={loading || phoneNumber === userData.phoneNumber}
            >
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>

        {/* Status Badges */}
        <div className="space-y-2">
          <Label>Account Status</Label>
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={
                userData.isVerified
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }
            >
              {userData.isVerified ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Email Verified
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Not Verified
                </>
              )}
            </Badge>
            <Badge
              variant="outline"
              className={
                userData.kycStatus === "approved"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : userData.kycStatus === "pending"
                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                  : "bg-gray-50 text-gray-700 border-gray-200"
              }
            >
              KYC: {userData.kycStatus || "pending"}
            </Badge>
          </div>
        </div>

        {/* Password Reset */}
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePasswordReset}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <Key className="h-4 w-4 mr-2" />
            Reset Password
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
