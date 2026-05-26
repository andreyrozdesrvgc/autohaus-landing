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
    setFromClientX(e.clientX);
  };
  const onPointerMove = (e) => {
    if (!dragging.current) return;
    setFromClientX(e.clientX);
  };
  const onPointerUp = () => { dragging.current = false; };

  return (
    <section
      ref={ref}
      data-testid="before-after-section"
      className="relative w-full bg-black py-24 md:py-36"
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-20">
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
          onPointerLeave={onPointerUp}
          onTouchStart={(e) => onPointerDown(e.touches[0])}
          onTouchMove={(e) => onPointerMove(e.touches[0])}
          onTouchEnd={onPointerUp}
          data-testid="before-after-slider"
          className="relative w-full aspect-[16/9] overflow-hidden select-none cursor-ew-resize bg-[#0A0A0A] border border-white/10"
        >
          {/* AFTER (base, full) */}
          <img
            src={AFTER}
            alt="After"
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
          {/* BEFORE (clipped) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
          >
            <img
              src={BEFORE}
              alt="Before"
              className="w-full h-full object-cover grayscale"
              draggable={false}
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
      </div>
    </section>
  );
}
