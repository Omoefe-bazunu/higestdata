"use client";

import { useState, useEffect } from "react";
import { firestore } from "@/lib/firebaseConfig";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, Users, Search } from "lucide-react";

export default function AdminUsersManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const q = query(
          collection(firestore, "users"),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const usersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData);
        setFilteredUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phoneNumber?.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto py-4 md:py-6 space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Users className="h-5 w-5 md:h-6 md:w-6" />
            Users Management
          </CardTitle>
          <CardDescription className="text-sm md:text-base">
            Total registered users: <strong>{users.length}</strong>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Statistics Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="text-center p-3 md:p-4 bg-gray-50 rounded-lg">
              <p className="text-xl md:text-2xl font-bold text-gray-800">
                {users.length}
              </p>
              <p className="text-xs md:text-sm text-gray-600">Total Users</p>
            </div>
            <div className="text-center p-3 md:p-4 bg-green-50 rounded-lg">
              <p className="text-xl md:text-2xl font-bold text-green-700">
                {users.filter((u) => u.isVerified).length}
              </p>
              <p className="text-xs md:text-sm text-gray-600">Verified</p>
            </div>
            <div className="text-center p-3 md:p-4 bg-yellow-50 rounded-lg">
              <p className="text-xl md:text-2xl font-bold text-yellow-700">
                {users.filter((u) => u.kycStatus === "pending").length}
              </p>
              <p className="text-xs md:text-sm text-gray-600">KYC Pending</p>
            </div>
            <div className="text-center p-3 md:p-4 bg-blue-50 rounded-lg">
              <p className="text-xl md:text-2xl font-bold text-blue-700">
                {users.filter((u) => u.kycStatus === "approved").length}
              </p>
              <p className="text-xs md:text-sm text-gray-600">KYC Approved</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name, email, or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchQuery && (
            <p className="text-sm text-gray-600 mt-2">
              Found {filteredUsers.length} user(s)
            </p>
          )}
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-600">
              No users found
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id} className="overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  {/* Avatar */}
                  <Avatar className="h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0">
                    <AvatarImage src={user.photoURL} alt={user.name} />
                    <AvatarFallback className="text-base sm:text-lg">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>

                  {/* User Info */}
                  <div className="flex-1 min-w-0 w-full space-y-3">
                    <div className="break-words">
                      <h3 className="font-semibold text-base sm:text-lg truncate">
                        {user.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 break-all">
                        {user.email}
                      </p>
                      {user.phoneNumber && (
                        <p className="text-xs sm:text-sm text-gray-600 break-all">
                          {user.phoneNumber}
                        </p>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          user.isVerified
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {user.isVerified ? (
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
                        className={`text-xs ${
                          user.kycStatus === "approved"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : user.kycStatus === "pending"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : "bg-gray-50 text-gray-700 border-gray-200"
                        }`}
                      >
                        KYC: {user.kycStatus || "pending"}
                      </Badge>

                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                      >
                        Balance: ₦{user.walletBalance?.toLocaleString() || 0}
                      </Badge>
                    </div>

                    {/* Additional Info */}
                    <div className="text-xs text-gray-500 break-words space-y-1">
                      <p className="break-all">User ID: {user.id}</p>
                      {user.createdAt && (
                        <p>
                          Joined:{" "}
                          {new Date(user.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
