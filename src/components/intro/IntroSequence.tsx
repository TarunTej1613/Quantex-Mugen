"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIntro } from "@/context/IntroContext";
import Image from "next/image";
import { Volume2, VolumeX, FastForward } from "lucide-react";

export const IntroSequence: React.FC = () => {
  const {
    introCompleted,
    logoAnimationCompleted,
    setIntroCompleted,
    setLogoAnimationCompleted,
    skipIntro,
  } = useIntro();

  const [phase, setPhase] = useState<"video" | "logo_center" | "logo_moving" | "done">("video");
  const [isMuted, setIsMuted] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (introCompleted && logoAnimationCompleted) {
      setPhase("done");
    }
  }, [introCompleted, logoAnimationCompleted]);

  const handleVideoEnded = () => {
    setIntroCompleted(true);
    setPhase("logo_center");
  };

  const handleSkip = () => {
    skipIntro();
    setPhase("done");
  };

  const handleVideoError = () => {
    setVideoError(true);
    setTimeout(() => {
      setIntroCompleted(true);
      setPhase("logo_center");
    }, 1000);
  };

  useEffect(() => {
    if (phase === "logo_center") {
      const timer = setTimeout(() => {
        setPhase("logo_moving");
      }, 3500);
      return () => clearTimeout(timer);
    } else if (phase === "logo_moving") {
      const timer = setTimeout(() => {
        setLogoAnimationCompleted(true);
        setPhase("done");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase, setLogoAnimationCompleted]);

  if (introCompleted && logoAnimationCompleted && phase === "done") {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712] overflow-hidden">
      {/* Skip Button */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full liquid-glass text-xs font-semibold tracking-wider text-rose-300 hover:text-white hover:bg-rose-950/40 border border-rose-500/30 transition-all duration-300 cursor-pointer uppercase"
      >
        <FastForward className="w-3.5 h-3.5" />
        <span>Skip Intro</span>
      </button>

      {/* PHASE 1: INTRO VIDEO */}
      <AnimatePresence mode="wait">
        {phase === "video" && (
          <motion.div
            key="intro-video-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8 }}
            className="relative w-full h-full flex items-center justify-center bg-black"
          >
            <video
              ref={videoRef}
              src="/assets/intro.mp4"
              autoPlay
              playsInline
              muted={isMuted}
              onEnded={handleVideoEnded}
              onError={handleVideoError}
              className="w-full h-full object-cover"
            />

            {/* Sound Toggle */}
            <div className="absolute bottom-8 left-8 z-40 flex items-center gap-3">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-3 rounded-full liquid-glass hover:bg-white/10 text-white/80 hover:text-white transition-all cursor-pointer border border-white/20"
                title={isMuted ? "Unmute Sound" : "Mute Sound"}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-rose-400" />
                ) : (
                  <Volume2 className="w-5 h-5 text-emerald-400" />
                )}
              </button>
              <span className="text-xs text-white/60 tracking-wider font-mono">
                {isMuted ? "AUDIO MUTED" : "CINEMATIC AUDIO ON"}
              </span>
            </div>

            {/* Fallback info when video file is being uploaded */}
            {videoError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center">
                <div className="w-16 h-16 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-4" />
                <h3 className="text-xl font-bold tracking-widest text-white uppercase mb-2">
                  QUANTEX MUGEN
                </h3>
                <p className="text-sm text-gray-400 max-w-md">
                  Initializing Organizers Cinematic Sequence...
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* PHASE 2 & 3: OWASP + CYBERNERDS LOGO FORMATION & POP */}
        {(phase === "logo_center" || phase === "logo_moving") && (
          <motion.div
            key="logo-animation-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="relative w-full h-full flex flex-col items-center justify-center bg-[#030712] px-4"
          >
            {/* Ambient cyber particle background */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1200),
                    y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 800),
                    opacity: 0,
                    scale: 0,
                  }}
                  animate={{
                    opacity: [0, 0.8, 0],
                    scale: [0, 1.5, 0],
                    y: "-=80",
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                  className="absolute w-1.5 h-1.5 rounded-full bg-rose-500 blur-[0.5px]"
                />
              ))}
            </div>

            {/* Center Logo Assembly */}
            <motion.div
              layout
              initial={{ scale: 0.3, opacity: 0, filter: "blur(20px)" }}
              animate={
                phase === "logo_center"
                  ? {
                      scale: [0.3, 1.1, 1],
                      opacity: [0, 1, 1],
                      filter: ["blur(20px)", "blur(0px)", "blur(0px)"],
                      y: 0,
                    }
                  : {
                      scale: 0.55,
                      opacity: 0.85,
                      y: typeof window !== "undefined" ? -window.innerHeight / 2 + 60 : -320,
                    }
              }
              transition={{
                duration: phase === "logo_center" ? 1.8 : 1.4,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative z-30 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 p-6 max-w-5xl"
            >
              {/* OWASP KARE STUDENT CHAPTER LOGO */}
              <motion.div
                initial={{ x: -100, opacity: 0, rotate: -8 }}
                animate={{ x: 0, opacity: 1, rotate: 0 }}
                transition={{ duration: 1.2, delay: 0.2, type: "spring", stiffness: 120, damping: 14 }}
                className="relative flex flex-col items-center"
              >
                <div className="relative w-72 sm:w-80 md:w-96 h-24 sm:h-28 px-4 py-3 rounded-2xl bg-white/95 border-2 border-white/40 shadow-[0_0_50px_rgba(255,255,255,0.3)] flex items-center justify-center overflow-hidden">
                  <Image
                    src="/assets/owasp-logo.png"
                    alt="OWASP KARE Student Chapter"
                    width={360}
                    height={100}
                    priority
                    className="object-contain w-full h-full"
                  />
                </div>
              </motion.div>

              {/* Glowing Cyber Separator */}
              <motion.div
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="hidden md:block w-[2px] h-20 bg-gradient-to-b from-transparent via-rose-500 to-transparent shadow-[0_0_15px_#e11d48]"
              />

              {/* CYBERNERDS KARE STUDENT CHAPTER LOGO */}
              <motion.div
                initial={{ x: 100, opacity: 0, rotate: 8 }}
                animate={{ x: 0, opacity: 1, rotate: 0 }}
                transition={{ duration: 1.2, delay: 0.4, type: "spring", stiffness: 120, damping: 14 }}
                className="relative flex flex-col items-center"
              >
                <div className="relative w-72 sm:w-80 md:w-96 h-24 sm:h-28 px-4 py-3 rounded-2xl bg-black/90 border-2 border-rose-500/50 shadow-[0_0_50px_rgba(225,29,72,0.4)] flex items-center justify-center overflow-hidden">
                  <Image
                    src="/assets/cybernerds-logo.png"
                    alt="CyberNerds KARE Student Chapter"
                    width={360}
                    height={100}
                    priority
                    className="object-contain w-full h-full"
                  />
                </div>
              </motion.div>
            </motion.div>

            {/* Subtitle during center showcase */}
            {phase === "logo_center" && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                className="mt-6 text-center"
              >
                <p className="text-xs md:text-sm font-mono tracking-[0.35em] text-rose-400 uppercase">
                  PROUDLY PRESENT
                </p>
                <h1 className="text-2xl md:text-4xl font-black tracking-widest text-white mt-1 text-glow-crimson uppercase">
                  QUANTEX MUGEN
                </h1>
                <p className="text-xs font-mono text-gray-400 mt-1 tracking-widest uppercase">
                  WHERE LIMITS CEASE, POSSIBILITIES BEGIN
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
