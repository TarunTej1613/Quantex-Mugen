"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import { motion } from "framer-motion";
import {
  Download,
  Calendar,
  MapPin,
  ArrowLeft,
  CheckCircle2,
  Lock,
} from "lucide-react";
import Link from "next/link";

export default function EventPassPage() {
  const params = useParams();
  const teamId = params?.teamId as string;

  const [team, setTeam] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (teamId) {
      // Fetch team details
      fetch(`/api/team/${teamId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.team) setTeam(data.team);
        });

      // Generate verification QR code
      const verifyUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/verify/${teamId}`
          : `https://quantexmugen.klu.ac.in/verify/${teamId}`;

      QRCode.toDataURL(verifyUrl, {
        width: 320,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      }).then(setQrDataUrl);
    }
  }, [teamId]);

  const generateHighResPassCanvas = async (
    teamData: any,
    currentTeamId: string,
    qrCodeUrl: string
  ): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement("canvas");
    const width = 1600;
    const height = 1000;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create canvas context");

    // Helper function to draw rounded rectangles
    const roundRect = (
      x: number,
      y: number,
      w: number,
      h: number,
      r: number,
      fill = false,
      stroke = false
    ) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      if (fill) ctx.fill();
      if (stroke) ctx.stroke();
    };

    // Helper to load image
    const loadImage = (src: string): Promise<HTMLImageElement | null> => {
      return new Promise((resolve) => {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      });
    };

    // 1. Deep Cyber Background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, "#050814");
    bgGrad.addColorStop(0.5, "#0b1024");
    bgGrad.addColorStop(1, "#050814");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Subtle Tech Grid Pattern
    ctx.strokeStyle = "rgba(225, 29, 72, 0.05)";
    ctx.lineWidth = 1;
    const gridSize = 35;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 3. Card Outer Border with Neon Rose Glow
    const margin = 28;
    const cardW = width - margin * 2;
    const cardH = height - margin * 2;

    ctx.save();
    ctx.shadowColor = "rgba(225, 29, 72, 0.4)";
    ctx.shadowBlur = 25;
    ctx.strokeStyle = "rgba(225, 29, 72, 0.75)";
    ctx.lineWidth = 2.5;
    roundRect(margin, margin, cardW, cardH, 20, false, true);
    ctx.restore();

    // 4. Corner Cyber Brackets
    const cornerLen = 28;
    ctx.strokeStyle = "#fb7185";
    ctx.lineWidth = 3.5;
    // Top-Left
    ctx.beginPath();
    ctx.moveTo(margin + 4, margin + cornerLen);
    ctx.lineTo(margin + 4, margin + 4);
    ctx.lineTo(margin + cornerLen, margin + 4);
    ctx.stroke();
    // Top-Right
    ctx.beginPath();
    ctx.moveTo(margin + cardW - cornerLen, margin + 4);
    ctx.lineTo(margin + cardW - 4, margin + 4);
    ctx.lineTo(margin + cardW - 4, margin + cornerLen);
    ctx.stroke();
    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(margin + 4, margin + cardH - cornerLen);
    ctx.lineTo(margin + 4, margin + cardH - 4);
    ctx.lineTo(margin + cornerLen, margin + cardH - 4);
    ctx.stroke();
    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(margin + cardW - cornerLen, margin + cardH - 4);
    ctx.lineTo(margin + cardW - 4, margin + cardH - 4);
    ctx.lineTo(margin + cardW - 4, margin + cardH - cornerLen);
    ctx.stroke();

    // Load Logos
    const [owaspImg, cyberImg, quantexImg, qrImg] = await Promise.all([
      loadImage("/assets/owasp-logo.png"),
      loadImage("/assets/cybernerds-logo.png"),
      loadImage("/assets/quantex-black-redglow.png"),
      loadImage(qrCodeUrl),
    ]);

    // 5. Header Logos
    const topY = margin + 20;
    const logoBoxW = 200;
    const logoBoxH = 60;

    // OWASP Box
    ctx.fillStyle = "#ffffff";
    roundRect(margin + 25, topY, logoBoxW, logoBoxH, 10, true, false);
    if (owaspImg) {
      const scale = Math.min((logoBoxW - 20) / owaspImg.width, (logoBoxH - 12) / owaspImg.height);
      const w = owaspImg.width * scale;
      const h = owaspImg.height * scale;
      const x = margin + 25 + (logoBoxW - w) / 2;
      const y = topY + (logoBoxH - h) / 2;
      ctx.drawImage(owaspImg, x, y, w, h);
    }

    // CyberNerds Box
    ctx.fillStyle = "#030712";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1.5;
    roundRect(margin + cardW - 25 - logoBoxW, topY, logoBoxW, logoBoxH, 10, true, true);
    if (cyberImg) {
      const scale = Math.min((logoBoxW - 20) / cyberImg.width, (logoBoxH - 12) / cyberImg.height);
      const w = cyberImg.width * scale;
      const h = cyberImg.height * scale;
      const x = margin + cardW - 25 - logoBoxW + (logoBoxW - w) / 2;
      const y = topY + (logoBoxH - h) / 2;
      ctx.drawImage(cyberImg, x, y, w, h);
    }

    // 6. Center Logo Banner
    const bannerY = topY + 45;
    if (quantexImg) {
      const qW = 420;
      const qH = (quantexImg.height * qW) / quantexImg.width;
      const qX = (width - qW) / 2;
      ctx.save();
      ctx.shadowColor = "rgba(225, 29, 72, 0.6)";
      ctx.shadowBlur = 20;
      ctx.drawImage(quantexImg, qX, bannerY, qW, qH);
      ctx.restore();
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 38px monospace";
      ctx.textAlign = "center";
      ctx.fillText("QUANTEX MUGEN", width / 2, bannerY + 45);
    }

    // Subtitle Badge
    const badgeY = bannerY + 115;
    const badgeW = 340;
    const badgeH = 34;
    ctx.fillStyle = "rgba(225, 29, 72, 0.15)";
    ctx.strokeStyle = "rgba(225, 29, 72, 0.6)";
    ctx.lineWidth = 1.5;
    roundRect((width - badgeW) / 2, badgeY, badgeW, badgeH, 17, true, true);
    ctx.fillStyle = "#fda4af";
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "center";
    ctx.fillText("OFFICIAL HACKATHON ENTRY PASS", width / 2, badgeY + 22);

    // 7. Main Details Card
    const detailsY = badgeY + 55;
    const detailsW = cardW - 50;
    const detailsH = 505;
    const detailsX = margin + 25;

    // Dark sleek container
    ctx.fillStyle = "rgba(6, 10, 24, 0.92)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1.5;
    roundRect(detailsX, detailsY, detailsW, detailsH, 18, true, true);

    // Divider between Info (Left) and QR (Right)
    const qrColW = 390;
    const leftColW = detailsW - qrColW;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.beginPath();
    ctx.moveTo(detailsX + leftColW, detailsY + 20);
    ctx.lineTo(detailsX + leftColW, detailsY + detailsH - 20);
    ctx.stroke();

    // LEFT COLUMN DETAILS
    const leftPadX = detailsX + 35;
    let curY = detailsY + 45;

    // Row 1: Team ID & Team Name
    ctx.textAlign = "left";
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 13px monospace";
    ctx.fillText("OFFICIAL TEAM ID", leftPadX, curY);

    ctx.textAlign = "right";
    ctx.fillText("TEAM NAME", detailsX + leftColW - 35, curY);

    curY += 36;
    // Team ID Value
    ctx.textAlign = "left";
    ctx.font = "bold 32px monospace";
    ctx.fillStyle = "#fb7185";
    ctx.save();
    ctx.shadowColor = "rgba(225, 29, 72, 0.5)";
    ctx.shadowBlur = 10;
    ctx.fillText(teamData?.teamId || currentTeamId, leftPadX, curY);
    ctx.restore();

    // Team Name Value
    ctx.textAlign = "right";
    ctx.font = "bold 26px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(teamData?.teamName || "CyberSquad", detailsX + leftColW - 35, curY);

    // Horizontal separator
    curY += 25;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.beginPath();
    ctx.moveTo(leftPadX, curY);
    ctx.lineTo(detailsX + leftColW - 35, curY);
    ctx.stroke();

    // Row 2: Event Date & Venue
    curY += 34;
    ctx.textAlign = "left";
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 15px monospace";
    ctx.fillText("📅  30–31 OCTOBER 2026", leftPadX, curY);
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("📍  KS AUDITORIUM, KARE CAMPUS", leftPadX + 350, curY);

    // Horizontal separator
    curY += 28;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.beginPath();
    ctx.moveTo(leftPadX, curY);
    ctx.lineTo(detailsX + leftColW - 35, curY);
    ctx.stroke();

    // Row 3: Members Section Header
    curY += 30;
    ctx.textAlign = "left";
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 13px monospace";
    ctx.fillText("CONFIRMED PARTICIPANTS (4/4)", leftPadX, curY);

    // Members Grid (2x2)
    const members = teamData?.members || [
      { name: "Team Leader", registrationNumber: "992XXXX001" },
      { name: "Member 2", registrationNumber: "992XXXX002" },
      { name: "Member 3", registrationNumber: "992XXXX003" },
      { name: "Member 4", registrationNumber: "992XXXX004" },
    ];

    const col1X = leftPadX;
    const col2X = leftPadX + 415;
    const memberRow1Y = curY + 35;
    const memberRow2Y = curY + 115;

    members.forEach((m: any, idx: number) => {
      const isCol1 = idx % 2 === 0;
      const isRow1 = idx < 2;
      const mX = isCol1 ? col1X : col2X;
      const mY = isRow1 ? memberRow1Y : memberRow2Y;

      // Member Card box
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      roundRect(mX, mY - 20, 390, 64, 10, true, true);

      // Number + Name
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px sans-serif";
      const displayName = `${idx + 1}. ${m.name || "Member"}`;
      const truncatedName =
        displayName.length > 28 ? displayName.substring(0, 26) + "..." : displayName;
      ctx.fillText(truncatedName, mX + 16, mY + 7);

      // Registration Number
      ctx.fillStyle = "#fb7185";
      ctx.font = "bold 13px monospace";
      ctx.fillText(m.registrationNumber || "N/A", mX + 16, mY + 30);
    });

    // RIGHT COLUMN: QR CODE & INSTRUCTIONS
    const qrCenterX = detailsX + leftColW + qrColW / 2;
    const qrBoxSize = 270;
    const qrBoxX = qrCenterX - qrBoxSize / 2;
    const qrBoxY = detailsY + 65;

    // QR White Container
    ctx.fillStyle = "#ffffff";
    ctx.save();
    ctx.shadowColor = "rgba(255, 255, 255, 0.25)";
    ctx.shadowBlur = 15;
    roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 16, true, false);
    ctx.restore();

    if (qrImg) {
      ctx.drawImage(qrImg, qrBoxX + 15, qrBoxY + 15, qrBoxSize - 30, qrBoxSize - 30);
    }

    // QR Badge label
    const qrLabelY = qrBoxY + qrBoxSize + 40;
    ctx.textAlign = "center";
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 13px monospace";
    ctx.fillText("SCAN TO VERIFY PASS", qrCenterX, qrLabelY);

    ctx.fillStyle = "#64748b";
    ctx.font = "11px monospace";
    ctx.fillText("OFFICIAL CRYPTOGRAPHIC ENTRY", qrCenterX, qrLabelY + 22);

    // 8. Security Footer
    const footerY = margin + cardH - 24;
    ctx.strokeStyle = "rgba(225, 29, 72, 0.3)";
    ctx.beginPath();
    ctx.moveTo(margin + 35, footerY - 18);
    ctx.lineTo(margin + cardW - 35, footerY - 18);
    ctx.stroke();

    ctx.fillStyle = "#64748b";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "left";
    ctx.fillText("SECURE DIGITAL ENTRY CREDENTIAL  •  KARE STUDENT CHAPTERS", margin + 35, footerY);

    ctx.textAlign = "right";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("STATUS: CONFIRMED  •  ALL ACCESS PASS", margin + cardW - 35, footerY);

    return canvas;
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const canvas = await generateHighResPassCanvas(team, teamId, qrDataUrl);
      const imgData = canvas.toDataURL("image/png");

      // Exact 16:10 pass dimensions (240mm x 150mm) - No white borders
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [240, 150],
      });

      pdf.addImage(imgData, "PNG", 0, 0, 240, 150);
      pdf.save(`QUANTEX_MUGEN_PASS_${teamId}.pdf`);
    } catch (err) {
      console.error("PDF download error:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-100px)] py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto flex flex-col items-center">
      {/* Navigation Top */}
      <div className="w-full flex items-center justify-between mb-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-rose-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO DASHBOARD</span>
        </Link>

        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs sm:text-sm font-mono tracking-wider flex items-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(225,29,72,0.4)] disabled:opacity-50 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {downloading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>DOWNLOAD PASS (PDF)</span>
        </button>
      </div>

      {/* Official Cyber Pass Card Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full rounded-3xl bg-[#060914] border-2 border-rose-500/50 p-6 sm:p-8 shadow-[0_0_50px_rgba(225,29,72,0.35)] relative overflow-hidden"
      >
        {/* Subtle Cyber Grid Background */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(rgba(225, 29, 72, 0.8) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        {/* Top Organizers Header */}
        <div className="flex items-center justify-between border-b border-rose-500/20 pb-4 mb-6 gap-3">
          <div className="relative h-12 w-36 sm:w-48 px-3 py-1.5 rounded-xl bg-white flex items-center justify-center shadow-md">
            <Image
              src="/assets/owasp-logo.png"
              alt="OWASP KARE Student Chapter"
              width={160}
              height={44}
              className="object-contain w-full h-full"
            />
          </div>

          <div className="relative h-12 w-36 sm:w-48 px-3 py-1.5 rounded-xl bg-black border border-white/20 flex items-center justify-center shadow-md">
            <Image
              src="/assets/cybernerds-logo.png"
              alt="CyberNerds KARE Student Chapter"
              width={160}
              height={44}
              className="object-contain w-full h-full"
            />
          </div>
        </div>

        {/* Pass Title & Logo */}
        <div className="text-center my-4 flex flex-col items-center">
          <div className="relative w-64 sm:w-80 h-20 sm:h-24 filter drop-shadow-[0_0_15px_rgba(255,0,60,0.7)]">
            <Image
              src="/assets/quantex-black-redglow.png"
              alt="QUANTEX MUGEN"
              fill
              sizes="(max-width: 768px) 100vw, 320px"
              priority
              className="object-contain"
            />
          </div>
          <div className="inline-block mt-3 px-4 py-1 rounded-full bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-mono tracking-widest uppercase font-bold shadow-[0_0_10px_rgba(225,29,72,0.2)]">
            OFFICIAL HACKATHON ENTRY PASS
          </div>
        </div>

        {/* Team Details & QR Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 p-5 sm:p-6 rounded-2xl bg-[#040712]/90 border border-white/10">
          {/* Left: Team Info */}
          <div className="lg:col-span-8 space-y-4 text-left font-mono">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-0.5">
                  OFFICIAL TEAM ID
                </span>
                <p className="text-2xl sm:text-3xl font-black text-rose-400 font-mono tracking-wider">
                  {team?.teamId || teamId}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-0.5">
                  TEAM NAME
                </span>
                <p className="text-lg sm:text-xl font-bold text-white tracking-wide">
                  {team?.teamName || "CyberSquad"}
                </p>
              </div>
            </div>

            {/* Event Key Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-gray-300">
                <Calendar className="w-4 h-4 text-rose-400" />
                <span className="font-semibold">30–31 October 2026</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold">KS Auditorium, KARE Campus</span>
              </div>
            </div>

            {/* 4 Participants */}
            <div className="pt-1">
              <span className="text-[11px] text-gray-400 uppercase font-bold tracking-wider block mb-2">
                CONFIRMED PARTICIPANTS (4/4)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {team?.members?.map((m: any, i: number) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] flex flex-col justify-center"
                  >
                    <span className="text-white font-bold text-xs truncate">
                      {i + 1}. {m.name}
                    </span>
                    <span className="text-[10px] text-rose-400 font-mono mt-0.5">
                      {m.registrationNumber}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Verification QR */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-white/10 pt-5 lg:pt-0 lg:pl-6">
            <div className="p-3 rounded-2xl bg-white shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center justify-center">
              {qrDataUrl ? (
                <Image
                  src={qrDataUrl}
                  alt="Pass Verification QR"
                  width={160}
                  height={160}
                  className="object-contain"
                />
              ) : (
                <div className="w-40 h-40 bg-gray-200 animate-pulse rounded-lg" />
              )}
            </div>
            <span className="text-[10px] font-mono text-cyan-400 font-bold mt-3 text-center uppercase tracking-widest flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              SCAN TO VERIFY PASS
            </span>
            <span className="text-[9px] font-mono text-gray-500 mt-0.5 text-center">
              OFFICIAL CRYPTOGRAPHIC ENTRY
            </span>
          </div>
        </div>

        {/* Pass Footer */}
        <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 border-t border-rose-500/20 pt-3">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-rose-400" />
            SECURE DIGITAL ENTRY CREDENTIAL • KARE STUDENT CHAPTERS
          </span>
          <span className="text-gray-500">STATUS: CONFIRMED • ALL ACCESS PASS</span>
        </div>
      </motion.div>
    </div>
  );
}
