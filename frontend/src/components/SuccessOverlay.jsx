import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SuccessOverlay({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose?.(), 3800);
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-testid="success-overlay"
          className="fixed inset-0 z-[100] flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Backdrop */}
          <motion.button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />

          <motion.div
            className="relative w-full max-w-md bg-[#0A0A0A] border border-white/15 p-10 md:p-12 text-center"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Animated check */}
            <div className="relative mx-auto w-20 h-20 mb-8">
              <motion.span
                className="absolute inset-0 rounded-full border border-white/20"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
              <motion.span
                className="absolute inset-0 rounded-full border border-white"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.6, opacity: 0 }}
                transition={{ duration: 1.6, ease: "easeOut", repeat: Infinity }}
              />
              <svg
                className="absolute inset-0 m-auto"
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
              >
                <motion.path
                  d="M9 21 L17 29 L31 13"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
                />
              </svg>
            </div>

            <div className="text-[11px] tracking-[0.4em] uppercase text-white/50 mb-4">
              AUTOHAUS
            </div>
            <h3 className="text-3xl md:text-4xl tracking-tighter font-medium leading-[1.05]">
              Заявка отправлена.
            </h3>
            <p className="mt-4 text-[#BDBDBD] text-base font-light leading-relaxed">
              Мы свяжемся с вами в ближайшее время.
            </p>

            <button
              type="button"
              onClick={onClose}
              data-testid="success-close"
              className="mt-10 inline-flex items-center gap-3 px-6 py-3 border border-white/20 text-[11px] tracking-[0.3em] uppercase hover:bg-white hover:text-black transition-all duration-300"
            >
              Закрыть
              <span className="block w-6 h-px bg-current" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
