import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const navLinks = ["Home", "Features", "Architecture", "How It Works", "Technology", "About", "Contact"];

interface NavbarProps {
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
}

export default function Navbar({ onLoginClick, onRegisterClick }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "glass-card border-b border-glass-border shadow-lg" : "bg-transparent"
      }`}
      style={scrolled ? { backdropFilter: "blur(20px)" } : {}}
    >
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        {/* Logo */}
        <a href="#" className="font-display text-xl font-bold tracking-wider">
          <span className="gradient-text">Mind</span>
          <span className="text-foreground">Tech</span>
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
            >
              {link}
            </a>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="hidden items-center gap-3 lg:flex">
          <button 
            onClick={onLoginClick}
            className="glow-button-outline text-sm"
          >
            Login
          </button>
          <button 
            onClick={onRegisterClick}
            className="glow-button pulse-glow text-sm"
          >
            Register Now
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex flex-col gap-1.5 lg:hidden"
          aria-label="Toggle menu"
        >
          <span className={`block h-0.5 w-6 bg-foreground transition-transform ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-6 bg-foreground transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-6 bg-foreground transition-transform ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card border-t border-glass-border p-4 lg:hidden"
        >
          {navLinks.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
              className="block py-2 text-sm text-muted-foreground hover:text-primary"
              onClick={() => setMenuOpen(false)}
            >
              {link}
            </a>
          ))}
          <div className="mt-4 flex gap-3">
            <button 
              onClick={() => {
                onLoginClick?.();
                setMenuOpen(false);
              }}
              className="glow-button-outline flex-1 text-sm"
            >
              Login
            </button>
            <button 
              onClick={() => {
                onRegisterClick?.();
                setMenuOpen(false);
              }}
              className="glow-button flex-1 text-sm"
            >
              Register Now
            </button>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
