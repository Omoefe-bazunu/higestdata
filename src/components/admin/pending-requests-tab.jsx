"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Eye,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Images,
} from "lucide-react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  query,
  where,
  increment,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { firestore } from "@/lib/firebaseConfig";

// Image Gallery Component
const ImageGallery = ({ images, title = "Images" }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">No images available</div>
    );
  }

  const imageList = Array.isArray(images)
    ? images
    : [{ url: images, name: "Card Image" }];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % imageList.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? imageList.length - 1 : prev - 1
    );
  };

  const openImageModal = (index) => {
    setCurrentImageIndex(index);
    setShowImageModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="font-semibold flex items-center gap-2">
          <Images className="h-4 w-4" />
          {title} ({imageList.length} image{imageList.length !== 1 ? "s" : ""})
        </Label>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {imageList.map((image, index) => (
          <div
            key={index}
            className="relative border rounded-lg p-2 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => openImageModal(index)}
          >
            <img
              src={image.url || image}
              alt={image.name || `Image ${index + 1}`}
              className="w-full h-24 object-cover rounded-md"
            />
            <div className="text-xs text-center mt-1 text-muted-foreground truncate">
              {image.name || `Image ${index + 1}`}
            </div>
            <div className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
              {index + 1}
            </div>
          </div>
        ))}
      </div>

      {/* Quick View - First Image */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Preview: Image 1 of {imageList.length}
          </span>
          <Button variant="outline" size="sm" onClick={() => openImageModal(0)}>
            <ExternalLink className="h-4 w-4 mr-2" />
            View All
          </Button>
        </div>
        <img
          src={imageList[0].url || imageList[0]}
          alt={imageList[0].name || "Card Image"}
          className="max-w-full h-auto max-h-64 rounded-md mx-auto shadow-md cursor-pointer"
          onClick={() => openImageModal(0)}
        />
      </div>

      {/* Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              Image {currentImageIndex + 1} of {imageList.length}
            </DialogTitle>
            <DialogDescription>
              {imageList[currentImageIndex].name ||
                `Card Image ${currentImageIndex + 1}`}
            </DialogDescription>
          </DialogHeader>

          <div className="relative flex items-center justify-center">
            {imageList.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 z-10"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 z-10"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            <div className="w-full flex justify-center">
              <img
                src={
                  imageList[currentImageIndex].url ||
                  imageList[currentImageIndex]
                }
                alt={
                  imageList[currentImageIndex].name ||
                  `Image ${currentImageIndex + 1}`
                }
                className="max-w-full max-h-[60vh] object-contain rounded-md"
              />
            </div>
          </div>

          {imageList.length > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {imageList.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentImageIndex
                      ? "bg-primary"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
          )}

          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              onClick={() =>
                window.open(
                  imageList[currentImageIndex].url ||
                    imageList[currentImageIndex],
                  "_blank"
                )
              }
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default function PendingRequestsTab() {
  const [giftCardRequests, setGiftCardRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [invalidReasons, setInvalidReasons] = useState({});
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { toast } = useToast();

  // Fetch gift card requests
  useEffect(() => {
    let isMounted = true;

    async function fetchRequests() {
      try {
        setLoading(true);
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          toast({
            title: "Authentication Error",
            description: "You must be logged in to view requests.",
            variant: "destructive",
          });
          return;
        }

        // Fetch gift card requests
        const giftCardSnapshot = await getDocs(
          collection(firestore, "giftCardSubmissions")
        );

        const giftCardData = giftCardSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(
            (req) => req.status === "pending" || req.status === "flagged"
          );

        if (isMounted) {
          setGiftCardRequests(giftCardData);
        }
      } catch (err) {
        console.error("Error fetching requests:", err);
        toast({
          title: "Error",
          description: `Failed to load requests: ${err.message}`,
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchRequests();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  // Handle status update
  const handleStatusUpdate = async (requestId, newStatus) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to update requests.",
        variant: "destructive",
      });
      return;
    }

    if (newStatus === "invalid" && !invalidReasons[requestId]?.trim()) {
      toast({
        title: "Invalid Input",
        description:
          "Please provide a reason for marking the request as invalid.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdating((prev) => ({ ...prev, [requestId]: true }));

      const request = giftCardRequests.find((req) => req.id === requestId);
      if (!request) {
        throw new Error("Request not found");
      }

      // Fetch user email from Firestore
      const userDocRef = doc(firestore, "users", request.userId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists() || !userDoc.data().email) {
        throw new Error("User email not found");
      }

      const userEmail = userDoc.data().email;

      // Update submission status
      const docRef = doc(firestore, "giftCardSubmissions", requestId);
      const updateData = {
        status: newStatus === "accepted" ? "approved" : "rejected",
        updatedAt: new Date().toISOString(),
      };

      if (newStatus === "invalid") {
        updateData.rejectionReason = invalidReasons[requestId];
      }

      await updateDoc(docRef, updateData);

      // Update related transaction status
      const transactionsQuery = query(
        collection(firestore, "users", request.userId, "transactions"),
        where("relatedSubmissionId", "==", requestId)
      );

      const transactionsSnapshot = await getDocs(transactionsQuery);

      if (!transactionsSnapshot.empty) {
        const transactionDoc = transactionsSnapshot.docs[0];
        const transactionUpdateData = {
          status: newStatus === "accepted" ? "Completed" : "Failed",
          updatedAt: new Date().toISOString(),
        };

        if (newStatus === "invalid") {
          transactionUpdateData.failureReason = invalidReasons[requestId];
        }

        await updateDoc(transactionDoc.ref, transactionUpdateData);
      }

      // If approved, update user's wallet balance
      if (newStatus === "accepted") {
        await updateDoc(userDocRef, {
          walletBalance: increment(request.payoutNaira),
          updatedAt: new Date().toISOString(),
        });
      }

      // Send email notification
      await sendUserNotification(
        request.userId,
        newStatus === "accepted" ? "approved" : "rejected",
        "giftCard",
        request.giftCardName,
        request.payoutNaira,
        invalidReasons[requestId],
        null,
        userEmail
      );

      // Remove from local state
      setGiftCardRequests((prev) => prev.filter((req) => req.id !== requestId));

      setInvalidReasons((prev) => {
        const newReasons = { ...prev };
        delete newReasons[requestId];
        return newReasons;
      });

      toast({
        title: "Status Updated",
        description: `Request ${
          newStatus === "accepted" ? "approved" : "rejected"
        } successfully.`,
      });
    } catch (err) {
      console.error("Error updating status:", err);
      toast({
        title: "Error",
        description: `Failed to update request: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setUpdating((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  // Send user notification
  const sendUserNotification = async (
    userId,
    status,
    type,
    itemName,
    amount,
    reason = null,
    cryptoName = null,
    userEmail
  ) => {
    try {
      const response = await fetch("/api/send-user-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          status,
          type,
          itemName,
          amount,
          reason,
          cryptoName,
          userEmail,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to send user notification:", errorText);
        throw new Error(`Email API failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Error sending user notification:", error);
    }
  };

  // Handle invalid reason input
  const handleInvalidReasonChange = (requestId, value) => {
    setInvalidReasons((prev) => ({ ...prev, [requestId]: value }));
  };

  // Handle view details
  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  return (
    <>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Gift Card Requests</CardTitle>
          <CardDescription>
            Review and update the status of pending or flagged gift card
            requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gift Card</TableHead>
                <TableHead>Face Value (USD)</TableHead>
                <TableHead>Payout (NGN)</TableHead>
                <TableHead>Images</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead>Invalid Reason</TableHead>
                <TableHead>Full Details</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-6 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : giftCardRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    No pending gift card requests.
                  </TableCell>
                </TableRow>
              ) : (
                giftCardRequests.map((req) => {
                  const imageCount = req.imageUrls
                    ? req.imageUrls.length
                    : req.imageUrl
                    ? 1
                    : 0;

                  return (
                    <TableRow key={req.id}>
                      <TableCell>{req.giftCardName}</TableCell>
                      <TableCell>
                        ${req.faceValue?.toFixed(2) || "N/A"}
                      </TableCell>
                      <TableCell>
                        ₦{req.payoutNaira?.toLocaleString() || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Images className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{imageCount}</span>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{req.status}</TableCell>
                      <TableCell>
                        {req.submittedAt || req.createdAt
                          ? new Date(
                              req.submittedAt || req.createdAt
                            ).toLocaleString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Reason for rejection"
                          value={invalidReasons[req.id] || ""}
                          onChange={(e) =>
                            handleInvalidReasonChange(req.id, e.target.value)
                          }
                          disabled={updating[req.id]}
                          className="w-40"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(req)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          onValueChange={(value) =>
                            handleStatusUpdate(req.id, value)
                          }
                          disabled={updating[req.id]}
                        >
                          <SelectTrigger className="w-32 ml-auto">
                            <SelectValue placeholder="Update status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="accepted">Accept</SelectItem>
                            <SelectItem value="invalid">Reject</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gift Card Request Details</DialogTitle>
            <DialogDescription>
              Full details of the submitted request
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Gift Card Name</Label>
                  <p>{selectedRequest.giftCardName}</p>
                </div>
                <div>
                  <Label className="font-semibold">Face Value (USD)</Label>
                  <p>${selectedRequest.faceValue?.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="font-semibold">Payout (NGN)</Label>
                  <p>₦{selectedRequest.payoutNaira?.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="font-semibold">Exchange Rate</Label>
                  <p>₦{selectedRequest.exchangeRate?.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="font-semibold">Rate Percentage</Label>
                  <p>{selectedRequest.ratePercentage}%</p>
                </div>
                <div>
                  <Label className="font-semibold">Status</Label>
                  <p className="capitalize">{selectedRequest.status}</p>
                </div>
                <div>
                  <Label className="font-semibold">Card Code</Label>
                  <p className="font-mono text-sm bg-gray-100 p-2 rounded break-all">
                    {selectedRequest.cardCode}
                  </p>
                </div>
                <div>
                  <Label className="font-semibold">Submitted At</Label>
                  <p>
                    {new Date(
                      selectedRequest.submittedAt || selectedRequest.createdAt
                    ).toLocaleString()}
                  </p>
                </div>
                <div className="col-span-2">
                  <Label className="font-semibold">User ID</Label>
                  <p className="text-xs font-mono">{selectedRequest.userId}</p>
                </div>
              </div>

              {/* Card Images Section */}
              <div className="space-y-4">
                <ImageGallery
                  images={
                    selectedRequest.imageUrls ||
                    (selectedRequest.imageUrl ? [selectedRequest.imageUrl] : [])
                  }
                  title="Card Images"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
