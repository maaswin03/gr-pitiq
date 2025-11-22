import type { Metadata } from "next";
import { Geist, Geist_Mono, Rajdhani, Orbitron } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "GR PitIQ 🏁 | AI Racing Simulation Dashboard",
  description:
    "Experience intelligent race engineering with GR PitIQ — an AI-powered simulation and telemetry dashboard for predicting lap times, pit stops, and racing performance."
};


import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="m-0 p-0">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${rajdhani.variable} ${orbitron.variable} antialiased m-0 p-0`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
