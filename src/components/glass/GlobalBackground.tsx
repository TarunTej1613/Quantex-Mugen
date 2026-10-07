"use client";

import React, { useState, useEffect } from "react";

interface GlobalBackgroundProps {
  children?: React.ReactNode;
}

export const GlobalBackground: React.FC<GlobalBackgroundProps> = ({ children }) => {
  const bgSrc = "/assets/bg.jpg";

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#0a0505]">
      {/* Fixed Full Website Background Layer */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-700 pointer-events-none"
        style={{
          backgroundImage: `url('${bgSrc}')`,
          backgroundColor: "#080404",
        }}
      >
        {/* Balanced Cinematic Dark / Crimson Tint to highlight the Moon and Blossoms while ensuring text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-[#0c0406]/40 to-black/75" />
        
        {/* Subtle Ambient Crimson Moon Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] bg-rose-600/20 rounded-full blur-[160px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-950/40 rounded-full blur-[140px] pointer-events-none" />

        {/* Delicate Cyber Scanlines / Texture Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
            backgroundSize: "28px 28px"
          }}
        />
      </div>

      {/* Main Glass Content Layer */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {children}
      </div>
    </div>
  );
};
