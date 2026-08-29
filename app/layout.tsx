import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Are You Compatible? | AI Couple Compatibility Stall",
  description: "The official AI-powered compatibility stall experience for college fests and events. Register your profile, pair up, and discover your hilarious AI compatibility analysis live on stage!",
  keywords: ["AI Compatibility", "College Event Stall", "Dating App Stall", "Couple Game", "AI Matchmaker"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#07070a] text-slate-100 min-h-screen selection:bg-rose-500 selection:text-white relative font-sans antialiased overflow-x-hidden">
        {/* Subtle Ambient Glow Background Orbs */}
        <div className="fixed top-[-10%] left-[15%] w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse-glow" />
        <div className="fixed bottom-[-10%] right-[15%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

        {children}
      </body>
    </html>
  );
}
