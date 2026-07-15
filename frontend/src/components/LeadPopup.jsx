import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { getAnalyticsPayload } from "@/lib/analytics";
import { formatRuPhone, isValidRuPhone } from "@/lib/phone";
import SuccessOverlay from "@/components/SuccessOverlay";
import { useContent } from "@/context/ContentContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * Premium-минималистичный попап.
 * Режимы:
 *  - mode="form" (по умолчанию): сразу показывает форму имя/телефон/авто
 *  - mode="chooser": показывает 3 кнопки мессенджеров + "Оставить заявку".
 *    Клик по "Оставить заявку" переключает на форму.
 * Пропсы:
 *  - source: метка для CRM
 *  - subject: дополнительный контекст для message
 *  - title / subtitle: кастомные заголовки (override дефолтных)
 */
export default function LeadPopup({
  open,
  onClose,
  source = "popup",
  subject = "",
  mode = "form",
  title,
  subtitle,
}) {
  const { footer } = useContent();
  const [view, setView] = useState(mode);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [car, setCar] = useState("");
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  // Reset view every time popup opens
  useEffect(() => {
    if (open) setView(mode);
  }, [open, mode]);

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

  const chooserTitle = title || "Как вам удобнее?";
  const chooserSubtitle = subtitle || "Выберите мессенджер — ответим за 15 минут. Или оставьте заявку, и мы перезвоним сами.";
  const formTitle = title || "Оставьте контакты —";
  const formSubtitle = subtitle || "мы перезвоним за 15 минут.";

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            data-testid="lead-popup"
            role="dialog"
            aria-modal="true"
            aria-label={view === "chooser" ? chooserTitle : "Оставить заявку"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center px-4 py-8"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md bg-[#0A0A0A] border border-white/10 p-7 md:p-10 flex flex-col gap-7"
            >
              <div className="absolute inset-0 grain pointer-events-none" />

              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть"
                data-testid="lead-popup-close"
                className="absolute top-4 right-4 z-10 w-10 h-10 border border-white/10 hover:bg-white hover:text-black text-white/70 flex items-center justify-center transition-all"
              >
                <X size={16} strokeWidth={1.5} />
              </button>

              {/* Header */}
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <span className="block w-8 h-px bg-white/40" />
                  <span className="text-[10px] tracking-[0.4em] uppercase text-white/50">
                    {view === "chooser" ? "Записаться" : "Заявка"}
                  </span>
                </div>
                <h3 className="text-2xl md:text-3xl tracking-tighter font-medium leading-[1.05] text-white">
                  {view === "chooser" ? (
                    <>
                      {chooserTitle}
                      <br />
                      <span className="text-[#BDBDBD]">{chooserSubtitle}</span>
                    </>
                  ) : (
                    <>
                      {formTitle}
                      <br />
                      <span className="text-[#BDBDBD]">{formSubtitle}</span>
                    </>
                  )}
                </h3>
                {subject && view === "form" && (
                  <p className="mt-3 text-[10px] tracking-[0.32em] uppercase text-white/40">
                    {subject}
                  </p>
                )}
              </div>

              <AnimatePresence mode="wait" initial={false}>
                {view === "chooser" ? (
                  <motion.div
                    key="chooser"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="relative flex flex-col gap-3"
                  >
                    <MessengerButton
                      href={footer?.telegram_url}
                      label="Telegram"
                      sub="@autohaus_detailing"
                      testId="lead-popup-tg"
                      icon={<TelegramGlyph />}
                    />
                    <MessengerButton
                      href={footer?.whatsapp_url}
                      label="WhatsApp"
                      sub="+7 (929) 169-57-00"
                      testId="lead-popup-wa"
                      icon={<WhatsAppGlyph />}
                    />
                    <MessengerButton
                      href={footer?.max_url}
                      label="MAX"
                      sub="Мессенджер MAX"
                      testId="lead-popup-max"
                      icon={<img src="/img/max-logo.png" alt="" className="w-5 h-5 object-contain group-hover:invert transition-[filter] duration-300" />}
                    />

                    <div className="flex items-center gap-3 my-2">
                      <span className="flex-1 h-px bg-white/10" />
                      <span className="text-[10px] tracking-[0.4em] uppercase text-white/35">или</span>
                      <span className="flex-1 h-px bg-white/10" />
                    </div>

                    <button
                      type="button"
                      onClick={() => setView("form")}
                      data-testid="lead-popup-open-form"
                      className="group inline-flex items-center justify-between gap-4 px-6 py-4 bg-white text-black text-[11px] tracking-[0.3em] uppercase hover:bg-[#EDEDED] transition-all duration-300 shine"
                    >
                      Оставить заявку
                      <span className="block w-8 h-px bg-current transition-all duration-500 group-hover:w-12" />
                    </button>

                    <p className="relative mt-2 text-xs text-white/35 leading-relaxed">
                      Ответим сами — просто выберите удобный канал.
                    </p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={submit}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    data-testid="lead-popup-form"
                    className="relative flex flex-col gap-6"
                  >
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

                    <div className="flex flex-col gap-5">
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

                    {mode === "chooser" && (
                      <button
                        type="button"
                        onClick={() => setView("chooser")}
                        className="text-[10px] tracking-[0.3em] uppercase text-white/45 hover:text-white transition-colors self-start"
                      >
                        ← назад к мессенджерам
                      </button>
                    )}

                    <p className="text-xs text-white/35 leading-relaxed">
                      Без обязательств. Звоним и пишем только по делу.
                      Отправляя форму, вы соглашаетесь на обработку персональных данных.
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <SuccessOverlay open={success} onClose={() => setSuccess(false)} />
    </>
  );
}

function MessengerButton({ href, label, sub, icon, testId }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-testid={testId}
      className="group flex items-center gap-4 px-5 py-4 border border-white/15 hover:bg-white hover:text-black hover:border-white transition-all duration-300 text-white"
    >
      <span className="flex items-center justify-center w-10 h-10 shrink-0 border border-white/20 group-hover:border-black/40 transition-colors">
        {icon}
      </span>
      <span className="flex-1 min-w-0 flex flex-col text-left">
        <span className="text-[11px] tracking-[0.32em] uppercase font-medium">{label}</span>
        <span className="text-xs mt-0.5 text-white/45 group-hover:text-black/55 truncate">{sub}</span>
      </span>
      <span className="text-white/40 group-hover:text-black transition-colors">→</span>
    </a>
  );
}

function TelegramGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21.5 3.5L2.5 10.8c-.7.3-.7 1.3 0 1.5l4.7 1.6 1.7 5.6c.2.7 1 .9 1.5.3l2.6-2.7 4.7 3.4c.6.4 1.4.1 1.6-.6L23 4.7c.2-.9-.7-1.6-1.5-1.2z" />
      <path d="M7.2 13.9l10.8-8" />
      <path d="M7.2 13.9l3.7 3.1" />
    </svg>
  );
}

function WhatsAppGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 20.5l1.3-4A8.5 8.5 0 1 1 8 20l-5 .5z" />
      <path d="M8.5 9.2c.5 2.2 2.2 3.9 4.4 4.4l1.4-1.4a.9.9 0 0 1 1-.2l2 .8a.9.9 0 0 1 .6.9 3.6 3.6 0 0 1-3.6 3.4A7.6 7.6 0 0 1 6.6 9.2 3.6 3.6 0 0 1 10 5.6a.9.9 0 0 1 .9.6l.8 2a.9.9 0 0 1-.2 1L10 10.5" />
    </svg>
  );
}
