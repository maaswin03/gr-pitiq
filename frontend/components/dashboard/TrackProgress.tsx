"use client";

import { motion } from "framer-motion";
import { Car, Flag } from "lucide-react";

interface TrackProgressProps {
  currentSector: number;
  currentSectorProgress: number;
  currentSpeed: number;
}

export default function TrackProgress({
  currentSector,
  currentSectorProgress,
  currentSpeed,
}: TrackProgressProps) {
  const calculateCarPosition = (sector: number, progress: number): number => {
    const sectorWidth = 100 / 3;
    const baseSectorPosition = (sector - 1) * sectorWidth;
    const positionInSector = (progress / 100) * sectorWidth;
    return baseSectorPosition + positionInSector;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="border border-orange-600/30 rounded-xl bg-linear-to-br from-black via-zinc-950 to-black p-4 md:p-6 shadow-2xl shadow-orange-600/10"
    >
      <div className="flex items-center gap-2 mb-6">
        <Flag className="w-5 h-5 text-orange-500" />
        <h3 className="text-sm md:text-base font-bold text-orange-500 tracking-wider uppercase">
          TRACK PROGRESS
        </h3>
      </div>

      <div className="relative h-24 md:h-32 mb-6">
        <div className="absolute top-1/2 -translate-y-1/2 w-full h-1">
          <div className="w-full h-full border-t-2 border-dashed border-zinc-700" />
        </div>

        <div className="absolute top-1/2 -translate-y-1/2 w-full h-8 flex justify-between items-center">
          <div className="flex flex-col items-center -ml-1">
            <div className="w-0.5 h-12 bg-linear-to-b from-green-500 to-green-600 shadow-lg shadow-green-500/50" />
            <span className="text-[10px] text-green-500 font-bold mt-2 uppercase">
              Start
            </span>
          </div>

          <div
            className="flex flex-col items-center"
            style={{
              position: "absolute",
              left: "33.33%",
              transform: "translateX(-50%)",
            }}
          >
            <div className="w-0.5 h-8 bg-zinc-600" />
            <span className="text-[10px] text-zinc-500 font-bold mt-2">
              S1
            </span>
          </div>

          <div
            className="flex flex-col items-center"
            style={{
              position: "absolute",
              left: "66.66%",
              transform: "translateX(-50%)",
            }}
          >
            <div className="w-0.5 h-8 bg-zinc-600" />
            <span className="text-[10px] text-zinc-500 font-bold mt-2">
              S2
            </span>
          </div>

          <div className="flex flex-col items-center -mr-1">
            <div className="w-0.5 h-12 bg-linear-to-b from-orange-500 to-red-600 shadow-lg shadow-orange-500/50" />
            <span className="text-[10px] text-orange-500 font-bold mt-2 uppercase">
              Finish
            </span>
          </div>
        </div>

        <motion.div
          className="absolute top-1/2 -translate-y-1/2 z-10"
          style={{
            left: `${calculateCarPosition(currentSector, currentSectorProgress)}%`,
          }}
          animate={{
            x: "-50%",
          }}
        >
          <div className="relative">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 bg-orange-600/30 blur-lg rounded-full"
            />
            <Car className="w-6 h-6 md:w-8 md:h-8 text-orange-500 relative z-10 drop-shadow-lg" />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((sector) => {
          const isCompleted = currentSector > sector;
          const isActive = currentSector === sector;
          const progress = isActive ? currentSectorProgress : (isCompleted ? 100 : 0);

          return (
            <motion.div
              key={sector}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * sector }}
              className={`
                relative overflow-hidden rounded-lg border p-3 md:p-4 transition-all duration-300
                ${
                  isActive
                    ? "border-orange-600/50 bg-linear-to-br from-orange-950/30 to-black shadow-lg shadow-orange-600/20"
                    : isCompleted
                    ? "border-green-600/30 bg-linear-to-br from-green-950/20 to-black"
                    : "border-zinc-800 bg-linear-to-br from-zinc-950 to-black"
                }
              `}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`
                    flex items-center gap-1.5 px-2 py-1 rounded text-[10px] md:text-xs font-bold uppercase tracking-wider
                    ${
                      isActive
                        ? "bg-orange-600/20 text-orange-400"
                        : isCompleted
                        ? "bg-green-600/20 text-green-400"
                        : "bg-zinc-800/50 text-zinc-500"
                    }
                  `}
                >
                  <div
                    className={`
                      w-1.5 h-1.5 rounded-full
                      ${
                        isActive
                          ? "bg-orange-500 animate-pulse"
                          : isCompleted
                          ? "bg-green-500"
                          : "bg-zinc-600"
                      }
                    `}
                  />
                  Sector {sector}
                </div>

                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-green-400"
                  >
                    <svg
                      className="w-4 h-4 md:w-5 md:h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </motion.div>
                ) : isActive ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="text-orange-500"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </motion.div>
                ) : null}
              </div>

              <div
                className={`
                  text-3xl md:text-4xl font-bold font-rajdhani mb-2
                  ${
                    isActive
                      ? "text-orange-400"
                      : isCompleted
                      ? "text-green-400"
                      : "text-zinc-600"
                  }
                `}
              >
                {progress.toFixed(0)}%
              </div>

              <div className="mt-2">
                <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${
                      isActive 
                        ? "bg-linear-to-r from-orange-600 to-orange-500"
                        : isCompleted
                        ? "bg-linear-to-r from-green-600 to-green-500"
                        : "bg-zinc-800"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
          <div className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wider">
            Current Sector
          </div>
          <div className="text-xl md:text-2xl font-bold text-orange-500">
            S{currentSector}
          </div>
        </div>

        <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
          <div className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wider">
            Current Speed
          </div>
          <div className="text-xl md:text-2xl font-bold text-orange-500">
            {currentSpeed.toFixed(0)} km/h
          </div>
        </div>
      </div>
    </motion.div>
  );
}
