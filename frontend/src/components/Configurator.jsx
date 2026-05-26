import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { getAnalyticsPayload } from "@/lib/analytics";
import SuccessOverlay from "@/components/SuccessOverlay";

const FILM_TYPES = [
  { id: "ppf", label: "Полиуретан (PPF)", price: 260000, sub: "Самовосстанавливающаяся защита 200 мкм" },
  { id: "vinyl", label: "Винил", price: 150000, sub: "Смена цвета. До 7 лет службы." },
  { id: "hybrid", label: "Hybrid PPF + Color", price: 320000, sub: "Защита + цвет в одной плёнке." },
];

const FINISHES = [
  { id: "gloss", label: "Глянец", mult: 1.0 },
  { id: "matte", label: "Мат", mult: 1.08 },
  { id: "satin", label: "Сатин", mult: 1.05 },
  { id: "stealth", label: "Stealth", mult: 1.15 },
];

const COVERAGE = [
  { id: "front", label: "Зоны риска", mult: 0.45, sub: "Капот, бампер, фары, зеркала" },
  { id: "half", label: "Половина кузова", mult: 0.7, sub: "Передняя часть + двери" },
  { id: "full", label: "Полный кузов", mult: 1.0, sub: "Все внешние панели" },
];

const CAR_VARIANTS = {
  gloss: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=2000&q=85",
  matte: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2000&q=85",
  satin: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=2000&q=85",
  stealth: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=2000&q=85",
};

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function fmt(n) {
  return new Intl.NumberFormat("ru-RU").format(Math.round(n));
}

export default function Configurator() {
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
              004 — Configurator
            </span>
            <h2 className="mt-4 text-4xl md:text-6xl lg:text-7xl tracking-tighter font-medium leading-[0.95]">
              Соберите свой<br />
              автомобиль в новом цвете.
            </h2>
          </div>
          <p className="text-[#BDBDBD] text-base md:text-lg leading-relaxed max-w-sm">
            Выберите тип плёнки, финиш и зону оклейки. Видите результат в
            реальном времени — точная цена после диагностики.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">
          {/* PREVIEW — floating composition, more negative space */}
          <div className="lg:col-span-6 relative bg-[#0A0A0A] border border-white/10 overflow-hidden">
            {/* Subtle radial spotlight for floating effect */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 60% 60% at 50% 60%, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 60%)",
              }}
            />
            <div className="relative aspect-[16/11] lg:aspect-auto lg:h-full lg:min-h-[460px] flex items-center justify-center p-8 md:p-10">
              {/* Floating car image with halo glow */}
              <div className="relative w-full max-w-[520px]">
                <div
                  className="absolute -inset-10 pointer-events-none opacity-70"
                  style={{
                    background:
                      "radial-gradient(ellipse at center, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%)",
                  }}
                />
                <motion.img
                  key={finish.id}
                  src={CAR_VARIANTS[finish.id]}
                  alt="Car preview"
                  initial={{ opacity: 0, scale: 1.04, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  className={`relative w-full h-auto object-contain grayscale ${
                    darkout ? "brightness-[0.65] contrast-110" : ""
                  } ${finish.id === "matte" ? "contrast-110" : ""}`}
                  style={{ aspectRatio: "16/10" }}
                />
                {/* Soft reflection underneath */}
                <div
                  className="absolute left-1/2 bottom-[-6%] -translate-x-1/2 w-[70%] h-3 rounded-[50%] blur-md"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                />
              </div>
            </div>
            <div className="absolute inset-0 grain pointer-events-none" />

            {/* Top meta */}
            <div className="absolute top-6 left-6 right-6 flex items-start justify-between">
              <div>
                <div className="text-[10px] tracking-[0.4em] uppercase text-white/50">Preview</div>
                <div className="mt-2 text-xl md:text-2xl tracking-tight font-medium">
                  {film.label}
                </div>
                <div className="text-[#BDBDBD] text-xs md:text-sm mt-1">
                  {finish.label} · {coverage.label}
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2 px-3 py-2 border border-white/20 backdrop-blur-md bg-black/40 text-[10px] tracking-[0.3em] uppercase">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                Live preview
              </div>
            </div>

            {/* Bottom option chips */}
            <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-center gap-2 text-[10px] tracking-[0.3em] uppercase text-white/60">
              {antichrome && <span className="px-3 py-2 border border-white/20 bg-black/40">Антихром</span>}
              {darkout && <span className="px-3 py-2 border border-white/20 bg-black/40">Чёрные элементы</span>}
              {headlights && <span className="px-3 py-2 border border-white/20 bg-black/40">Бронь оптики</span>}
            </div>
          </div>

          {/* CONTROLS */}
          <div className="lg:col-span-6 bg-[#0A0A0A] border border-white/10 p-6 md:p-8 flex flex-col gap-8">
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
              <div className="grid grid-cols-4 gap-2">
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
          </div>

          {/* SUMMARY + FORM */}
          <div className="lg:col-span-12 bg-[#0A0A0A] border border-white/10 p-6 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
              <div className="md:col-span-5">
                <div className="text-[11px] tracking-[0.32em] uppercase text-white/50 mb-3">
                  Заявка на расчёт
                </div>
                <div className="text-2xl md:text-3xl tracking-tight font-medium leading-tight text-white">
                  Получите персональное предложение в течение&nbsp;30&nbsp;минут.
                </div>
                <p className="mt-4 text-sm text-white/50 max-w-sm font-light leading-relaxed">
                  Точная цена формируется после диагностики кузова и согласования
                  плёнки. Срок работ — 5–14 дней.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="md:col-span-7 grid grid-cols-1 md:grid-cols-7 gap-3">
                {/* Honeypot — hidden from real users, bots tend to fill it */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "-9999px",
                    width: "1px",
                    height: "1px",
                    opacity: 0,
                  }}
                />
                <input
                  data-testid="config-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Имя"
                  className="md:col-span-2 bg-transparent border-b border-white/15 focus:border-white px-2 py-4 text-sm tracking-wide outline-none transition-colors duration-300 placeholder:text-white/40"
                />
                <input
                  data-testid="config-phone-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (___) ___-__-__"
                  className="md:col-span-3 bg-transparent border-b border-white/15 focus:border-white px-2 py-4 text-sm tracking-wide outline-none transition-colors duration-300 placeholder:text-white/40"
                />
                <button
                  data-testid="config-submit"
                  type="submit"
                  disabled={sending}
                  className="md:col-span-2 group inline-flex items-center justify-center gap-3 px-6 py-4 bg-white text-black text-[11px] tracking-[0.3em] uppercase hover:bg-[#EDEDED] disabled:opacity-60 transition-all duration-300 shine"
                >
                  {sending ? "Отправка…" : "Получить расчёт"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <SuccessOverlay open={success} onClose={() => setSuccess(false)} />
    </section>
  );
}
