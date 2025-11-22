'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string[];
  confirmText?: string;
  cancelText?: string;
}

export function AlertDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Continue',
  cancelText = 'Cancel'
}: AlertDialogProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="bg-zinc-950 border-2 border-orange-600/50 rounded-lg shadow-2xl shadow-orange-600/20 max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-950/30 via-red-950/30 to-orange-950/30 border-b border-orange-600/30 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-600/20 rounded-lg border border-orange-600/30">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                    </div>
                    <h2 className="text-lg font-bold text-orange-500 tracking-wider">
                      {title}
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-zinc-800 rounded transition-colors"
                  >
                    <X className="w-5 h-5 text-zinc-400 hover:text-zinc-200" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-3">
                {description.map((line, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 text-sm text-zinc-300"
                  >
                    <span className="text-orange-600 font-bold">•</span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="bg-zinc-900/50 border-t border-zinc-800 p-4 flex gap-3 justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-all border border-zinc-700"
                >
                  {cancelText}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(234, 88, 12, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleConfirm}
                  className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-red-600/20"
                >
                  {confirmText}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
