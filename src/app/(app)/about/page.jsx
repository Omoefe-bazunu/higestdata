"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FaShieldAlt, FaLightbulb, FaHandshake } from "react-icons/fa";
import { FaXTwitter, FaFacebook, FaLinkedin } from "react-icons/fa6";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function AboutUs() {
  const team = [
    {
      name: "John Doe",
      title: "Founder & CEO",
      image: "/me.jpeg", // replace with your image
      socials: {
        twitter: "https://twitter.com",
        facebook: "https://facebook.com",
        linkedin: "https://linkedin.com",
      },
    },
    {
      name: "Jane Smith",
      title: "COO",
      image: "/me.jpeg", // replace with your image
      socials: {
        twitter: "https://twitter.com",
        facebook: "https://facebook.com",
        linkedin: "https://linkedin.com",
      },
    },
  ];

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % team.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [team.length]);

  return (
    <section className="bg-blue-950 text-primary">
      {/* ================= About + Hero ================= */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <p className="uppercase tracking-widest text-sm text-gray-300 mt-10">
            About Us
          </p>
          <h2
            className="text-4xl md:text-5xl max-w-3xl mx-auto text-white mt-3"
            style={{ lineHeight: "1.2" }}
          >
            We are more than just a Digital Trade Platform
          </h2>
        </motion.div>

        <div className="flex flex-col lg:flex-row items-center gap-12 mt-16">
          <motion.div
            initial={{ opacity: 0, x: -80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            className="flex-1 text-left"
          >
            <h3 className="text-3xl md:text-4xl text-center md:text-left font-bold text-white mb-6">
              Making Digital Transactions a Seamless Experience
            </h3>
            <p className="text-lg md:text-xl text-center md:text-left text-gray-300 mb-6 leading-relaxed">
              At <span className="font-semibold">Highest Data</span>, we
              simplify digital transactions with a secure, user-friendly
              platform. From gift cards trade to airtime, data, electricity
              bills, cable data subscription, exam scratch cards, and betting
              wallet funding, our mission is to make financial services
              accessible, fast, and reliable.
            </p>
            <p className="text-lg md:text-xl text-center md:text-left text-gray-300 leading-relaxed">
              We exist to empower individuals and businesses with a seamless,
              secure ecosystem for confident transactions, ensuring every
              digital trade is trustworthy and efficient.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            className="flex-1"
          >
            <div className="relative w-full max-w-md mx-auto">
              <Image
                src="/Faq.jpg"
                alt="About Highest Data"
                width={500}
                height={500}
                className="rounded-2xl shadow-2xl object-cover w-full h-auto hover:scale-105 transition-transform duration-500"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* ================= Core Values ================= */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-blue-950">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Our Core Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
            {[
              {
                title: "Security",
                desc: "Top-tier encryption and multi-layer protection ensure every transaction is safe and reliable.",
                icon: (
                  <FaShieldAlt className="text-5xl mx-auto mb-4 text-blue-950" />
                ),
              },
              {
                title: "Innovation",
                desc: "Constantly evolving with cutting-edge financial technology to meet global demands.",
                icon: (
                  <FaLightbulb className="text-5xl mx-auto mb-4 text-blue-950" />
                ),
              },
              {
                title: "Trust",
                desc: "Trusted by thousands of users for transparent, fair, and dependable digital services.",
                icon: (
                  <FaHandshake className="text-5xl mx-auto mb-4 text-blue-950" />
                ),
              },
            ].map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.15,
                  ease: "easeOut",
                }}
                className="p-8 bg-white bg-opacity-10 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-blue-400 border-opacity-30"
              >
                <h3 className="text-2xl font-bold mb-4">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= Team Section ================= */}
      <div className="py-20 bg-white hidden">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-12">
            Meet Our Team
          </h2>
          <div className="relative w-full flex justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="flex flex-col items-center"
              >
                <Image
                  src={team[current].image}
                  alt={team[current].name}
                  width={300}
                  height={300}
                  className="rounded-2xl shadow-xl object-cover mb-6"
                />
                <h3 className="text-2xl font-bold">{team[current].name}</h3>
                <p className="text-gray-600 mb-4">{team[current].title}</p>
                <div className="flex space-x-4">
                  <a
                    href={team[current].socials.twitter}
                    target="_blank"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FaXTwitter size={22} />
                  </a>
                  <a
                    href={team[current].socials.facebook}
                    target="_blank"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FaFacebook size={22} />
                  </a>
                  <a
                    href={team[current].socials.linkedin}
                    target="_blank"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FaLinkedin size={22} />
                  </a>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
