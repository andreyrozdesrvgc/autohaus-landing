import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useContent } from "@/context/ContentContext";

function CountUp({ value, suffix, start, duration = 1800 }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!start) return;
    const t0 = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, value, duration]);

  return <span>{n}{suffix}</span>;
}

export default function Stats() {
  const { stats } = useContent();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const items = stats.items || [];

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
              {stats.overline}
            </span>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 text-4xl md:text-6xl lg:text-7xl tracking-tighter font-medium leading-[0.95]"
            >
              {stats.title_line_1_white}<span className="text-[#BDBDBD]">{stats.title_line_1_grey}</span><br />
              {stats.title_line_2}
            </motion.h2>
          </div>
          <p className="md:col-span-5 text-[#BDBDBD] text-base md:text-lg leading-relaxed self-end">
            {stats.description}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-white/10">
          {items.map((s, i) => (
            <div
              key={i}
              data-testid={`stat-${i}`}
              className={`p-6 md:p-10 border-white/10 ${i < items.length - 1 ? "md:border-r" : ""} ${i % 2 === 0 ? "border-r" : ""} ${i < 2 ? "border-b md:border-b-0" : ""}`}
            >
              <div className="text-[clamp(2.5rem,6vw,5.5rem)] tracking-tighter font-medium leading-none text-white">
                <CountUp value={Number(s.value) || 0} suffix={s.suffix || ""} start={inView} />
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
