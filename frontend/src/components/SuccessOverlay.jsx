import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { trackLeadSubmit } from "@/lib/metrika";

/**
 * SuccessOverlay — короткая анимация подтверждения, затем редирект на /thank-you.
 * `source` попадает в трекинг метрики (цель lead_submit_{source}).
 * Через ~1.4 сек редиректим — быстро, но пользователь успевает увидеть чек-mark.
 */
export default function SuccessOverlay({ open, onClose, source = "form" }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    trackLeadSubmit(source);
    const redirect = setTimeout(() => {
      navigate(`/thank-you?source=${encodeURIComponent(source)}`);
    }, 1400);
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(redirect);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, source, navigate, onClose]);

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
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xl" />
          <motion.div
            className="relative w-full max-w-md bg-[#0A0A0A] border border-white/15 p-10 md:p-12 text-center"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative mx-auto w-20 h-20 mb-8">
              <motion.span
                className="absolute inset-0 rounded-full border border-white/20"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
              <svg className="absolute inset-0 m-auto" width="40" height="40" viewBox="0 0 40 40" fill="none">
                <motion.path
                  d="M9 21 L17 29 L31 13"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
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
              Переходим на страницу «Спасибо»…
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
