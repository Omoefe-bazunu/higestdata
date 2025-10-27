"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { firestore as db } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

// --- Animations ---
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
};
const fadeLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8 } },
};

export default function ContactPage() {
  const { user } = useAuth(); // ✅ AuthContext provides logged in user
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    if (!db || !user) {
      setStatus("❌ Something went wrong. Try again later.");
      setLoading(false);
      return;
    }

    try {
      const ref = collection(db, "contactMessages"); // ✅ simple collection
      await addDoc(ref, {
        ...formData,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });

      // Send email notification
      try {
        const response = await fetch("/api/contact-message-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            message: formData.message,
            userId: user.uid,
          }),
        });

        if (!response.ok) {
          console.error("Failed to send email");
        }
      } catch (emailError) {
        console.error("Email error:", emailError);
      }

      setStatus("✅ Message sent successfully!");
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      console.error("Firestore error:", err);
      setStatus("❌ Failed to send message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-blue-950 ">
      {/* Hero */}
      <section className=" text-center px-6 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="uppercase tracking-widest text-sm text-gray-300 mt-10">
              Contact Us
            </p>
            <h2
              className="text-4xl md:text-5xl max-w-3xl mx-auto text-white mt-3"
              style={{ lineHeight: "1.2" }}
            >
              Connect with Us: We are Here to Help You
            </h2>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className=" px-6 bg-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-12 flex items-center flex-col gap-12">
          {/* Form */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="p-4 sm:p-8"
          >
            <h2 className="text-2xl font-semibold text-center text-blu-950 mb-6">
              Send us a message
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your Name"
                required
                className="w-full p-6 border rounded-lg"
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Your Email"
                required
                className="w-full p-6 border rounded-lg "
              />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone Number (Optional)"
                className="w-full p-6 border rounded-lg "
              />
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Your Message"
                required
                rows="5"
                className="w-full p-6 border rounded-lg"
              />
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-fit px-8 flex justify-center items-center gap-2 bg-blue-950 text-white py-3 rounded-lg font-semibold shadow hover:bg-orange-600 transition"
              >
                {loading && (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.3 0 0 5.3 0 12h4zm2 5.3A8 8 0 014 12H0c0 3 1.1 5.8 3 7.9l3-2.6z"
                    />
                  </svg>
                )}
                {loading ? "Sending..." : "Send Message"}
              </motion.button>
            </form>

            {status && (
              <p
                className={`mt-4 text-center font-medium ${
                  status.startsWith("✅") ? "text-green-600" : "text-red-500"
                }`}
              >
                {status}
              </p>
            )}
          </motion.div>
        </div>
      </section>
      <section className="py-8 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 lg:px-12 flex text-left flex-col gap-12">
          {/* Contact Info */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeLeft}
            className="p-4 sm:p-8"
          >
            <h2 className="text-2xl font-semibold text-blue-950 mb-4">
              We are available on the following channels:
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Address: Okemute Gbogborogbo Compound, Old Benin Road, Opposite
                Lawyer Filling Station, Oghara, Ethiope West, Delta State.
              </p>
              <p>Phone: +23409159082405</p>
              <p>Email: info@highestdata.com.ng</p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
