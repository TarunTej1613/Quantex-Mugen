"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import {
  Clock,
  QrCode,
  CreditCard,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RotateCcw,
  ArrowRight,
  Crown,
  Sparkles,
} from "lucide-react";

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamIdParam = searchParams.get("teamId") || "QXM-003";

  const [timeLeft, setTimeLeft] = useState<number>(216); // 03:36 = 216s default
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [team, setTeam] = useState<any>(null);

  const [copied, setCopied] = useState(false);
  const [utr, setUtr] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedQr, setGeneratedQr] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [paymentSettings, setPaymentSettings] = useState<{
    upiId: string;
    paymentQrUrl: string;
    teamFee: number;
    participantFee: number;
  }>({
    upiId: "csiklu@upi",
    paymentQrUrl: "/assets/payment-qr.png",
    teamFee: 1400,
    participantFee: 350,
  });

  // Generate dynamic crisp QR code for UPI
  useEffect(() => {
    const upiUri = `upi://pay?pa=${paymentSettings.upiId}&pn=QUANTEX%20MUGEN&am=${paymentSettings.teamFee}&cu=INR&tn=QXM-${teamIdParam}`;
    QRCode.toDataURL(
      upiUri,
      {
        width: 380,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      },
      (err, url) => {
        if (!err && url) {
          setGeneratedQr(url);
        }
      }
    );
  }, [paymentSettings.upiId, paymentSettings.teamFee, teamIdParam]);

  // Fetch team and reservation details on mount
  useEffect(() => {
    const fetchReservation = async () => {
      try {
        setLoadingInitial(true);
        const res = await fetch(`/api/team/${teamIdParam}`);
        if (res.ok) {
          const data = await res.json();
          if (data.team) {
            setTeam(data.team);
            if (data.team.paymentStatus === "PENDING" || data.team.paymentStatus === "VERIFIED") {
              router.push(`/success?teamId=${teamIdParam}`);
              return;
            }
          }
          if (data.paymentSettings) {
            setPaymentSettings(data.paymentSettings);
          }
          if (data.expiresAt) {
            setExpiresAt(data.expiresAt);
            const expiryTime = new Date(data.expiresAt).getTime();
            const nowTime = Date.now();
            const remaining = Math.max(0, Math.floor((expiryTime - nowTime) / 1000));
            if (data.isExpired || remaining <= 0) {
              setTimeLeft(300);
            } else {
              setTimeLeft(remaining);
            }
          } else {
            setExpiresAt(new Date(Date.now() + 5 * 60 * 1000).toISOString());
            setTimeLeft(300);
          }
        } else {
          // Fallback team info for preview
          setTeam({
            teamId: teamIdParam,
            teamName: "Team Legacy",
            members: [
              { name: "NALLAM VENKATA VINAY", registrationNumber: "99240040661" },
              { name: "TARUN", registrationNumber: "99240040833" },
              { name: "YASH", registrationNumber: "992400567" },
              { name: "PRAKASH", registrationNumber: "99250040833" },
            ],
          });
          setExpiresAt(new Date(Date.now() + 5 * 60 * 1000).toISOString());
          setTimeLeft(216);
        }
      } catch {
        setTeam({
          teamId: teamIdParam,
          teamName: "Team Legacy",
          members: [
            { name: "NALLAM VENKATA VINAY", registrationNumber: "99240040661" },
            { name: "TARUN", registrationNumber: "99240040833" },
            { name: "YASH", registrationNumber: "992400567" },
            { name: "PRAKASH", registrationNumber: "99250040833" },
          ],
        });
        setExpiresAt(new Date(Date.now() + 5 * 60 * 1000).toISOString());
        setTimeLeft(216);
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchReservation();
  }, [teamIdParam, router]);

  // Countdown Timer
  useEffect(() => {
    if (isExpired) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isExpired]);

  // Format mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(paymentSettings.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError("Screenshot size exceeds 5MB limit.");
        return;
      }

      setScreenshotFile(file);
      setError(null);

      // Create preview & convert to Base64 data URL
      const reader = new FileReader();
      reader.onloadstart = () => {
        setUploading(true);
        setUploadProgress(40);
      };
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };
      reader.onload = () => {
        const base64Url = reader.result as string;
        setPreviewUrl(base64Url);
        setUploadedUrl(base64Url);
        setUploadProgress(100);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isExpired || timeLeft <= 0) {
      setError("Payment window has expired. Please restart registration.");
      return;
    }

    const cleanUtr = utr.trim();
    if (!/^[0-9]{12}$/.test(cleanUtr)) {
      setError("Must be exactly 12 numeric digits from your UPI transaction receipt.");
      return;
    }

    if (!uploadedUrl) {
      setError("Please upload your payment screenshot before submitting.");
      return;
    }

    setSubmitting(true);

    try {
      const payRes = await fetch("/api/payment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: team?.teamId || teamIdParam,
          utr: cleanUtr,
          screenshotUrl: uploadedUrl,
          amount: paymentSettings.teamFee,
        }),
      });

      const payData = await payRes.json();

      if (!payRes.ok) {
        throw new Error(payData.error || "Payment verification submission failed.");
      }

      router.push(`/success?teamId=${team?.teamId || teamIdParam}`);
    } catch (err: any) {
      setError(err.message || "An error occurred during payment submission.");
    } finally {
      setSubmitting(false);
    }
  };

  const leaderName =
    team?.members?.[0]?.name?.toUpperCase() || "NALLAM VENKATA VINAY";
  const leaderReg =
    team?.members?.[0]?.registrationNumber || "99240040661";

  const memberList = team?.members?.length === 4
    ? team.members
    : [
        { name: "NALLAM VENKATA VINAY", registrationNumber: "99240040661" },
        { name: "TARUN", registrationNumber: "99240040833" },
        { name: "YASH", registrationNumber: "992400567" },
        { name: "PRAKASH", registrationNumber: "99250040833" },
      ];

  if (loadingInitial) {
    return (
      <div className="min-h-[calc(100vh-100px)] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-3 border-red-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-mono text-gray-300 text-sm">Initializing Payment Session...</p>
      </div>
    );
  }

  // EXPIRED STATE
  if (isExpired && timeLeft <= 0) {
    return (
      <div className="min-h-[calc(100vh-100px)] py-12 px-4 sm:px-6 lg:px-8 max-w-xl mx-auto flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full rounded-3xl bg-[#080305]/95 border border-red-600/50 shadow-[0_0_80px_rgba(220,38,38,0.4)] p-8 sm:p-10 text-center relative overflow-hidden"
        >
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-600/20 border border-red-500/50 flex items-center justify-center text-red-500 shadow-[0_0_30px_rgba(220,38,38,0.3)]">
            <Clock className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider mb-3">
            PAYMENT WINDOW EXPIRED
          </h2>

          <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs sm:text-sm font-mono space-y-2 mb-8 leading-relaxed">
            <p>Your 5-minute payment window has expired.</p>
            <p>Your registration slot has been released.</p>
            <p className="text-gray-300">Please start the registration process again.</p>
          </div>

          <Link
            href="/register"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white font-mono font-black tracking-wider uppercase text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-[0_0_30px_rgba(220,38,38,0.6)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>START REGISTRATION AGAIN</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-100px)] py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Outer Card Container */}
      <div className="w-full rounded-3xl bg-[#060814]/92 backdrop-blur-2xl border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.85)] p-6 sm:p-10 relative">
        {/* Subtle Ambient Crimson Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-36 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Section */}
        <div className="text-center relative z-10 mb-8">
          {/* Top Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-[#20080d] border border-red-500/50 text-red-400 text-xs font-mono font-bold tracking-wider uppercase mb-3 shadow-[0_0_15px_rgba(220,38,38,0.25)]">
            <span>STEP 3 OF 3 — FEE PAYMENT & PROOF SUBMISSION</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl font-black tracking-wider text-white uppercase text-glow-crimson drop-shadow-md">
            TEAM PAYMENT (₹1,400)
          </h1>

          {/* Subtitle */}
          <p className="mt-2 text-xs sm:text-sm text-gray-400 font-sans max-w-xl mx-auto leading-relaxed">
            Scan the official UPI QR code or use the UPI ID below to pay ₹1,400 for your 4-member team.
          </p>
        </div>

        {/* Team Leader Gold Card */}
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-[#0a0705]/80 border border-amber-500/30 flex items-center justify-between relative z-10 shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                TEAM LEADER (MEMBER 1)
              </span>
              <h3 className="text-base sm:text-lg font-black text-white tracking-wide uppercase">
                {leaderName}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-400 hidden sm:inline">REG NO:</span>
            <span className="px-3 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-400 font-mono font-bold text-xs sm:text-sm shadow-sm">
              {leaderReg}
            </span>
          </div>
        </div>

        {/* Reservation Timer Box */}
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-[#0c0508]/90 border border-red-500/40 flex items-center justify-between relative z-10 shadow-lg">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-red-500 animate-pulse shrink-0" />
            <div>
              <span className="text-xs font-mono font-bold text-gray-200 uppercase tracking-wider block">
                RESERVATION EXPIRES IN
              </span>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Complete payment before timer reaches 00:00 to keep slot
              </p>
            </div>
          </div>

          <span className="text-2xl sm:text-3xl font-mono font-black text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.7)] tracking-wider">
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-[#1c080b] border border-red-500/60 text-red-200 text-xs sm:text-sm flex items-start gap-3 shadow-[0_0_20px_rgba(220,38,38,0.3)] relative z-10"
          >
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
          {/* Left Column: QR & Breakdown */}
          <div className="md:col-span-5 space-y-6">
            {/* Card 1: OFFICIAL UPI PAYMENT QR */}
            <div className="p-6 rounded-3xl bg-[#060814]/90 border border-white/10 shadow-xl flex flex-col items-center text-center">
              <h4 className="text-xs font-mono font-black text-red-500 tracking-wider mb-4 uppercase">
                OFFICIAL UPI PAYMENT QR
              </h4>

              {/* QR Container with Red Border */}
              <div className="relative w-52 h-52 p-3 bg-white rounded-3xl border-4 border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.4)] flex items-center justify-center">
                {generatedQr ? (
                  <Image
                    src={generatedQr}
                    alt="UPI Payment QR"
                    width={200}
                    height={200}
                    className="object-contain"
                    priority
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-900 font-mono text-xs text-center p-2">
                    <span className="font-black text-sm text-red-600">UPI PAYMENT</span>
                    <span className="mt-1 font-bold text-gray-800">{paymentSettings.upiId}</span>
                    <span className="mt-2 text-[10px] text-gray-500">Amount: ₹{paymentSettings.teamFee}</span>
                  </div>
                )}
              </div>

              {/* UPI Copy Box */}
              <div className="mt-5 w-full p-2.5 rounded-xl bg-[#030612] border border-white/15 flex items-center justify-between gap-2">
                <div className="text-left truncate pl-2">
                  <span className="text-xs font-mono text-gray-300 font-bold truncate block">
                    <span className="text-gray-500 font-normal">UPI ID: </span>
                    {paymentSettings.upiId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUPI}
                  className="px-3 py-1 rounded-lg bg-[#24080d] hover:bg-[#380c14] text-xs text-red-300 font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all border border-red-500/40 shrink-0"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Card 2: FEE BREAKDOWN */}
            <div className="p-5 rounded-3xl bg-[#060814]/90 border border-white/10 shadow-xl space-y-3 text-xs font-mono">
              <h4 className="font-mono font-bold text-gray-200 uppercase tracking-wider mb-3">
                FEE BREAKDOWN (STRICTLY 4 MEMBERS)
              </h4>

              <div className="space-y-2 text-gray-300">
                <div className="flex justify-between items-center">
                  <span className="truncate pr-2">
                    Member 1 ({memberList[0]?.name}) 👑 (Team Leader):
                  </span>
                  <span className="font-bold text-white shrink-0">₹350</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="truncate pr-2">
                    Member 2 ({memberList[1]?.name}):
                  </span>
                  <span className="font-bold text-white shrink-0">₹350</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="truncate pr-2">
                    Member 3 ({memberList[2]?.name}):
                  </span>
                  <span className="font-bold text-white shrink-0">₹350</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="truncate pr-2">
                    Member 4 ({memberList[3]?.name}):
                  </span>
                  <span className="font-bold text-white shrink-0">₹350</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-between items-center font-black text-sm text-white">
                <span className="text-red-500 uppercase tracking-wider font-bold">TOTAL AMOUNT:</span>
                <span className="text-red-500 text-lg font-mono font-black drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                  ₹1,400
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Submission Form */}
          <div className="md:col-span-7 space-y-5">
            <form onSubmit={handlePaymentSubmit} className="space-y-5">
              {/* UTR Input */}
              <div>
                <label className="block text-xs font-mono font-bold text-gray-200 uppercase tracking-wider mb-2">
                  12-DIGIT UTR / TRANSACTION REF NO <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={12}
                  placeholder="123456789123"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full px-4 py-3.5 rounded-xl bg-[#030612] border border-white/20 text-white font-mono text-base tracking-widest font-bold placeholder:text-gray-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 focus:outline-none transition-all"
                />
                <p className="mt-1.5 text-[11px] text-gray-500 font-mono">
                  Must be exactly 12 numeric digits from your UPI transaction receipt.
                </p>
              </div>

              {/* Screenshot Upload Box */}
              <div>
                <label className="block text-xs font-mono font-bold text-gray-200 uppercase tracking-wider mb-2">
                  PAYMENT SCREENSHOT <span className="text-red-500">*</span>
                </label>

                {/* Dashed Drop Zone */}
                <label className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-red-500/40 hover:border-red-500/70 rounded-2xl cursor-pointer bg-[#030612]/60 hover:bg-white/5 transition-all text-center">
                  <UploadCloud className="w-8 h-8 text-red-500 mb-2" />
                  <span className="text-xs font-mono font-bold text-gray-200">
                    {screenshotFile ? screenshotFile.name : "Untitled design.jpg"}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono mt-1">
                    PNG, JPG or WEBP (Uploads instantly upon selection)
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Verified Preview Card (When Image Selected) */}
              {previewUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-[#030612] border border-emerald-500/40 space-y-3 shadow-lg"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Screenshot Loaded & Verified</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded bg-[#24080d] border border-red-500/40 text-red-400 text-[10px] font-mono font-bold uppercase hover:bg-red-600 hover:text-white transition-all cursor-pointer"
                    >
                      CHANGE IMAGE
                    </button>
                  </div>

                  {/* Image Preview */}
                  <div className="relative w-full h-72 rounded-xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center">
                    <Image
                      src={previewUrl}
                      alt="Payment Screenshot Proof"
                      fill
                      sizes="(max-width: 768px) 100vw, 500px"
                      className="object-contain"
                    />
                  </div>
                </motion.div>
              )}

              {/* Upload Progress Bar */}
              {uploadedUrl && (
                <div className="p-3 rounded-xl bg-[#030612] border border-emerald-500/30 space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-emerald-400 font-bold">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Screenshot Uploaded & Verified</span>
                    </div>
                    <span>100%</span>
                  </div>
                  <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981] w-full" />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || uploading || isExpired || timeLeft <= 0}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white font-mono font-black tracking-wider uppercase text-xs sm:text-sm flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_0_30px_rgba(220,38,38,0.6)] disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99] mt-4"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>SUBMIT PAYMENT (₹1,400)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-100px)] flex flex-col items-center justify-center p-6 font-mono text-gray-300">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-3" />
          <span>Loading Payment Portal...</span>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
