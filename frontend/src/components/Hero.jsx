import React from "react";
import { motion } from "framer-motion";
import { ArrowDown, Play } from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 1, ease: [0.16, 1, 0.3, 1], delay },
});

export default function Hero() {
  return (
    <section
      id="top"
      data-testid="hero-section"
      className="relative w-full h-[100svh] min-h-[700px] overflow-hidden bg-black"
    >
      {/* Background video */}
      <video
        data-testid="hero-video"
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        poster="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1920&q=85"
      >
        <source src="https://assets.mixkit.co/videos/35540/35540-720.mp4" type="video/mp4" />
        <source src="https://assets.mixkit.co/videos/35205/35205-720.mp4" type="video/mp4" />
        <source src="https://assets.mixkit.co/videos/4694/4694-720.mp4" type="video/mp4" />
      </video>

      {/* Vignette and overlay */}
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.85) 100%)",
        }}
      />
      <div className="absolute inset-0 grain pointer-events-none" />

      {/* Hero content - single grid for perfect alignment */}
      <div className="relative z-10 h-full w-full">
        <div className="mx-auto max-w-[1400px] h-full px-6 md:px-10 flex flex-col pt-28 pb-16 md:pb-20">
          {/* Top meta line — same container as content for strict left alignment */}
          <div className="flex items-center justify-between text-[10px] md:text-[11px] tracking-[0.4em] uppercase text-white/60">
            <span>№ 001 — Premium Wrapping</span>
            <span className="hidden md:inline">54.71° N / 20.51° E</span>
          </div>

          {/* Spacer pushes the main block to the bottom */}
          <div className="flex-1" />

          <motion.span
            {...fadeUp(0.1)}
            className="text-[11px] tracking-[0.4em] uppercase text-[#EDEDED]/70 mb-8"
          >
            Detailing Studio
          </motion.span>

          <motion.h1
            {...fadeUp(0.25)}
            data-testid="hero-headline"
            className="text-balance font-medium leading-[0.92] tracking-tighter text-white text-[clamp(2.6rem,8vw,7.2rem)] uppercase"
          >
            Преображаем<br />
            автомобили в<br />
            <span className="text-[#BDBDBD]">произведение</span> искусства
          </motion.h1>

          <motion.div
            {...fadeUp(0.5)}
            className="mt-10 flex flex-col md:flex-row md:items-end md:justify-between gap-8"
          >
            <p className="max-w-xl text-[#BDBDBD] text-base md:text-lg leading-relaxed font-light">
              Полиуретан. Винил. Антихром. Полная защита кузова в Калининграде —
              для тех, кто видит разницу в деталях.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#configurator"
                data-testid="hero-cta-primary"
                className="group inline-flex items-center gap-4 px-8 py-5 glass-strong text-white text-[12px] tracking-[0.3em] uppercase hover:bg-white hover:text-black transition-all duration-500 shine"
              >
                <span>Рассчитать проект</span>
                <span className="block w-8 h-px bg-current transition-all duration-500 group-hover:w-14" />
              </a>
              <a
                href="#protocol"
                data-testid="hero-cta-secondary"
                className="inline-flex items-center gap-3 px-6 py-5 border border-white/20 text-[12px] tracking-[0.3em] uppercase text-white/80 hover:text-white hover:border-white/40 transition-all duration-300"
              >
                <Play size={14} strokeWidth={1.5} />
                Смотреть процесс
              </a>
            </div>
          </motion.div>

          <motion.div
            {...fadeUp(0.75)}
            className="mt-10 pt-6 border-t border-white/10 flex items-center justify-between text-[10px] md:text-[11px] tracking-[0.32em] uppercase text-white/50"
          >
            <span className="flex items-center gap-3">
              <ArrowDown size={14} strokeWidth={1.5} className="animate-bounce" />
              Scroll
            </span>
            <span className="hidden md:inline">PPF · Vinyl · Anti-chrome · Headlight Armor</span>
            <span>2026 / Edition 01</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
