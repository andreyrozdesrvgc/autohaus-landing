import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useContent } from "@/context/ContentContext";
import { formatRuPhone, isValidRuPhone } from "@/lib/phone";
import { getAnalyticsPayload } from "@/lib/analytics";
import SuccessOverlay from "@/components/SuccessOverlay";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const SESSION_KEY = "autohaus_exit_intent_shown";

export default function ExitIntentPopup() {
  const { exit_intent: ei } = useContent();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const triggered = useRef(false);

  useEffect(() => {
    if (!ei || ei.enabled === false) return;
    // Disable on the admin pages
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) return;
    if (sessionStorage.getItem(SESSION_KEY) === "1") return;

    const minDelay = (ei.delay_seconds ?? 10) * 1000;
    const mountedAt = Date.now();

    const trigger = () => {
      if (triggered.current) return;
      if (Date.now() - mountedAt < minDelay) return;
      triggered.current = true;
      sessionStorage.setItem(SESSION_KEY, "1");
      setOpen(true);
    };

    // Desktop: mouse leaves toward URL bar
    const onMouseOut = (e) => {
      if (e.clientY <= 0 && (!e.relatedTarget && !e.toElement)) trigger();
    };

    // Mobile: page goes hidden (tab switch / minimize) — secondary trigger
    let mobileTimer;
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        mobileTimer = setTimeout(() => {
          // Fire on return only — don't show right when hidden
          if (document.visibilityState === "visible") trigger();
        }, 200);
      } else if (document.visibilityState === "visible" && mobileTimer == null) {
        // user just came back, give them a moment then trigger
        setTimeout(trigger, 600);
      }
    };

    // Back-button on mobile / desktop
    const onPopState = () => trigger();

    document.addEventListener("mouseout", onMouseOut);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("popstate", onPopState);
    // Push a dummy state so a back press fires popstate without leaving the site
    try {
      if (!window.history.state || window.history.state.__exitGuard !== true) {
        window.history.pushState({ __exitGuard: true }, "");
      }
    } catch {}

    return () => {
      document.removeEventListener("mouseout", onMouseOut);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("popstate", onPopState);
    };
  }, [ei]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

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
        message: "Exit-intent: + бонус «Защита стёкол»",
        source: "exit_intent",
        configuration: { bonus: "Защита стёкол · ₽5 000" },
        website,
        ...getAnalyticsPayload(),
      });
      setName(""); setPhone("");
      setOpen(false);
      setSuccess(true);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 429) toast.error("Слишком много запросов. Попробуйте через минуту.");
      else toast.error("Ошибка отправки. Попробуйте позже.");
    } finally {
      setSending(false);
    }
  };

  if (!ei) return null;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            data-testid="exit-intent-popup"
            role="dialog"
            aria-modal="true"
            aria-label="Подождите — подарок"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[120] bg-black/92 backdrop-blur-md flex items-center justify-center px-4 py-8"
          >
            <motion.form
              onSubmit={submit}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-lg bg-[#0A0A0A] border border-white/10 p-7 md:p-10 flex flex-col gap-6"
            >
              <div className="absolute inset-0 grain pointer-events-none" />

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Закрыть"
                data-testid="exit-intent-close"
                className="absolute top-4 right-4 w-10 h-10 border border-white/10 hover:bg-white hover:text-black text-white/70 flex items-center justify-center transition-all"
              >
                <X size={16} strokeWidth={1.5} />
              </button>

              <div className="relative flex items-center gap-3">
                <span className="inline-flex w-10 h-10 items-center justify-center border border-white/15 bg-white/[0.04]">
                  <Gift size={18} strokeWidth={1.5} />
                </span>
                <span className="text-[10px] tracking-[0.4em] uppercase text-white/55">
                  Только сейчас
                </span>
              </div>

              <div className="relative">
                <h3 className="text-3xl md:text-4xl tracking-tighter font-medium leading-[1.0] text-white">
                  {ei.title_line_1}<br />
                  <span className="text-[#BDBDBD]">{ei.title_line_2}</span>
                </h3>
                <p className="mt-4 text-sm md:text-base text-[#BDBDBD] font-light leading-relaxed">
                  {ei.description}
                </p>
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
                    data-testid="exit-name"
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
                    data-testid="exit-phone"
                    value={phone}
                    onChange={(e) => setPhone(formatRuPhone(e.target.value))}
                    onFocus={() => { if (!phone) setPhone("+7 ("); }}
                    inputMode="tel"
                    maxLength={18}
                    placeholder="+7 (___) ___-__-__"
                    className="w-full bg-transparent border-b border-white/15 focus:border-white py-3 text-base outline-none placeholder:text-white/30 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={sending}
                data-testid="exit-submit"
                className="relative group inline-flex items-center justify-between gap-4 px-6 py-4 bg-white text-black text-[11px] tracking-[0.3em] uppercase disabled:opacity-60 hover:bg-[#EDEDED] transition-all duration-300 shine"
              >
                {sending ? "Отправка…" : ei.submit_label}
                <span className="block w-8 h-px bg-current transition-all duration-500 group-hover:w-12" />
              </button>

              <p className="relative text-xs text-white/35 leading-relaxed">
                {ei.consent}
              </p>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
      <SuccessOverlay open={success} onClose={() => setSuccess(false)} />
    </>
  );
}
