import React from "react";
import { motion } from "framer-motion";
import { ArrowDown, Play } from "lucide-react";
import { useContent } from "@/context/ContentContext";
import { resolveMedia } from "@/lib/contentDefaults";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 1, ease: [0.16, 1, 0.3, 1], delay },
});

export default function Hero() {
  const content = useContent();
  const hero = content?.hero || {};
  return (
    <section
      id="top"
      data-testid="hero-section"
      className="relative w-full h-[100svh] min-h-[700px] overflow-hidden bg-black"
    >
      <video
        key={hero.video_url}
        data-testid="hero-video"
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-label="Премиальный автомобиль — фон Hero блока AUTOHAUS"
        poster={resolveMedia(hero.poster_url)}
      >
        <source src={resolveMedia(hero.video_url)} type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-black/70" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.85) 100%)",
        }}
      />
      <div className="absolute inset-0 grain pointer-events-none" />

      <div className="relative z-10 h-full w-full">
        <div className="mx-auto max-w-[1400px] h-full px-6 md:px-10 flex flex-col pt-28 pb-16 md:pb-20">
          <div className="flex items-center justify-between text-[10px] md:text-[11px] tracking-[0.4em] uppercase text-white/60">
            <span>{hero.overline}</span>
            <span className="hidden md:inline">{hero.geo_label}</span>
          </div>

          {/* Desktop spacer — pushes content to bottom */}
          <div className="hidden md:block flex-1" />
          {/* Mobile: small gap only, content sits near top */}
          <div className="md:hidden h-6" />

          <motion.span
            {...fadeUp(0.1)}
            className="text-[11px] tracking-[0.4em] uppercase text-[#EDEDED]/70 mb-8"
          >
            {hero.studio_label}
          </motion.span>

          <motion.h1
            {...fadeUp(0.25)}
            data-testid="hero-headline"
            className="text-balance font-medium leading-[0.92] tracking-tighter text-white text-[clamp(2.6rem,8vw,7.2rem)] uppercase"
          >
            {hero.title_line_1}<br />
            {hero.title_line_2}<br />
            <span className="text-[#BDBDBD]">{hero.title_line_3_grey}</span>{hero.title_line_3_white}
          </motion.h1>

          <motion.div
            {...fadeUp(0.5)}
            className="mt-10 flex flex-col md:flex-row md:items-end md:justify-between gap-8"
          >
            <p className="max-w-xl text-[#BDBDBD] text-base md:text-lg leading-relaxed font-light">
              {hero.description}
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#configurator"
                data-testid="hero-cta-primary"
                className="group inline-flex items-center gap-4 px-8 py-5 glass-strong text-white text-[12px] tracking-[0.3em] uppercase hover:bg-white hover:text-black transition-all duration-500 shine"
              >
                <span>{hero.cta_primary}</span>
                <span className="block w-8 h-px bg-current transition-all duration-500 group-hover:w-14" />
              </a>
              <a
                href="#protocol"
                data-testid="hero-cta-secondary"
                className="inline-flex items-center gap-3 px-6 py-5 border border-white/20 text-[12px] tracking-[0.3em] uppercase text-white/80 hover:text-white hover:border-white/40 transition-all duration-300"
              >
                <Play size={14} strokeWidth={1.5} />
                {hero.cta_secondary}
              </a>
            </div>
          </motion.div>

          {/* Mobile: spacer pushes footer meta to bottom */}
          <div className="md:hidden flex-1 min-h-[16px]" />

          <motion.div
            {...fadeUp(0.75)}
            className="mt-10 pt-6 border-t border-white/10 flex items-center justify-between text-[10px] md:text-[11px] tracking-[0.32em] uppercase text-white/50"
          >
            <span className="flex items-center gap-3">
              <ArrowDown size={14} strokeWidth={1.5} className="animate-bounce" />
              Scroll
            </span>
            <span className="hidden md:inline">{hero.footer_meta}</span>
            <span>{hero.footer_edition}</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
