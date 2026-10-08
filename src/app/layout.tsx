import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { IntroProvider } from "@/context/IntroContext";
import { GlobalBackground } from "@/components/glass/GlobalBackground";
import { GlassHeader } from "@/components/glass/GlassHeader";
import { GlassFooter } from "@/components/glass/GlassFooter";
import { IntroSequence } from "@/components/intro/IntroSequence";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#030712",
};

export const metadata: Metadata = {
  title: "QUANTEX MUGEN — WHERE LIMITS CEASE, POSSIBILITIES BEGIN",
  description:
    "Official Hackathon Portal organized by OWASP KARE Student Chapter & CyberNerds KARE Student Chapter. 30–31 October at KS Auditorium.",
  keywords: [
    "Quantex Mugen",
    "OWASP KARE",
    "CyberNerds KARE",
    "Hackathon",
    "KLU",
    "Cybersecurity",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <body className="min-h-screen bg-[#030712] text-gray-100 font-sans antialiased selection:bg-rose-500/30 selection:text-white flex flex-col">
        <IntroProvider>
          <IntroSequence />
          <GlobalBackground>
            <GlassHeader />
            <main className="flex-1 w-full">{children}</main>
            <GlassFooter />
          </GlobalBackground>
        </IntroProvider>
      </body>
    </html>
  );
}
