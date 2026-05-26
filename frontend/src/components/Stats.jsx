import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const STATS = [
  { value: 15, suffix: "+", label: "Лет precision-детейлинга" },
  { value: 300, suffix: "+", label: "Оклеенных автомобилей" },
  { value: 100, suffix: "%", label: "Контроль качества" },
  { value: 7, suffix: "", label: "Этапов процесса" },
];

function CountUp({ value, suffix, duration = 1800 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return (
    <span ref={ref}>
      {n}
      {suffix}
    </span>
  );
}

export default function Stats() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  return (
    <section
      ref={ref}
      data-testid="stats-section"
      className="relative w-full bg-[#050505] py-16 md:py-24 border-y border-white/5"
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-10">
          <div className="md:col-span-7">
            <span className="text-[11px] tracking-[0.4em] uppercase text-white/50">
              007 — Numbers
            </span>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 text-4xl md:text-6xl lg:text-7xl tracking-tighter font-medium leading-[0.95]"
            >
              Почему <span className="text-[#BDBDBD]">мы.</span><br />
              Без воды.
            </motion.h2>
          </div>
          <p className="md:col-span-5 text-[#BDBDBD] text-base md:text-lg leading-relaxed self-end">
            Студия с командой мастеров, чьи руки видели больше углов, кромок и
            фар, чем некоторые целые сервисы.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-white/10">
          {STATS.map((s, i) => (
            <div
              key={i}
              data-testid={`stat-${i}`}
              className={`p-6 md:p-10 border-white/10 ${i < STATS.length - 1 ? "md:border-r" : ""} ${i % 2 === 0 ? "border-r" : ""} ${i < 2 ? "border-b md:border-b-0" : ""}`}
            >
              <div className="text-[clamp(2.5rem,6vw,5.5rem)] tracking-tighter font-medium leading-none text-white">
                <CountUp value={s.value} suffix={s.suffix} />
              </div>
              <div className="mt-4 text-[#BDBDBD] text-sm md:text-base leading-relaxed font-light max-w-[14ch]">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
