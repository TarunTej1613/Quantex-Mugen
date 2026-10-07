"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  CreditCard,
  Users,
  FileText,
  Calendar,
  Award,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Info,
} from "lucide-react";
import { DEFAULT_RULES, RuleItem } from "@/constants/rules";

export default function RulesSection() {
  const [rules, setRules] = useState<RuleItem[]>(DEFAULT_RULES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const res = await fetch("/api/rules");
        if (res.ok) {
          const data = await res.json();
          if (data.rules && Array.isArray(data.rules) && data.rules.length > 0) {
            setRules(data.rules);
          }
        }
      } catch (err) {
        console.error("Error fetching rules:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRules();
  }, []);

  const getIcon = (iconName?: string, colorClass: string = "text-rose-400") => {
    switch (iconName) {
      case "CreditCard":
        return <CreditCard className={`w-5 h-5 ${colorClass}`} />;
      case "Users":
        return <Users className={`w-5 h-5 ${colorClass}`} />;
      case "ShieldCheck":
        return <ShieldCheck className={`w-5 h-5 ${colorClass}`} />;
      case "FileText":
        return <FileText className={`w-5 h-5 ${colorClass}`} />;
      case "Calendar":
        return <Calendar className={`w-5 h-5 ${colorClass}`} />;
      case "Award":
        return <Award className={`w-5 h-5 ${colorClass}`} />;
      default:
        return <ShieldCheck className={`w-5 h-5 ${colorClass}`} />;
    }
  };

  const getAccentStyles = (color?: string) => {
    switch (color) {
      case "cyan":
        return {
          badgeBg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300",
          iconBg: "bg-cyan-500/15 border-cyan-500/40 text-cyan-400",
          titleColor: "text-cyan-400",
          highlightBg: "bg-cyan-950/40 border-cyan-500/30 text-cyan-200",
          borderHover: "hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]",
          glow: "from-cyan-500/10 via-transparent to-transparent",
        };
      case "amber":
        return {
          badgeBg: "bg-amber-500/10 border-amber-500/30 text-amber-300",
          iconBg: "bg-amber-500/15 border-amber-500/40 text-amber-400",
          titleColor: "text-amber-400",
          highlightBg: "bg-amber-950/40 border-amber-500/30 text-amber-200",
          borderHover: "hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]",
          glow: "from-amber-500/10 via-transparent to-transparent",
        };
      case "purple":
        return {
          badgeBg: "bg-purple-500/10 border-purple-500/30 text-purple-300",
          iconBg: "bg-purple-500/15 border-purple-500/40 text-purple-400",
          titleColor: "text-purple-400",
          highlightBg: "bg-purple-950/40 border-purple-500/30 text-purple-200",
          borderHover: "hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]",
          glow: "from-purple-500/10 via-transparent to-transparent",
        };
      case "emerald":
        return {
          badgeBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
          iconBg: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400",
          titleColor: "text-emerald-400",
          highlightBg: "bg-emerald-950/40 border-emerald-500/30 text-emerald-200",
          borderHover: "hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]",
          glow: "from-emerald-500/10 via-transparent to-transparent",
        };
      case "rose":
      default:
        return {
          badgeBg: "bg-rose-500/10 border-rose-500/30 text-rose-300",
          iconBg: "bg-rose-500/15 border-rose-500/40 text-rose-400",
          titleColor: "text-rose-400",
          highlightBg: "bg-rose-950/40 border-rose-500/30 text-rose-200",
          borderHover: "hover:border-rose-500/50 hover:shadow-[0_0_30px_rgba(225,29,72,0.25)]",
          glow: "from-rose-500/10 via-transparent to-transparent",
        };
    }
  };

  return (
    <section className="relative w-full py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Outer Container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
        className="relative rounded-[2.5rem] bg-gradient-to-b from-[#0b0f24]/85 via-[#070a1a]/90 to-[#040611]/95 border border-indigo-500/20 backdrop-blur-2xl p-6 sm:p-10 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.6)] overflow-hidden"
      >
        {/* Subtle Top Glow Line */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />

        {/* Section Header Area */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-mono tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(225,29,72,0.2)]">
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            <span>OFFICIAL GUIDELINES & PROTOCOLS</span>
          </div>

          {/* Heading with Security/Shield Icon */}
          <div className="flex items-center justify-center gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.3)] shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-wider text-white uppercase text-glow-crimson font-sans">
              REGISTRATION & PARTICIPATION RULES
            </h2>
          </div>

          {/* Subtitle */}
          <p className="mt-3 text-xs sm:text-sm font-mono text-gray-400 leading-relaxed max-w-2xl mx-auto">
            Review the essential participation criteria, verification steps, and academic credit regulations for QUANTEX MUGEN.
          </p>
        </div>

        {/* Rules Grid: 3 Cards per row on Desktop, stacked on Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {rules.map((rule, idx) => {
            const styles = getAccentStyles(rule.accentColor);
            return (
              <motion.div
                key={rule._id || idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className={`group relative rounded-2xl bg-[#080d20]/75 border border-white/10 ${styles.borderHover} backdrop-blur-xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-lg`}
              >
                {/* Background Ambient Radial Accent */}
                <div
                  className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${styles.glow} rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500`}
                />

                <div>
                  {/* Top Row: Numbered Badge & Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`px-3 py-1 rounded-full border text-[11px] font-mono font-bold tracking-wider uppercase ${styles.badgeBg}`}
                    >
                      {rule.badge || `RULE ${idx + 1}`}
                    </span>

                    <div
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center ${styles.iconBg} group-hover:scale-110 transition-transform duration-300 shadow-sm`}
                    >
                      {getIcon(rule.iconName, styles.titleColor)}
                    </div>
                  </div>

                  {/* Rule Title */}
                  <h3 className={`text-base sm:text-lg font-bold font-sans tracking-wide mb-2 ${styles.titleColor}`}>
                    {rule.title}
                  </h3>

                  {/* Highlight Pill (if available) */}
                  {rule.highlight && (
                    <div
                      className={`inline-block px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold mb-3 ${styles.highlightBg}`}
                    >
                      {rule.highlight}
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-sans mb-4">
                    {rule.description}
                  </p>

                  {/* Bullet Points */}
                  {rule.points && rule.points.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      {rule.points.map((point, pIdx) => (
                        <div key={pIdx} className="flex items-start gap-2 text-xs font-mono text-gray-300">
                          <CheckCircle2
                            className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${styles.titleColor}`}
                          />
                          <span className="leading-snug">{point}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Card Accent Bar */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-gray-400">
                  <span>QUANTEX MUGEN PROTOCOL</span>
                  <span className="text-gray-400 font-bold">#{String(rule.order || idx + 1).padStart(2, "0")}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer Note Area inside Container */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs font-mono text-gray-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-rose-400 shrink-0" />
            <span>All participants must adhere strictly to the above code of conduct and event policies.</span>
          </div>

          <div className="inline-flex items-center gap-1 text-[11px] text-gray-300 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>KS Auditorium • October 30 – 31</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
