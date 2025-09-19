"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="https://firebasestorage.googleapis.com/v0/b/higestdata.firebasestorage.app/o/HIGHEST%20ICON%20COLORED.png?alt=media&token=4946037d-3ef0-4f52-a671-88a6e732ac1e"
        alt="Website Logo"
        width={36}
        height={36}
        priority
        className="object-contain"
      />
      <span className="text-2xl font-bold font-headline text-primary whitespace-nowrap">
        Highest Data
      </span>
    </div>
  );
}

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const linkClasses = (path) =>
    `px-3 py-2 font-medium transition duration-200 ${
      pathname === path
        ? "text-primary border-b-2 border-primary"
        : "text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded"
    }`;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 🔗 Reusable navigation links
  const NavLinks = ({ onClick }) => (
    <>
      <a href="/" className={linkClasses("/")} onClick={onClick}>
        Home
      </a>
      <a href="/about" className={linkClasses("/about")} onClick={onClick}>
        About
      </a>
      <a
        href="/services"
        className={linkClasses("/services")}
        onClick={onClick}
      >
        Services
      </a>
      <a href="/contact" className={linkClasses("/contact")} onClick={onClick}>
        Contact
      </a>
    </>
  );

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-md py-3" : "bg-[#eef0f3] py-5"
      }`}
    >
      <div className="flex justify-between items-center max-w-7xl mx-auto px-6 lg:px-12">
        <Logo />

        {/* Desktop Nav */}
        <nav className="hidden md:flex space-x-4" aria-label="Main navigation">
          <NavLinks />
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-5 py-2 bg-primary text-white rounded-full hover:bg-blue-600 focus:ring-2 focus:ring-primary transition"
              >
                Dashboard
              </button>
              <button
                onClick={async () => await logout()}
                className="px-5 py-2 border border-red-500 text-red-500 rounded-full hover:bg-red-600 hover:text-white focus:ring-2 focus:ring-red-400 transition"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push("/login")}
                className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-primary transition"
              >
                Log In
              </button>
              <button
                onClick={() => router.push("/signup")}
                className="px-5 py-2 border border-primary text-primary rounded-lg hover:bg-blue-50 focus:ring-2 focus:ring-primary transition"
              >
                Sign Up
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          aria-label="Toggle mobile menu"
          className="md:hidden text-gray-700 focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Nav with overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsOpen(false)}
          />
          {/* Sidebar */}
          <div className="absolute top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out p-6 space-y-6">
            <nav
              className="flex flex-col space-y-4"
              aria-label="Mobile navigation"
            >
              <NavLinks onClick={() => setIsOpen(false)} />
            </nav>

            {user ? (
              <div className="flex flex-col gap-4 mt-6">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/dashboard");
                  }}
                  className="w-full px-5 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition"
                >
                  Dashboard
                </button>
                <button
                  onClick={async () => {
                    await logout();
                    setIsOpen(false);
                  }}
                  className="w-full px-5 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 mt-6">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/login");
                  }}
                  className="w-full px-5 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/signup");
                  }}
                  className="w-full px-5 py-2 border border-primary text-primary rounded-lg hover:bg-blue-50 transition"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
