// "use client";

// import { useState, useEffect } from "react";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from "@/components/ui/card";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Skeleton } from "@/components/ui/skeleton";
// import { useToast } from "@/hooks/use-toast";
// import {
//   Eye,
//   ExternalLink,
//   ChevronLeft,
//   ChevronRight,
//   Images,
//   X,
//   Check,
//   MessageSquare,
// } from "lucide-react";
// import {
//   collection,
//   getDocs,
//   doc,
//   updateDoc,
//   getDoc,
//   query,
//   where,
//   increment,
// } from "firebase/firestore";
// import { getAuth } from "firebase/auth";
// import { firestore } from "@/lib/firebaseConfig";

// // Image Gallery Component
// const ImageGallery = ({ images, title = "Images" }) => {
//   const [currentImageIndex, setCurrentImageIndex] = useState(0);
//   const [showImageModal, setShowImageModal] = useState(false);

//   if (!images || images.length === 0) {
//     return (
//       <div className="text-sm text-muted-foreground">No images available</div>
//     );
//   }

//   const imageList = Array.isArray(images)
//     ? images
//     : [{ url: images, name: "Card Image" }];

//   const nextImage = () => {
//     setCurrentImageIndex((prev) => (prev + 1) % imageList.length);
//   };

//   const prevImage = () => {
//     setCurrentImageIndex((prev) =>
//       prev === 0 ? imageList.length - 1 : prev - 1
//     );
//   };

//   const openImageModal = (index) => {
//     setCurrentImageIndex(index);
//     setShowImageModal(true);
//   };

//   return (
//     <div className="space-y-4">
//       <div className="flex items-center justify-between">
//         <Label className="font-semibold flex items-center gap-2">
//           <Images className="h-4 w-4" />
//           {title} ({imageList.length} image{imageList.length !== 1 ? "s" : ""})
//         </Label>
//       </div>

//       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
//         {imageList.map((image, index) => (
//           <div
//             key={index}
//             className="relative border rounded-lg p-2 cursor-pointer hover:shadow-md transition-shadow"
//             onClick={() => openImageModal(index)}
//           >
//             <img
//               src={image.url || image}
//               alt={image.name || `Image ${index + 1}`}
//               className="w-full h-24 object-cover rounded-md"
//             />
//             <div className="text-xs text-center mt-1 text-muted-foreground truncate">
//               {image.name || `Image ${index + 1}`}
//             </div>
//             <div className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
//               {index + 1}
//             </div>
//           </div>
//         ))}
//       </div>

//       <div className="border rounded-lg p-4 bg-gray-50">
//         <div className="flex items-center justify-between mb-2">
//           <span className="text-sm font-medium">
//             Preview: Image 1 of {imageList.length}
//           </span>
//           <Button variant="outline" size="sm" onClick={() => openImageModal(0)}>
//             <ExternalLink className="h-4 w-4 mr-2" />
//             View All
//           </Button>
//         </div>
//         <img
//           src={imageList[0].url || imageList[0]}
//           alt={imageList[0].name || "Card Image"}
//           className="max-w-full h-auto max-h-64 rounded-md mx-auto shadow-md cursor-pointer"
//           onClick={() => openImageModal(0)}
//         />
//       </div>

//       <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
//         <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
//           <DialogHeader>
//             <DialogTitle>
//               Image {currentImageIndex + 1} of {imageList.length}
//             </DialogTitle>
//             <DialogDescription>
//               {imageList[currentImageIndex].name ||
//                 `Card Image ${currentImageIndex + 1}`}
//             </DialogDescription>
//           </DialogHeader>

//           <div className="relative flex items-center justify-center">
//             {imageList.length > 1 && (
//               <>
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   className="absolute left-2 z-10"
//                   onClick={prevImage}
//                 >
//                   <ChevronLeft className="h-4 w-4" />
//                 </Button>
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   className="absolute right-2 z-10"
//                   onClick={nextImage}
//                 >
//                   <ChevronRight className="h-4 w-4" />
//                 </Button>
//               </>
//             )}

//             <div className="w-full flex justify-center">
//               <img
//                 src={
//                   imageList[currentImageIndex].url ||
//                   imageList[currentImageIndex]
//                 }
//                 alt={
//                   imageList[currentImageIndex].name ||
//                   `Image ${currentImageIndex + 1}`
//                 }
//                 className="max-w-full max-h-[60vh] object-contain rounded-md"
//               />
//             </div>
//           </div>

//           {imageList.length > 1 && (
//             <div className="flex justify-center gap-2 mt-4">
//               {imageList.map((_, index) => (
//                 <button
//                   key={index}
//                   className={`w-2 h-2 rounded-full transition-colors ${
//                     index === currentImageIndex
//                       ? "bg-primary"
//                       : "bg-gray-300 hover:bg-gray-400"
//                   }`}
//                   onClick={() => setCurrentImageIndex(index)}
//                 />
//               ))}
//             </div>
//           )}

//           <div className="flex justify-center mt-4">
//             <Button
//               variant="outline"
//               onClick={() =>
//                 window.open(
//                   imageList[currentImageIndex].url ||
//                     imageList[currentImageIndex],
//                   "_blank"
//                 )
//               }
//             >
//               <ExternalLink className="h-4 w-4 mr-2" />
//               Open in New Tab
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default function PendingRequestsTab() {
//   const [giftCardRequests, setGiftCardRequests] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [updating, setUpdating] = useState({});
//   const [invalidReasons, setInvalidReasons] = useState({});
//   const [selectedRequest, setSelectedRequest] = useState(null);
//   const [showDetailsModal, setShowDetailsModal] = useState(false);
//   const { toast } = useToast();
//   const [negotiatingId, setNegotiatingId] = useState(null);
//   const [negotiationData, setNegotiationData] = useState({
//     rate: "",
//     amount: "",
//     reason: "",
//   });

//   useEffect(() => {
//     let isMounted = true;

//     async function fetchRequests() {
//       try {
//         setLoading(true);
//         const auth = getAuth();
//         const user = auth.currentUser;

//         if (!user) {
//           toast({
//             title: "Authentication Error",
//             description: "You must be logged in to view requests.",
//             variant: "destructive",
//           });
//           return;
//         }

//         const snapshot = await getDocs(
//           collection(firestore, "giftCardSubmissions")
//         );

//         const data = snapshot.docs
//           .map((doc) => ({
//             id: doc.id,
//             ...doc.data(),
//           }))
//           .filter(
//             (req) => req.status === "pending" || req.status === "flagged"
//           );

//         if (isMounted) {
//           setGiftCardRequests(data);
//         }
//       } catch (err) {
//         toast({
//           title: "Error",
//           description: `Failed to load requests: ${err.message}`,
//           variant: "destructive",
//         });
//       } finally {
//         if (isMounted) {
//           setLoading(false);
//         }
//       }
//     }

//     fetchRequests();

//     return () => {
//       isMounted = false;
//     };
//   }, [toast]);

//   const handleStatusUpdate = async (requestId, newStatus) => {
//     const auth = getAuth();
//     const user = auth.currentUser;

//     if (!user) {
//       toast({
//         title: "Authentication Error",
//         description: "You must be logged in to update requests.",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (newStatus === "invalid" && !invalidReasons[requestId]?.trim()) {
//       toast({
//         title: "Invalid Input",
//         description: "Please provide a reason for rejection.",
//         variant: "destructive",
//       });
//       return;
//     }

//     try {
//       setUpdating((prev) => ({ ...prev, [requestId]: true }));

//       const request = giftCardRequests.find((req) => req.id === requestId);
//       if (!request) throw new Error("Request not found");

//       const userDocRef = doc(firestore, "users", request.userId);
//       const userDoc = await getDoc(userDocRef);
//       if (!userDoc.exists() || !userDoc.data().email) {
//         throw new Error("User email not found");
//       }

//       const docRef = doc(firestore, "giftCardSubmissions", requestId);
//       const updateData = {
//         status: newStatus === "accepted" ? "approved" : "rejected",
//         updatedAt: new Date().toISOString(),
//       };

//       if (newStatus === "invalid") {
//         updateData.rejectionReason = invalidReasons[requestId];
//       }

//       await updateDoc(docRef, updateData);

//       const transactionsQuery = query(
//         collection(firestore, "users", request.userId, "transactions"),
//         where("relatedSubmissionId", "==", requestId)
//       );

//       const transactionsSnapshot = await getDocs(transactionsQuery);
//       if (!transactionsSnapshot.empty) {
//         const transactionDoc = transactionsSnapshot.docs[0];
//         const transactionUpdateData = {
//           status: newStatus === "accepted" ? "Completed" : "Failed",
//           updatedAt: new Date().toISOString(),
//         };

//         if (newStatus === "invalid") {
//           transactionUpdateData.failureReason = invalidReasons[requestId];
//         }

//         await updateDoc(transactionDoc.ref, transactionUpdateData);
//       }

//       if (newStatus === "accepted") {
//         await updateDoc(userDocRef, {
//           walletBalance: increment(request.payoutNaira),
//           updatedAt: new Date().toISOString(),
//         });
//       }

//       await sendUserNotification(
//         request.userId,
//         newStatus === "accepted" ? "approved" : "rejected",
//         "giftCard",
//         request.giftCardName,
//         request.payoutNaira,
//         invalidReasons[requestId],
//         request.currency,
//         userDoc.data().email
//       );

//       setGiftCardRequests((prev) => prev.filter((req) => req.id !== requestId));
//       setInvalidReasons((prev) => {
//         const newReasons = { ...prev };
//         delete newReasons[requestId];
//         return newReasons;
//       });

//       toast({
//         title: "Success",
//         description: `Request ${
//           newStatus === "accepted" ? "approved" : "rejected"
//         }.`,
//       });
//     } catch (err) {
//       toast({
//         title: "Error",
//         description: `Failed: ${err.message}`,
//         variant: "destructive",
//       });
//     } finally {
//       setUpdating((prev) => ({ ...prev, [requestId]: false }));
//     }
//   };

//   const handleNegotiateClick = (req) => {
//     setNegotiatingId(req.id);
//     setNegotiationData({
//       rate: req.ratePerUnit,
//       amount: req.payoutNaira,
//       reason: "Market rate dropped",
//     });
//   };

//   const submitNegotiation = async (requestId) => {
//     try {
//       const newPayout = parseFloat(negotiationData.amount);
//       const newRate = parseFloat(negotiationData.rate);

//       if (isNaN(newPayout) || isNaN(newRate)) return;

//       await updateDoc(doc(firestore, "giftCardSubmissions", requestId), {
//         status: "negotiating",
//         adminProposal: {
//           newRate,
//           newPayout,
//           reason: negotiationData.reason,
//           proposedAt: new Date().toISOString(),
//         },
//       });

//       toast({ title: "Offer Sent", description: "User notified of new rate." });
//       setNegotiatingId(null);
//     } catch (err) {
//       toast({ title: "Error", variant: "destructive" });
//     }
//   };

//   const sendUserNotification = async (
//     userId,
//     status,
//     type,
//     itemName,
//     amount,
//     reason = null,
//     currency = null,
//     userEmail
//   ) => {
//     try {
//       await fetch("/api/send-user-notification", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           userId,
//           status,
//           type,
//           itemName,
//           amount,
//           reason,
//           currency,
//           userEmail,
//         }),
//       });
//     } catch (error) {
//       console.error("Notification failed:", error);
//     }
//   };

//   const handleInvalidReasonChange = (requestId, value) => {
//     setInvalidReasons((prev) => ({ ...prev, [requestId]: value }));
//   };

//   const handleViewDetails = (request) => {
//     setSelectedRequest(request);
//     setShowDetailsModal(true);
//   };

//   return (
//     <>
//       <Card className="mt-4">
//         <CardHeader>
//           <CardTitle>Gift Card Requests</CardTitle>
//           <CardDescription>
//             Review pending or flagged gift card submissions.
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Card</TableHead>
//                 <TableHead>Value</TableHead>
//                 <TableHead>Payout (NGN)</TableHead>
//                 <TableHead>Rate</TableHead>
//                 <TableHead>Images</TableHead>
//                 <TableHead>Status</TableHead>
//                 <TableHead>Submitted</TableHead>
//                 <TableHead>Reason</TableHead>
//                 <TableHead>Details</TableHead>
//                 <TableHead className="text-right">Actions</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {loading ? (
//                 Array.from({ length: 4 }).map((_, i) => (
//                   <TableRow key={i}>
//                     <TableCell>
//                       <Skeleton className="h-6 w-32" />
//                     </TableCell>
//                     <TableCell>
//                       <Skeleton className="h-6 w-24" />
//                     </TableCell>
//                     <TableCell>
//                       <Skeleton className="h-6 w-28" />
//                     </TableCell>
//                     <TableCell>
//                       <Skeleton className="h-6 w-20" />
//                     </TableCell>
//                     <TableCell>
//                       <Skeleton className="h-6 w-16" />
//                     </TableCell>
//                     <TableCell>
//                       <Skeleton className="h-6 w-20" />
//                     </TableCell>
//                     <TableCell>
//                       <Skeleton className="h-6 w-32" />
//                     </TableCell>
//                     <TableCell>
//                       <Skeleton className="h-6 w-32" />
//                     </TableCell>
//                     <TableCell>
//                       <Skeleton className="h-6 w-20" />
//                     </TableCell>
//                     <TableCell>
//                       <Skeleton className="h-6 w-20 ml-auto" />
//                     </TableCell>
//                   </TableRow>
//                 ))
//               ) : giftCardRequests.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={10} className="text-center py-8">
//                     No pending requests.
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 giftCardRequests.map((req) => {
//                   const imageCount = req.imageUrls?.length || 0;
//                   return (
//                     <TableRow key={req.id}>
//                       <TableCell className="font-medium">
//                         {req.giftCardName}
//                       </TableCell>
//                       <TableCell>
//                         {req.faceValue} {req.currency}
//                       </TableCell>
//                       <TableCell>
//                         ₦{req.payoutNaira?.toLocaleString()}
//                       </TableCell>
//                       <TableCell>
//                         ₦{req.ratePerUnit?.toLocaleString()}
//                       </TableCell>
//                       <TableCell>
//                         <div className="flex items-center gap-1">
//                           <Images className="h-4 w-4 text-muted-foreground" />
//                           <span className="text-sm">{imageCount}</span>
//                         </div>
//                       </TableCell>
//                       <TableCell className="capitalize">{req.status}</TableCell>
//                       <TableCell>
//                         {new Date(req.submittedAt).toLocaleString()}
//                       </TableCell>
//                       <TableCell>
//                         <Input
//                           placeholder="Rejection reason"
//                           value={invalidReasons[req.id] || ""}
//                           onChange={(e) =>
//                             handleInvalidReasonChange(req.id, e.target.value)
//                           }
//                           disabled={updating[req.id]}
//                           className="w-40"
//                         />
//                       </TableCell>
//                       <TableCell>
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           onClick={() => handleViewDetails(req)}
//                         >
//                           <Eye className="h-4 w-4" />
//                         </Button>
//                       </TableCell>
//                       {/* Action Buttons */}
//                       <TableCell className="text-right">
//                         {req.status === "user_accepted" ? (
//                           <div className="flex flex-col gap-1 items-end">
//                             <Badge className="bg-green-100 text-green-800 mb-1">
//                               User Accepted
//                             </Badge>
//                             <Button
//                               size="sm"
//                               onClick={() =>
//                                 handleStatusUpdate(req.id, "accepted")
//                               }
//                             >
//                               Finalize Pay
//                             </Button>
//                           </div>
//                         ) : negotiatingId === req.id ? (
//                           <div className="flex flex-col gap-2 bg-white p-2 border rounded shadow-lg absolute right-4 z-10 w-64">
//                             <p className="text-xs font-bold">Counter Offer</p>
//                             <div className="grid grid-cols-2 gap-2">
//                               <div>
//                                 <Label className="text-[10px]">New Rate</Label>
//                                 <Input
//                                   className="h-7 text-xs"
//                                   type="number"
//                                   value={negotiationData.rate}
//                                   onChange={(e) =>
//                                     setNegotiationData({
//                                       ...negotiationData,
//                                       rate: e.target.value,
//                                     })
//                                   }
//                                 />
//                               </div>
//                               <div>
//                                 <Label className="text-[10px]">
//                                   New Payout
//                                 </Label>
//                                 <Input
//                                   className="h-7 text-xs"
//                                   type="number"
//                                   value={negotiationData.amount}
//                                   onChange={(e) =>
//                                     setNegotiationData({
//                                       ...negotiationData,
//                                       amount: e.target.value,
//                                     })
//                                   }
//                                 />
//                               </div>
//                             </div>
//                             <Input
//                               className="h-7 text-xs"
//                               placeholder="Reason"
//                               value={negotiationData.reason}
//                               onChange={(e) =>
//                                 setNegotiationData({
//                                   ...negotiationData,
//                                   reason: e.target.value,
//                                 })
//                               }
//                             />
//                             <div className="flex gap-2">
//                               <Button
//                                 size="sm"
//                                 className="w-full h-7 text-xs"
//                                 onClick={() => submitNegotiation(req.id)}
//                               >
//                                 Send
//                               </Button>
//                               <Button
//                                 size="sm"
//                                 variant="ghost"
//                                 className="w-full h-7 text-xs"
//                                 onClick={() => setNegotiatingId(null)}
//                               >
//                                 Cancel
//                               </Button>
//                             </div>
//                           </div>
//                         ) : (
//                           <div className="flex justify-end gap-2">
//                             <Button
//                               variant="outline"
//                               size="sm"
//                               onClick={() => handleNegotiateClick(req)}
//                             >
//                               <MessageSquare className="h-4 w-4" />
//                             </Button>
//                             <Select
//                               onValueChange={(v) =>
//                                 handleStatusUpdate(req.id, v)
//                               }
//                             >
//                               {/* Existing Select Logic */}
//                             </Select>
//                           </div>
//                         )}
//                       </TableCell>
//                     </TableRow>
//                   );
//                 })
//               )}
//             </TableBody>
//           </Table>
//         </CardContent>
//       </Card>

//       <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
//         <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>Request Details</DialogTitle>
//             <DialogDescription>Full submission info</DialogDescription>
//           </DialogHeader>

//           {selectedRequest && (
//             <div className="space-y-6">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <Label className="font-semibold">Gift Card</Label>
//                   <p>{selectedRequest.giftCardName}</p>
//                 </div>
//                 <div>
//                   <Label className="font-semibold">Face Value</Label>
//                   <p>
//                     {selectedRequest.faceValue} {selectedRequest.currency}
//                   </p>
//                 </div>
//                 <div>
//                   <Label className="font-semibold">Payout (NGN)</Label>
//                   <p>₦{selectedRequest.payoutNaira?.toLocaleString()}</p>
//                 </div>
//                 <div>
//                   <Label className="font-semibold">Rate (per unit)</Label>
//                   <p>₦{selectedRequest.ratePerUnit?.toLocaleString()}</p>
//                 </div>
//                 <div>
//                   <Label className="font-semibold">Status</Label>
//                   <p className="capitalize">{selectedRequest.status}</p>
//                 </div>
//                 <div>
//                   <Label className="font-semibold">Card Code</Label>
//                   <p className="font-mono text-sm bg-gray-100 p-2 rounded break-all">
//                     {selectedRequest.cardCode || "—"}
//                   </p>
//                 </div>
//                 <div>
//                   <Label className="font-semibold">Submitted At</Label>
//                   <p>
//                     {new Date(selectedRequest.submittedAt).toLocaleString()}
//                   </p>
//                 </div>
//                 <div>
//                   <Label className="font-semibold">User ID</Label>
//                   <p className="text-xs font-mono">{selectedRequest.userId}</p>
//                 </div>
//               </div>

//               <div className="space-y-4">
//                 <ImageGallery
//                   images={selectedRequest.imageUrls || []}
//                   title="Card Images"
//                 />
//               </div>
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// }

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
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Eye, CheckCircle, XCircle, RefreshCw } from "lucide-react";
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
import { firestore } from "@/lib/firebaseConfig";
import { Badge } from "@/components/ui/badge";

const ImageGallery = ({ images }) => {
  if (!images?.length)
    return <span className="text-sm text-muted">No images</span>;
  return (
    <div className="flex gap-2 overflow-x-auto py-2">
      {images.map((img, i) => (
        <a key={i} href={img.url} target="_blank" rel="noreferrer">
          <img
            src={img.url}
            className="h-16 w-16 object-cover rounded border hover:scale-105 transition-transform"
            alt="Card"
          />
        </a>
      ))}
    </div>
  );
};

export default function PendingRequestsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [selectedReq, setSelectedReq] = useState(null);

  // Negotiation State
  const [showNegotiateDialog, setShowNegotiateDialog] = useState(false);
  const [negotiateRate, setNegotiateRate] = useState("");
  const [negotiateReason, setNegotiateReason] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const snapshot = await getDocs(
        collection(firestore, "giftCardSubmissions")
      );
      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((r) =>
          [
            "pending",
            "flagged",
            "negotiating",
            "negotiation_accepted",
            "negotiation_rejected",
          ].includes(r.status)
        )
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      setRequests(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // --- FIXED: Added amountOverride parameter ---
  const sendNotification = async (
    req,
    status,
    amountOverride = null,
    details = null,
    reason = null
  ) => {
    try {
      let userEmail = req.userEmail;
      if (!userEmail) {
        const userDoc = await getDoc(doc(firestore, "users", req.userId));
        if (userDoc.exists()) userEmail = userDoc.data().email;
      }

      // Use the override if provided (for approved negotiated amounts), otherwise default to current doc amount
      const finalAmount =
        amountOverride !== null ? amountOverride : req.payoutNaira;

      await fetch("/api/send-user-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: req.userId,
          status: status,
          type: "giftCard",
          itemName: req.giftCardName,
          amount: finalAmount, // Sending the correct amount
          userEmail: userEmail,
          reason: reason,
          negotiationDetails: details,
        }),
      });
    } catch (error) {
      console.error("Failed to send email", error);
    }
  };

  const handleNegotiateSubmit = async () => {
    if (!selectedReq || !negotiateRate || !negotiateReason) {
      toast({
        title: "Missing Info",
        description: "Rate and Reason are required.",
        variant: "destructive",
      });
      return;
    }

    const newRate = parseFloat(negotiateRate);
    const newPayout = newRate * selectedReq.faceValue;

    if (isNaN(newRate) || newRate <= 0) return;

    setUpdating((prev) => ({ ...prev, [selectedReq.id]: true }));
    try {
      await updateDoc(doc(firestore, "giftCardSubmissions", selectedReq.id), {
        status: "negotiating",
        negotiation: {
          originalRate: selectedReq.ratePerUnit,
          originalPayout: selectedReq.payoutNaira,
          proposedRate: newRate,
          proposedPayout: newPayout,
          adminReason: negotiateReason,
          status: "open",
          createdAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      });

      // Pass newPayout as amountOverride
      await sendNotification(
        selectedReq,
        "negotiating",
        newPayout,
        { newRate, newPayout },
        negotiateReason
      );

      toast({ title: "Offer Sent", description: "User has been notified." });
      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedReq.id ? { ...r, status: "negotiating" } : r
        )
      );
      setShowNegotiateDialog(false);
      setSelectedReq(null);
    } catch (err) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUpdating((prev) => ({ ...prev, [selectedReq.id]: false }));
    }
  };

  const updateStatus = async (reqId, action, reason = null) => {
    setUpdating((prev) => ({ ...prev, [reqId]: true }));
    try {
      const req = requests.find((r) => r.id === reqId);
      const userRef = doc(firestore, "users", req.userId);
      const subRef = doc(firestore, "giftCardSubmissions", reqId);

      let finalStatus = action === "approve" ? "approved" : "rejected";
      let payoutAmount = req.payoutNaira;
      let finalRate = req.ratePerUnit;

      // --- CRITICAL FIX: Update local variables based on negotiation ---
      if (req.status === "negotiation_accepted" && action === "approve") {
        payoutAmount = req.negotiation.proposedPayout; // Get new amount
        finalRate = req.negotiation.proposedRate;

        await updateDoc(subRef, {
          ratePerUnit: finalRate,
          payoutNaira: payoutAmount,
          "negotiation.status": "completed",
        });
      }

      await updateDoc(subRef, {
        status: finalStatus,
        rejectionReason: reason,
        updatedAt: new Date().toISOString(),
      });

      if (finalStatus === "approved") {
        await updateDoc(userRef, {
          walletBalance: increment(payoutAmount),
        });
      }

      const txQuery = query(
        collection(firestore, "users", req.userId, "transactions"),
        where("relatedSubmissionId", "==", reqId)
      );
      const txSnap = await getDocs(txQuery);
      if (!txSnap.empty) {
        await updateDoc(txSnap.docs[0].ref, {
          status: finalStatus === "approved" ? "Completed" : "Failed",
          amount: payoutAmount,
          failureReason: reason,
        });
      }

      // --- FIXED: Pass the calculated payoutAmount to the email function ---
      await sendNotification(req, finalStatus, payoutAmount, null, reason);

      setRequests((prev) => prev.filter((r) => r.id !== reqId));
      toast({ title: "Success", description: `Request ${finalStatus}.` });
    } catch (err) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUpdating((prev) => ({ ...prev, [reqId]: false }));
      setSelectedReq(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            Pending
          </Badge>
        );
      case "negotiating":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Negotiating...
          </Badge>
        );
      case "negotiation_accepted":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            User Accepted Offer
          </Badge>
        );
      case "negotiation_rejected":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            User Declined Offer
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Pending & Negotiating</CardTitle>
          <CardDescription>
            Manage sell orders and counter-offers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Card</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Payout (Current)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-12 w-full" />
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No pending requests.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-mono text-xs">
                      {req.userId.slice(0, 5)}...
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{req.giftCardName}</div>
                      <div className="text-xs text-muted-foreground">
                        {req.cardType}
                      </div>
                    </TableCell>
                    <TableCell>
                      {req.currency} {req.faceValue}
                    </TableCell>
                    <TableCell>
                      {req.status === "negotiating" ? (
                        <span className="text-muted-foreground line-through decoration-red-500">
                          ₦{req.payoutNaira.toLocaleString()}
                        </span>
                      ) : req.status === "negotiation_accepted" ? (
                        <span className="text-green-600 font-bold">
                          ₦{req.negotiation.proposedPayout.toLocaleString()}
                        </span>
                      ) : (
                        `₦${req.payoutNaira.toLocaleString()}`
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedReq(req)}
                      >
                        <Eye className="h-4 w-4 mr-2" /> Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog
        open={!!selectedReq && !showNegotiateDialog}
        onOpenChange={(o) => !o && setSelectedReq(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
          </DialogHeader>

          {selectedReq && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm p-4 bg-slate-50 rounded-lg">
                <div>
                  <Label className="text-muted-foreground">Card</Label>
                  <div className="font-medium">
                    {selectedReq.giftCardName} ({selectedReq.cardType})
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Face Value</Label>
                  <div className="font-medium">
                    {selectedReq.currency} {selectedReq.faceValue}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Original Rate</Label>
                  <div className="font-medium">{selectedReq.ratePerUnit}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Original Payout
                  </Label>
                  <div className="font-medium">
                    ₦{selectedReq.payoutNaira.toLocaleString()}
                  </div>
                </div>
                {selectedReq.rateTag && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Tag</Label>
                    <div>
                      <Badge variant="secondary">{selectedReq.rateTag}</Badge>
                    </div>
                  </div>
                )}
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Card Code</Label>
                  <div className="font-mono bg-white border px-2 py-1 rounded select-all">
                    {selectedReq.cardCode || "N/A"}
                  </div>
                </div>
              </div>

              {selectedReq.status === "negotiation_accepted" && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-md">
                  <h4 className="font-bold text-green-800 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" /> User Accepted New Offer
                  </h4>
                  <p className="text-sm mt-1 text-green-700">
                    User accepted{" "}
                    <strong>₦{selectedReq.negotiation.proposedRate}</strong>{" "}
                    (Payout: ₦
                    {selectedReq.negotiation.proposedPayout.toLocaleString()}).
                  </p>
                </div>
              )}

              {selectedReq.status === "negotiation_rejected" && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-md">
                  <h4 className="font-bold text-red-800 flex items-center gap-2">
                    <XCircle className="h-4 w-4" /> User Declined Offer
                  </h4>
                  <p className="text-sm mt-1 text-red-700">
                    Reason: "{selectedReq.negotiation.userReason}"
                  </p>
                </div>
              )}

              <div>
                <Label>Card Images</Label>
                <ImageGallery images={selectedReq.imageUrls} />
              </div>

              <div className="flex flex-col gap-4 border-t pt-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Rejection Reason (if rejecting)"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                  <Button
                    variant="destructive"
                    disabled={updating[selectedReq.id]}
                    onClick={() =>
                      updateStatus(selectedReq.id, "reject", rejectionReason)
                    }
                  >
                    Reject Order
                  </Button>
                </div>

                <div className="flex justify-between items-center gap-4">
                  {selectedReq.status !== "negotiation_accepted" && (
                    <Button
                      variant="outline"
                      className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() => {
                        setNegotiateRate(
                          selectedReq.negotiation?.proposedRate || ""
                        );
                        setShowNegotiateDialog(true);
                      }}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {selectedReq.status === "negotiating"
                        ? "Update Offer"
                        : "Renegotiate"}
                    </Button>
                  )}

                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={
                      selectedReq.status === "negotiating" ||
                      updating[selectedReq.id]
                    }
                    onClick={() => updateStatus(selectedReq.id, "approve")}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {selectedReq.status === "negotiation_accepted"
                      ? "Confirm New Payout"
                      : "Approve Original"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showNegotiateDialog} onOpenChange={setShowNegotiateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renegotiate Rate</DialogTitle>
            <DialogDescription>
              Propose a new rate. User will be notified via email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-100 rounded">
              <div>
                <span className="text-xs text-muted-foreground">
                  Current Rate
                </span>
                <div className="font-bold">{selectedReq?.ratePerUnit}</div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">
                  Current Payout
                </span>
                <div className="font-bold">
                  ₦{selectedReq?.payoutNaira?.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>New Rate (per {selectedReq?.currency})</Label>
              <Input
                type="number"
                value={negotiateRate}
                onChange={(e) => setNegotiateRate(e.target.value)}
                placeholder="e.g. 950"
              />
            </div>

            {negotiateRate && (
              <div className="text-right text-sm text-green-600 font-medium">
                New Payout: ₦
                {(
                  parseFloat(negotiateRate) * (selectedReq?.faceValue || 0)
                ).toLocaleString()}
              </div>
            )}

            <div className="space-y-2">
              <Label>Reason for change</Label>
              <Textarea
                placeholder="e.g. Card is used, Rate dropped..."
                value={negotiateReason}
                onChange={(e) => setNegotiateReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNegotiateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleNegotiateSubmit}
              disabled={updating[selectedReq?.id]}
            >
              Send Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
