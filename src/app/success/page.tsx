"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Ticket,
  LayoutDashboard,
  MessageCircle,
  Clock,
  ShieldCheck,
  Users,
} from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const teamId = searchParams.get("teamId");

  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Launch celebratory cyber confetti
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#e11d48", "#f43f5e", "#06b6d4", "#ffffff"],
      });
    } catch (e) {
      console.error(e);
    }

    // Fetch team details
    if (teamId) {
      fetch(`/api/team/${teamId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.team) setTeam(data.team);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [teamId]);

  return (
    <div className="min-h-[calc(100vh-100px)] py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto flex flex-col items-center justify-center text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full p-8 sm:p-10 rounded-3xl liquid-glass-card border border-white/15 relative overflow-hidden"
      >
        {/* Glow */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-48 h-48 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-full liquid-glass-crimson flex items-center justify-center border border-rose-500/50 shadow-[0_0_30px_rgba(225,29,72,0.5)]">
          <CheckCircle2 className="w-8 h-8 text-rose-400" />
        </div>

        <h1 className="text-2xl sm:text-4xl font-black tracking-wider text-white uppercase text-glow-crimson">
          REGISTRATION SUCCESSFUL 🎉
        </h1>
        <p className="mt-2 text-xs sm:text-sm font-mono text-gray-300">
          Your slot for QUANTEX MUGEN has been locked and payment submitted.
        </p>

        {/* Team Details Badge */}
        <div className="my-8 p-5 rounded-2xl liquid-glass border border-white/10 text-left space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <span className="text-[10px] font-mono text-gray-400 uppercase">OFFICIAL TEAM ID</span>
              <p className="text-xl font-black text-rose-400 font-mono tracking-wider">
                {team?.teamId || teamId || "QXM-001"}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-gray-400 uppercase">TEAM NAME</span>
              <p className="text-lg font-bold text-white">{team?.teamName || "CyberSquad"}</p>
            </div>
          </div>

          {/* Payment Status Pill */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-mono text-gray-400">PAYMENT STATUS</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>PAYMENT PENDING VERIFICATION</span>
            </span>
          </div>

          {/* Members list if available */}
          {team?.members && (
            <div className="pt-3 border-t border-white/10">
              <span className="text-[11px] font-mono text-gray-400 uppercase block mb-2">
                CONFIRMED PARTICIPANTS (4/4)
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {team.members.map((m: any, i: number) => (
                  <div key={i} className="p-2 rounded-lg bg-white/5 text-gray-300">
                    <span className="font-bold text-white">{m.name}</span>
                    <span className="text-gray-400 block text-[10px]">{m.registrationNumber}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Official WhatsApp Group */}
        <div className="mb-8 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-left">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-emerald-400" />
            <div>
              <span className="text-xs font-bold text-white">Join Official WhatsApp Group</span>
              <p className="text-[11px] text-gray-300 font-mono">
                Mandatory for hackathon announcements & team coordination.
              </p>
            </div>
          </div>
          <a
            href="https://chat.whatsapp.com/quantex-mugen"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono tracking-wider transition-all"
          >
            JOIN NOW
          </a>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={`/pass/${team?.teamId || teamId}`}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl liquid-glass-btn text-white font-bold tracking-wider uppercase text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(225,29,72,0.4)]"
          >
            <Ticket className="w-4 h-4" />
            <span>VIEW EVENT PASS</span>
          </Link>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl liquid-glass-btn-secondary text-white font-semibold tracking-wider uppercase text-xs sm:text-sm flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>GO TO TEAM DASHBOARD</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-mono">Loading Registration Status...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
