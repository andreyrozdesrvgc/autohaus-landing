import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { getAnalyticsPayload } from "@/lib/analytics";
import { formatRuPhone, isValidRuPhone } from "@/lib/phone";
import SuccessOverlay from "@/components/SuccessOverlay";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * Premium-минималистичный попап с формой "имя · телефон · марка авто".
 * - Открывается через проп `open`
 * - Принимает `source` (метка для CRM) и опциональный `subject`
 *   который добавляется в message (например, название видео)
 */
export default function LeadPopup({ open, onClose, source = "popup", subject = "" }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [car, setCar] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  // Lock body scroll while open; close on Escape
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error("Заполните имя и телефон");
      return;
    }
    if (!isValidRuPhone(phone)) {
      toast.error("Введите корректный номер: +7 и ещё 10 цифр");
      return;
    }
    setSending(true);
    try {
      await axios.post(`${API}/leads`, {
        name,
        phone,
        car,
        message: subject ? `Заявка из попапа · ${subject}` : "Заявка из попапа",
        source,
        website,
        ...getAnalyticsPayload(),
      });
      setName(""); setPhone(""); setCar("");
      setSuccess(true);
      onClose();
    } catch (err) {
      const status = err?.response?.status;
      if (status === 429) toast.error("Слишком много запросов. Попробуйте через минуту.");
      else toast.error("Ошибка отправки. Попробуйте позже.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            data-testid="lead-popup"
            role="dialog"
            aria-modal="true"
            aria-label="Запросить расчёт"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center px-4 py-8"
          >
            <motion.form
              onSubmit={submit}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              data-testid="lead-popup-form"
              className="relative w-full max-w-md bg-[#0A0A0A] border border-white/10 p-7 md:p-10 flex flex-col gap-7"
            >
              {/* Grain texture */}
              <div className="absolute inset-0 grain pointer-events-none" />

              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть"
                data-testid="lead-popup-close"
                className="absolute top-4 right-4 w-10 h-10 border border-white/10 hover:bg-white hover:text-black text-white/70 flex items-center justify-center transition-all"
              >
                <X size={16} strokeWidth={1.5} />
              </button>

              {/* Header */}
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <span className="block w-8 h-px bg-white/40" />
                  <span className="text-[10px] tracking-[0.4em] uppercase text-white/50">
                    Заявка
                  </span>
                </div>
                <h3 className="text-2xl md:text-3xl tracking-tighter font-medium leading-[1.05] text-white">
                  Оставьте контакты —<br />
                  <span className="text-[#BDBDBD]">мы перезвоним за 15 минут.</span>
                </h3>
                {subject && (
                  <p className="mt-3 text-[10px] tracking-[0.32em] uppercase text-white/40">
                    {subject}
                  </p>
                )}
              </div>

              {/* Honeypot */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                aria-hidden="true"
                style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0 }}
              />

              <div className="relative flex flex-col gap-5">
                <div>
                  <label className="block text-[10px] tracking-[0.32em] uppercase text-white/40 mb-2.5">Имя</label>
                  <input
                    data-testid="lead-popup-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Александр"
                    autoFocus
                    className="w-full bg-transparent border-b border-white/15 focus:border-white py-3 text-base outline-none placeholder:text-white/30 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] tracking-[0.32em] uppercase text-white/40 mb-2.5">Телефон</label>
                  <input
                    data-testid="lead-popup-phone"
                    value={phone}
                    onChange={(e) => setPhone(formatRuPhone(e.target.value))}
                    onFocus={() => { if (!phone) setPhone("+7 ("); }}
                    inputMode="tel"
                    maxLength={18}
                    placeholder="+7 (___) ___-__-__"
                    className="w-full bg-transparent border-b border-white/15 focus:border-white py-3 text-base outline-none placeholder:text-white/30 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] tracking-[0.32em] uppercase text-white/40 mb-2.5">Марка авто</label>
                  <input
                    data-testid="lead-popup-car"
                    value={car}
                    onChange={(e) => setCar(e.target.value)}
                    placeholder="BMW M3 Competition, 2024"
                    className="w-full bg-transparent border-b border-white/15 focus:border-white py-3 text-base outline-none placeholder:text-white/30 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={sending}
                data-testid="lead-popup-submit"
                className="relative group inline-flex items-center justify-center gap-4 px-6 py-4 bg-white text-black text-[11px] tracking-[0.3em] uppercase disabled:opacity-60 hover:bg-[#EDEDED] transition-all duration-300 shine"
              >
                {sending ? "Отправка…" : "Получить расчёт"}
                <span className="block w-8 h-px bg-current transition-all duration-500 group-hover:w-12" />
              </button>

              <p className="relative text-xs text-white/35 leading-relaxed">
                Без обязательств. Звоним и пишем только по делу.
                Отправляя форму, вы соглашаетесь на обработку персональных данных.
              </p>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
      <SuccessOverlay open={success} onClose={() => setSuccess(false)} />
    </>
  );
}
