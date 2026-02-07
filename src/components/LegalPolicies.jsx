"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
// import { Shield, FileText, RefreshCw } from "lucide-react";

export default function LegalPolicies() {
  return (
    <>
      <section className=" text-center px-6 shadow-sm bg-blue-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="uppercase tracking-widest text-sm text-gray-300 mt-10">
              Legal Policies
            </p>
            <h2
              className="text-4xl md:text-5xl max-w-3xl mx-auto text-white mt-3"
              style={{ lineHeight: "1.2" }}
            >
              Please read our terms, privacy policy, and refund policy carefully
            </h2>
          </motion.div>
        </div>
      </section>
      <section className="bg-[#eef0f3] text-blue-950 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-4 pb-20">
          <Tabs defaultValue="terms" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
              <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
              <TabsTrigger value="refund">Refund Policy</TabsTrigger>
            </TabsList>

            {/* Terms and Conditions */}
            <TabsContent value="terms">
              <Card>
                <CardHeader>
                  <CardTitle>Terms and Conditions</CardTitle>
                  <CardDescription>
                    Last updated: {new Date().toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-6">
                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          1. Introduction
                        </h3>
                        <p className="">
                          Welcome to Highest Data Fintech Solutions ("we,"
                          "our," or "the Company"). By accessing or using our
                          platform, you agree to comply with and be bound by
                          these Terms and Conditions. If you do not agree with
                          these terms, please do not use our services.
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          2. Services Offered
                        </h3>
                        <p className=" mb-2">
                          Highest Data Fintech Solutions provides the following
                          services:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Gift card trading</li>
                          <li>Airtime and data purchase</li>
                          <li>Cable TV subscription</li>
                          <li>Sports betting account funding</li>
                          <li>Electricity Bill Payment</li>
                          <li>Exam Scratch Card Purchase</li>
                          <li>Airtime to Cash Conversion</li>
                          <li>Bulk SMS</li>
                          <li>Wallet funding and withdrawal</li>
                        </ul>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          3. User Eligibility
                        </h3>
                        <p className="">
                          You must be at least 18 years old and have the legal
                          capacity to enter into binding contracts to use our
                          services. By registering, you confirm that all
                          information provided is accurate and complete.
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          4. Account Registration
                        </h3>
                        <div className="space-y-2 ">
                          <p>
                            To use our services, you must create an account by
                            providing:
                          </p>
                          <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>Valid email address</li>
                            <li>Secure password</li>
                            <li>Phone number for verification</li>
                            <li>Additional KYC documents as required</li>
                          </ul>
                          <p className="mt-3">
                            You are responsible for maintaining the
                            confidentiality of your account credentials and for
                            all activities that occur under your account.
                          </p>
                        </div>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          5. Transaction Processing
                        </h3>
                        <div className="space-y-3 ">
                          <p>
                            <strong>5.1 Wallet Funding:</strong> Users can fund
                            their wallets. Funds are typically credited within
                            minutes, subject to payment processor confirmation.
                          </p>

                          <p>
                            <strong>5.2 Service Transactions:</strong> All
                            purchases (airtime, data, cable TV, betting funding,
                            etc) are processed instantly upon successful payment
                            from your wallet balance.
                          </p>

                          <p>
                            <strong>5.3 Gift Card Trading:</strong> Transactions
                            are subject to current market rates and may require
                            verification before processing.
                          </p>

                          <p>
                            <strong>5.4 Withdrawals:</strong> Wallet withdrawals
                            are processed within 24-48 hours to your registered
                            bank account.
                          </p>
                        </div>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          6. Fees and Charges
                        </h3>
                        <p className="">
                          We reserve the right to charge service fees for
                          transactions. All applicable fees will be clearly
                          displayed before you confirm any transaction. Rates
                          are subject to change without prior notice.
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          7. Prohibited Activities
                        </h3>
                        <p className=" mb-2">
                          Users are strictly prohibited from:
                        </p>
                        <ul className="list-disc list-inside space-y-1  ml-4">
                          <li>
                            Using the platform for money laundering or fraud
                          </li>
                          <li>Providing false or misleading information</li>
                          <li>
                            Attempting to manipulate rates or exploit system
                            vulnerabilities
                          </li>
                          <li>Using automated bots or scripts</li>
                          <li>Engaging in any illegal activities</li>
                          <li>
                            Sharing account credentials with third parties
                          </li>
                        </ul>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          8. Limitation of Liability
                        </h3>
                        <p className="">
                          Highest Data Fintech Solutions shall not be liable for
                          any indirect, incidental, special, or consequential
                          damages arising from the use of our services,
                          including but not limited to network failures,
                          third-party service disruptions, or market volatility
                          in gift card trading.
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          9. Account Suspension and Termination
                        </h3>
                        <p className="">
                          We reserve the right to suspend or terminate accounts
                          that violate these terms, engage in fraudulent
                          activities, or pose security risks. In case of
                          termination, remaining wallet balances will be
                          refunded after deducting any applicable fees or
                          charges.
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          10. Intellectual Property
                        </h3>
                        <p className="">
                          All content, trademarks, logos, and intellectual
                          property on our platform remain the exclusive property
                          of Highest Data Fintech Solutions. Unauthorized use is
                          strictly prohibited.
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          11. Governing Law
                        </h3>
                        <p className="">
                          These Terms and Conditions are governed by the laws of
                          the Federal Republic of Nigeria. Any disputes shall be
                          resolved in Nigerian courts.
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          12. Contact Information
                        </h3>
                        <p className="">
                          For questions or concerns regarding these terms,
                          please contact us through our customer support
                          channels available on the platform.
                        </p>
                      </section>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy Policy */}
            <TabsContent value="privacy">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Policy</CardTitle>
                  <CardDescription>
                    Last updated: {new Date().toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-6">
                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          1. Introduction
                        </h3>
                        <p className="">
                          Highest Data Fintech Solutions ("we," "our," or "the
                          Company") is committed to protecting your privacy.
                          This Privacy Policy explains how we collect, use,
                          disclose, and safeguard your information when you use
                          our platform.
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          2. Information We Collect
                        </h3>
                        <div className="space-y-3 ">
                          <p>
                            <strong>2.1 Personal Information:</strong>
                          </p>
                          <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>Full name, email address, and phone number</li>
                            <li>Bank account details for withdrawals</li>
                            <li>Government-issued ID for KYC verification</li>
                            <li>Billing and transaction history</li>
                          </ul>

                          <p className="mt-3">
                            <strong>2.2 Technical Information:</strong>
                          </p>
                          <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>
                              IP address, browser type, and device information
                            </li>
                            <li>Cookies and usage data</li>
                            <li>Location data (with your consent)</li>
                          </ul>

                          <p className="mt-3">
                            <strong>2.3 Transaction Data:</strong>
                          </p>
                          <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>Payment information processed.</li>
                            <li>Transaction history and wallet activity</li>
                            <li>Gift card details</li>
                          </ul>
                        </div>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          3. How We Use Your Information
                        </h3>
                        <p className=" mb-2">
                          We use collected information to:
                        </p>
                        <ul className="list-disc list-inside space-y-1  ml-4">
                          <li>Process transactions and provide services</li>
                          <li>Verify your identity and prevent fraud</li>
                          <li>Communicate service updates and notifications</li>
                          <li>
                            Improve platform functionality and user experience
                          </li>
                          <li>Comply with legal and regulatory requirements</li>
                          <li>Resolve disputes and enforce our terms</li>
                        </ul>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          4. Information Sharing and Disclosure
                        </h3>
                        <div className="space-y-3 ">
                          <p>We may share your information with:</p>

                          <p>
                            <strong>4.1 Service Providers:</strong> Third-party
                            payment processors, API providers (VTU Africa), and
                            cloud hosting services for operational purposes.
                          </p>

                          <p>
                            <strong>4.2 Legal Authorities:</strong> When
                            required by law, court order, or government
                            regulation, or to protect our rights and safety.
                          </p>

                          <p>
                            <strong>4.3 Business Transfers:</strong> In the
                            event of a merger, acquisition, or sale of assets,
                            your information may be transferred to the new
                            entity.
                          </p>

                          <p className="font-semibold mt-3">
                            We do NOT sell your personal information to third
                            parties for marketing purposes.
                          </p>
                        </div>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          5. Data Security
                        </h3>
                        <p className="">
                          We implement industry-standard security measures
                          including encryption, secure servers, and regular
                          security audits to protect your data. However, no
                          system is completely secure, and we cannot guarantee
                          absolute security.
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          6. Data Retention
                        </h3>
                        <p className="">
                          We retain your personal information for as long as
                          necessary to provide services, comply with legal
                          obligations, resolve disputes, and enforce agreements.
                          Transaction records are kept for a minimum of 7 years
                          as required by Nigerian financial regulations.
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          7. Your Rights
                        </h3>
                        <p className=" mb-2">You have the right to:</p>
                        <ul className="list-disc list-inside space-y-1  ml-4">
                          <li>Access and review your personal information</li>
                          <li>Request correction of inaccurate data</li>
                          <li>Request deletion of your account and data</li>
                          <li>Withdraw consent for data processing</li>
                          <li>Object to certain data processing activities</li>
                          <li>Export your data in a portable format</li>
                        </ul>
                        <p className=" mt-3">
                          To exercise these rights, contact our support team
                          through the platform.
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          8. Cookies and Tracking
                        </h3>
                        <p className="">
                          We use cookies and similar tracking technologies to
                          enhance user experience, analyze usage patterns, and
                          improve our services. You can control cookie
                          preferences through your browser settings.
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          9. Third-Party Services
                        </h3>
                        <p className="">
                          Our platform integrates with third-party services.
                          These providers have their own privacy policies, and
                          we recommend reviewing them. We are not responsible
                          for their privacy practices.
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          10. Children's Privacy
                        </h3>
                        <p className="">
                          Our services are not intended for individuals under 18
                          years of age. We do not knowingly collect personal
                          information from minors. If we discover such
                          collection, we will promptly delete the information.
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          11. International Users
                        </h3>
                        <p className="">
                          Our services are primarily intended for users in
                          Nigeria. If you access our platform from outside
                          Nigeria, you consent to the transfer and processing of
                          your data in Nigeria.
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          12. Changes to Privacy Policy
                        </h3>
                        <p className="">
                          We may update this Privacy Policy periodically.
                          Changes will be posted on this page with an updated
                          "Last Modified" date. Continued use of our services
                          constitutes acceptance of the updated policy.
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          13. Contact Us
                        </h3>
                        <p className="">
                          For privacy-related questions or concerns, please
                          contact our Data Protection Officer through the
                          support channels on our platform.
                        </p>
                      </section>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Refund Policy */}
            <TabsContent value="refund">
              <Card>
                <CardHeader>
                  <CardTitle>Refund Policy</CardTitle>
                  <CardDescription>
                    Last updated: {new Date().toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-6">
                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          1. General Policy
                        </h3>
                        <p className="">
                          At Highest Data Fintech Solutions, we strive to
                          provide excellent service. This Refund Policy outlines
                          the conditions under which refunds may be issued for
                          various services on our platform.
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          2. Wallet Funding Refunds
                        </h3>
                        <div className="space-y-3 ">
                          <p>
                            <strong>2.1 Failed Payments:</strong> If your
                            payment is debited but your wallet is not credited
                            within 24 hours, we will investigate and process a
                            full refund or credit your wallet accordingly.
                          </p>

                          <p>
                            <strong>2.2 Duplicate Charges:</strong> Duplicate
                            payments will be refunded in full within 5-7
                            business days after verification.
                          </p>

                          <p>
                            <strong>2.3 Processing Time:</strong> Refunds to
                            your bank account or card are processed within 7-14
                            business days, subject to your bank's processing
                            time.
                          </p>
                        </div>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          3. Airtime and Data Purchase
                        </h3>
                        <div className="space-y-3 ">
                          <p>
                            <strong>3.1 Failed Transactions:</strong> If airtime
                            or data is not delivered within 5 minutes of
                            purchase, the amount will be automatically refunded
                            to your wallet.
                          </p>

                          <p>
                            <strong>3.2 Wrong Number:</strong> We are NOT
                            responsible for purchases made to incorrect phone
                            numbers. Please verify recipient numbers before
                            confirming transactions.
                          </p>

                          <p>
                            <strong>3.3 Network Issues:</strong> Refunds will be
                            processed if the failure is due to our system error
                            or API provider issues. Network provider issues are
                            beyond our control.
                          </p>
                        </div>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          4. Cable TV Subscriptions
                        </h3>
                        <div className="space-y-3 ">
                          <p>
                            <strong>4.1 Failed Activation:</strong> If your
                            cable TV subscription is not activated within 30
                            minutes, contact support. We will investigate and
                            refund to your wallet if the issue is from our end.
                          </p>

                          <p>
                            <strong>4.2 Wrong Card Number:</strong>{" "}
                            Subscriptions processed to incorrect smartcard/IUC
                            numbers are non-refundable. Always verify details
                            before purchase.
                          </p>

                          <p>
                            <strong>4.3 Partial Refunds:</strong> Not
                            applicable. Cable subscriptions are non-refundable
                            once successfully activated on the recipient's
                            account.
                          </p>
                        </div>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          5. Betting Account Funding
                        </h3>
                        <div className="space-y-3 ">
                          <p>
                            <strong>5.1 Failed Funding:</strong> If your betting
                            account is not credited within 15 minutes, the
                            amount will be refunded to your wallet after
                            verification.
                          </p>

                          <p>
                            <strong>5.2 Wrong Account ID:</strong> We are not
                            responsible for funds sent to incorrect betting
                            account IDs. Verify account details carefully.
                          </p>

                          <p>
                            <strong>5.3 Betting Provider Issues:</strong> If the
                            betting provider confirms non-receipt of funds, we
                            will refund to your wallet within 48 hours.
                          </p>
                        </div>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          6. Gift Card Trading
                        </h3>
                        <div className="space-y-3 ">
                          <p>
                            <strong>7.1 Declined Cards:</strong> If a gift card
                            is declined after submission, no payment will be
                            processed. Previously accepted cards cannot be
                            refunded.
                          </p>

                          <p>
                            <strong>7.2 Rate Disputes:</strong> Rates displayed
                            at the time of submission are final. Subsequent rate
                            changes do not qualify for adjustments or refunds.
                          </p>

                          <p>
                            <strong>7.3 Invalid/Used Cards:</strong> Gift cards
                            found to be invalid, used, or fraudulent will not be
                            paid for, and accounts may be suspended.
                          </p>
                        </div>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          7. Wallet Withdrawal Refunds
                        </h3>
                        <div className="space-y-3 ">
                          <p>
                            <strong>8.1 Failed Withdrawals:</strong> If a
                            withdrawal fails due to incorrect bank details, the
                            amount will be credited back to your wallet
                            immediately.
                          </p>

                          <p>
                            <strong>8.2 Processing Delays:</strong> Withdrawals
                            typically complete within 24-48 hours. Delays beyond
                            this period should be reported for investigation.
                          </p>

                          <p>
                            <strong>8.3 Bank Rejections:</strong> If your bank
                            rejects the transfer, funds will be returned to your
                            wallet within 3-5 business days.
                          </p>
                        </div>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          8. Service Fees
                        </h3>
                        <p className="">
                          Service fees charged on transactions are
                          non-refundable, even if the main transaction is
                          refunded. Fees cover processing costs and platform
                          maintenance.
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          10. Refund Request Process
                        </h3>
                        <div className="space-y-2 ">
                          <p>To request a refund:</p>
                          <ol className="list-decimal list-inside space-y-1 ml-4">
                            <li>Log in to your account</li>
                            <li>
                              Navigate to the transaction in question to get the
                              transaction details
                            </li>
                            <li>
                              Navigate to the "contact" page to get the support
                              email
                            </li>
                            <li>
                              Send a mail to the support email and Provide the
                              transaction ID, date, and description of the issue
                            </li>
                            <li>
                              Include supporting evidence (screenshots,
                              receipts, etc.)
                            </li>
                            <li>
                              Wait for investigation (typically 24-48 hours)
                            </li>
                            <li>Receive notification of refund decision</li>
                          </ol>
                        </div>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          11. Refund Methods
                        </h3>
                        <div className="space-y-2 ">
                          <p>Approved refunds will be processed as follows:</p>
                          <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>
                              VTU services (airtime, data, cable, betting):
                              Refunded to wallet instantly
                            </li>
                            <li>
                              Wallet funding issues: Refunded to original
                              payment method within 7-14 days
                            </li>
                            <li>
                              Gift card transactions: Refunded to wallet within
                              24 hours
                            </li>
                          </ul>
                        </div>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          12. Non-Refundable Situations
                        </h3>
                        <p className=" mb-2">Refunds will NOT be issued for:</p>
                        <ul className="list-disc list-inside space-y-1  ml-4">
                          <li>
                            User errors (wrong numbers, addresses, account IDs)
                          </li>
                          <li>Completed and successful transactions</li>
                          <li>Change of mind after transaction completion</li>
                          <li>Services already rendered and consumed</li>
                          <li>Market rate fluctuations in gift card trading</li>
                          <li>
                            Disputes raised more than 7 days after transaction
                          </li>
                        </ul>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          13. Dispute Resolution
                        </h3>
                        <p className="">
                          If you disagree with a refund decision, you may
                          escalate the issue to our management team within 14
                          days. Final decisions are made at the discretion of
                          Highest Data Fintech Solutions management and are
                          binding.
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold mb-3">
                          14. Contact Information
                        </h3>
                        <p className="">
                          For refund-related inquiries or to file a refund
                          request, contact our customer support team through the
                          platform's help center or via the contact channels
                          provided.
                        </p>
                      </section>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </>
  );
}
