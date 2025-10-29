"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Hero() {
  return (
    <section
      className="h-fit text-center text-white py-20"
      style={{
        backgroundImage: `url('/herobg1.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-12 l lg:pt-12 flex flex-col items-center">
        <div className="flex flex-col items-start justify-center w-full">
          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl lg:text-7xl max-w-xl text-center mx-auto leading-[2.5rem] mb-6"
            style={{ lineHeight: "1.1", fontFamily: "Inter, sans-serif" }}
          >
            Simplified Digital{" "}
            <span className="text-orange-400">Transactions</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-normal max-w-xl mx-auto lg:w-full mb-8"
          >
            Trade gift cards, purchase airtime & data, subscribe to cable TV,
            and fund your sports betting account — all at amazing rates through
            a secure, responsive system.
          </motion.p>

          {/* Button */}
          <Link href="/dashboard" className="mx-auto text-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="px-5 py-2 mx-auto bg-orange-500 hover:bg-orange-600 text-white text-lg font-medium rounded-full shadow-md transition"
            >
              Get Started
            </motion.button>
          </Link>
        </div>
      </div>
    </section>
  );
}
