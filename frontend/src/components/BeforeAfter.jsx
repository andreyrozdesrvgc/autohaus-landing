import React, { useRef, useState, useCallback } from "react";
import { motion, useInView } from "framer-motion";

const BEFORE = "https://images.unsplash.com/photo-1616591938558-fb03d845567b?auto=format&fit=crop&w=1800&q=85";
const AFTER = "https://images.unsplash.com/photo-1626381958625-f4e4ea343925?auto=format&fit=crop&w=1800&q=85";

export default function BeforeAfter() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const containerRef = useRef(null);
  const [pos, setPos] = useState(55);
  const dragging = useRef(false);

  const setFromClientX = useCallback((clientX) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    setPos((x / rect.width) * 100);
  }, []);

  const onPointerDown = (e) => {
    dragging.current = true;
    // Capture pointer so we keep receiving move/up even when finger leaves bounds
    if (e.currentTarget && e.pointerId !== undefined) {
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    }
    setFromClientX(e.clientX);
  };
  const onPointerMove = (e) => {
    if (!dragging.current) return;
    // Prevent native gestures (page scroll / pull-to-refresh) from stealing the drag
    if (e.cancelable) e.preventDefault();
    setFromClientX(e.clientX);
  };
  const onPointerUp = (e) => {
    dragging.current = false;
    if (e && e.currentTarget && e.pointerId !== undefined) {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
    }
  };

  return (
    <section
      ref={ref}
      data-testid="before-after-section"
      className="relative w-full bg-black py-16 md:py-24"
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-14">
          <div>
            <span className="text-[11px] tracking-[0.4em] uppercase text-white/50">
              002 — Result
            </span>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 text-4xl md:text-6xl lg:text-7xl tracking-tighter font-medium leading-[0.95]"
            >
              Разница<br />видна без слов.
            </motion.h2>
          </div>
          <p className="text-[#BDBDBD] max-w-md text-base md:text-lg leading-relaxed">
            Перетащите ползунок — увидите состояние «до» и финальный результат
            после полной оклейки полиуретановой плёнкой.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          ref={containerRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          data-testid="before-after-slider"
          style={{ touchAction: "none" }}
          className="relative w-full md:max-w-[1100px] md:mx-auto aspect-[16/9] md:aspect-[21/9] overflow-hidden select-none cursor-ew-resize bg-[#0A0A0A] border border-white/10 touch-none"
        >
          {/* AFTER (base, full) */}
          <img
            src={AFTER}
            alt="Автомобиль после премиальной оклейки полиуретановой плёнкой в AUTOHAUS Калининград"
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
            loading="lazy"
            decoding="async"
          />
          {/* BEFORE (clipped) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
          >
            <img
              src={BEFORE}
              alt="Автомобиль до оклейки — состояние кузова перед premium detailing"
              className="w-full h-full object-cover grayscale"
              draggable={false}
              loading="lazy"
              decoding="async"
            />
          </div>

          {/* Labels */}
          <div className="absolute top-6 left-6 text-[10px] md:text-[11px] tracking-[0.4em] uppercase text-white/80 px-3 py-2 border border-white/20 backdrop-blur-md bg-black/40">
            До
          </div>
          <div className="absolute top-6 right-6 text-[10px] md:text-[11px] tracking-[0.4em] uppercase text-white/80 px-3 py-2 border border-white/20 backdrop-blur-md bg-black/40">
            После
          </div>

          {/* Divider line */}
          <div
            className="absolute top-0 bottom-0 w-px bg-white"
            style={{ left: `${pos}%` }}
          />
          {/* Handle */}
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.4)]"
            style={{ left: `${pos}%` }}
            data-testid="before-after-handle"
          >
            <span className="text-xl leading-none">‹›</span>
          </div>
        </motion.div>

        {/* Inline CTA — captures the post-"wow" intent right after the slider */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
          className="mt-8 md:mt-10 md:max-w-[1100px] md:mx-auto border-t border-white/10 pt-6 md:pt-8 flex flex-col md:flex-row md:items-center md:justify-end gap-5"
        >
          {/* Supporting line — visible on mobile only */}
          <p className="md:hidden text-[#BDBDBD] text-sm font-light leading-relaxed">
            Хотите также?{" "}
            <span className="text-white">Расчёт за&nbsp;15&nbsp;минут</span>{" "}
            под Ваш автомобиль.
          </p>
          <a
            href="#configurator"
            data-testid="before-after-cta"
            className="group inline-flex items-center justify-center gap-4 px-6 py-4 bg-white text-black text-[11px] tracking-[0.3em] uppercase hover:bg-[#EDEDED] transition-all duration-300 shine"
          >
            Получить расчёт
            <span className="block w-8 h-px bg-current transition-all duration-500 group-hover:w-12" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
