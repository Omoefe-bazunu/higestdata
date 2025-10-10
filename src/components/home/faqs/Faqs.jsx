"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What services can I access after signing up?",
    answer:
      "Once you sign up, you’ll gain access to your personal dashboard where you can buy and sell gift cards, airtime, fund your betting wallet, and much more.",
  },
  {
    question: "Is my data and money safe with Highest Data?",
    answer:
      "Yes. We use high-end encryption, KYC verification, and secure payment gateways to protect your personal data and transactions.",
  },
  {
    question: "How long does it take to process transactions?",
    answer:
      "Most transactions are processed instantly. However, depending on network congestion or verification, some may take a few minutes.",
  },
  {
    question: "What should I do if I need support?",
    answer:
      "Our support team is available 24/7. You can reach out via your dashboard or use the contact page on our website.",
  },
];

export default function FAQs() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-gray-50 text-blue-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - FAQ List */}
        <div>
          <motion.h2
            className="text-4xl lg:text-5xl font-bold mb-10"
            initial={{ opacity: 0, y: -30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Frequently Asked Questions
          </motion.h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-blue-950 shadow-xl text-white rounded-lg"
              >
                {/* Question */}
                <button
                  className="flex justify-between items-center w-full px-6 py-4 text-left font-semibold focus:outline-none"
                  onClick={() => toggleFAQ(index)}
                >
                  {faq.question}
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-6 h-6 text-white" />
                  </motion.div>
                </button>

                {/* Answer */}
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{
                        height: 0,
                        opacity: 0,
                        transition: { duration: 0.3 },
                      }}
                      transition={{ duration: 0.4 }}
                      className="px-6 pb-4 text-gray-200"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Featured Image */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex justify-center"
        >
          <Image
            src="/Faq.jpg"
            alt="FAQs Illustration"
            width={500}
            height={400}
            className="rounded-lg shadow-xl object-contain"
          />
        </motion.div>
      </div>
    </section>
  );
}
