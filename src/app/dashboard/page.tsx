"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  ShieldCheck,
  Ticket,
  Clock,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Calendar,
  MapPin,
  LogOut,
  Sparkles,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const authRes = await fetch("/api/auth/me");
        if (!authRes.ok) {
          router.push("/login");
          return;
        }

        const authData = await authRes.json();
        setUser(authData.user);

        if (authData.user?.teamId) {
          const teamRes = await fetch(`/api/team/${authData.user.teamId}`);
          if (teamRes.ok) {
            const teamData = await teamRes.json();
            setTeam(teamData.team);
          }
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-100px)] flex items-center justify-center font-mono text-sm text-gray-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <span>AUTHENTICATING DASHBOARD...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-100px)] py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl liquid-glass-card border border-white/15">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>AUTHENTICATED TEAM LEAD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-white uppercase">
            {team ? team.teamName : "STUDENT DASHBOARD"}
          </h1>
          <p className="text-xs font-mono text-gray-400">
            {user?.email} • QUANTEX MUGEN
          </p>
        </div>

        <div className="flex items-center gap-3">
          {team && (
            <Link
              href={`/pass/${team.teamId}`}
              className="px-4 py-2 rounded-xl liquid-glass-btn text-white text-xs font-mono font-bold tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(225,29,72,0.4)]"
            >
              <Ticket className="w-4 h-4" />
              <span>EVENT PASS</span>
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl liquid-glass-btn-secondary text-gray-400 hover:text-white text-xs font-mono cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!team ? (
        <div className="p-8 rounded-3xl liquid-glass-card border border-white/15 text-center space-y-4">
          <h3 className="text-xl font-bold text-white uppercase">NO TEAM REGISTERED YET</h3>
          <p className="text-xs font-mono text-gray-400 max-w-md mx-auto">
            You are logged in as a Team Lead. Complete your 4-participant registration to lock your slot for Quantex Mugen.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl liquid-glass-btn text-white font-bold text-xs font-mono tracking-wider uppercase shadow-[0_0_20px_rgba(225,29,72,0.4)]"
          >
            <Users className="w-4 h-4" />
            <span>START TEAM REGISTRATION</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Status & Overview */}
          <div className="md:col-span-4 space-y-6">
            {/* Status Card */}
            <div className="p-6 rounded-3xl liquid-glass-card border border-white/15 space-y-4">
              <span className="text-xs font-mono text-gray-400 uppercase tracking-wider block">
                TEAM IDENTITY & STATUS
              </span>

              <div>
                <span className="text-[10px] text-gray-400 font-mono uppercase">TEAM ID</span>
                <p className="text-2xl font-black text-rose-400 font-mono">{team.teamId}</p>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 font-mono uppercase">PAYMENT STATUS</span>
                <div className="mt-1">
                  {team.paymentStatus === "VERIFIED" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED
                    </span>
                  ) : team.paymentStatus === "REJECTED" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                      <XCircle className="w-3.5 h-3.5" /> REJECTED
                    </span>
                  ) : team.paymentStatus === "UNPAID" ? (
                    <div className="space-y-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                        <Clock className="w-3.5 h-3.5 animate-pulse" /> RESERVATION PENDING
                      </span>
                      <Link
                        href={`/payment?teamId=${team.teamId}`}
                        className="block text-center py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                      >
                        COMPLETE PAYMENT NOW
                      </Link>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      <Clock className="w-3.5 h-3.5 animate-spin" /> PENDING VERIFICATION
                    </span>
                  )}
                </div>
              </div>

              {team.payment?.utr && (
                <div>
                  <span className="text-[10px] text-gray-400 font-mono uppercase">SUBMITTED UTR</span>
                  <p className="text-xs font-mono font-bold text-gray-200">{team.payment.utr}</p>
                </div>
              )}

              {team.payment?.rejectionReason && (
                <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-xs text-red-200">
                  <span className="font-bold block">Rejection Reason:</span>
                  {team.payment.rejectionReason}
                </div>
              )}
            </div>

            {/* Event Quick Info */}
            <div className="p-6 rounded-3xl liquid-glass-card border border-white/15 space-y-3 font-mono text-xs">
              <span className="text-gray-400 uppercase tracking-wider block font-bold">
                EVENT SPECIFICATIONS
              </span>
              <div className="flex items-center gap-2 text-gray-300">
                <Calendar className="w-4 h-4 text-rose-400" />
                <span>30–31 October 2026</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span>KS Auditorium, KARE Campus</span>
              </div>
            </div>

            {/* WhatsApp Link */}
            <a
              href="https://chat.whatsapp.com/quantex-mugen"
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 hover:bg-emerald-900/40 flex items-center justify-between text-white transition-all cursor-pointer block"
            >
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold font-mono">Join WhatsApp Squad</span>
              </div>
              <span className="text-xs text-emerald-400">→</span>
            </a>
          </div>

          {/* Members Roster */}
          <div className="md:col-span-8 p-6 sm:p-8 rounded-3xl liquid-glass-card border border-white/15">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-rose-400" />
                <div>
                  <h3 className="text-lg font-bold text-white tracking-wider uppercase">
                    TEAM PARTICIPANTS (4/4)
                  </h3>
                  <p className="text-xs text-gray-400 font-mono">
                    Verified registered roster for Quantex Mugen.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {team.members.map((m: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl liquid-glass border border-white/10 space-y-1 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-rose-400 uppercase">
                      MEMBER #{idx + 1} {idx === 0 ? "(TEAM LEAD)" : ""}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">
                      {m.gender}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white">{m.name}</h4>
                  <p className="text-xs font-mono text-gray-300">
                    {m.registrationNumber} • {m.department} (Yr {m.year}, Sec {m.section})
                  </p>
                  <p className="text-[11px] font-mono text-gray-400">
                    Email: {m.generatedCollegeEmail}
                  </p>
                  <p className="text-[11px] font-mono text-gray-400">
                    Phone: {m.mobile}
                  </p>
                  <p className="text-[11px] font-mono text-gray-400">
                    {m.accommodation} {m.accommodation === "Hosteller" ? `• ${m.hostel} (Rm ${m.roomNumber})` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
