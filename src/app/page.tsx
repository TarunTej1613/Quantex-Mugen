"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { EventSpecifications } from "@/components/home/EventSpecifications";
import RulesSection from "@/components/home/RulesSection";
import {
  Calendar,
  MapPin,
  Users,
  Award,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Lock,
} from "lucide-react";

interface CapacityData {
  totalTeams: number;
  maximumTeams: number;
  confirmedTeams: number;
  activeReservations: number;
  occupiedSlots: number;
  isFull: boolean;
  participantFee: number;
  teamFee: number;
  registrationOpen: boolean;
  eventName: string;
  tagline: string;
  eventDate: string;
  venue: string;
  prizePool: string;
  credits: string;
}

export default function HomePage() {
  const [capacity, setCapacity] = useState<CapacityData>({
    totalTeams: 0,
    maximumTeams: 100,
    confirmedTeams: 0,
    activeReservations: 0,
    occupiedSlots: 0,
    isFull: false,
    participantFee: 350,
    teamFee: 1400,
    registrationOpen: true,
    eventName: "QUANTEX MUGEN",
    tagline: "WHERE LIMITS CEASE, POSSIBILITIES BEGIN",
    eventDate: "30–31 October",
    venue: "KS Auditorium",
    prizePool: "₹15,000",
    credits: "2EE Credits",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCapacity = async () => {
      try {
        const res = await fetch("/api/capacity");
        if (res.ok) {
          const data = await res.json();
          setCapacity(data);
        }
      } catch (err) {
        console.error("Failed to fetch capacity:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCapacity();

    const interval = setInterval(fetchCapacity, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Hero Content */}
      <div className="mx-auto max-w-6xl w-full flex flex-col items-center text-center">
        {/* Organizers Tag */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full liquid-glass border border-rose-500/30 text-rose-300 text-xs sm:text-sm font-semibold tracking-widest uppercase mb-2"
        >
          <ShieldCheck className="w-4 h-4 text-rose-400" />
          <span>OWASP KARE & CYBERNERDS KARE PRESENT</span>
        </motion.div>

        {/* Title Logo Floating with Pure Font Stroke Red Glow Outline (No Background Blobs) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="relative my-2 sm:my-3 flex items-center justify-center w-full max-w-3xl md:max-w-4xl"
        >
          {/* Title Card Image: QUANTEX MUGEN Black & Red Glow Calligraphy */}
          <div className="relative z-10 w-full max-w-xl sm:max-w-2xl md:max-w-3xl h-60 sm:h-76 md:h-88 flex items-center justify-center filter drop-shadow-[0_0_20px_rgba(255,0,60,0.85)] select-none">
            <Image
              src="/assets/quantex-black-redglow.png"
              alt="QUANTEX SERIES MUGEN"
              width={850}
              height={400}
              priority
              unoptimized
              className="object-contain max-h-full w-auto select-none"
            />
          </div>
        </motion.div>

        {/* Live Dynamic Capacity Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-2 sm:mt-4 w-full max-w-md p-4 rounded-2xl liquid-glass border border-white/15"
        >
          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold mb-2">
            <span className="text-gray-300 tracking-wider flex items-center gap-1.5 uppercase font-mono">
              <Users className={`w-4 h-4 ${!capacity.registrationOpen || capacity.isFull ? "text-red-400" : "text-rose-400"}`} />
              {!capacity.registrationOpen ? "REGISTRATION STATUS" : "TEAM REGISTRATION"}
            </span>
            <span className={`font-bold font-mono ${!capacity.registrationOpen || capacity.isFull ? "text-red-400" : "text-rose-400"}`}>
              {loading
                ? "FETCHING..."
                : !capacity.registrationOpen
                ? "CLOSED"
                : capacity.isFull
                ? "SLOTS FULL"
                : `${capacity.occupiedSlots} / ${capacity.maximumTeams} TEAMS`}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden border border-white/10 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                !capacity.registrationOpen || capacity.isFull
                  ? "bg-red-500 shadow-[0_0_12px_#ef4444]"
                  : "bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_0_12px_rgba(225,29,72,0.8)]"
              }`}
              style={{
                width: !capacity.registrationOpen || capacity.isFull
                  ? "100%"
                  : `${Math.min(
                      100,
                      (capacity.occupiedSlots / (capacity.maximumTeams || 100)) * 100
                    )}%`,
              }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400 font-mono">
            <span>{!capacity.registrationOpen ? "OFFICIAL PORTAL" : "4 MEMBERS / TEAM"}</span>
            {!capacity.registrationOpen ? (
              <span className="text-red-400 font-bold tracking-wider">
                ADMISSIONS LOCKED
              </span>
            ) : capacity.isFull ? (
              <span className="text-red-400 font-bold tracking-wider animate-pulse">
                0 SLOTS REMAINING
              </span>
            ) : (
              <span className="text-emerald-400 font-bold">
                {capacity.maximumTeams - capacity.occupiedSlots} SLOTS REMAINING
              </span>
            )}
          </div>
        </motion.div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-6 flex flex-col sm:flex-row items-center gap-4"
        >
          {capacity.isFull || !capacity.registrationOpen ? (
            <button
              disabled
              className="px-8 py-3.5 rounded-xl liquid-glass border border-red-500/40 text-red-400 font-bold tracking-wider uppercase cursor-not-allowed opacity-80 text-sm sm:text-base flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
            >
              <Lock className="w-4 h-4" />
              <span>{!capacity.registrationOpen ? "REGISTRATIONS CLOSED" : "REGISTRATIONS FULL"}</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="group px-8 py-3.5 rounded-xl liquid-glass-btn text-white font-bold tracking-wider uppercase text-sm sm:text-base flex items-center gap-3 shadow-[0_0_30px_rgba(225,29,72,0.5)] hover:shadow-[0_0_45px_rgba(225,29,72,0.8)]"
            >
              <span>REGISTER NOW</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}

          <Link
            href="/login"
            className="px-6 py-3.5 rounded-xl liquid-glass-btn-secondary font-semibold text-xs sm:text-sm tracking-wider uppercase"
          >
            TEAM LEAD LOGIN
          </Link>
        </motion.div>

        {/* Official Event Specifications Section (2 Cards + 3-Level Prize Podium) */}
        <EventSpecifications />

        {/* Registration & Participation Rules Section (6 Cyber-Glass Cards) */}
        <RulesSection />
      </div>
    </div>
  );
}
