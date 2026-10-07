"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Eye, EyeOff, Lock, AlertCircle, ArrowLeft, Terminal, KeyRound } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // 2FA TOTP State
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // Auto-redirect if already logged in as admin
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/admin/session");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            router.push("/admin/dashboard");
            return;
          }
        }
      } catch {
        // Not authenticated
      } finally {
        setCheckingSession(false);
      }
    };
    checkSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed. Invalid admin credentials.");
      }

      if (data.mfaRequired && data.mfaSessionToken) {
        setMfaRequired(true);
        setMfaToken(data.mfaSessionToken);
        setLoading(false);
        return;
      }

      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Unable to log in. Please check your admin credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/verify-mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mfaSessionToken: mfaToken,
          code: otpCode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid 6-digit TOTP code.");
      }

      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "MFA verification failed.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-[calc(100vh-100px)] flex flex-col items-center justify-center font-mono text-xs text-rose-400">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span>VERIFYING SECURE ADMIN CONSOLE...</span>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-100px)] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-[#0e0714] via-black/85 to-[#050814] border border-rose-500/30 backdrop-blur-2xl shadow-[0_0_50px_rgba(225,29,72,0.25)] relative overflow-hidden text-center"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Quantex Mugen Logo */}
        <div className="relative w-44 h-14 mx-auto mb-2 filter drop-shadow-[0_0_12px_rgba(255,0,60,0.7)]">
          <Image
            src="/assets/quantex-black-redglow.png"
            alt="QUANTEX MUGEN"
            fill
            sizes="(max-width: 768px) 176px, 176px"
            priority
            unoptimized
            className="object-contain"
          />
        </div>

        {/* Shield & Eyebrow */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] font-mono tracking-widest uppercase mb-3">
          <Terminal className="w-3.5 h-3.5 text-rose-400" />
          <span>ADMINISTRATIVE ACCESS ONLY</span>
        </div>

        {/* Heading */}
        <h1 className="text-xl sm:text-2xl font-black tracking-widest text-white uppercase text-glow-crimson font-sans">
          {mfaRequired ? "TWO-FACTOR VERIFICATION" : "ADMIN PORTAL LOGIN"}
        </h1>
        <p className="mt-1 text-xs font-mono text-gray-400">
          {mfaRequired
            ? "Enter the 6-digit verification code from your authenticator app (Google Authenticator / Authy)."
            : "Enter authorized administrative credentials to manage registrations, teams, and payments."}
        </p>

        {/* Error Alert */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-start gap-2.5 text-left font-mono"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        {!mfaRequired ? (
          <form onSubmit={handleLogin} className="mt-6 space-y-4 text-left font-mono">
            {/* Hidden Honeypot Anti-Bot Field (Invisible to humans, triggers trap for automated bots) */}
            <div className="hidden opacity-0 pointer-events-none absolute -left-[9999px]" aria-hidden="true">
              <input
                type="text"
                name="website_url"
                tabIndex={-1}
                autoComplete="off"
                placeholder="Leave blank"
              />
              <input
                type="text"
                name="bot_trap_field"
                tabIndex={-1}
                autoComplete="off"
                placeholder="Leave blank"
              />
            </div>

            {/* Admin Username */}
            <div>
              <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                ADMIN USERNAME / EMAIL *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Dinesh"
                  autoComplete="username"
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 focus:border-rose-500/60 focus:outline-none text-white text-xs sm:text-sm transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                PASSWORD *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 focus:border-rose-500/60 focus:outline-none text-white text-xs sm:text-sm transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs sm:text-sm tracking-widest uppercase flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(225,29,72,0.4)] hover:shadow-[0_0_35px_rgba(225,29,72,0.6)] transition-all cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>SECURE ADMIN LOGIN</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMfaSubmit} className="mt-6 space-y-4 text-left font-mono">
            <div>
              <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                6-DIGIT TOTP AUTH CODE *
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-rose-500/50 focus:border-rose-400 focus:outline-none text-white text-center text-xl tracking-[0.5em] font-mono transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full mt-4 py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs sm:text-sm tracking-widest uppercase flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(225,29,72,0.4)] hover:shadow-[0_0_35px_rgba(225,29,72,0.6)] transition-all cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>VERIFY MFA & ENTER DASHBOARD</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMfaRequired(false);
                setOtpCode("");
                setPassword("");
              }}
              className="w-full text-center text-[11px] text-gray-400 hover:text-white transition-colors uppercase pt-2"
            >
              Cancel and return to password login
            </button>
          </form>
        )}

        {/* Security Notice */}
        <div className="mt-6 p-3 rounded-xl bg-white/[0.02] border border-white/10 text-[10px] font-mono text-gray-400 flex items-center justify-center gap-2">
          <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Protected with HTTP-only tokens, bcrypt hash & activity audit trails.</span>
        </div>

        {/* Back Link */}
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-rose-400 transition-colors font-mono tracking-wider uppercase"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>RETURN TO MAIN PORTAL</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
