"use client";

import Image from "next/image";
import {
  Facebook,
  Twitter,
  Instagram,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-blue-950 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        {/* Brand Info */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Image
              src="/logow.png"
              alt="Highest Data Logo"
              width={40}
              height={40}
              className="object-contain"
            />
            <span className="text-2xl font-bold">Highest Data</span>
          </div>
          <p className="text-gray-300 whitespace-normal break-words">
            Simplified digital transactions. Buy, sell, and trade with
            confidence.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
          <ul className="space-y-2">
            {["Home", "About", "Services", "Contact", "Policies"].map(
              (link) => (
                <li key={link}>
                  <a
                    href={`/${link.toLowerCase()}`}
                    className="text-gray-300 hover:text-orange-400 transition"
                  >
                    {link}
                  </a>
                </li>
              )
            )}
          </ul>
        </div>

        {/* Services */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Services</h3>
          <ul className="space-y-2">
            <li className="text-gray-300 hover:text-orange-400 transition cursor-pointer">
              <Link href="/dashboard/crypto">Crypto Trading</Link>
            </li>
            <li className="text-gray-300 hover:text-orange-400 transition cursor-pointer">
              <Link href="/dashboard/gift-cards">Gift Card Exchange</Link>
            </li>
            <li className="text-gray-300 hover:text-orange-400 transition cursor-pointer">
              <Link href="/dashboard/buy-airtime">Airtime & Data</Link>
            </li>
            <li className="text-gray-300 hover:text-orange-400 transition cursor-pointer">
              <Link href="/dashboard/buy-airtime">Betting Wallet Funding</Link>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-center gap-3">
              <Mail size={18} /> info@highestdata.com
            </li>
            <li className="flex items-center gap-3">
              <Phone size={18} /> +234 703 891 1469; 09159082405
            </li>
            <li className="flex items-center gap-3">
              <MapPin size={18} /> HON BEN IGBAKPA HOUSE WATER BOARD RD, LAKYARD
              CLUB, OGHARA, ETHIOPE WEST
            </li>
          </ul>

          {/* Social Icons */}
          <div className="flex gap-4 mt-4">
            <a href="#" className="hover:text-orange-400 transition">
              <Facebook size={20} />
            </a>
            <a href="#" className="hover:text-orange-400 transition">
              <Twitter size={20} />
            </a>
            <a href="#" className="hover:text-orange-400 transition">
              <Instagram size={20} />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-400 mt-12 pt-6 text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} Highest Data. All rights reserved.
      </div>
    </footer>
  );
}
