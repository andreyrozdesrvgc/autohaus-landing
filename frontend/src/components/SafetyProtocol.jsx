import React, { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useContent } from "@/context/ContentContext";
import { resolveMedia } from "@/lib/contentDefaults";

const STAGES_FALLBACK = [
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
    video: "https://assets.mixkit.co/videos/35230/35230-720.mp4",
    poster:
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=2000&q=85",
  },
];

/* Desktop card — absolutely positioned, driven by scroll progress */
function DesktopStage({ s, range, total, progress, index }) {
  // Stage 01 (index 0) shows immediately at full opacity — no entrance animation.
  // Stages 02/03 fade in cinematically as before.
  const isFirst = index === 0;
  const opacity = useTransform(
    progress,
    [range[0], range[1], range[2], range[3]],
    [isFirst ? 1 : 0, 1, 1, 0]
  );
  const y = useTransform(
    progress,
    [range[0], range[1], range[2], range[3]],
    [isFirst ? 0 : 40, 0, 0, -40]
  );
  const scale = useTransform(
    progress,
    [range[0], range[1], range[2], range[3]],
    [isFirst ? 1 : 1.04, 1, 1, 0.98]
  );
  const blurPx = useTransform(
    progress,
    [range[0], range[1], range[2], range[3]],
    [isFirst ? 0 : 8, 0, 0, 6]
  );
  const filter = useTransform(blurPx, (b) => `blur(${b}px)`);

  return (
    <motion.article
      data-testid={`protocol-stage-${s.n}`}
      style={{ opacity, y, scale, filter }}
      className="absolute inset-0 flex items-center justify-center px-10 will-change-transform"
    >
      <div className="relative w-full max-w-[1200px] h-[78vh] bg-[#0A0A0A] border border-white/10 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster={resolveMedia(s.poster)}
          aria-label={`${s.title} — видеоиллюстрация этапа`}
          className="absolute inset-0 w-full h-full object-cover grayscale brightness-[0.55]"
        >
          <source src={resolveMedia(s.video)} type="video/mp4" />
        </video>

        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.85) 100%)",
          }}
        />
        <div className="absolute inset-0 grain pointer-events-none" />

        {/* Top meta strip */}
        <div className="absolute top-0 inset-x-0 px-10 py-6 flex items-center justify-between text-[10px] tracking-[0.4em] uppercase text-white/60 border-b border-white/10">
          <span>{s.overline}</span>
          <span>
            {s.n} / {String(total).padStart(2, "0")}
          </span>
        </div>

        {/* Watermark number */}
        <div className="absolute -bottom-4 -right-2 select-none pointer-events-none text-white/[0.06] font-medium leading-none tracking-tighter text-[clamp(10rem,28vw,24rem)]">
          {s.n}
        </div>

        {/* Content */}
        <div className="absolute inset-0 px-10 pb-12 pt-24 flex flex-col justify-end">
          <div className="max-w-2xl">
            <div className="flex items-center gap-4 mb-6">
              <span className="block w-16 h-px bg-white/40" />
              <span className="text-[11px] tracking-[0.32em] uppercase text-white/60">
                Protocol · 0{index + 1}
              </span>
            </div>
            <h3 className="text-4xl md:text-5xl lg:text-6xl tracking-tighter font-medium leading-[0.95] text-white">
              {s.title}
            </h3>
            <p className="mt-5 text-[#BDBDBD] text-base md:text-lg leading-relaxed max-w-xl font-light">
              {s.desc}
            </p>
            <ul className="mt-8 grid grid-cols-2 gap-x-8 gap-y-2.5 max-w-xl">
              {s.points.map((p) => (
                <li
                  key={p}
                  className="flex items-start gap-3 text-[13px] tracking-[0.04em] text-white/75"
                >
                  <span className="mt-[8px] block w-1.5 h-px bg-white/50" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function MobileStage({ s, total, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: index * 0.08 }}
      data-testid={`protocol-stage-${s.n}-mobile`}
      className="relative w-full h-[78vh] bg-[#0A0A0A] border border-white/10 overflow-hidden"
    >
      <img
        src={resolveMedia(s.poster)}
        alt={`${s.title} — премиальный детейлинг AUTOHAUS Калининград`}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover grayscale brightness-[0.55]"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.85) 100%)",
        }}
      />
      <div className="absolute top-0 inset-x-0 px-6 py-5 flex items-center justify-between text-[10px] tracking-[0.4em] uppercase text-white/60 border-b border-white/10">
        <span>{s.overline}</span>
        <span>
          {s.n} / {String(total).padStart(2, "0")}
        </span>
      </div>
      <div className="absolute -bottom-2 -right-2 select-none pointer-events-none text-white/[0.06] font-medium leading-none tracking-tighter text-[clamp(8rem,40vw,16rem)]">
        {s.n}
      </div>
      <div className="absolute inset-0 px-6 pb-8 pt-20 flex flex-col justify-end">
        <h3 className="text-3xl tracking-tighter font-medium leading-[0.95] text-white">
          {s.title}
        </h3>
        <p className="mt-4 text-[#BDBDBD] text-sm leading-relaxed font-light">{s.desc}</p>
        <ul className="mt-5 space-y-2">
          {s.points.map((p) => (
            <li key={p} className="flex items-start gap-3 text-[13px] text-white/75">
              <span className="mt-[8px] block w-1.5 h-px bg-white/50" />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </motion.article>
  );
}

function RailStep({ n, index, activeIdx }) {
  const dotOpacity = useTransform(activeIdx, (v) => (v === index + 1 ? 1 : 0.3));
  const lineOpacity = useTransform(activeIdx, (v) => (v === index + 1 ? 1 : 0.15));
  return (
    <div className="flex items-center gap-3">
      <motion.span
        style={{ opacity: dotOpacity }}
        className="block w-2 h-2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.5)]"
      />
      <motion.span
        style={{ opacity: lineOpacity }}
        className="block w-8 h-px bg-white"
      />
      <span className="text-[10px] tracking-[0.36em] uppercase text-white/40">{n}</span>
    </div>
  );
}

function ActiveCounter({ activeIdx }) {
  const text = useTransform(activeIdx, (v) => String(v).padStart(2, "0"));
  return <motion.span>{text}</motion.span>;
}

export default function SafetyProtocol() {
  const { protocol } = useContent();
  const STAGES = (protocol.stages && protocol.stages.length) ? protocol.stages : STAGES_FALLBACK;
  const wrapper = useRef(null);
  const headerRef = useRef(null);
  const headerIn = useInView(headerRef, { once: true, margin: "-15%" });

  const { scrollYProgress } = useScroll({
    target: wrapper,
    offset: ["start start", "end end"],
  });

  // Three stages, each held for ~33% of scroll progress with smooth overlaps.
  const ranges = [
    [0.00, 0.02, 0.30, 0.36],
    [0.32, 0.40, 0.62, 0.68],
    [0.64, 0.72, 1.00, 1.00],
  ];

  // Progress bar fill across the section
  const barScale = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const dotLeft = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  // Active-stage index for the side counter (computed via discrete transforms)
  const activeIdx = useTransform(scrollYProgress, (v) => {
    if (v < 0.35) return 1;
    if (v < 0.69) return 2;
    return 3;
  });

  return (
    <section
      id="protocol"
      data-testid="protocol-section"
      className="relative w-full bg-black border-t border-white/5"
    >
      {/* HEADER */}
      <div
        ref={headerRef}
        className="mx-auto max-w-[1400px] px-6 md:px-10 pt-8 md:pt-12 pb-4 md:pb-6"
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <span className="text-[11px] tracking-[0.4em] uppercase text-white/50">
              {protocol.overline}
            </span>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={headerIn ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              data-testid="protocol-heading"
              className="mt-3 text-3xl md:text-5xl lg:text-6xl tracking-tighter font-medium leading-[0.95]"
            >
              {protocol.title_line_1}<br />
              <span className="text-[#BDBDBD]">{protocol.title_line_2_grey}</span>{protocol.title_line_2_white}
            </motion.h2>
          </div>
          <p className="text-[#BDBDBD] text-sm md:text-base leading-relaxed max-w-md">
            {protocol.description}
          </p>
        </div>

        <div className="mt-6 h-px w-full bg-white/10 overflow-hidden">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={headerIn ? { scaleX: 1 } : {}}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            style={{ originX: 0 }}
            className="h-full w-full bg-white/60"
          />
        </div>
      </div>

      {/* DESKTOP STICKY SCROLL STORYTELLING */}
      <div ref={wrapper} className="relative hidden md:block h-[320vh]">
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          {/* Background ambient layer */}
          <div className="absolute inset-0 bg-black" />

          {/* Stage cards stacked, opacity-driven */}
          <div className="absolute inset-0">
            {STAGES.map((s, i) => (
              <DesktopStage
                key={s.n}
                s={s}
                range={ranges[i]}
                total={STAGES.length}
                progress={scrollYProgress}
                index={i}
              />
            ))}
          </div>

          {/* Left rail step indicator */}
          <div className="pointer-events-none absolute left-6 lg:left-10 top-1/2 -translate-y-1/2 flex flex-col gap-6">
            {STAGES.map((s, i) => (
              <RailStep key={s.n} n={s.n} index={i} activeIdx={activeIdx} />
            ))}
          </div>

          {/* Bottom progress bar */}
          <div className="absolute bottom-8 left-10 right-10 flex items-center gap-6 text-[10px] tracking-[0.4em] uppercase text-white/40">
            <span className="whitespace-nowrap">Protocol</span>
            <div className="flex-1 h-px bg-white/10 overflow-hidden relative">
              <motion.div
                style={{ scaleX: barScale, originX: 0 }}
                className="absolute inset-0 bg-white/70"
              />
              <motion.div
                style={{ left: dotLeft }}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.7)]"
              />
            </div>
            <span className="whitespace-nowrap">
              <ActiveCounter activeIdx={activeIdx} />
              {" / 03"}
            </span>
          </div>
        </div>
      </div>

      {/* MOBILE VERTICAL CARDS */}
      <div className="md:hidden px-6 pb-10 space-y-6">
        {STAGES.map((s, i) => (
          <MobileStage key={s.n} s={s} total={STAGES.length} index={i} />
        ))}
      </div>

      {/* MICRO TEXT */}
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 pb-16 md:pb-20 pt-8 md:pt-10">
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-[11px] tracking-[0.32em] uppercase text-white/45">
          <span>{protocol.footer_left}</span>
          <span className="text-white/60 max-w-md text-right md:normal-case md:tracking-normal md:text-sm md:font-light leading-relaxed">
            {protocol.footer_right}
          </span>
        </div>
      </div>
    </section>
  );
}
