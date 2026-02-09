import FAQs from "@/components/home/faqs/Faqs";
import Hero from "@/components/home/hero/Hero";
import HowItWorks from "@/components/home/howitworks/How-it-works";
import WhyChooseUs from "@/components/home/why-choose-us/Whychooseus";
import Testimonials from "@/components/Testimonials";
import React from "react";

export default function page() {
  return (
    <div className="relative min-h-screen">
      <Hero />
      <WhyChooseUs />
      <HowItWorks />
      <FAQs />
      <Testimonials />
    </div>
  );
}
