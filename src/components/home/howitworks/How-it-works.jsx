"use client";

import { Play, BarChart2, Lock, Wallet, Send } from "lucide-react";
import { motion } from "framer-motion";

const HowItWorks = () => {
  const steps = [
    {
      mainText: "Sign up to create an account",
      subText:
        "Get access to your personal dashboard where you can explore services, track transactions, and receive email notifications.",
      icon: Play,
    },
    {
      mainText: "Visit your Dashboard",
      subText:
        "Explore all the services available and instantly initiate transactions in just a few clicks.",
      icon: BarChart2,
    },
    {
      mainText: "Complete your KYC",
      subText:
        "Verify your identity securely by filling out our KYC form to enjoy safe and unrestricted access.",
      icon: Lock,
    },
    {
      mainText: "Fund your Wallet",
      subText:
        "Deposit funds into your wallet easily through our secure payment gateway to start transacting.",
      icon: Wallet,
    },
    {
      mainText: "Initiate Transactions",
      subText:
        "With a funded wallet, you’re ready to use our services and reach out to support if you need assistance.",
      icon: Send,
    },
  ];

  return (
    <section
      className="py-20 text-white"
      style={{
        backgroundImage: `url('/hiwbg.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Section Heading */}
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center mb-6"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          How It Works
        </motion.h2>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="p-8 "
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              {/* Icon */}
              <motion.div
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 mx-auto"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <step.icon className="w-8 h-8 text-blue-950" />
              </motion.div>

              {/* Text */}
              <h3 className="text-xl text-white font-semibold mb-3 text-center">
                {step.mainText}
              </h3>
              <p className="text-white text-center leading-relaxed">
                {step.subText}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
