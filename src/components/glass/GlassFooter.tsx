import React from "react";
import { socialLinks } from "@/config/socials";

const InstagramIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export const GlassFooter: React.FC = () => {
  return (
    <footer className="w-full mt-auto border-t border-white/10 bg-black/70 backdrop-blur-2xl transition-all z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6 text-center md:text-left">
          
          {/* LEFT SECTION: Quantex Mugen Branding & Organizing Chapters */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <span className="font-extrabold tracking-wider text-white text-glow-crimson uppercase font-sans text-xs sm:text-sm whitespace-nowrap">
              QUANTEX MUGEN
            </span>
            <span className="text-gray-600 font-mono hidden sm:inline">•</span>
            <span className="text-[11px] sm:text-xs text-gray-400 font-mono tracking-tight whitespace-nowrap">
              Organized by{" "}
              <strong className="text-gray-200 font-bold">OWASP</strong> &{" "}
              <strong className="text-gray-200 font-bold">Cybernerds</strong> KARE Student Chapters
            </span>
          </div>

          {/* CENTER SECTION: Exactly Two Instagram Pill Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 my-0.5 md:my-0">
            {/* OWASP Instagram Button */}
            <a
              href={socialLinks.owaspInstagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-rose-600/20 border border-white/10 hover:border-rose-500/40 text-gray-300 hover:text-rose-300 font-mono text-[11px] whitespace-nowrap transition-all duration-300 hover:shadow-[0_0_15px_rgba(225,29,72,0.3)] hover:-translate-y-0.5 group"
            >
              <InstagramIcon className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform duration-300 shrink-0" />
              <span className="tracking-wide">OWASP Instagram</span>
            </a>

            {/* Cybernerds Instagram Button */}
            <a
              href={socialLinks.cybernerdsInstagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-rose-600/20 border border-white/10 hover:border-rose-500/40 text-gray-300 hover:text-rose-300 font-mono text-[11px] whitespace-nowrap transition-all duration-300 hover:shadow-[0_0_15px_rgba(225,29,72,0.3)] hover:-translate-y-0.5 group"
            >
              <InstagramIcon className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform duration-300 shrink-0" />
              <span className="tracking-wide">Cybernerds Instagram</span>
            </a>
          </div>

          {/* RIGHT SECTION: Credits & Copyright */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-gray-400 whitespace-nowrap shrink-0">
            <span>
              Made with <span className="text-rose-500 animate-pulse">❤️</span> by Web Team
            </span>
            <span className="text-gray-600">•</span>
            <span>
              © 2026 <strong className="text-gray-200 font-bold">QUANTEX MUGEN</strong>
            </span>
          </div>

        </div>
      </div>
    </footer>
  );
};
