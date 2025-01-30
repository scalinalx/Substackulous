"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";

interface NavbarProps {
  onSignIn: () => void;
}

const Navbar = ({ onSignIn }: NavbarProps) => {
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
          <Link href="/" className="text-2xl font-bold text-gray-800">
            Substackulous
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#use-cases" className="text-gray-700 hover:text-gray-900 transition-colors">
              Creator Tools
            </a>
            <a href="#testimonials" className="text-gray-700 hover:text-gray-900 transition-colors">
              Success Stories
            </a>
            <a href="#pricing" className="text-gray-700 hover:text-gray-900 transition-colors">
              Pricing
            </a>
            <a href="#faq" className="text-gray-700 hover:text-gray-900 transition-colors">
              FAQ
            </a>
            <button 
              onClick={onSignIn}
              className="bg-gray-900 text-white px-6 py-2 rounded-full font-medium hover:bg-gray-800 transition-colors"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-800"
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
                className="text-gray-700 hover:text-gray-900 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Creator Tools
              </a>
              <a
                href="#testimonials"
                className="text-gray-700 hover:text-gray-900 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Success Stories
              </a>
              <a
                href="#pricing"
                className="text-gray-700 hover:text-gray-900 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </a>
              <a
                href="#faq"
                className="text-gray-700 hover:text-gray-900 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                FAQ
              </a>
              <button 
                onClick={() => {
                  setIsOpen(false);
                  onSignIn();
                }}
                className="bg-gray-900 text-white px-6 py-2 rounded-full font-medium hover:bg-gray-800 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 