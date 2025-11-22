"use client";

import { motion } from "framer-motion";
import { Zap, ChevronRight, Flag, Trophy } from "lucide-react";
import Link from "next/link";

const speedLines = [
  { top: 15, width: 25, duration: 1.5, delay: 0 },
  { top: 28, width: 18, duration: 2.2, delay: 0.3 },
  { top: 42, width: 30, duration: 1.8, delay: 0.6 },
  { top: 55, width: 22, duration: 2.5, delay: 0.9 },
  { top: 68, width: 28, duration: 1.6, delay: 1.2 },
  { top: 82, width: 20, duration: 2.1, delay: 1.5 },
  { top: 12, width: 35, duration: 1.9, delay: 0.2 },
  { top: 35, width: 15, duration: 2.3, delay: 0.8 },
  { top: 48, width: 32, duration: 1.7, delay: 1.1 },
  { top: 62, width: 19, duration: 2.4, delay: 1.4 },
  { top: 75, width: 27, duration: 1.4, delay: 0.4 },
  { top: 88, width: 24, duration: 2.0, delay: 0.7 },
  { top: 20, width: 16, duration: 2.6, delay: 1.0 },
  { top: 38, width: 29, duration: 1.3, delay: 1.3 },
  { top: 52, width: 21, duration: 2.2, delay: 0.5 },
  { top: 65, width: 33, duration: 1.8, delay: 1.6 },
  { top: 78, width: 17, duration: 2.4, delay: 0.1 },
  { top: 8, width: 26, duration: 1.6, delay: 1.8 },
  { top: 92, width: 23, duration: 2.1, delay: 0.9 },
  { top: 45, width: 31, duration: 1.7, delay: 1.2 },
];

export default function Home() {
  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 bg-black/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div
                className="w-8 h-8 bg-linear-to-br from-orange-600 to-orange-700 flex items-center justify-center"
                style={{
                  clipPath:
                    "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                }}
              >
                <Flag className="w-4 h-4 text-black" fill="black" />
              </div>
              <span className="text-lg font-black text-white group-hover:text-orange-600 transition-colors">
                GR <span className="text-orange-600">PitIQ</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link
                href="/dashboard"
                className="text-sm font-semibold text-zinc-400 hover:text-orange-600 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/simulation-setup"
                className="text-sm font-semibold text-zinc-400 hover:text-orange-600 transition-colors"
              >
                Simulation
              </Link>
              <Link
                href="/analytics"
                className="text-sm font-semibold text-zinc-400 hover:text-orange-600 transition-colors"
              >
                Analytics
              </Link>
              <Link
                href="/about"
                className="text-sm font-semibold text-zinc-400 hover:text-orange-600 transition-colors"
              >
                About
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 text-sm font-bold text-zinc-300 hover:text-orange-600 transition-colors"
                >
                  Login
                </motion.button>
              </Link>
              <Link href="/signup">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 text-sm font-bold bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Sign Up
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <div className="pt-16">
        <div className="relative bg-black min-h-screen flex items-center justify-center pb-8">
          {speedLines.map((line, i) => (
            <motion.div
              key={i}
              className="absolute h-px bg-linear-to-r from-transparent via-orange-600/30 to-transparent pointer-events-none"
              style={{
                top: `${line.top}%`,
                width: `${line.width}%`,
                left: "-30%",
              }}
              animate={{
                x: ["0%", "200vw"],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: line.duration,
                repeat: Infinity,
                delay: line.delay,
                ease: "linear",
              }}
            />
          ))}

          <motion.div
            className="absolute w-96 h-96 rounded-full bg-orange-600/20 blur-3xl pointer-events-none"
            style={{ top: "10%", left: "10%" }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute w-96 h-96 rounded-full bg-orange-600/20 blur-3xl pointer-events-none"
            style={{ bottom: "10%", right: "10%" }}
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.5, 0.3, 0.5],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.div
            className="absolute top-20 right-20 opacity-5 pointer-events-none"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <Flag className="w-32 h-32 text-orange-600" />
          </motion.div>
          <motion.div
            className="absolute bottom-20 left-20 opacity-5 pointer-events-none"
            animate={{
              rotate: -360,
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <Trophy className="w-32 h-32 text-orange-600" />
          </motion.div>

          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-center">
            <div className="text-center space-y-4 sm:space-y-6 py-4">
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="space-y-2 sm:space-y-3"
              >
                <motion.h1
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-tight"
                  animate={{
                    textShadow: [
                      "0 0 20px rgba(234, 88, 12, 0.3)",
                      "0 0 40px rgba(234, 88, 12, 0.5)",
                      "0 0 20px rgba(234, 88, 12, 0.3)",
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  GR{" "}
                  <span className="text-orange-600">
                    PitIQ
                  </span>
                </motion.h1>
                <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                  <motion.div
                    className="h-px w-6 sm:w-10 bg-linear-to-r from-transparent to-orange-600"
                    animate={{ scaleX: [1, 1.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <p className="text-sm sm:text-base md:text-lg font-bold text-zinc-400 tracking-wider uppercase px-2">
                    Racing Intelligence Platform
                  </p>
                  <motion.div
                    className="h-px w-6 sm:w-10 bg-linear-to-l from-transparent to-orange-600"
                    animate={{ scaleX: [1, 1.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  />
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-sm sm:text-base md:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed px-4"
              >
                Advanced simulation and predictive analytics for the{" "}
                <span className="text-orange-600 font-bold">Toyota GR Cup</span>{" "}
                series. Optimize performance, predict outcomes, and dominate the
                track.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-4"
              >
                <motion.div
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-full hover:border-orange-600/50 hover:bg-zinc-900 transition-all cursor-pointer group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600 group-hover:animate-pulse" />
                  <span className="text-xs sm:text-sm font-semibold text-zinc-300 group-hover:text-white">
                    Real-time Analytics
                  </span>
                </motion.div>
                <motion.div
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-full hover:border-orange-600/50 hover:bg-zinc-900 transition-all cursor-pointer group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs sm:text-sm font-semibold text-zinc-300 group-hover:text-white">
                    AI Predictions
                  </span>
                </motion.div>
                <motion.div
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-full hover:border-orange-600/50 hover:bg-zinc-900 transition-all cursor-pointer group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center">
                    <motion.div
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-orange-600"
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-zinc-300 group-hover:text-white">
                    Live Telemetry
                  </span>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 px-4"
              >
                <Link href="/login" className="w-full sm:w-auto max-w-xs">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative w-full px-8 py-3.5 bg-linear-to-r from-orange-600 to-orange-700 text-white font-black text-base sm:text-lg rounded-xl overflow-hidden shadow-2xl shadow-orange-600/40"
                  >
                    <motion.div className="absolute inset-0 bg-linear-to-r from-orange-700 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <motion.div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
                      animate={{
                        x: ["-100%", "200%"],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                      style={{
                        background:
                          "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                      }}
                    />
                    <div className="relative flex items-center justify-center gap-2">
                      <span className="tracking-wider">LOGIN</span>
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </motion.div>
                    </div>
                  </motion.button>
                </Link>

                <Link href="/signup" className="w-full sm:w-auto max-w-xs">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative w-full px-8 py-3.5 bg-transparent border-2 border-orange-600 text-orange-600 font-black text-base sm:text-lg rounded-xl hover:bg-orange-600/10 transition-all overflow-hidden shadow-lg shadow-orange-600/20"
                  >
                    <motion.div
                      className="absolute inset-0 bg-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                      animate={{
                        boxShadow: [
                          "inset 0 0 20px rgba(234, 88, 12, 0)",
                          "inset 0 0 20px rgba(234, 88, 12, 0.3)",
                          "inset 0 0 20px rgba(234, 88, 12, 0)",
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <div className="relative flex items-center justify-center gap-2">
                      <span className="tracking-wider">SIGN UP</span>
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: 0.5,
                        }}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </motion.div>
                    </div>
                  </motion.button>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1 }}
                className="pt-4 sm:pt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-10 text-sm px-4"
              >
                <motion.div
                  className="text-center group cursor-pointer"
                  whileHover={{ scale: 1.1 }}
                >
                  <motion.div
                    className="text-2xl sm:text-3xl md:text-4xl font-black text-orange-600 mb-1"
                    animate={{
                      textShadow: [
                        "0 0 10px rgba(234, 88, 12, 0.5)",
                        "0 0 20px rgba(234, 88, 12, 0.8)",
                        "0 0 10px rgba(234, 88, 12, 0.5)",
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    7+
                  </motion.div>
                  <div className="text-zinc-500 font-semibold group-hover:text-zinc-400 transition-colors uppercase tracking-wider text-[10px] sm:text-xs">
                    ML Models
                  </div>
                </motion.div>

                <motion.div
                  className="h-10 sm:h-12 w-px bg-zinc-800"
                  animate={{ scaleY: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                />

                <motion.div
                  className="text-center group cursor-pointer"
                  whileHover={{ scale: 1.1 }}
                >
                  <motion.div
                    className="text-2xl sm:text-3xl md:text-4xl font-black text-orange-600 mb-1"
                    animate={{
                      textShadow: [
                        "0 0 10px rgba(234, 88, 12, 0.5)",
                        "0 0 20px rgba(234, 88, 12, 0.8)",
                        "0 0 10px rgba(234, 88, 12, 0.5)",
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                  >
                    6
                  </motion.div>
                  <div className="text-zinc-500 font-semibold group-hover:text-zinc-400 transition-colors uppercase tracking-wider text-[10px] sm:text-xs">
                    Race Tracks
                  </div>
                </motion.div>

                <motion.div
                  className="h-10 sm:h-12 w-px bg-zinc-800"
                  animate={{ scaleY: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                />

                <motion.div
                  className="text-center group cursor-pointer"
                  whileHover={{ scale: 1.1 }}
                >
                  <motion.div
                    className="text-2xl sm:text-3xl md:text-4xl font-black text-orange-600 mb-1"
                    animate={{
                      textShadow: [
                        "0 0 10px rgba(234, 88, 12, 0.5)",
                        "0 0 20px rgba(234, 88, 12, 0.8)",
                        "0 0 10px rgba(234, 88, 12, 0.5)",
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                  >
                    1000+
                  </motion.div>
                  <div className="text-zinc-500 font-semibold group-hover:text-zinc-400 transition-colors uppercase tracking-wider text-[10px] sm:text-xs">
                    Data Points
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>

          <div className="absolute top-0 left-0 w-16 sm:w-24 h-16 sm:h-24 border-t-2 border-l-2 border-orange-600/30 pointer-events-none" />
          <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 border-t-2 border-r-2 border-orange-600/30 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-16 sm:w-24 h-16 sm:h-24 border-b-2 border-l-2 border-orange-600/30 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-16 sm:w-24 h-16 sm:h-24 border-b-2 border-r-2 border-orange-600/30 pointer-events-none" />
        </div>
      </div>

      <footer className="relative z-10 border-t border-zinc-800 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-zinc-500">
              © 2025{" "}
              <span className="text-orange-600 font-semibold">GR PitIQ</span>.
              All rights reserved.
            </div>

            <div className="flex items-center gap-6">
              <Link
                href="/privacy"
                className="text-sm text-zinc-500 hover:text-orange-600 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-zinc-500 hover:text-orange-600 transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/contact"
                className="text-sm text-zinc-500 hover:text-orange-600 transition-colors"
              >
                Contact
              </Link>
            </div>

            <div className="text-sm text-zinc-500">
              Powered by{" "}
              <span className="text-orange-600 font-semibold">
                AI-Driven Racing Intelligence
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
