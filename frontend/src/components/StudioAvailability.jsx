import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useContent } from "@/context/ContentContext";
import LeadPopup from "@/components/LeadPopup";

/**
 * Загруженность студии сегодня.
 *
 * Логика чисел: детерминированный псевдо-рандом по дате (все посетители
 * в один и тот же день видят одинаковые значения; каждое утро — новые).
 *   - free_slots:      1..free_slots_max      (по умолчанию 1..2)
 *   - cars_in_work:    cars_min..cars_max     (по умолчанию 3..6)
 *
 * Бонус: таймер обратного отсчёта в минутах. Стартует при первом заходе,
 * сохраняется в localStorage до "сгорания". Когда истёк — бонус исчезает.
 */
export default function StudioAvailability() {
  const content = useContent();
  const cfg = content?.studio_availability || {};
  const isVisible = cfg.visible !== false;

  const [popupOpen, setPopupOpen] = useState(false);
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, margin: "-15%" });

  // ── Ежедневные числа (детерминированно от даты) ────────────────────
  const { freeSlots, freeSlotsMax, carsInWork, carsMax } = useMemo(() => {
    const freeMax = Math.max(1, Number(cfg.free_slots_max) || 2);
    const carsMinRaw = Math.max(1, Number(cfg.cars_in_work_min) || 3);
    const carsMaxRaw = Math.max(carsMinRaw, Number(cfg.cars_in_work_max) || 6);

    // Простой хэш от YYYY-MM-DD → стабилен весь день
    const today = new Date();
    const dateKey =
      today.getUTCFullYear() * 10000 +
      (today.getUTCMonth() + 1) * 100 +
      today.getUTCDate();
    // xorshift-like чтобы разброс был не последовательный
    const seed = (dateKey ^ 0x9e3779b9) >>> 0;
    const rnd1 = (seed * 2654435761) >>> 0;
    const rnd2 = (rnd1 * 40503) >>> 0;

    const free = 1 + (rnd1 % freeMax);
    const inWork = carsMinRaw + (rnd2 % (carsMaxRaw - carsMinRaw + 1));
    return {
      freeSlots: free,
      freeSlotsMax: freeMax,
      carsInWork: inWork,
      carsMax: carsMaxRaw,
    };
  }, [cfg.free_slots_max, cfg.cars_in_work_min, cfg.cars_in_work_max]);

  // ── Бонус + таймер ────────────────────────────────────────────────
  const bonusEnabled = cfg.bonus_enabled !== false && Boolean(cfg.bonus_title);
  const bonusMinutes = Math.max(1, Number(cfg.bonus_minutes) || 30);
  const bonusKey = `autohaus_bonus_${bonusMinutes}_${cfg.bonus_title || "default"}`;

  const [secondsLeft, setSecondsLeft] = useState(bonusMinutes * 60);

  useEffect(() => {
    if (!bonusEnabled) return undefined;
    const now = Date.now();
    let expiry = Number(localStorage.getItem(bonusKey));
    if (!expiry || expiry < now) {
      expiry = now + bonusMinutes * 60 * 1000;
      localStorage.setItem(bonusKey, String(expiry));
    }
    const tick = () => {
      const rest = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      setSecondsLeft(rest);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [bonusEnabled, bonusKey, bonusMinutes]);

  const bonusActive = bonusEnabled && secondsLeft > 0;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  // ── Тексты (CMS-editable) ──────────────────────────────────────────
  const overline = cfg.overline || "002 — Live status";
  const title_1 = cfg.title_line_1 || "Загруженность";
  const title_2_grey = cfg.title_line_2_grey || "студии";
  const title_2_white = cfg.title_line_2_white || " сегодня.";
  const description =
    cfg.description ||
    "Работаем без спешки — каждому автомобилю уделяем внимание, которого он заслуживает. Проверьте свободные окна на завтра и забронируйте.";

  const free_slots_label = cfg.free_slots_label || "свободное окно";
  const free_slots_label_plural = cfg.free_slots_label_plural || "свободных окна";
  const free_slots_when = cfg.free_slots_when || "на завтра";
  const cars_in_work_label_one = cfg.cars_in_work_label_one || "автомобиль в работе";
  const cars_in_work_label_few = cfg.cars_in_work_label_few || "автомобиля в работе";
  const cars_in_work_label_many =
    cfg.cars_in_work_label_many || cfg.cars_in_work_label || "автомобилей в работе";
  const posts_total_label = cfg.posts_total_label || `из ${carsMax} боксов заняты`;

  const cta_label = cfg.cta_label || "Забронировать дату";
  const cta_note = cfg.cta_note || "Оставьте заявку — мастер подберёт удобное окно и перезвонит за 15 минут.";

  const bonus_overline = cfg.bonus_overline || "Специальное предложение";
  const bonus_title = cfg.bonus_title || "Керамика фар в подарок";
  const bonus_sub =
    cfg.bonus_sub || "При заказе полной оклейки PPF на кузов до конца дня.";
  const bonus_expire_label = cfg.bonus_expire_label || "Предложение сгорает через";

  const freeSlotsWord =
    freeSlots === 1 ? free_slots_label : free_slots_label_plural;

  // Русская плюрализация для "автомобиль"
  //   1  → автомобиль
  //   2-4 → автомобиля
  //   5-6, 11-14 → автомобилей
  const pluralizeCar = (n) => {
    const mod100 = n % 100;
    const mod10 = n % 10;
    if (mod100 >= 11 && mod100 <= 14) return cars_in_work_label_many;
    if (mod10 === 1) return cars_in_work_label_one;
    if (mod10 >= 2 && mod10 <= 4) return cars_in_work_label_few;
    return cars_in_work_label_many;
  };
  const carsInWorkWord = pluralizeCar(carsInWork);

  const loadPercent = Math.min(
    100,
    Math.round((carsInWork / Math.max(carsMax, carsInWork)) * 100)
  );

  // Секция может быть отключена в CMS — рендерим null после всех хуков.
  if (!isVisible) return null;

  return (
    <section
      id="studio-availability"
      ref={sectionRef}
      data-testid="studio-availability-section"
      className="relative w-full bg-black text-white py-20 md:py-28 border-t border-white/5 overflow-hidden"
    >
      {/* фоновый шум */}
      <div className="absolute inset-0 grain pointer-events-none opacity-40" />

      <div className="relative mx-auto max-w-[1400px] px-6 md:px-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="block w-8 h-px bg-white/40" />
            <span
              data-testid="studio-availability-overline"
              className="text-[10px] tracking-[0.4em] uppercase text-white/50"
            >
              {overline}
            </span>
            {/* live pulse dot */}
            <span className="ml-3 relative inline-flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-70" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-[9px] tracking-[0.4em] uppercase text-white/60">
                Live
              </span>
            </span>
          </div>

          <h2
            data-testid="studio-availability-title"
            className="text-4xl sm:text-5xl lg:text-6xl tracking-tighter font-medium leading-[1]"
          >
            {title_1}{" "}
            <span className="text-[#BDBDBD]">{title_2_grey}</span>
            {title_2_white}
          </h2>

          <p className="mt-6 text-[15px] md:text-base text-[#BDBDBD] leading-relaxed max-w-2xl font-light">
            {description}
          </p>
        </motion.div>

        {/* Content grid */}
        <div className="mt-12 md:mt-16 grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-px bg-white/[0.06] border border-white/[0.06]">
          {/* Left — Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="bg-black p-8 md:p-12 flex flex-col gap-10"
          >
            {/* Free slots */}
            <div
              data-testid="studio-free-slots"
              className="flex items-start gap-6 md:gap-8"
            >
              <div className="shrink-0 w-16 md:w-20 border-t border-white/40 pt-3 flex flex-col">
                <span className="text-[10px] tracking-[0.32em] uppercase text-white/50 mb-2">
                  {free_slots_when}
                </span>
                <span
                  data-testid="studio-free-slots-value"
                  className="text-6xl md:text-7xl font-light leading-none tabular-nums"
                >
                  {freeSlots}
                </span>
              </div>
              <div className="flex-1 pt-8">
                <div className="text-lg md:text-xl font-light leading-snug">
                  {freeSlotsWord}
                </div>
                <div className="mt-2 text-[11px] tracking-[0.3em] uppercase text-white/45">
                  успей забронировать
                </div>
              </div>
            </div>

            {/* Cars in work */}
            <div
              data-testid="studio-cars-in-work"
              className="flex items-start gap-6 md:gap-8"
            >
              <div className="shrink-0 w-16 md:w-20 border-t border-white/40 pt-3 flex flex-col">
                <span className="text-[10px] tracking-[0.32em] uppercase text-white/50 mb-2">
                  сейчас
                </span>
                <span
                  data-testid="studio-cars-in-work-value"
                  className="text-6xl md:text-7xl font-light leading-none tabular-nums"
                >
                  {carsInWork}
                </span>
              </div>
              <div className="flex-1 pt-8">
                <div className="text-lg md:text-xl font-light leading-snug">
                  {carsInWorkWord}
                </div>
                <div className="mt-2 text-[11px] tracking-[0.3em] uppercase text-white/45">
                  {posts_total_label}
                </div>

                {/* Progress bar */}
                <div className="relative mt-4 h-[3px] w-full bg-white/[0.08] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={inView ? { width: `${loadPercent}%` } : {}}
                    transition={{
                      duration: 1.4,
                      delay: 0.4,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="absolute top-0 left-0 h-full bg-white"
                  />
                </div>
                <div className="mt-2 text-[10px] tracking-[0.3em] uppercase text-white/40">
                  Загруженность {loadPercent}%
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right — Bonus card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-white text-black p-8 md:p-10 flex flex-col justify-between min-h-[300px] overflow-hidden group"
          >
            {/* diagonal accent */}
            <div className="pointer-events-none absolute -right-24 -top-24 w-64 h-64 border border-black/10 rotate-45" />

            {bonusActive ? (
              <>
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="block w-6 h-px bg-black/40" />
                    <span className="text-[10px] tracking-[0.4em] uppercase text-black/55">
                      {bonus_overline}
                    </span>
                  </div>
                  <h3
                    data-testid="studio-bonus-title"
                    className="text-2xl md:text-[26px] tracking-tighter font-medium leading-[1.05]"
                  >
                    {bonus_title}
                  </h3>
                  <p className="mt-3 text-sm text-black/65 font-light leading-relaxed">
                    {bonus_sub}
                  </p>
                </div>

                <div className="mt-8 pt-5 border-t border-black/10">
                  <div className="text-[10px] tracking-[0.32em] uppercase text-black/50 mb-2">
                    {bonus_expire_label}
                  </div>
                  <div
                    data-testid="studio-bonus-timer"
                    className="text-4xl md:text-5xl font-light tabular-nums tracking-tight"
                  >
                    {mm}
                    <span className="text-black/30 mx-1">:</span>
                    {ss}
                  </div>
                </div>
              </>
            ) : (
              <div className="my-auto text-center">
                <div className="text-[10px] tracking-[0.4em] uppercase text-black/55 mb-3">
                  Свободный слот
                </div>
                <div className="text-2xl md:text-3xl tracking-tighter font-medium leading-tight">
                  Оставьте заявку — <br />
                  подберём удобную дату.
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 md:mt-12 flex flex-col md:flex-row items-stretch md:items-center gap-6 md:gap-10"
        >
          <button
            type="button"
            onClick={() => setPopupOpen(true)}
            data-testid="studio-availability-cta"
            className="group relative flex-1 md:flex-none inline-flex items-center justify-between gap-6 px-8 md:px-10 py-5 md:py-6 bg-white text-black text-[11px] md:text-xs tracking-[0.32em] uppercase font-medium hover:bg-[#EDEDED] transition-all duration-500 shine overflow-hidden"
          >
            <span className="relative z-10">{cta_label}</span>
            <span className="relative z-10 flex items-center gap-3">
              <span className="hidden md:inline text-black/40 text-[10px] tracking-[0.3em]">
                15 мин · ответ
              </span>
              <span className="block w-10 h-px bg-current transition-all duration-500 group-hover:w-16" />
            </span>
          </button>

          <p className="text-xs md:text-sm text-white/45 leading-relaxed md:max-w-md font-light">
            {cta_note}
          </p>
        </motion.div>
      </div>

      <LeadPopup
        open={popupOpen}
        onClose={() => setPopupOpen(false)}
        source="studio_availability"
        subject="Бронирование даты — Загруженность студии"
        mode="chooser"
      />
    </section>
  );
}
