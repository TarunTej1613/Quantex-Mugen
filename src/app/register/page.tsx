"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  User,
  Shield,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Lock,
  Building,
  CreditCard,
  Edit3,
  RotateCcw,
} from "lucide-react";

interface MemberForm {
  name: string;
  registrationNumber: string;
  department: string;
  year: string;
  section: string;
  mobile: string;
  gender: string;
  accommodation: string;
  hostel: string;
  roomNumber: string;
}

const initialMember: MemberForm = {
  name: "",
  registrationNumber: "",
  department: "CSE",
  year: "III",
  section: "",
  mobile: "",
  gender: "Male",
  accommodation: "Day Scholar",
  hostel: "MH-1",
  roomNumber: "",
};

const STORAGE_KEY = "quantex_register_draft";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(0); // 0: Team Name, 1: Member 1, 2: Member 2, 3: Member 3, 4: Member 4, 5: Review
  const [teamName, setTeamName] = useState("");
  const [nameStatus, setNameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [nameMessage, setNameMessage] = useState<string>("");
  const [members, setMembers] = useState<MemberForm[]>([
    { ...initialMember },
    { ...initialMember },
    { ...initialMember },
    { ...initialMember },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [capacity, setCapacity] = useState<any>(null);
  const [checkingCapacity, setCheckingCapacity] = useState(true);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.teamName) setTeamName(parsed.teamName.toUpperCase());
        if (parsed.members && Array.isArray(parsed.members)) setMembers(parsed.members);
      }
    } catch (e) {
      console.error("Failed to load saved draft", e);
    }
  }, []);

  // Real-time team name uniqueness validation with debounce
  useEffect(() => {
    const trimmed = teamName.trim().toUpperCase();
    if (!trimmed || trimmed.length < 3) {
      setNameStatus("idle");
      setNameMessage("");
      return;
    }

    setNameStatus("checking");
    setNameMessage("Verifying name availability...");

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/team/check-name?name=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.available) {
            setNameStatus("available");
            setNameMessage(data.message || `Team name "${trimmed}" is available!`);
          } else {
            setNameStatus("taken");
            setNameMessage(data.message || `Team name "${trimmed}" is already taken.`);
          }
        } else {
          setNameStatus("idle");
        }
      } catch (err) {
        setNameStatus("idle");
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [teamName]);

  // Save draft to localStorage whenever fields change
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          teamName: teamName.toUpperCase(),
          members,
        })
      );
    } catch (e) {
      console.error("Failed to save draft", e);
    }
  }, [teamName, members]);

  useEffect(() => {
    // Check if user is logged in & check capacity
    const checkInit = async () => {
      try {
        const [meRes, capRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/capacity")
        ]);
        if (meRes.ok) {
          const data = await meRes.json();
          if (data.user) setUser(data.user);
        }
        if (capRes.ok) {
          const capData = await capRes.json();
          setCapacity(capData);
        }
      } catch (e) {
        console.error("Init check failed:", e);
      } finally {
        setCheckingCapacity(false);
      }
    };
    checkInit();
  }, []);

  const updateMember = (index: number, field: keyof MemberForm, value: string) => {
    setMembers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const updateMemberMultiple = (index: number, fields: Partial<MemberForm>) => {
    setMembers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...fields };
      return updated;
    });
  };

  const handleClearForm = () => {
    if (window.confirm("Are you sure you want to clear all form fields?")) {
      setTeamName("");
      setNameStatus("idle");
      setNameMessage("");
      setMembers([
        { ...initialMember },
        { ...initialMember },
        { ...initialMember },
        { ...initialMember },
      ]);
      setStep(0);
      setError(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const validateCurrentStep = (): boolean => {
    setError(null);
    if (step === 0) {
      const cleanName = teamName.trim().toUpperCase();
      if (!cleanName || cleanName.length < 3) {
        setError("Please enter a valid Team Name (minimum 3 characters).");
        return false;
      }
      if (nameStatus === "taken") {
        setError(nameMessage || `Team name "${cleanName}" is already taken. Please choose another unique name.`);
        return false;
      }
      return true;
    }

    if (step >= 1 && step <= 4) {
      const idx = step - 1;
      const m = members[idx];
      if (!m.name.trim()) {
        setError(`Participant #${step} Name as per SIS is required.`);
        return false;
      }
      if (!m.registrationNumber.trim()) {
        setError(`Participant #${step} Registration Number is required.`);
        return false;
      }
      // Validate KLU Registration Number format (e.g. 99240040799, 99240040833, 2100030001)
      const regNumberClean = m.registrationNumber.trim().toUpperCase();
      if (!/^[0-9A-Z]{8,15}$/.test(regNumberClean)) {
        setError(`Participant #${step} Registration Number format is invalid (e.g. 99240040799).`);
        return false;
      }
      if (!m.mobile.trim() || !/^[0-9]{10}$/.test(m.mobile.trim())) {
        setError(`Participant #${step} Mobile Number must be exactly 10 digits.`);
        return false;
      }
      if (!m.department || m.department === "-- Select Department --") {
        setError(`Participant #${step} Department selection is required.`);
        return false;
      }
      if (!m.year || m.year === "-- Select Year --") {
        setError(`Participant #${step} Year selection is required.`);
        return false;
      }
      if (!m.section.trim()) {
        setError(`Participant #${step} Section is required (e.g. 24S10).`);
        return false;
      }
      if (!m.gender || m.gender === "-- Select Gender --") {
        setError(`Participant #${step} Gender selection is required.`);
        return false;
      }
      if (m.accommodation === "Hosteller" && !m.roomNumber.trim()) {
        setError(`Participant #${step} Room Number is required for hostellers.`);
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(0, prev - 1));
  };

  const handleProceedToPayment = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/team/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName,
          members,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register team.");
      }

      // Clear draft on successful registration
      localStorage.removeItem(STORAGE_KEY);

      // Route to payment page with teamId
      router.push(`/payment?teamId=${data.teamId}`);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const tabLabels = [
    { label: "Team Info", stepIdx: 0 },
    { label: "Mem 1 (Leader)", stepIdx: 1 },
    { label: "Mem 2", stepIdx: 2 },
    { label: "Mem 3", stepIdx: 3 },
    { label: "Mem 4", stepIdx: 4 },
    { label: "Review", stepIdx: 5 },
  ];

  const getNextButtonText = () => {
    switch (step) {
      case 0:
        return "PROCEED TO MEMBER 1 (TEAM LEADER) DETAILS";
      case 1:
      case 2:
      case 3:
        return "NEXT MEMBER";
      case 4:
        return "REVIEW DETAILS";
      default:
        return "PROCEED TO PAYMENT (₹1,400)";
    }
  };

  const userEmail =
    user?.email ||
    (members[0]?.registrationNumber
      ? `${members[0].registrationNumber.toLowerCase()}@klu.ac.in`
      : "teamlead@klu.ac.in");

  if (!checkingCapacity && capacity && (!capacity.registrationOpen || capacity.isFull)) {
    return (
      <div className="min-h-[calc(100vh-100px)] py-10 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto flex items-center justify-center">
        <div className="w-full rounded-3xl bg-[#060814]/92 backdrop-blur-2xl border border-red-500/30 shadow-[0_0_60px_rgba(239,68,68,0.2)] p-8 sm:p-10 text-center relative overflow-hidden font-mono">
          <div className="w-16 h-16 rounded-2xl bg-red-950/60 border border-red-500/50 flex items-center justify-center mx-auto mb-5 text-red-400">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider text-glow-crimson font-sans">
            {!capacity.registrationOpen ? "REGISTRATIONS CLOSED" : "REGISTRATIONS FULL"}
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-gray-300 font-sans max-w-md mx-auto leading-relaxed">
            {!capacity.registrationOpen
              ? "The hackathon registration portal is currently closed by the organizers. No new squad entries are being accepted."
              : "All allocated team slots for QUANTEX MUGEN have been claimed. Registrations are at maximum capacity."}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs tracking-wider uppercase transition-colors"
            >
              RETURN TO HOME
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 rounded-xl liquid-glass-btn text-white font-bold text-xs tracking-wider uppercase transition-colors"
            >
              TEAM LEAD LOGIN
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-100px)] py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto flex items-center justify-center">
      {/* Main Glassmorphic Card Container */}
      <div className="w-full rounded-3xl bg-[#060814]/92 backdrop-blur-2xl border border-red-500/20 shadow-[0_0_60px_rgba(0,0,0,0.85)] p-6 sm:p-10 relative">
        {/* Subtle Crimson Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header Section */}
        <div className="text-center relative z-10 mb-8">
          {/* Top Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#20080d] border border-red-500/50 text-red-400 text-xs font-mono font-bold tracking-wider uppercase mb-3 shadow-[0_0_15px_rgba(220,38,38,0.25)]">
            <span>TEAM REGISTRATION (4 MEMBERS REQUIRED)</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl font-black tracking-wider text-white uppercase text-glow-crimson drop-shadow-md">
            REGISTER YOUR TEAM
          </h1>

          {/* Subtitle */}
          <p className="mt-2 text-xs sm:text-sm text-gray-400 font-sans max-w-xl mx-auto leading-relaxed">
            Complete participant SIS records for all 4 team members to enter the payment reservation window.
          </p>
        </div>

        {/* Utility / Autosave Bar */}
        <div className="flex items-center justify-between mb-6 text-xs font-mono relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/40 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Auto-Saved • Safe to refresh anytime</span>
          </div>

          <button
            type="button"
            onClick={handleClearForm}
            className="text-gray-400 hover:text-white underline transition-colors cursor-pointer"
          >
            Clear Form
          </button>
        </div>

        {/* Tab Stepper Bar */}
        <div className="mb-8 overflow-x-auto pb-1 scrollbar-none relative z-10">
          <div className="grid grid-cols-6 min-w-[580px] bg-[#030612]/90 p-1.5 rounded-2xl border border-white/10 gap-1">
            {tabLabels.map((tab) => {
              const isActive = step === tab.stepIdx;
              const isCompleted = step > tab.stepIdx;
              return (
                <button
                  key={tab.stepIdx}
                  type="button"
                  onClick={() => {
                    if (tab.stepIdx < step) {
                      setStep(tab.stepIdx);
                      setError(null);
                    }
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all text-center whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.6)]"
                      : isCompleted
                      ? "text-emerald-400 hover:text-emerald-300 hover:bg-white/5"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Step Content */}
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            {/* STEP 0: TEAM INFO */}
            {step === 0 && (
              <motion.div
                key="step-team-info"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {/* Team Name Input */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="block text-xs font-mono font-bold text-gray-200 uppercase tracking-wider">
                      GLOBALLY UNIQUE TEAM NAME (BLOCK LETTERS) <span className="text-red-500">*</span>
                    </label>
                    {nameStatus === "checking" && (
                      <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
                        <span className="w-3 h-3 border border-cyan-400 border-t-transparent rounded-full animate-spin" />
                        <span>Verifying uniqueness...</span>
                      </span>
                    )}
                    {nameStatus === "available" && (
                      <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>NAME AVAILABLE</span>
                      </span>
                    )}
                    {nameStatus === "taken" && (
                      <span className="text-[11px] font-mono text-rose-400 flex items-center gap-1 font-bold animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>ALREADY TAKEN</span>
                      </span>
                    )}
                  </div>

                  <div className="relative flex items-center">
                    <div className="absolute left-4 pointer-events-none text-gray-400">
                      <Users className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="E.G. CYBERWEB INNOVATORS"
                      value={teamName}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setTeamName(val);
                        if (error) setError(null);
                      }}
                      className={`w-full pl-12 pr-12 py-3.5 rounded-xl bg-[#030612] border ${
                        nameStatus === "taken" || error
                          ? "border-red-500/80 ring-2 ring-red-500/20"
                          : nameStatus === "available"
                          ? "border-emerald-500/70 ring-2 ring-emerald-500/20"
                          : "border-white/20"
                      } text-white font-mono text-sm sm:text-base font-bold uppercase tracking-wider placeholder:text-gray-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 focus:outline-none transition-all`}
                    />
                    {nameStatus === "available" && (
                      <div className="absolute right-4 pointer-events-none text-emerald-400">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    )}
                    {(nameStatus === "taken" || error) && (
                      <div className="absolute right-4 pointer-events-none text-red-500">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  {/* Real-time Status Message */}
                  {nameStatus === "taken" && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-xs font-mono text-rose-400 flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                      <span>{nameMessage || `Team name "${teamName}" is already taken. Please choose another unique name.`}</span>
                    </motion.p>
                  )}

                  {nameStatus === "available" && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-xs font-mono text-emerald-400 flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                      <span>{nameMessage}</span>
                    </motion.p>
                  )}
                </div>

                {/* Error Banner */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-xl bg-[#1c080b] border border-red-600/60 text-red-200 text-xs sm:text-sm flex items-center gap-2.5 font-medium shadow-[0_0_15px_rgba(220,38,38,0.2)]"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* Registered University Account Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#080d1e]/80 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Registered University Account:</h4>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">
                      This fixed email must belong to at least one member in the team.
                    </p>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-[#26080d] border border-red-500/50 text-red-400 font-mono text-xs sm:text-sm font-bold tracking-wider shrink-0 text-center">
                    {userEmail}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEPS 1 TO 4: MEMBERS */}
            {step >= 1 && step <= 4 && (
              <motion.div
                key={`step-member-${step}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {/* Step Header Row */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <User className="w-5 h-5 text-red-500 shrink-0" />
                    <h3 className="text-base sm:text-lg font-black text-red-500 tracking-wider uppercase">
                      MEMBER {step} {step === 1 ? "(TEAM LEADER)" : ""}
                    </h3>
                    {step === 1 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-mono font-bold uppercase tracking-wider">
                        TEAM LEADER
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-gray-400">
                    Member Fee: <strong className="text-white">₹350</strong>
                  </span>
                </div>

                {/* Error Banner */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-xl bg-[#1c080b] border border-red-600/60 text-red-200 text-xs sm:text-sm flex items-center gap-2.5 font-medium shadow-[0_0_15px_rgba(220,38,38,0.2)]"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name as per SIS */}
                  <div>
                    <label className="block text-xs font-mono font-bold text-gray-200 uppercase tracking-wider mb-2">
                      NAME AS PER SIS <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="E.G. SAI KRISHNA V"
                      value={members[step - 1].name}
                      onChange={(e) => updateMember(step - 1, "name", e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 rounded-xl bg-[#030612] border border-white/20 text-white font-mono text-sm font-semibold uppercase placeholder:text-gray-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 focus:outline-none transition-all"
                    />
                    <span className="text-[10px] text-gray-500 font-sans mt-1 block">
                      Must be in BLOCK LETTERS as per university SIS record.
                    </span>
                  </div>

                  {/* Registration Number */}
                  <div>
                    <label className="block text-xs font-mono font-bold text-gray-200 uppercase tracking-wider mb-2">
                      REGISTRATION NUMBER <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="E.G. 99240040799"
                      value={members[step - 1].registrationNumber}
                      onChange={(e) =>
                        updateMember(step - 1, "registrationNumber", e.target.value.toUpperCase())
                      }
                      className="w-full px-4 py-3 rounded-xl bg-[#030612] border border-white/20 text-white font-mono text-sm font-bold uppercase placeholder:text-gray-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Auto Generated KLU Email */}
                  <div>
                    <label className="block text-xs font-mono font-bold text-gray-200 uppercase tracking-wider mb-2">
                      AUTO GENERATED KLU EMAIL (READ-ONLY)
                    </label>
                    <input
                      type="text"
                      readOnly
                      placeholder="registrationnumber@klu.ac.in"
                      value={
                        members[step - 1].registrationNumber
                          ? `${members[step - 1].registrationNumber.toLowerCase()}@klu.ac.in`
                          : ""
                      }
                      className="w-full px-4 py-3 rounded-xl bg-[#030612]/50 border border-white/10 text-sm font-mono text-gray-300 placeholder:text-gray-600 cursor-not-allowed"
                    />
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-xs font-mono font-bold text-gray-200 uppercase tracking-wider mb-2">
                      MOBILE NUMBER <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={members[step - 1].mobile}
                      onChange={(e) => updateMember(step - 1, "mobile", e.target.value.replace(/[^0-9]/g, ""))}
                      className="w-full px-4 py-3 rounded-xl bg-[#030612] border border-white/20 text-white font-mono text-sm font-bold placeholder:text-gray-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-xs font-mono font-bold text-gray-200 uppercase tracking-wider mb-2">
                      DEPARTMENT <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={members[step - 1].department}
                      onChange={(e) => updateMember(step - 1, "department", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#030612] border border-white/20 text-white text-sm font-medium focus:border-red-500 focus:ring-2 focus:ring-red-500/30 focus:outline-none"
                    >
                      <option value="-- Select Department --" disabled className="bg-gray-900 text-gray-500">
                        -- Select Department --
                      </option>
                      {["CSE", "ECE", "IT", "EEE", "MECH", "CIVIL", "BIO", "Others"].map((dept) => (
                        <option key={dept} value={dept} className="bg-gray-900 text-white">
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block text-xs font-mono font-bold text-gray-200 uppercase tracking-wider mb-2">
                      YEAR <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={members[step - 1].year}
                      onChange={(e) => updateMember(step - 1, "year", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#030612] border border-white/20 text-white text-sm font-medium focus:border-red-500 focus:ring-2 focus:ring-red-500/30 focus:outline-none"
                    >
                      <option value="-- Select Year --" disabled className="bg-gray-900 text-gray-500">
                        -- Select Year --
                      </option>
                      {["I", "II", "III", "IV"].map((y) => (
                        <option key={y} value={y} className="bg-gray-900 text-white">
                          Year {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Section */}
                  <div>
                    <label className="block text-xs font-mono font-bold text-gray-200 uppercase tracking-wider mb-2">
                      SECTION <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="E.G. 24S10"
                      value={members[step - 1].section}
                      onChange={(e) => updateMember(step - 1, "section", e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 rounded-xl bg-[#030612] border border-white/20 text-white font-mono text-sm font-medium uppercase placeholder:text-gray-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-mono font-bold text-gray-200 uppercase tracking-wider mb-2">
                      GENDER <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={members[step - 1].gender}
                      onChange={(e) => {
                        const newGender = e.target.value;
                        const defaultHostel = newGender === "Female" ? "LH-1" : "MH-1";
                        updateMemberMultiple(step - 1, {
                          gender: newGender,
                          hostel: defaultHostel,
                        });
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-[#030612] border border-red-500/50 text-white text-sm font-medium focus:border-red-500 focus:ring-2 focus:ring-red-500/40 focus:outline-none shadow-[0_0_10px_rgba(220,38,38,0.2)]"
                    >
                      <option value="-- Select Gender --" disabled className="bg-gray-900 text-gray-500">
                        -- Select Gender --
                      </option>
                      <option value="Male" className="bg-gray-900 text-white">
                        Male
                      </option>
                      <option value="Female" className="bg-gray-900 text-white">
                        Female
                      </option>
                      <option value="Other" className="bg-gray-900 text-white">
                        Other
                      </option>
                    </select>
                  </div>
                </div>

                {/* Accommodation Type Toggle Buttons */}
                <div className="pt-2">
                  <label className="block text-xs font-mono font-bold text-gray-200 uppercase tracking-wider mb-2.5">
                    ACCOMMODATION TYPE <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => updateMember(step - 1, "accommodation", "Day Scholar")}
                      className={`py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-mono font-black tracking-wider uppercase transition-all cursor-pointer ${
                        members[step - 1].accommodation === "Day Scholar"
                          ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.6)]"
                          : "bg-[#030612] text-gray-400 border border-white/10 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      DAY SCHOLAR
                    </button>

                    <button
                      type="button"
                      onClick={() => updateMember(step - 1, "accommodation", "Hosteller")}
                      className={`py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-mono font-black tracking-wider uppercase transition-all cursor-pointer ${
                        members[step - 1].accommodation === "Hosteller"
                          ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.6)]"
                          : "bg-[#030612] text-gray-400 border border-white/10 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      HOSTELLER
                    </button>
                  </div>
                </div>

                {/* Hosteller Fields if Hosteller */}
                {members[step - 1].accommodation === "Hosteller" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1"
                  >
                    <div>
                      <label className="block text-xs font-mono font-bold text-gray-200 uppercase tracking-wider mb-2">
                        HOSTEL NAME <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={members[step - 1].hostel}
                        onChange={(e) => updateMember(step - 1, "hostel", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[#030612] border border-white/20 text-white text-sm font-medium focus:border-red-500 focus:ring-2 focus:ring-red-500/30 focus:outline-none"
                      >
                        {members[step - 1].gender === "Female"
                          ? ["LH-1", "LH-2", "LH-3", "LH-4"].map((h) => (
                              <option key={h} value={h} className="bg-gray-900 text-white">
                                {h}
                              </option>
                            ))
                          : ["MH-1", "MH-2", "MH-3", "MH-4", "MH-5", "MH-6", "MH-7"].map((h) => (
                              <option key={h} value={h} className="bg-gray-900 text-white">
                                {h}
                              </option>
                            ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold text-gray-200 uppercase tracking-wider mb-2">
                        ROOM NUMBER <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 302, 412"
                        value={members[step - 1].roomNumber}
                        onChange={(e) => updateMember(step - 1, "roomNumber", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[#030612] border border-white/20 text-white text-sm font-mono font-bold placeholder:text-gray-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 focus:outline-none transition-all"
                      />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* STEP 5: REVIEW */}
            {step === 5 && (
              <motion.div
                key="step-review"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-red-600/20 border border-red-500/40 text-red-400">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-white tracking-wider uppercase">
                        REVIEW TEAM DETAILS
                      </h3>
                      <p className="text-xs text-gray-400 font-mono">
                        Verify all participant information before proceeding to slot reservation and payment.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Team Name Display */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#030612] border border-red-500/40 flex items-center justify-between shadow-lg">
                  <div>
                    <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider">TEAM NAME</span>
                    <p className="text-lg sm:text-xl font-black text-white mt-0.5">{teamName}</p>
                  </div>
                  <button
                    onClick={() => setStep(0)}
                    className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-red-300 hover:text-white text-xs flex items-center gap-1.5 font-mono font-bold transition-all border border-white/10 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>

                {/* 4 Members Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {members.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[#030612] border border-white/15 relative shadow-lg"
                    >
                      <div className="flex items-center justify-between mb-2.5 border-b border-white/10 pb-2">
                        <span className="text-xs font-black text-red-400 font-mono tracking-wider">
                          MEMBER #{idx + 1} {idx === 0 ? "(LEAD)" : ""}
                        </span>
                        <button
                          onClick={() => setStep(idx + 1)}
                          className="text-xs text-gray-400 hover:text-white flex items-center gap-1 font-mono font-bold transition-all"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      </div>
                      <p className="font-bold text-sm text-white">{m.name}</p>
                      <p className="text-xs font-mono text-gray-300 mt-1">
                        {m.registrationNumber} • {m.department} (Year {m.year}, Sec {m.section})
                      </p>
                      <p className="text-xs font-mono text-gray-400 mt-1">
                        {m.mobile} • {m.accommodation}{" "}
                        {m.accommodation === "Hosteller" ? `(${m.hostel} - Rm ${m.roomNumber})` : ""}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Error Banner */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-xl bg-[#1c080b] border border-red-600/60 text-red-200 text-xs sm:text-sm flex items-center gap-2.5 font-medium shadow-[0_0_15px_rgba(220,38,38,0.2)]"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* Fee Summary */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-950/90 via-[#1c080b] to-[#080d1e] border border-red-500/50 flex items-center justify-between shadow-2xl">
                  <div>
                    <span className="text-xs font-mono font-bold text-red-300 uppercase tracking-wider">
                      REGISTRATION TOTAL (4 MEMBERS)
                    </span>
                    <p className="text-2xl sm:text-3xl font-black text-white mt-0.5">₹1,400</p>
                    <span className="text-xs text-gray-400 font-mono font-medium">
                      ₹350 per member • 5-Minute Reservation Slot
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-red-600/30 border border-red-500/60 shadow-[0_0_15px_rgba(220,38,38,0.4)]">
                    <CreditCard className="w-6 h-6 sm:w-7 sm:h-7 text-red-300" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Navigation Controls */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
            {step > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-[#0e162b] hover:bg-[#15203d] text-white text-xs sm:text-sm font-mono font-bold tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer border border-white/15 transition-all shadow-md"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>PREVIOUS</span>
              </button>
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="w-full flex-1 py-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white font-mono font-black tracking-wider uppercase text-xs sm:text-sm flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_0_25px_rgba(220,38,38,0.6)] transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>{getNextButtonText()}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleProceedToPayment}
                className="w-full flex-1 py-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white font-mono font-black tracking-wider uppercase text-xs sm:text-sm flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_0_30px_rgba(220,38,38,0.7)] disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>PROCEED TO PAYMENT (₹1,400)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
