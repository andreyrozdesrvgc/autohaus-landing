import React, { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";

const STAGES = [
  {
    n: "01",
    title: "Подготовка автомобиля",
    overline: "Stage one — Surface",
    desc:
      "Многофазная мойка, удаление битума и металлических вкраплений, обезжиривание, очистка труднодоступных зон. Создаём идеально чистую поверхность для адгезии плёнки.",
    points: [
      "Многофазная мойка кузова",
      "Удаление битума и вкраплений",
      "Обезжиривание поверхности",
      "Очистка труднодоступных зон",
    ],
    video: "https://assets.mixkit.co/videos/4438/4438-720.mp4",
    poster:
      "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=2000&q=85",
  },
  {
    n: "02",
    title: "Безопасная подготовка кузова",
    overline: "Stage two — Paint",
    desc:
      "Анализируем состояние ЛКП, устраняем мелкие дефекты, выполняем безопасную полировку. Работаем только профессиональным оборудованием — без перегрева и риска.",
    points: [
      "Анализ толщины ЛКП",
      "Устранение мелких дефектов",
      "Деликатная полировка",
      "Подготовка под оклейку",
    ],
    video: "https://assets.mixkit.co/videos/24420/24420-720.mp4",
    poster:
      "https://images.unsplash.com/photo-1605030753481-bb38b08c384a?auto=format&fit=crop&w=2000&q=85",
  },
  {
    n: "03",
    title: "Точная оклейка и контроль",
    overline: "Stage three — Precision",
    desc:
      "Каждый элемент клеится вручную. Работаем по технологии: завод под кромки, отсутствие натяжений, контроль качества каждого узла перед выдачей автомобиля.",
    points: [
      "Заход плёнки под кромки",
      "Без натяжений и клеевых растяжек",
      "Покомпонентный QC",
      "Финальная проверка покрытия",
    ],
    video: "https://assets.mixkit.co/videos/5320/5320-720.mp4",
    poster:
      "https://images.pexels.com/photos/10126666/pexels-photo-10126666.jpeg?auto=compress&cs=tinysrgb&w=2000",
  },
];

function StageCard({ s, i, total, variant = "desktop" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
      data-testid={`protocol-stage-${s.n}${variant === "mobile" ? "-mobile" : ""}`}
      className="relative flex-shrink-0 w-[88vw] md:w-[78vw] max-w-[1100px] h-[78vh] md:h-[82vh] bg-[#0A0A0A] border border-white/10 overflow-hidden group"
    >
      {/* Background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster={s.poster}
        className="absolute inset-0 w-full h-full object-cover grayscale brightness-[0.55]"
      >
        <source src={s.video} type="video/mp4" />
      </video>

      {/* Overlays */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.85) 100%)",
        }}
      />
      <div className="absolute inset-0 grain pointer-events-none" />

      {/* Top meta strip */}
      <div className="absolute top-0 inset-x-0 px-8 md:px-12 py-6 flex items-center justify-between text-[10px] tracking-[0.4em] uppercase text-white/60 border-b border-white/10">
        <span>{s.overline}</span>
        <span>{s.n} / {String(total).padStart(2, "0")}</span>
      </div>

      {/* Huge number watermark */}
      <div className="absolute -bottom-4 -right-2 md:-right-4 select-none pointer-events-none text-white/5 font-medium leading-none tracking-tighter text-[clamp(10rem,30vw,26rem)]">
        {s.n}
      </div>

      {/* Content */}
      <div className="absolute inset-0 px-8 md:px-12 pb-10 pt-24 flex flex-col justify-end">
        <div className="max-w-2xl">
          <div className="flex items-center gap-4 mb-6">
            <span className="block w-10 md:w-16 h-px bg-white/40" />
            <span className="text-[11px] tracking-[0.32em] uppercase text-white/60">
              Protocol
            </span>
          </div>
          <h3 className="text-3xl md:text-5xl lg:text-6xl tracking-tighter font-medium leading-[0.95] text-white">
            {s.title}
          </h3>
          <p className="mt-5 text-[#BDBDBD] text-sm md:text-base leading-relaxed max-w-xl font-light">
            {s.desc}
          </p>

          <ul className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 max-w-xl">
            {s.points.map((p) => (
              <li
                key={p}
                className="flex items-start gap-3 text-[12px] md:text-[13px] tracking-[0.04em] text-white/75"
              >
                <span className="mt-[7px] block w-1.5 h-px bg-white/50" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.article>
  );
}

export default function SafetyProtocol() {
  const wrapper = useRef(null);
  const headerRef = useRef(null);
  const headerIn = useInView(headerRef, { once: true, margin: "-15%" });

  const { scrollYProgress } = useScroll({
    target: wrapper,
    offset: ["start start", "end end"],
  });
  // On desktop: translate horizontally. End position calibrated so the last
  // card ends near the right edge (2 cards * (78vw + gap) ≈ 162vw)
  const x = useTransform(scrollYProgress, [0, 1], ["0vw", "-130vw"]);
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const dotX = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section
      id="protocol"
      data-testid="protocol-section"
      className="relative w-full bg-black border-t border-white/5"
    >
      {/* HEADER */}
      <div ref={headerRef} className="mx-auto max-w-[1400px] px-6 md:px-10 pt-24 md:pt-36 pb-10 md:pb-14">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <span className="text-[11px] tracking-[0.4em] uppercase text-white/50">
              001.5 — Protocol
            </span>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={headerIn ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              data-testid="protocol-heading"
              className="mt-4 text-4xl md:text-6xl lg:text-7xl tracking-tighter font-medium leading-[0.95]"
            >
              Протокол<br />
              <span className="text-[#BDBDBD]">безопасной</span> оклейки.
            </motion.h2>
          </div>
          <p className="text-[#BDBDBD] text-base md:text-lg leading-relaxed max-w-md">
            Каждый автомобиль проходит многоэтапную подготовку и контроль
            качества перед оклейкой. Не «наклеить плёнку» — а инженерный процесс.
          </p>
        </div>

        {/* Thin animated under-line */}
        <div className="mt-10 h-px w-full bg-white/10 overflow-hidden">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={headerIn ? { scaleX: 1 } : {}}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            style={{ originX: 0 }}
            className="h-full w-full bg-white/60"
          />
        </div>

        {/* Indicator row */}
        <div className="mt-6 flex items-center justify-between text-[10px] tracking-[0.4em] uppercase text-white/40">
          <span className="flex items-center gap-3">
            <span className="block w-1.5 h-1.5 rounded-full bg-white" />
            Stage 01 — Surface
          </span>
          <span className="hidden md:inline">Stage 02 — Paint</span>
          <span>Stage 03 — Precision</span>
        </div>
      </div>

      {/* DESKTOP HORIZONTAL SCROLL */}
      <div ref={wrapper} className="relative hidden md:block h-[220vh]">
        <div className="sticky top-0 h-screen overflow-hidden flex items-center">
          <motion.div
            style={{ x }}
            className="flex items-center gap-6 lg:gap-8 px-10 will-change-transform"
          >
            {STAGES.map((s, i) => (
              <StageCard key={s.n} s={s} i={i} total={STAGES.length} />
            ))}
            <div className="flex-shrink-0 w-[20vw]" />
          </motion.div>

          {/* Progress connector bar at bottom */}
          <div className="absolute bottom-10 left-10 right-10 h-px bg-white/10 overflow-hidden">
            <motion.div
              style={{ scaleX: lineScale, originX: 0 }}
              className="h-full bg-white/70"
            />
          </div>
          <motion.div
            style={{ left: dotX }}
            className="absolute bottom-10 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.7)]"
          />
        </div>
      </div>

      {/* MOBILE VERTICAL CARDS */}
      <div className="md:hidden px-6 pb-10 space-y-6">
        {STAGES.map((s, i) => (
          <StageCard key={s.n} s={s} i={i} total={STAGES.length} variant="mobile" />
        ))}
      </div>

      {/* MICRO TEXT */}
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 pb-24 md:pb-32 pt-10 md:pt-16">
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-[11px] tracking-[0.32em] uppercase text-white/45">
          <span>Technology · Attention · Precision</span>
          <span className="text-white/60 max-w-md text-right md:normal-case md:tracking-normal md:text-sm md:font-light leading-relaxed">
            Технология, внимание к деталям и precision-подход —
            основа безупречной оклейки.
          </span>
        </div>
      </div>
    </section>
  );
}
