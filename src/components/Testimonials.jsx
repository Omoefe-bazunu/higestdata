"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star, Trash2, Edit3 } from "lucide-react";
import { firestore, auth, storage } from "@/lib/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [index, setIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [userReview, setUserReview] = useState(null);
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchTestimonials = async () => {
      const q = query(
        collection(firestore, "testimonials"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTestimonials(data);
    };
    fetchTestimonials();
  }, []);

  useEffect(() => {
    const fetchUserReview = async () => {
      if (!user) {
        setUserReview(null);
        return;
      }

      const userTestimonial = testimonials.find((t) => t.userId === user.uid);
      setUserReview(userTestimonial || null);
    };

    fetchUserReview();
  }, [user, testimonials]);

  const prevSlide = () =>
    setIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  const nextSlide = () =>
    setIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || !rating) return;

    setLoading(true);
    try {
      let imageUrl = userReview?.imageUrl || "";

      if (imageFile) {
        // Delete old image if exists and we're updating
        if (editing && userReview?.imageUrl) {
          try {
            const oldImageRef = ref(storage, userReview.imageUrl);
            await deleteObject(oldImageRef);
          } catch (error) {
            console.log("Error deleting old image:", error);
          }
        }

        const imageRef = ref(storage, `testimonials/${user.uid}-${Date.now()}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      if (editing && userReview) {
        const refDoc = doc(firestore, "testimonials", userReview.id);
        await updateDoc(refDoc, {
          text,
          rating,
          name,
          occupation,
          imageUrl,
        });
      } else {
        await addDoc(collection(firestore, "testimonials"), {
          name: name || user.displayName || "Anonymous",
          occupation,
          userId: user.uid,
          text,
          rating,
          imageUrl,
          createdAt: serverTimestamp(),
        });
      }

      setText("");
      setName("");
      setOccupation("");
      setRating(5);
      setImageFile(null);
      setEditing(false);

      const q = query(
        collection(firestore, "testimonials"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTestimonials(data);
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (!userReview) return;
    setEditing(true);
    setText(userReview.text);
    setRating(userReview.rating);
    setName(userReview.name);
    setOccupation(userReview.occupation || "");
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setText("");
    setName("");
    setOccupation("");
    setRating(5);
    setImageFile(null);
  };

  const handleDelete = async () => {
    if (!userReview) return;

    if (!confirm("Are you sure you want to delete your review?")) return;

    setLoading(true);
    try {
      // Delete image from storage if exists
      if (userReview.imageUrl) {
        try {
          const imageRef = ref(storage, userReview.imageUrl);
          await deleteObject(imageRef);
        } catch (error) {
          console.log("Error deleting image:", error);
        }
      }

      // Delete review from Firestore
      await deleteDoc(doc(firestore, "testimonials", userReview.id));
      setTestimonials((prev) => prev.filter((r) => r.id !== userReview.id));
      setUserReview(null);
      setText("");
      setName("");
      setOccupation("");
      setRating(5);
      setEditing(false);
    } catch (error) {
      console.error("Error deleting review:", error);
    } finally {
      setLoading(false);
    }
  };

  const current = testimonials[index];

  return (
    <section className="bg-white py-20 px-6 md:px-12 flex flex-col items-center text-blue-950">
      <div className="text-center mb-10">
        <h2 className="text-4xl lg:text-5xl font-bold mb-3">
          Customer Reviews
        </h2>
        <p className="text-gray-600 text-base md:text-lg max-w-xl mx-auto">
          Hear what our customers say about our services
        </p>
      </div>

      {testimonials.length > 0 && (
        <div className="bg-gray-50 rounded-3xl shadow-lg p-8 flex flex-col md:flex-row items-center gap-8 max-w-5xl w-full text-gray-800 transition-all duration-500">
          <div className="w-24 h-24 flex items-center justify-center rounded-full bg-blue-900 text-white text-3xl font-semibold overflow-hidden">
            {current.imageUrl ? (
              <img
                src={current.imageUrl}
                alt={current.name}
                className="w-full h-full object-cover"
              />
            ) : (
              current.name?.[0]?.toUpperCase() || "?"
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl text-primary font-semibold">
              {current.name}
            </h3>
            {current.occupation && (
              <p className="text-sm text-gray-500">{current.occupation}</p>
            )}
            <div className="flex justify-center md:justify-start my-3">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  className={
                    i < current.rating
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300"
                  }
                />
              ))}
            </div>
            <p className="text-gray-700 leading-relaxed">{current.text}</p>

            <div className="flex justify-center md:justify-start mt-6 gap-3">
              <button
                onClick={prevSlide}
                className="border border-gray-400 rounded-full p-3 hover:bg-gray-200 transition"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextSlide}
                className="border border-gray-400 rounded-full p-3 hover:bg-gray-200 transition"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {testimonials.length === 0 && (
        <p className="text-gray-600 mt-6">No reviews yet.</p>
      )}

      {/* User Review Form */}
      <div className="mt-10 w-full max-w-xl bg-gray-50 p-6 rounded-2xl shadow-md">
        {!user ? (
          <div className="text-center">
            <p className="text-gray-700 mb-4">Want to share your experience?</p>
            <Link
              href="/login"
              className="bg-blue-900 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-800 transition"
            >
              Login to drop a review
            </Link>
          </div>
        ) : userReview && !editing ? (
          <div className="text-center">
            <p className="text-gray-700 mb-4">
              You've already submitted a review!
            </p>
            <div className="flex justify-center flex-col md:flex-row gap-3">
              <button
                onClick={handleEdit}
                className="bg-blue-900 text-center justify-center text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-800 transition flex items-center gap-2"
              >
                <Edit3 size={18} />
                Edit Review
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="bg-red-600 text-white justify-center text-center px-6 py-3 rounded-full font-semibold hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 size={18} />
                {loading ? "Deleting..." : "Delete Review"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="border border-gray-300 rounded-xl p-3"
              required
            />
            <input
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="Occupation (optional)"
              className="border border-gray-300 rounded-xl p-3"
            />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows="4"
              placeholder="Share your experience..."
              className="w-full border border-gray-300 rounded-xl p-3"
            />
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-700">Your Rating:</span>
              {[1, 2, 3, 4, 5].map((num) => (
                <Star
                  key={num}
                  size={20}
                  onClick={() => setRating(num)}
                  className={`cursor-pointer ${
                    num <= rating
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-400"
                  }`}
                />
              ))}
            </div>
            <div>
              <label className="text-sm text-gray-700 block mb-1">
                Upload Profile Picture (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-900 text-white px-6 py-2 rounded-full hover:bg-blue-800 transition disabled:opacity-50"
              >
                {loading
                  ? "Submitting..."
                  : editing
                  ? "Update Review"
                  : "Submit Review"}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="bg-gray-500 text-white px-6 py-2 rounded-full hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
