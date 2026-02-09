"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path) => pathname === path;

  return (
    <>
      <header className="fixed top-10 left-0 right-0 z-50 bg-blue-950 text-white border-b border-gray-300">
        <div className="mx-auto px-4 py-5" style={{ maxWidth: "1280px" }}>
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logow.png"
                alt="Highest Data"
                width={28}
                height={28}
                priority
              />
              <span className="text-xl font-bold">Highest Data</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className={`hover:text-orange-400 transition-colors ${
                  isActive("/") ? "text-orange-400" : ""
                }`}
              >
                Home
              </Link>
              <Link
                href="/about"
                className={`hover:text-orange-400 transition-colors ${
                  isActive("/about") ? "text-orange-400" : ""
                }`}
              >
                About
              </Link>
              <Link
                href="/services"
                className={`hover:text-orange-400 transition-colors ${
                  isActive("/services") ? "text-orange-400" : ""
                }`}
              >
                Services
              </Link>
              <Link
                href="/contact"
                className={`hover:text-orange-400 transition-colors ${
                  isActive("/contact") ? "text-orange-400" : ""
                }`}
              >
                Contact
              </Link>
              <Link
                href="/policies"
                className={`hover:text-orange-400 transition-colors ${
                  isActive("/policies") ? "text-orange-400" : ""
                }`}
              >
                Legal Policies
              </Link>
            </nav>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="px-8 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => logout()}
                    className="px-8 py-2 border border-white rounded-full hover:bg-white hover:text-blue-950 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push("/login")}
                    className="px-8 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => router.push("/signup")}
                    className="px-8 py-2 border border-white hover:bg-white rounded-full hover:text-blue-950 transition-colors"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-blue-950 border-t border-gray-700">
            <div className="px-4 py-4 space-y-4">
              <Link
                href="/"
                className={`block hover:text-orange-400 transition-colors ${
                  isActive("/") ? "text-orange-400" : ""
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/about"
                className={`block hover:text-orange-400 transition-colors ${
                  isActive("/about") ? "text-orange-400" : ""
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/services"
                className={`block hover:text-orange-400 transition-colors ${
                  isActive("/services") ? "text-orange-400" : ""
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Services
              </Link>
              <Link
                href="/contact"
                className={`block hover:text-orange-400 transition-colors ${
                  isActive("/contact") ? "text-orange-400" : ""
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              <Link
                href="/policies"
                className={`block hover:text-orange-400 transition-colors ${
                  isActive("/policies") ? "text-orange-400" : ""
                }`}
              >
                Legal Policies
              </Link>

              <div className="pt-4 border-t border-gray-700 space-y-3">
                {user ? (
                  <>
                    <button
                      onClick={() => {
                        router.push("/dashboard");
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 border border-white rounded hover:bg-white hover:text-blue-950 transition-colors"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        router.push("/login");
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                    >
                      Log In
                    </button>
                    <button
                      onClick={() => {
                        router.push("/signup");
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 border border-white hover:bg-white rounded hover:text-blue-950 transition-colors"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
