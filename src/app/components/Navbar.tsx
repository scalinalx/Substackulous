"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? "bg-white shadow-md py-2" : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-amber-600">
            Substackulous
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#use-cases" className="text-amber-800 hover:text-amber-500 transition-colors">
              Use Cases
            </a>
            <a href="#pain-points" className="text-amber-800 hover:text-amber-500 transition-colors">
              Solutions
            </a>
            <a href="#testimonials" className="text-amber-800 hover:text-amber-500 transition-colors">
              Success Stories
            </a>
            <a href="#pricing" className="text-amber-800 hover:text-amber-500 transition-colors">
              Pricing
            </a>
            <Link 
              href="/dashboard" 
              className="bg-amber-500 text-white px-6 py-2 rounded-full font-medium hover:bg-amber-600 transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-amber-800"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg py-4">
            <div className="flex flex-col space-y-4 px-4">
              <a
                href="#use-cases"
                className="text-amber-800 hover:text-amber-500 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Use Cases
              </a>
              <a
                href="#pain-points"
                className="text-amber-800 hover:text-amber-500 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Solutions
              </a>
              <a
                href="#testimonials"
                className="text-amber-800 hover:text-amber-500 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Success Stories
              </a>
              <a
                href="#pricing"
                className="text-amber-800 hover:text-amber-500 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </a>
              <Link 
                href="/dashboard"
                className="bg-amber-500 text-white px-6 py-2 rounded-full font-medium hover:bg-amber-600 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 