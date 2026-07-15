import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { getAnalyticsPayload } from "@/lib/analytics";
import { formatRuPhone, isValidRuPhone } from "@/lib/phone";
import SuccessOverlay from "@/components/SuccessOverlay";
import { useContent } from "@/context/ContentContext";
import { MEDIA } from "@/lib/mediaUrls";

const FILM_TYPES = [
  { id: "ppf", label: "Полиуретан (PPF)", price: 260000, sub: "Самовосстанавливающаяся защита 200 мкм" },
  { id: "vinyl", label: "Винил", price: 150000, sub: "Смена цвета. До 7 лет службы." },
  { id: "hybrid", label: "Hybrid PPF + Color", price: 320000, sub: "Защита + цвет в одной плёнке." },
];

const FINISHES = [
  { id: "gloss", label: "Глянец", mult: 1.0 },
  { id: "matte", label: "Мат", mult: 1.08 },
  { id: "satin", label: "Сатин", mult: 1.05 },
];

const COVERAGE = [
  { id: "front", label: "Зоны риска", mult: 0.45, sub: "Капот, бампер, фары, зеркала" },
  { id: "half", label: "Половина кузова", mult: 0.7, sub: "Передняя часть + двери" },
  { id: "full", label: "Полный кузов", mult: 1.0, sub: "Все внешние панели" },
];

const CAR_VARIANTS = {
  gloss: MEDIA.configurator.gloss,
  matte: MEDIA.configurator.matte,
  satin: MEDIA.configurator.satin,
  stealth: MEDIA.configurator.stealth,
};

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function fmt(n) {
  return new Intl.NumberFormat("ru-RU").format(Math.round(n));
}

export default function Configurator() {
  const { configurator: cfg } = useContent();
  const [film, setFilm] = useState(FILM_TYPES[0]);
  const [finish, setFinish] = useState(FINISHES[1]);
  const [coverage, setCoverage] = useState(COVERAGE[2]);
  const [antichrome, setAntichrome] = useState(true);
  const [darkout, setDarkout] = useState(false);
  const [headlights, setHeadlights] = useState(true);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const total = useMemo(() => {
    let t = film.price * finish.mult * coverage.mult;
    if (antichrome) t += 22000;
    if (darkout) t += 18000;
    if (headlights) t += 14000;
    return t;
  }, [film, finish, coverage, antichrome, darkout, headlights]);

  const handleSubmit = async (e) => {
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
        website, // honeypot — must be empty
        car: "—",
        message: "Заявка из конфигуратора",
        source: "configurator",
        configuration: {
          film: film.label,
          finish: finish.label,
          coverage: coverage.label,
          antichrome,
          darkout,
          headlights,
          estimated_price: Math.round(total),
        },
        ...getAnalyticsPayload(),
      });
      setName("");
      setPhone("");
      setSuccess(true);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 429) {
        toast.error("Слишком много запросов. Попробуйте через минуту.");
      } else {
        toast.error("Ошибка отправки. Попробуйте позже.");
      }
    } finally {
      setSending(false);
    }
  };

  const Toggle = ({ active, onChange, label, sub, testid }) => (
    <button
      type="button"
      onClick={() => onChange(!active)}
      data-testid={testid}
      className={`w-full text-left p-5 border transition-all duration-300 ${
        active
          ? "border-white bg-white text-black"
          : "border-white/15 bg-transparent text-white hover:border-white/40"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[12px] tracking-[0.22em] uppercase font-medium">{label}</div>
          {sub && (
            <div className={`mt-1 text-xs font-light ${active ? "text-black/70" : "text-white/50"}`}>
              {sub}
            </div>
          )}
        </div>
        <div
          className={`w-10 h-5 relative ${active ? "bg-black" : "bg-white/10"}`}
        >
          <span
            className={`absolute top-0.5 ${active ? "right-0.5 bg-white" : "left-0.5 bg-white"} w-4 h-4 transition-all duration-300`}
          />
        </div>
      </div>
    </button>
  );

  return (
    <section
      id="configurator"
      data-testid="configurator-section"
      className="relative w-full bg-[#050505] py-16 md:py-24 border-t border-white/5"
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-14">
          <div>
            <span className="text-[11px] tracking-[0.4em] uppercase text-white/50">
              {cfg.overline}
            </span>
            <h2 className="mt-4 text-4xl md:text-6xl lg:text-7xl tracking-tighter font-medium leading-[0.95]">
              {cfg.title_line_1}<br />
              {cfg.title_line_2}
            </h2>
          </div>
          <p className="text-[#BDBDBD] text-base md:text-lg leading-relaxed max-w-sm">
            {cfg.description}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">
          {/* LEFT — CONTROLS */}
          <div className="lg:col-span-7 bg-[#0A0A0A] border border-white/10 p-6 md:p-8 flex flex-col gap-8">
            {/* Film type */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] tracking-[0.32em] uppercase text-white/50">Тип плёнки</span>
                <span className="text-[10px] tracking-[0.28em] uppercase text-white/30">01</span>
              </div>
              <div className="space-y-2">
                {FILM_TYPES.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilm(f)}
                    data-testid={`film-${f.id}`}
                    className={`w-full text-left p-4 border transition-all duration-300 flex items-center justify-between ${
                      film.id === f.id
                        ? "border-white bg-white text-black"
                        : "border-white/15 hover:border-white/40 text-white"
                    }`}
                  >
                    <div>
                      <div className="text-sm font-medium">{f.label}</div>
                      <div className={`text-xs mt-0.5 font-light ${film.id === f.id ? "text-black/60" : "text-white/50"}`}>{f.sub}</div>
                    </div>
                    {film.id === f.id && <Check size={16} strokeWidth={2} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Finish */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] tracking-[0.32em] uppercase text-white/50">Финиш</span>
                <span className="text-[10px] tracking-[0.28em] uppercase text-white/30">02</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {FINISHES.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFinish(f)}
                    data-testid={`finish-${f.id}`}
                    className={`p-3 border text-[11px] tracking-[0.2em] uppercase transition-all duration-300 ${
                      finish.id === f.id
                        ? "bg-white text-black border-white"
                        : "border-white/15 text-white hover:border-white/40"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Coverage */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] tracking-[0.32em] uppercase text-white/50">Зона</span>
                <span className="text-[10px] tracking-[0.28em] uppercase text-white/30">03</span>
              </div>
              <div className="space-y-2">
                {COVERAGE.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCoverage(c)}
                    data-testid={`coverage-${c.id}`}
                    className={`w-full text-left p-4 border transition-all duration-300 ${
                      coverage.id === c.id
                        ? "border-white bg-white text-black"
                        : "border-white/15 hover:border-white/40 text-white"
                    }`}
                  >
                    <div className="text-sm font-medium">{c.label}</div>
                    <div className={`text-xs mt-0.5 font-light ${coverage.id === c.id ? "text-black/60" : "text-white/50"}`}>{c.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] tracking-[0.32em] uppercase text-white/50">Доп. опции</span>
                <span className="text-[10px] tracking-[0.28em] uppercase text-white/30">04</span>
              </div>
              <div className="space-y-2">
                <Toggle active={antichrome} onChange={setAntichrome} label="Антихром" sub="Все хром-элементы — в чёрный" testid="toggle-antichrome" />
                <Toggle active={darkout} onChange={setDarkout} label="Чёрные элементы" sub="Эмблемы, молдинги, шильдики" testid="toggle-darkout" />
                <Toggle active={headlights} onChange={setHeadlights} label="Бронирование оптики" sub="Защита фар плёнкой" testid="toggle-headlights" />
              </div>
            </div>

            {/* Current selection summary (subtle, in-card) */}
            <div className="border-t border-white/10 pt-5 flex flex-wrap items-center gap-2 text-[10px] tracking-[0.3em] uppercase text-white/55">
              <span className="text-white/40">Ваш выбор:</span>
              <span className="px-3 py-1.5 border border-white/15 bg-white/[0.03]">{film.label}</span>
              <span className="px-3 py-1.5 border border-white/15 bg-white/[0.03]">{finish.label}</span>
              <span className="px-3 py-1.5 border border-white/15 bg-white/[0.03]">{coverage.label}</span>
              {antichrome && <span className="px-3 py-1.5 border border-white/15 bg-white/[0.03]">Антихром</span>}
              {darkout && <span className="px-3 py-1.5 border border-white/15 bg-white/[0.03]">Чёрные элементы</span>}
              {headlights && <span className="px-3 py-1.5 border border-white/15 bg-white/[0.03]">Бронь оптики</span>}
            </div>
          </div>

          {/* RIGHT — INTENT + FORM (sticky) */}
          <aside className="lg:col-span-5 relative">
            <div className="lg:sticky lg:top-24 bg-[#0A0A0A] border border-white/10 p-6 md:p-8 lg:p-10 flex flex-col gap-8">
              {/* Header */}
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span className="block w-8 h-px bg-white/40" />
                  <span className="text-[10px] tracking-[0.4em] uppercase text-white/50">
                    Заявка на расчёт
                  </span>
                </div>
                <h3 className="text-2xl md:text-3xl lg:text-4xl tracking-tighter font-medium leading-[1.05] text-white">
                  {cfg.form_heading}
                </h3>
                <p className="mt-5 text-sm md:text-base text-[#BDBDBD] font-light leading-relaxed">
                  {cfg.form_description}
                </p>
              </div>

              {/* Trust strip */}
              <div className="grid grid-cols-3 gap-2 text-center border-y border-white/10 py-4">
                <div>
                  <div className="text-[10px] tracking-[0.3em] uppercase text-white/40">{cfg.trust_response_label}</div>
                  <div className="mt-1 text-sm font-medium tracking-tight">{cfg.trust_response_value}</div>
                </div>
                <div className="border-x border-white/10">
                  <div className="text-[10px] tracking-[0.3em] uppercase text-white/40">{cfg.trust_warranty_label}</div>
                  <div className="mt-1 text-sm font-medium tracking-tight">{cfg.trust_warranty_value}</div>
                </div>
                <div>
                  <div className="text-[10px] tracking-[0.3em] uppercase text-white/40">{cfg.trust_experience_label}</div>
                  <div className="mt-1 text-sm font-medium tracking-tight">{cfg.trust_experience_value}</div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

                <div>
                  <label className="block text-[10px] tracking-[0.32em] uppercase text-white/40 mb-3">Имя</label>
                  <input
                    data-testid="config-name-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Александр"
                    className="w-full bg-transparent border-b border-white/15 focus:border-white py-3 text-base outline-none placeholder:text-white/30 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] tracking-[0.32em] uppercase text-white/40 mb-3">Телефон</label>
                  <input
                    data-testid="config-phone-input"
                    value={phone}
                    onChange={(e) => setPhone(formatRuPhone(e.target.value))}
                    onFocus={() => { if (!phone) setPhone("+7 ("); }}
                    inputMode="tel"
                    maxLength={18}
                    placeholder="+7 (___) ___-__-__"
                    className="w-full bg-transparent border-b border-white/15 focus:border-white py-3 text-base outline-none placeholder:text-white/30 transition-colors"
                  />
                </div>

                <button
                  data-testid="config-submit"
                  type="submit"
                  disabled={sending}
                  className="mt-2 group inline-flex items-center justify-center gap-4 px-6 py-5 bg-white text-black text-[11px] tracking-[0.3em] uppercase hover:bg-[#EDEDED] disabled:opacity-60 transition-all duration-300 shine"
                >
                  {sending ? "Отправка…" : "Получить расчёт"}
                  <span className="block w-8 h-px bg-current transition-all duration-500 group-hover:w-12" />
                </button>

                <p className="text-xs text-white/35 leading-relaxed">
                  Отправляя форму, вы соглашаетесь на обработку персональных данных.
                  Точная цена формируется после диагностики кузова.
                </p>
              </form>
            </div>
          </aside>
        </div>
      </div>
      <SuccessOverlay open={success} onClose={() => setSuccess(false)} />
    </section>
  );
}
