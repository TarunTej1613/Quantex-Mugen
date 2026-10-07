"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Shield, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDirectGoogleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      // Immediately open native Google Account Chooser showing all browser Google accounts
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;
      const email = googleUser.email ? googleUser.email.trim().toLowerCase() : "";

      // Validate @klu.ac.in domain
      if (!email.endsWith("@klu.ac.in")) {
        await auth.signOut();
        throw new Error(
          `You selected "${email}". Please choose your official @klu.ac.in college Google account.`
        );
      }

      // Sync verified Google user with MongoDB Atlas
      const res = await fetch("/api/auth/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          name: googleUser.displayName || email.split("@")[0].toUpperCase(),
          googleId: googleUser.uid,
          photoUrl: googleUser.photoURL,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to establish MongoDB session");
      }

      // Route to dashboard if already registered, else register
      if (data.user?.teamId) {
        router.push("/dashboard");
      } else {
        router.push("/register");
      }
    } catch (err: any) {
      console.error("Firebase Login Error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-in window closed before selecting an account.");
      } else if (err.code === "auth/cancelled-popup-request") {
        setError("Account selection was cancelled.");
      } else {
        setError(err.message || "Google Authentication failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-100px)] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md p-8 sm:p-10 rounded-3xl liquid-glass-card border border-white/15 relative overflow-hidden text-center shadow-2xl"
      >
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Quantex Mugen Logo */}
        <div className="relative w-48 h-16 mx-auto mb-3 filter drop-shadow-[0_0_12px_rgba(255,0,60,0.7)]">
          <Image
            src="/assets/quantex-black-redglow.png"
            alt="QUANTEX MUGEN"
            fill
            sizes="(max-width: 768px) 192px, 192px"
            priority
            className="object-contain"
          />
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-black tracking-widest text-white uppercase text-glow-crimson">
          TEAM LEAD LOGIN
        </h2>
        <p className="mt-2 text-xs font-mono text-gray-300 tracking-wider uppercase">
          QUANTEX MUGEN ACCESS PORTAL
        </p>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex items-start gap-2.5 text-left"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Direct One-Click Google Authentication */}
        <div className="mt-8 space-y-4">
          <button
            type="button"
            disabled={loading}
            onClick={handleDirectGoogleLogin}
            className="w-full py-4 px-6 rounded-2xl bg-white hover:bg-gray-100 text-gray-900 font-bold text-sm sm:text-base tracking-wider flex items-center justify-center gap-3 shadow-[0_4px_30px_rgba(255,255,255,0.25)] hover:shadow-[0_6px_35px_rgba(255,255,255,0.4)] transition-all cursor-pointer transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.4 8.9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.6 7.2C.6 9.2 0 11.5 0 14s.6 4.8 1.6 6.8l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.4-6.7-5.3L1.6 16c1.9 3.8 5.8 7 10.4 7z"
                  />
                </svg>
                <span>CONTINUE WITH GOOGLE</span>
              </>
            )}
          </button>

          {/* Security Notice */}
          <div className="p-3.5 rounded-xl liquid-glass border border-white/10 text-xs font-mono text-gray-300 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Select your official <strong className="text-white">@klu.ac.in</strong> account from Google</span>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-rose-400 transition-colors font-mono tracking-wider uppercase"
          >
            ← BACK TO HOME
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
