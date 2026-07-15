import React, { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Check, ChevronLeft, ArrowRight, Gift, Shield, Sparkles, Lightbulb, Send, Phone } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useContent } from "@/context/ContentContext";
import { resolveMedia } from "@/lib/contentDefaults";
import { getAnalyticsPayload } from "@/lib/analytics";
import { formatRuPhone, isValidRuPhone } from "@/lib/phone";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// 5-step funnel crafted for high conversion. Each step is a single tap on mobile.
const STEPS = [
  {
    id: "type",
    label: "Какой автомобиль?",
    hint: "Подбираем толщину плёнки и зоны защиты",
    options: [
      { id: "sedan", title: "Седан / Купе", sub: "BMW 5, Mercedes C, Audi A4 …" },
      { id: "suv", title: "Кроссовер / SUV", sub: "X5, Q7, Cayenne, GLE …" },
      { id: "sport", title: "Спорткар", sub: "M, AMG, RS, Tesla Plaid …" },
      { id: "ev", title: "Электромобиль", sub: "Tesla, Lucid, Porsche Taycan …" },
    ],
  },
  {
    id: "goal",
    label: "Что для вас важнее?",
    hint: "Это определяет тип покрытия",
    options: [
      { id: "ppf", title: "Защита от сколов", sub: "Полиуретан PPF, 200 мкм, самовосстановление" },
      { id: "color", title: "Смена цвета", sub: "Винил: мат, сатин, металлик" },
      { id: "antichrome", title: "Чёрные элементы", sub: "Антихром, dark-out" },
      { id: "advise", title: "Не знаю — посоветуйте", sub: "Бесплатная консультация Максима" },
    ],
  },
  {
    id: "coverage",
    label: "Какую зону покрываем?",
    hint: "От этого зависит стоимость и срок",
    options: [
      { id: "risk", title: "Только зоны риска", sub: "Капот, бампер, фары, зеркала" },
      { id: "half", title: "Половина кузова", sub: "Передняя часть + двери" },
      { id: "full", title: "Полный кузов", sub: "Все внешние панели" },
      { id: "parts", title: "Отдельные детали", sub: "Решим после диагностики" },
    ],
  },
  {
    id: "urgency",
    label: "Когда планируете?",
    hint: "Подскажем ближайшее окно в загрузке цеха",
    options: [
      { id: "this_week", title: "На этой неделе", sub: "Быстрый старт, нужно срочно" },
      { id: "this_month", title: "В течение месяца", sub: "Спокойно выберем дату" },
      { id: "later", title: "Планирую заранее", sub: "Просто узнаю стоимость" },
    ],
  },
];

const BONUS_ICONS = { shield: Shield, spray: Sparkles, headlight: Lightbulb };

function StepHeader({ index, total, label, hint }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[10px] tracking-[0.4em] uppercase text-white/40">
          Шаг {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>
      <h3 className="text-2xl md:text-4xl tracking-tighter font-medium leading-[1.05] text-white">
        {label}
      </h3>
      {hint && (
        <p className="mt-3 text-sm md:text-base text-[#BDBDBD] font-light leading-relaxed">
          {hint}
        </p>
      )}
    </div>
  );
}

function OptionCard({ option, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`quiz-option-${option.id}`}
      className={`group relative w-full text-left p-5 md:p-6 border transition-all duration-300 overflow-hidden ${
        active
          ? "bg-white text-black border-white shadow-[0_0_40px_rgba(255,255,255,0.18)]"
          : "bg-[#0A0A0A] border-white/10 hover:border-white/40 text-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="text-base md:text-lg tracking-tight font-medium">{option.title}</div>
          {option.sub && (
            <div className={`mt-1.5 text-xs md:text-sm font-light leading-relaxed ${active ? "text-black/60" : "text-white/45"}`}>
              {option.sub}
            </div>
          )}
        </div>
        <span
          className={`flex-shrink-0 w-7 h-7 border flex items-center justify-center transition-all ${
            active ? "border-black bg-black text-white" : "border-white/20 group-hover:border-white/50"
          }`}
        >
          {active ? <Check size={14} strokeWidth={2.5} /> : null}
        </span>
      </div>
    </button>
  );
}

function ProgressBar({ progress }) {
  return (
    <div className="h-px w-full bg-white/10 overflow-hidden">
      <motion.div
        animate={{ scaleX: progress }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ originX: 0 }}
        className="h-full w-full bg-white/80"
      />
    </div>
  );
}

function ExpertCard({ q, contextKey }) {
  const message = (q.step_messages && q.step_messages[contextKey]) || q.expert_quote;
  return (
    <aside data-testid="quiz-expert" className="relative bg-[#0A0A0A] border border-white/10 flex flex-col h-full">
      {/* Top trust ribbon */}
      <div className="px-5 md:px-6 py-4 flex items-center justify-between text-[10px] tracking-[0.4em] uppercase text-white/65 border-b border-white/10">
        <span className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-60 animate-ping" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
          </span>
          Online
        </span>
        <span className="hidden md:inline">{q.trust_badge}</span>
      </div>

      {/* Manager identity row */}
      <div className="px-5 md:px-6 pt-5 pb-4 flex items-center gap-4 border-b border-white/10">
        <div className="relative w-14 h-14 md:w-16 md:h-16 shrink-0 overflow-hidden border border-white/15 bg-black">
          <img
            src={resolveMedia(q.expert_image)}
            alt={`${q.expert_name} — ${q.expert_role}`}
            className="absolute inset-0 w-full h-full object-cover grayscale"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] tracking-[0.32em] uppercase text-white/45 mb-1 truncate">
            {q.expert_role}
          </div>
          <div className="text-lg md:text-xl tracking-tight font-medium text-white">
            {q.expert_name}
          </div>
        </div>
      </div>

      {/* Chat area — grows to fill, pushes footer to bottom */}
      <div className="px-5 md:px-6 py-5 md:py-6 flex-1 flex flex-col">
        <div className="text-[10px] tracking-[0.32em] uppercase text-white/35 mb-3">
          {q.expert_name} пишет:
        </div>

        {/* Bubble + arrow */}
        <div className="relative">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={contextKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-white/[0.04] border border-white/10 px-4 py-4 md:px-5 md:py-5 text-sm md:text-[15px] text-[#DCDCDC] font-light leading-relaxed"
            >
              {/* Top-left bubble tail */}
              <span
                aria-hidden="true"
                className="absolute -top-1.5 left-6 w-3 h-3 bg-white/[0.04] border-l border-t border-white/10 rotate-45"
              />
              {message}
            </motion.div>
          </AnimatePresence>

          {/* Thin curved arrow → from top-right of bubble to just above letter "К" of question heading (desktop only) */}
          <svg
            aria-hidden="true"
            className="hidden lg:block absolute pointer-events-none text-white/90"
            style={{
              top: "-120px",
              right: 0,
              transform: "translate(100%, 0)",
              width: "120px",
              height: "200px",
              overflow: "visible",
              zIndex: 30,
            }}
            viewBox="0 0 120 200"
            fill="none"
          >
            {/* Arc starts EXACTLY at bubble's top-right corner (0, 120), sweeps up and right, descends just above the "К" letter (~64, 56) */}
            <path
              d="M 0 120 C 0 30, 50 5, 64 56"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Down-pointing arrowhead */}
            <path
              d="M 57 48 L 64 60 L 71 46"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>

        {/* Footer block — pinned to bottom */}
        <div className="mt-auto pt-6">
          {/* Stats strip */}
          <div className="grid grid-cols-3 border-t border-white/10 pt-4 gap-2 md:gap-3">
            {[
              { v: q.expert_stat_1_value, l: q.expert_stat_1_label },
              { v: q.expert_stat_2_value, l: q.expert_stat_2_label },
              { v: q.expert_stat_3_value, l: q.expert_stat_3_label },
            ].map((s, i) => (
              <div key={i} className={i === 1 ? "border-x border-white/10 px-2 md:px-3" : ""}>
                <div className="text-sm md:text-lg tracking-tighter font-medium text-white leading-none truncate">{s.v}</div>
                <div className="mt-1.5 text-[9px] tracking-[0.18em] md:tracking-[0.28em] uppercase text-white/45 leading-tight">{s.l}</div>
              </div>
            ))}
          </div>

          {/* Call button */}
          {q.call_phone_link ? (
            <a
              href={`tel:${q.call_phone_link}`}
              data-testid="quiz-call"
              className="group mt-5 inline-flex w-full items-center justify-between gap-3 px-5 py-3.5 border border-white/15 hover:border-white/40 hover:bg-white hover:text-black text-[10px] tracking-[0.3em] uppercase transition-all"
            >
              <span className="flex items-center gap-3">
                <Phone size={14} strokeWidth={1.5} />
                {q.call_button_label || "Позвонить"}
              </span>
              <span className="text-white/45 group-hover:text-black/60 normal-case tracking-normal text-xs">
                {q.call_phone_display}
              </span>
            </a>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

function ContactStep({ q, answers, name, setName, phone, setPhone, bonusId, setBonusId }) {
  return (
    <div className="flex flex-col gap-6">
      <StepHeader
        index={4}
        total={5}
        label="Куда прислать расчёт?"
        hint={`${q.expert_name || "Наш мастер"} пришлёт результат в Telegram и перезвонит за 15 минут`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-[10px] tracking-[0.32em] uppercase text-white/40 mb-2.5">Имя</label>
          <input
            data-testid="quiz-name"
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
            data-testid="quiz-phone"
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

      {/* Bonus picker — the conversion magnet */}
      <div className="mt-3 border border-white/10 bg-[#070707] p-5 md:p-6">
        <div className="flex items-center gap-3 mb-4">
          <Gift size={16} strokeWidth={1.5} className="text-white" />
          <span className="text-[10px] tracking-[0.32em] uppercase text-white/65">
            {q.bonus_overline}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(q.bonuses || []).map((b) => {
            const Icon = BONUS_ICONS[b.icon] || Gift;
            const active = bonusId === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setBonusId(b.id)}
                data-testid={`quiz-bonus-${b.id}`}
                className={`group text-left p-4 border transition-all duration-300 ${
                  active
                    ? "bg-white text-black border-white"
                    : "bg-transparent border-white/15 hover:border-white/40 text-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <Icon size={20} strokeWidth={1.5} />
                  {active && <Check size={14} strokeWidth={2.5} />}
                </div>
                <div className="mt-4 text-sm font-medium tracking-tight">{b.title}</div>
                <div className={`mt-1 text-xs font-light leading-relaxed ${active ? "text-black/60" : "text-white/45"}`}>{b.sub}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ThanksStep({ q, name, bonus }) {
  return (
    <div className="flex flex-col gap-6 items-start" data-testid="quiz-thanks">
      <span className="text-[10px] tracking-[0.4em] uppercase text-white/40">Готово</span>
      <h3 className="text-3xl md:text-5xl tracking-tighter font-medium leading-[1.0] text-white">
        {q.thanks_title}{name ? `, ${name}` : ""}.
      </h3>
      <p className="text-base md:text-lg text-[#BDBDBD] font-light leading-relaxed max-w-lg">
        {q.thanks_subtitle}
      </p>
      {bonus && (
        <div className="border border-white/15 p-5 md:p-6 flex items-start gap-4 bg-white/[0.03]">
          <Gift size={20} strokeWidth={1.5} className="text-white shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] tracking-[0.32em] uppercase text-white/45 mb-1">Ваш бонус</div>
            <div className="text-base text-white font-medium">{bonus.title}</div>
            <div className="text-xs text-white/55 mt-1 font-light">{bonus.sub}</div>
          </div>
        </div>
      )}
      <a
        href={q.thanks_telegram_url || "#"}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="quiz-telegram"
        className="group inline-flex items-center gap-4 px-6 py-4 bg-white text-black text-[11px] tracking-[0.3em] uppercase hover:bg-[#EDEDED] transition-all shine"
      >
        <Send size={14} strokeWidth={1.5} />
        {q.thanks_telegram_label}
        <span className="block w-8 h-px bg-current transition-all duration-500 group-hover:w-12" />
      </a>
    </div>
  );
}

export default function Quiz() {
  const { quiz: q } = useContent();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bonusId, setBonusId] = useState("glass");
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const totalSteps = STEPS.length + 1; // 4 questions + 1 contact step
  const progress = done ? 1 : Math.min(1, (step + (step === STEPS.length ? 0.5 : 0)) / totalSteps);

  const select = (option) => {
    const stepDef = STEPS[step];
    setAnswers((prev) => ({ ...prev, [stepDef.id]: option }));
    // Auto-advance after a short delay so the user sees their choice
    setTimeout(() => setStep((s) => Math.min(s + 1, STEPS.length)), 320);
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  const submit = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error("Заполните имя и телефон");
      return;
    }
    if (!isValidRuPhone(phone)) {
      toast.error("Введите корректный номер: +7 и ещё 10 цифр");
      return;
    }
    setSending(true);
    const chosenBonus = (q.bonuses || []).find((b) => b.id === bonusId);
    const config = {
      car_type: answers.type?.title,
      goal: answers.goal?.title,
      coverage: answers.coverage?.title,
      urgency: answers.urgency?.title,
      bonus: chosenBonus?.title,
    };
    try {
      await axios.post(`${API}/leads`, {
        name,
        phone,
        car: answers.type?.title || "",
        message: "Заявка из квиза",
        source: "quiz",
        configuration: config,
        website,
        ...getAnalyticsPayload(),
      });
      setDone(true);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 429) toast.error("Слишком много запросов. Попробуйте через минуту.");
      else toast.error("Ошибка отправки. Попробуйте позже.");
    } finally {
      setSending(false);
    }
  };

  const selectedBonus = useMemo(() => (q.bonuses || []).find((b) => b.id === bonusId), [q.bonuses, bonusId]);
  const stepDef = STEPS[step];
  const isContactStep = step === STEPS.length && !done;
  const canSubmit = name.trim() && phone.trim();

  // Determine which chat message the expert shows
  const contextKey = done ? "thanks" : isContactStep ? "contact" : stepDef.id;

  return (
    <section
      ref={ref}
      id="quiz"
      data-testid="quiz-section"
      className="relative w-full bg-black py-16 md:py-24 border-t border-white/5"
    >
      {/* HEADER */}
      <div className="mx-auto max-w-[1240px] px-6 md:px-10 mb-10 md:mb-14">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <span className="text-[11px] tracking-[0.4em] uppercase text-white/50">
              {q.overline}
            </span>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              data-testid="quiz-heading"
              className="mt-4 text-4xl md:text-6xl lg:text-7xl tracking-tighter font-medium leading-[0.95]"
            >
              {q.title_line_1}<br />
              <span className="text-[#BDBDBD]">{q.title_line_2}</span>
            </motion.h2>
          </div>
          <p className="text-[#BDBDBD] text-base md:text-lg leading-relaxed max-w-sm">
            {q.description}
          </p>
        </div>
      </div>

      {/* BODY: expert | quiz — balanced, centered */}
      <div className="mx-auto max-w-[1240px] px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-stretch">
          {/* Expert / manager sidebar */}
          <div className="lg:col-span-5 relative z-20">
            <ExpertCard q={q} contextKey={contextKey} />
          </div>

          {/* Quiz card */}
          <div className="lg:col-span-7 relative z-10 bg-[#0A0A0A] border border-white/10 p-6 md:p-10 flex flex-col min-h-[520px]">
            {/* Progress */}
            <ProgressBar progress={progress} />

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

            <div className="flex-1 mt-8 md:mt-10">
              <AnimatePresence mode="wait" initial={false}>
                {done ? (
                  <motion.div
                    key="thanks"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <ThanksStep q={q} name={name.trim()} bonus={selectedBonus} />
                  </motion.div>
                ) : isContactStep ? (
                  <motion.div
                    key="contact"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <ContactStep
                      q={q}
                      answers={answers}
                      name={name}
                      setName={setName}
                      phone={phone}
                      setPhone={setPhone}
                      bonusId={bonusId}
                      setBonusId={setBonusId}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key={`step-${step}`}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col gap-6"
                  >
                    <StepHeader index={step} total={totalSteps} label={stepDef.label} hint={stepDef.hint} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {stepDef.options.map((opt) => (
                        <OptionCard
                          key={opt.id}
                          option={opt}
                          active={answers[stepDef.id]?.id === opt.id}
                          onClick={() => select(opt)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer controls */}
            {!done && (
              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between gap-4">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={back}
                    data-testid="quiz-back"
                    className="inline-flex items-center gap-2 text-[10px] tracking-[0.32em] uppercase text-white/55 hover:text-white transition-colors"
                  >
                    <ChevronLeft size={14} strokeWidth={1.5} />
                    Назад
                  </button>
                ) : (
                  <span className="text-[10px] tracking-[0.32em] uppercase text-white/35">Бесплатно · 90 секунд</span>
                )}

                {isContactStep ? (
                  <button
                    type="button"
                    onClick={submit}
                    disabled={sending || !canSubmit}
                    data-testid="quiz-submit"
                    className="group inline-flex items-center gap-4 px-5 py-3 md:px-6 md:py-4 bg-white text-black text-[10px] md:text-[11px] tracking-[0.3em] uppercase disabled:opacity-40 hover:bg-[#EDEDED] transition-all shine"
                  >
                    {sending ? "Отправка…" : "Получить расчёт"}
                    <ArrowRight size={14} strokeWidth={1.5} />
                  </button>
                ) : (
                  <span className="text-[10px] tracking-[0.32em] uppercase text-white/40">
                    Выберите вариант — продолжим
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
