"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, LayoutDashboard, Settings } from "lucide-react";

export const GlassHeader: React.FC = () => {
  const pathname = usePathname();
  const [user, setUser] = useState<{ email?: string; role?: string; teamId?: string } | null>(null);

  useEffect(() => {
    // Check client session user
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    };
    checkAuth();
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-300">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 rounded-2xl liquid-glass backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
          {/* Organizers Logos (OWASP + CyberNerds) */}
          <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
            {/* OWASP Logo */}
            <Link href="/" className="flex items-center group">
              <div className="relative h-7 sm:h-10 w-20 xs:w-24 sm:w-36 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg sm:rounded-xl bg-white/95 border border-white/30 flex items-center justify-center transition-all group-hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] overflow-hidden">
                <Image
                  src="/assets/owasp-logo.png"
                  alt="OWASP KARE Student Chapter"
                  width={150}
                  height={40}
                  priority
                  className="object-contain w-full h-full"
                />
              </div>
            </Link>

            {/* Separator */}
            <div className="w-[1px] h-4 sm:h-6 bg-white/20" />

            {/* CyberNerds Logo */}
            <Link href="/" className="flex items-center group">
              <div className="relative h-7 sm:h-10 w-20 xs:w-24 sm:w-36 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg sm:rounded-xl bg-black/90 border border-white/15 flex items-center justify-center transition-all group-hover:border-rose-500/50 group-hover:shadow-[0_0_15px_rgba(225,29,72,0.3)] overflow-hidden">
                <Image
                  src="/assets/cybernerds-logo.png"
                  alt="CyberNerds KARE Student Chapter"
                  width={150}
                  height={40}
                  priority
                  className="object-contain w-full h-full"
                />
              </div>
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="flex items-center gap-1.5 sm:gap-3">
            <Link
              href="/"
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all ${
                pathname === "/"
                  ? "bg-rose-600/20 text-rose-300 border border-rose-500/30"
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              }`}
            >
              HOME
            </Link>

            <Link
              href="/register"
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all ${
                pathname.startsWith("/register")
                  ? "bg-rose-600/20 text-rose-300 border border-rose-500/30"
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              }`}
            >
              REGISTER
            </Link>

            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all ${
                    pathname.startsWith("/dashboard")
                      ? "bg-rose-600/20 text-rose-300 border border-rose-500/30"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">DASHBOARD</span>
                </Link>

                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all ${
                      pathname.startsWith("/admin")
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10"
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">ADMIN</span>
                  </Link>
                )}
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold tracking-wider liquid-glass-btn text-white"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>SIGN IN</span>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
