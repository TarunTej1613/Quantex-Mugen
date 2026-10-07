"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  MapPin,
  CreditCard,
  Trophy,
  GraduationCap,
  Sparkles,
  Award,
  CheckCircle2,
  Medal,
} from "lucide-react";

export const EventSpecifications: React.FC = () => {
  return (
    <section className="w-full max-w-6xl mx-auto my-12 sm:my-16 px-4 sm:px-6">
      {/* ========================================================================= */}
      {/* 1. SECTION HEADER */}
      {/* ========================================================================= */}
      <div className="text-center mb-10 sm:mb-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-mono tracking-[0.25em] uppercase mb-3 shadow-[0_0_15px_rgba(225,29,72,0.2)]"
        >
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          <span>OFFICIAL EVENT SPECIFICATIONS</span>
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl font-black tracking-wider text-white uppercase text-glow-crimson font-sans"
        >
          EVENT SPECIFICATIONS
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xs sm:text-sm text-gray-300 font-mono max-w-xl mx-auto mt-2 leading-relaxed"
        >
          Comprehensive technical, academic, and championship parameters for QUANTEX MUGEN.
        </motion.p>
      </div>

      {/* ========================================================================= */}
      {/* 2. TWO FEATURE CARDS (Desktop: Side-by-Side, Mobile: Stacked) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-14 sm:mb-18">
        
        {/* CARD 1: EVENT / HACKATHON (Red/Orange/Crimson Accent) */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-rose-950/30 via-black/70 to-black/90 border border-rose-500/40 shadow-[0_0_35px_rgba(225,29,72,0.15)] hover:border-rose-500/60 transition-all duration-300 backdrop-blur-2xl flex flex-col justify-between"
        >
          <div>
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] font-mono tracking-widest uppercase mb-4">
              <Trophy className="w-3.5 h-3.5 text-rose-400" />
              <span>HACKATHON PARAMETERS</span>
            </div>

            {/* Title */}
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-widest uppercase text-glow-crimson font-sans mb-6">
              QUANTEX MUGEN
            </h3>

            {/* Confirmed Details List */}
            <div className="space-y-4 font-mono text-xs sm:text-sm">
              {/* Date */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-rose-500/30 transition-colors">
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                    <Calendar className="w-4 h-4 text-rose-400" />
                  </div>
                  <span className="text-gray-400 uppercase text-xs">Date</span>
                </div>
                <span className="font-bold text-white tracking-wide">October 30 – 31</span>
              </div>

              {/* Venue */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-rose-500/30 transition-colors">
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <MapPin className="w-4 h-4 text-orange-400" />
                  </div>
                  <span className="text-gray-400 uppercase text-xs">Venue</span>
                </div>
                <span className="font-bold text-white tracking-wide">KS Auditorium</span>
              </div>

              {/* Registration Fee */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-rose-500/30 transition-colors">
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-gray-400 uppercase text-xs">Registration Fee</span>
                </div>
                <span className="font-bold text-emerald-300 tracking-wide">₹350</span>
              </div>

              {/* Prize Pool */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-rose-500/30 transition-colors">
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <Trophy className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-gray-400 uppercase text-xs">Prize Pool</span>
                </div>
                <span className="font-bold text-amber-300 tracking-wide">₹15,000</span>
              </div>

              {/* 2EE Credits */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-rose-500/30 transition-colors">
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <GraduationCap className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className="text-gray-400 uppercase text-xs">Academic Credits</span>
                </div>
                <span className="font-bold text-cyan-300 tracking-wide">2EE Credits</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CARD 2: ACADEMIC CERTIFICATION (Blue/Cyan Accent) */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-cyan-950/30 via-black/70 to-black/90 border border-cyan-500/40 shadow-[0_0_35px_rgba(6,182,212,0.15)] hover:border-cyan-500/60 transition-all duration-300 backdrop-blur-2xl flex flex-col justify-between"
        >
          <div>
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono tracking-widest uppercase mb-4">
              <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
              <span>OFFICIAL ACCREDITATION</span>
            </div>

            {/* Title */}
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-widest uppercase text-glow-cyan font-sans mb-4">
              ACADEMIC CERTIFICATION
            </h3>

            {/* Big 2EE Credits Badge */}
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-center my-4">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-semibold block">
                EARN ACADEMIC CREDIT
              </span>
              <span className="text-3xl sm:text-4xl font-black font-mono text-cyan-300 tracking-wider text-glow-cyan mt-1 block">
                2EE CREDITS
              </span>
            </div>

            {/* Concise description */}
            <p className="text-xs sm:text-sm text-gray-300 font-mono leading-relaxed mt-4">
              Participants actively competing in <strong className="text-white">QUANTEX MUGEN</strong> are eligible to claim <strong className="text-cyan-300">2EE Credits</strong> towards their official academic portfolio upon completion and evaluation.
            </p>

            {/* Highlights */}
            <div className="mt-6 space-y-2.5 font-mono text-xs">
              <div className="flex items-center gap-2.5 text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Participants can claim 2EE Credits</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Endorsed by OWASP & Cybernerds KARE Chapters</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Official participation credentials provided</span>
              </div>
            </div>
          </div>
        </motion.div>

      </div>

      {/* ========================================================================= */}
      {/* 3. PRIZE POOL SECTION (Large Centered Presentation & 3-Level Podium) */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="w-full p-6 sm:p-10 rounded-3xl bg-gradient-to-b from-white/[0.04] via-black/75 to-black/95 border border-white/15 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.6)] text-center relative overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono tracking-[0.25em] uppercase mb-3">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>PRIZE POOL</span>
        </div>

        {/* Main Heading */}
        <h3 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-widest uppercase text-glow-amber font-sans">
          ₹15,000 TOTAL CASH PRIZE POOL
        </h3>

        {/* Short Description */}
        <p className="text-xs sm:text-sm text-gray-300 font-mono max-w-xl mx-auto mt-2 leading-relaxed">
          “Compete, innovate, and showcase your skills to claim the ultimate championship rewards.”
        </p>

        {/* ===================================================================== */}
        {/* THREE-POSITION PODIUM (Desktop: 2nd -> 1st -> 3rd; Mobile: Clean Hierarchy) */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-10 sm:mt-12 items-end max-w-4xl mx-auto">
          
          {/* 2ND PLACE (Left Column on Desktop, Silver Accent) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="order-2 sm:order-1 p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-slate-400/15 via-black/70 to-black/90 border border-slate-300/40 shadow-[0_0_30px_rgba(203,213,225,0.15)] flex flex-col items-center justify-center text-center h-52 sm:h-56 relative group hover:border-slate-300/70 transition-all"
          >
            {/* Icon */}
            <div className="w-12 h-12 rounded-full bg-slate-300/10 border border-slate-300/30 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(203,213,225,0.2)]">
              <span className="text-2xl">🥈</span>
            </div>
            
            {/* Position */}
            <span className="text-[11px] font-mono tracking-widest uppercase font-bold text-slate-300 mb-1">
              2ND PLACE
            </span>

            {/* Amount */}
            <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-wider">
              ₹5,000
            </span>

            {/* Sub-label */}
            <span className="text-[10px] text-gray-400 font-mono mt-1">
              Runner Up Award
            </span>
          </motion.div>

          {/* 1ST PLACE (Center Column on Desktop, Taller & Gold Accent) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="order-1 sm:order-2 p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-amber-500/25 via-black/75 to-black/95 border-2 border-amber-400/60 shadow-[0_0_50px_rgba(245,158,11,0.35)] flex flex-col items-center justify-center text-center h-60 sm:h-68 relative scale-100 sm:scale-105 z-10 group hover:border-amber-400/90 transition-all"
          >
            {/* Crown / Top Badge */}
            <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-amber-500 border border-amber-300 text-black text-[10px] font-mono font-black tracking-widest uppercase shadow-lg">
              CHAMPIONS
            </div>

            {/* Trophy Icon */}
            <div className="w-16 h-16 rounded-full bg-amber-400/15 border border-amber-400/40 flex items-center justify-center mb-3 shadow-[0_0_25px_rgba(245,158,11,0.4)] animate-bounce duration-1000">
              <span className="text-3xl">🏆</span>
            </div>

            {/* Position */}
            <span className="text-xs font-mono tracking-widest uppercase font-black text-amber-300 text-glow-amber mb-1">
              1ST PLACE
            </span>

            {/* Amount */}
            <span className="text-4xl sm:text-5xl font-black text-white text-glow-amber font-mono tracking-wider">
              ₹6,000
            </span>

            {/* Sub-label */}
            <span className="text-[11px] text-amber-200/80 font-mono mt-1 font-semibold">
              Grand Winner Award
            </span>
          </motion.div>

          {/* 3RD PLACE (Right Column on Desktop, Bronze Accent) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="order-3 sm:order-3 p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-amber-800/15 via-black/70 to-black/90 border border-amber-700/40 shadow-[0_0_30px_rgba(180,83,9,0.2)] flex flex-col items-center justify-center text-center h-52 sm:h-56 relative group hover:border-amber-700/70 transition-all"
          >
            {/* Icon */}
            <div className="w-12 h-12 rounded-full bg-amber-700/15 border border-amber-700/40 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(180,83,9,0.25)]">
              <span className="text-2xl">🥉</span>
            </div>

            {/* Position */}
            <span className="text-[11px] font-mono tracking-widest uppercase font-bold text-amber-400 mb-1">
              3RD PLACE
            </span>

            {/* Amount */}
            <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-wider">
              ₹4,000
            </span>

            {/* Sub-label */}
            <span className="text-[10px] text-gray-400 font-mono mt-1">
              Second Runner Up
            </span>
          </motion.div>

        </div>
      </motion.div>
    </section>
  );
};
