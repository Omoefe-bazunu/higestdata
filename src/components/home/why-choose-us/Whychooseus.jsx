"use client";
import { motion } from "framer-motion";

export default function WhyChooseUs() {
  return (
    <section className="flex flex-col-reverse md:flex-row items-center justify-center px-6 py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col-reverse md:flex-row lg:flex-row items-center justify-between">
        {/* Image Section */}
        <motion.div
          className="w-full md:w-1/2 mt-8 md:mt-0 flex justify-center"
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src="/section2.png"
            alt="Person with device"
            className=" w-full"
          />
        </motion.div>
        {/* Text Section */}
        <motion.div
          className="w-full md:w-1/2 md:pr-12 text-left"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-blue-950 mb-4">
            Why Choose Us?
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            At Highest Data Fintech Solutions, we create a seamless and secure
            platform for buying and selling of crypto assets, selling of gift
            cards, buying of airtime VTU and funding of betting account.
          </p>

          <div className="space-y-6">
            {/* Feature 1 */}
            <motion.div
              className="flex items-start"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white mr-4 flex-shrink-0 shadow-md">
                ✔
              </span>
              <p className="text-gray-700">
                <span className=" text-blue-950 font-semibold">
                  Secure Trade:
                </span>{" "}
                Enjoy high-end security for all your transactions, making sure
                you get value for your money without losing a dime to fraud or
                network interruption.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              className="flex items-start"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white mr-4 flex-shrink-0 shadow-md">
                ✔
              </span>
              <p className="text-gray-700">
                <span className=" text-blue-950 font-semibold">
                  Sweet Rates:
                </span>{" "}
                Trade your favorite digital assets with competitive rates that
                feel like a cheat code and compel you to come back for more.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
