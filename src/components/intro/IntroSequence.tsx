"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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

  const handleVideoEnded = useCallback(() => {
    setIntroCompleted(true);
    setPhase("logo_center");
  }, [setIntroCompleted]);

  const handleSkip = useCallback(() => {
    skipIntro();
    setPhase("done");
  }, [skipIntro]);

  const handleVideoError = useCallback(() => {
    setVideoError(true);
    setTimeout(() => {
      setIntroCompleted(true);
      setPhase("logo_center");
    }, 1000);
  }, [setIntroCompleted]);

  // Handle video autoplay on mobile safely
  useEffect(() => {
    if (phase === "video" && videoRef.current) {
      videoRef.current.defaultMuted = isMuted;
      videoRef.current.muted = isMuted;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay was blocked or deferred; video will play when ready or on user tap
        });
      }
    }
  }, [phase, isMuted]);

  useEffect(() => {
    if (phase === "logo_center") {
      const timer = setTimeout(() => {
        setPhase("logo_moving");
      }, 3000);
      return () => clearTimeout(timer);
    } else if (phase === "logo_moving") {
      const timer = setTimeout(() => {
        setLogoAnimationCompleted(true);
        setPhase("done");
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [phase, setLogoAnimationCompleted]);

  if (introCompleted && logoAnimationCompleted && phase === "done") {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712] overflow-hidden w-screen h-[100dvh] touch-manipulation select-none">
      {/* Skip Button */}
      <button
        onClick={handleSkip}
        type="button"
        aria-label="Skip Intro"
        className="absolute top-4 sm:top-6 right-4 sm:right-6 z-50 flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full liquid-glass text-xs font-semibold tracking-wider text-rose-300 hover:text-white hover:bg-rose-950/40 border border-rose-500/30 transition-all duration-300 cursor-pointer uppercase shadow-lg active:scale-95"
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
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden"
          >
            {/* Ambient Background Glow Layer (fills portrait screen beautifully) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <video
                src="/assets/intro.mp4"
                autoPlay
                playsInline
                webkit-playsinline="true"
                x5-playsinline="true"
                muted
                preload="auto"
                aria-hidden="true"
                className="w-full h-full min-h-[100dvh] min-w-full object-cover object-center blur-3xl opacity-30 scale-125 transform-gpu"
              />
              <div className="absolute inset-0 bg-black/50" />
            </div>

            {/* Main Crisp Video (Rotates to Portrait on Portrait Mobile, Landscape on Desktop) */}
            <div className="relative z-10 w-full h-full flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                src="/assets/intro.mp4"
                autoPlay
                playsInline
                webkit-playsinline="true"
                x5-playsinline="true"
                muted={isMuted}
                preload="auto"
                onEnded={handleVideoEnded}
                onError={handleVideoError}
                className="transform-gpu shadow-2xl transition-all duration-500
                  portrait:rotate-90 portrait:w-[100dvh] portrait:h-[100vw] portrait:max-w-none portrait:max-h-none portrait:object-contain
                  landscape:rotate-0 landscape:w-full landscape:h-full landscape:max-w-full landscape:max-h-full landscape:object-contain"
              />
            </div>

            {/* Sound Toggle */}
            <div className="absolute bottom-6 left-4 sm:bottom-8 sm:left-8 z-40 flex items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setIsMuted((prev) => !prev)}
                className="p-2.5 sm:p-3 rounded-full liquid-glass hover:bg-white/10 text-white/80 hover:text-white transition-all cursor-pointer border border-white/20 active:scale-95 shadow-lg"
                title={isMuted ? "Unmute Sound" : "Mute Sound"}
                aria-label={isMuted ? "Unmute Sound" : "Mute Sound"}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                )}
              </button>
              <span className="text-[10px] sm:text-xs text-white/70 tracking-wider font-mono bg-black/40 px-2 py-1 rounded backdrop-blur-sm border border-white/10">
                {isMuted ? "AUDIO MUTED" : "AUDIO ON"}
              </span>
            </div>

            {/* Fallback info when video file is being uploaded */}
            {videoError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center z-30">
                <div className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-4" />
                <h3 className="text-lg sm:text-xl font-bold tracking-widest text-white uppercase mb-2">
                  QUANTEX MUGEN
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 max-w-md">
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
            transition={{ duration: 0.5 }}
            className="relative w-full h-full flex flex-col items-center justify-center bg-[#030712] px-4 overflow-hidden transform-gpu"
          >
            {/* Ambient cyber glow background (GPU-accelerated, lightweight, 0 lag) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-rose-600/15 rounded-full blur-[100px] transform-gpu" />
              <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-red-900/15 rounded-full blur-[80px] transform-gpu" />
            </div>

            {/* Center Logo Assembly */}
            <motion.div
              layout
              initial={{ scale: 0.5, opacity: 0, filter: "blur(10px)" }}
              animate={
                phase === "logo_center"
                  ? {
                      scale: [0.5, 1.05, 1],
                      opacity: [0, 1, 1],
                      filter: ["blur(10px)", "blur(0px)", "blur(0px)"],
                      y: 0,
                    }
                  : {
                      scale: 0.65,
                      opacity: 0.75,
                      y: "-35vh",
                    }
              }
              transition={{
                duration: phase === "logo_center" ? 1.4 : 1.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative z-30 flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-10 p-3 sm:p-6 max-w-5xl w-full transform-gpu will-change-transform"
            >
              {/* OWASP KARE STUDENT CHAPTER LOGO */}
              <motion.div
                initial={{ x: -60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.1, ease: "easeOut" }}
                className="relative flex flex-col items-center w-full max-w-[280px] sm:max-w-xs md:max-w-sm"
              >
                <div className="relative w-full h-20 sm:h-24 md:h-28 px-3 py-2 sm:px-4 sm:py-3 rounded-2xl bg-white/95 border-2 border-white/40 shadow-[0_0_40px_rgba(255,255,255,0.25)] flex items-center justify-center overflow-hidden">
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
                transition={{ duration: 0.6, delay: 0.3 }}
                className="hidden md:block w-[2px] h-16 sm:h-20 bg-gradient-to-b from-transparent via-rose-500 to-transparent shadow-[0_0_15px_#e11d48]"
              />

              {/* CYBERNERDS KARE STUDENT CHAPTER LOGO */}
              <motion.div
                initial={{ x: 60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
                className="relative flex flex-col items-center w-full max-w-[280px] sm:max-w-xs md:max-w-sm"
              >
                <div className="relative w-full h-20 sm:h-24 md:h-28 px-3 py-2 sm:px-4 sm:py-3 rounded-2xl bg-black/90 border-2 border-rose-500/50 shadow-[0_0_40px_rgba(225,29,72,0.35)] flex items-center justify-center overflow-hidden">
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="mt-4 sm:mt-6 text-center px-4"
              >
                <p className="text-[11px] sm:text-xs md:text-sm font-mono tracking-[0.25em] sm:tracking-[0.35em] text-rose-400 uppercase">
                  PROUDLY PRESENT
                </p>
                <h1 className="text-xl sm:text-2xl md:text-4xl font-black tracking-widest text-white mt-1 text-glow-crimson uppercase">
                  QUANTEX MUGEN
                </h1>
                <p className="text-[10px] sm:text-xs font-mono text-gray-400 mt-1 tracking-wider uppercase">
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
