import React from "react";
import connectToDatabase from "@/lib/mongodb";
import { Team } from "@/models/Team";
import { ShieldCheck, AlertOctagon, Calendar, MapPin, Users, Award } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function VerifyPassPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  let team: any = null;
  let isValid = false;

  try {
    await connectToDatabase();
    const doc = await Team.findOne({ teamId }).select(
      "teamId teamName members paymentStatus createdAt"
    );
    if (doc) {
      team = {
        teamId: doc.teamId,
        teamName: doc.teamName,
        paymentStatus: doc.paymentStatus,
        members: doc.members.map((m: any) => ({
          name: m.name,
          registrationNumber: m.registrationNumber,
          department: m.department,
        })),
      };
      isValid = doc.paymentStatus === "VERIFIED" || doc.paymentStatus === "PENDING";
    }
  } catch (err) {
    console.error("Verification error:", err);
  }

  return (
    <div className="min-h-[calc(100vh-100px)] py-12 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto flex flex-col items-center justify-center">
      <div className="w-full p-8 rounded-3xl liquid-glass-card border border-white/15 text-center relative overflow-hidden shadow-2xl">
        {isValid ? (
          <>
            {/* Verified Badge */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </div>

            <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider mb-2">
              OFFICIAL VERIFIED PASS
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-white uppercase text-glow-white">
              VALID QUANTEX MUGEN EVENT PASS
            </h1>
            <p className="mt-1 text-xs font-mono text-gray-300">
              WHERE LIMITS CEASE, POSSIBILITIES BEGIN
            </p>

            {/* Team Summary Card */}
            <div className="my-6 p-5 rounded-2xl liquid-glass border border-white/10 text-left font-mono space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase">TEAM ID</span>
                  <p className="text-xl font-bold text-rose-400">{team.teamId}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 uppercase">TEAM NAME</span>
                  <p className="text-base font-bold text-white">{team.teamName}</p>
                </div>
              </div>

              {/* Event Info */}
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-300 py-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-rose-400" />
                  <span>30–31 October</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>KS Auditorium</span>
                </div>
              </div>

              {/* 4 Registered Participants */}
              <div className="pt-2 border-t border-white/10">
                <span className="text-[10px] text-gray-400 uppercase block mb-1.5">
                  REGISTERED PARTICIPANTS ({team.members.length}/4)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {team.members.map((m: any, idx: number) => (
                    <div key={idx} className="p-2 rounded-lg bg-white/5">
                      <p className="font-bold text-xs text-white">
                        {idx + 1}. {m.name}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {m.registrationNumber} • {m.department}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-[11px] font-mono text-gray-400">
              Organized by OWASP KARE & CYBERNERDS KARE STUDENT CHAPTERS
            </div>
          </>
        ) : (
          <>
            {/* Invalid Badge */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.4)]">
              <AlertOctagon className="w-8 h-8 text-red-400" />
            </div>

            <h1 className="text-2xl font-black tracking-wider text-white uppercase text-red-400">
              INVALID OR UNVERIFIED PASS
            </h1>
            <p className="mt-2 text-xs font-mono text-gray-400 max-w-sm mx-auto">
              No active or verified team registration was found for Team ID:{" "}
              <span className="text-white font-bold">{teamId}</span>.
            </p>
          </>
        )}

        <div className="mt-8">
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl liquid-glass-btn text-white font-bold text-xs font-mono uppercase tracking-wider inline-block"
          >
            RETURN TO HOMEPAGE
          </Link>
        </div>
      </div>
    </div>
  );
}
