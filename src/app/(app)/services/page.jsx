"use client";

import FAQs from "@/components/home/faqs/Faqs";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

// Animation Variants
const fadeLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0 },
};
const fadeRight = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0 },
};

const services = [
  {
    title: "Gift Card Exchange",
    subtitle: "Instant & Reliable",
    desc: "Exchange gift cards for cash seamlessly. Get paid instantly with no hidden fees.",
    img: "/gift.jpg",
    cta: "Exchange Now",
    url: "/dashboard/gift-cards",
  },
  {
    title: "Airtime & Data",
    subtitle: "Always Connected",
    desc: "Recharge airtime, buy data bundles, and pay for utilities instantly — all in one place.",
    img: "/vtu.png",
    cta: "Recharge Now",
    url: "/dashboard/buy-airtime",
  },
  {
    title: "Betting Wallet Funding",
    subtitle: "Peace of Mind",
    desc: "Fund your sports betting wallet and enjoy uninterrupted stakes on your favorite sports.",
    img: "/betting.jpg",
    cta: "Fund Now",
    url: "/dashboard/betting",
  },
  {
    title: "CableTv Subscription",
    subtitle: "Binge Watching",
    desc: "Stay glued to your favorite channel by keeping your TV subscriptions always recharged.",
    img: "/cabletv.png",
    cta: "Subscribe Now",
    url: "/dashboard/cable-tv",
  },
  {
    title: "Electricity Bill Subscription",
    subtitle: "Keep Your Lights Up",
    desc: "Never go a day without power supply. Keep your Electricity subscription loaded and power all your devices.",
    img: "/electricity.png",
    cta: "Subscribe Now",
    url: "/dashboard/electricity-bill",
  },
  {
    title: "Exam Scratch Cards",
    subtitle: "Check Your Results",
    desc: "Be on the know about your exam grades and admission progress by getting scratch cards for your WAEC, NECO or JAMB results.",
    img: "/exam.png",
    cta: "Buy Now",
    url: "/dashboard/exam-cards",
  },
  {
    title: "Bulk SMS",
    subtitle: "Send Bulk Messages",
    desc: "Send messages to a large group without the stress of repeating yourself. Use our bulk SMS service right away",
    img: "/bulksms.png",
    cta: "Send Messages",
    url: "/dashboard/bulksms",
  },
  {
    title: "Convert Airtime 2 Cash",
    subtitle: "Get your Cash Back",
    desc: "Whether you recharged excess or just want to get back some of your airtime as cash, you can do that with ease with our airtime to cash service.",
    img: "/airtime2cash.png",
    cta: "Convert Now",
    url: "/dashboard/airtime-to-cash",
  },
];

export default function Services() {
  return (
    <>
      <section className="bg-[#eef0f3] text-blue-950 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <p className="uppercase tracking-widest text-sm text-gray-500 mt-10">
              Our Services
            </p>
            <h2
              className="text-4xl md:text-5xl max-w-3xl mx-auto text-blue-950 mt-3"
              style={{ lineHeight: "1.2" }}
            >
              Secure, fast, and reliable platform.
            </h2>
          </motion.div>

          {/* Service Sections */}
          <div className="space-y-24 mt-12">
            {services.map((service, i) => (
              <div
                key={i}
                className={`flex flex-col lg:flex-row items-center gap-12 ${
                  i % 2 !== 0 ? "lg:flex-row-reverse" : ""
                }`}
              >
                {/* Image */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.8, delay: i * 0.2 }}
                  variants={i % 2 === 0 ? fadeLeft : fadeRight}
                  className="flex-1 w-full"
                >
                  <div className="overflow-hidden rounded-2xl shadow-xl">
                    <Image
                      src={service.img}
                      alt={service.title}
                      width={600}
                      height={400}
                      priority
                      className="object-cover w-full h-auto hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </motion.div>

                {/* Text */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.8, delay: i * 0.25 }}
                  variants={i % 2 === 0 ? fadeRight : fadeLeft}
                  className="flex-1 w-full"
                >
                  <h3 className="text-3xl font-bold mb-3">{service.title}</h3>
                  <h4 className="text-xl text-orange-400 mb-4">
                    {service.subtitle}
                  </h4>
                  <p className="text-gray-500 mb-6 leading-relaxed">
                    {service.desc}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-full shadow hover:bg-orange-600 transition"
                  >
                    <Link href={service.url}>{service.cta}</Link>
                  </motion.button>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <FAQs />
    </>
  );
}
