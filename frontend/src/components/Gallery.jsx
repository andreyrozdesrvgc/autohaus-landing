import React, { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useContent } from "@/context/ContentContext";
import { resolveMedia } from "@/lib/contentDefaults";

// Соответствуют классам ниже: карточка 60vw, gap-6 = 24px ≈ 1.5vw, trailing spacer 20vw.
const CARD_VW = 60;
const GAP_VW = 1.5;
const TRAILING_VW = 20;

export default function Gallery() {
  const { gallery } = useContent();
  const items = gallery.items || [];
  const count = items.length;
  const wrapper = useRef(null);
  const headerRef = useRef(null);
  const headerIn = useInView(headerRef, { once: true, margin: "-10%" });
  const { scrollYProgress } = useScroll({
    target: wrapper,
    offset: ["start start", "end end"],
  });

  // Считаем реальный оверфлоу в vw и переводим в % ширины track'а.
  // Это даёт корректный ход независимо от кол-ва работ (3, 6, 10...).
  const totalVW = count * CARD_VW + Math.max(0, count - 1) * GAP_VW + TRAILING_VW;
  const overflowVW = Math.max(0, totalVW - 100);
  const translatePct = totalVW > 0 ? -(overflowVW / totalVW) * 100 : 0;
  const x = useTransform(scrollYProgress, [0, 1], ["0%", `${translatePct}%`]);

  // Высота обёртки — тоже динамическая: базовые 100vh (для sticky) + запас на каждую карточку.
  // Меньше 3 карточек — 240vh; больше — увеличиваем плавно.
  const wrapperVH = Math.max(240, 120 + count * 45);

  return (
    <section
      id="gallery"
      data-testid="gallery-section"
      className="relative w-full bg-black"
    >
      <div ref={headerRef} className="mx-auto max-w-[1400px] px-6 md:px-10 pt-16 md:pt-24 pb-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <span className="text-[11px] tracking-[0.4em] uppercase text-white/50">
              {gallery.overline}
            </span>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={headerIn ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 text-4xl md:text-6xl lg:text-7xl tracking-tighter font-medium leading-[0.95]"
            >
              {gallery.title_line_1}<br />
              <span className="text-[#BDBDBD]">{gallery.title_line_2}</span>
            </motion.h2>
          </div>
          <p className="text-[#BDBDBD] text-base md:text-lg leading-relaxed max-w-sm">
            {gallery.description}
          </p>
        </div>
      </div>

      {/* DESKTOP — horizontal scroll driven by vertical scroll */}
      <div
        ref={wrapper}
        style={{ height: `${wrapperVH}vh` }}
        className="relative hidden md:block"
      >
        <div className="sticky top-0 h-screen overflow-hidden">
          <motion.div style={{ x }} className="flex h-full items-center gap-6 px-10 will-change-transform">
            {items.map((img, i) => (
              <div
                key={i}
                data-testid={`gallery-item-${i}`}
                className="relative flex-shrink-0 h-[78vh] w-[60vw] max-w-[900px] bg-[#0A0A0A] border border-white/10 overflow-hidden"
              >
                <img
                  src={resolveMedia(img.src)}
                  alt={img.alt || img.title}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Компактный инфо-чип поверх фото — только там, где текст, без затемнения всей фотографии */}
                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4 pointer-events-none">
                  {(img.title || i >= 0) && (
                    <div className="px-4 py-3 bg-black/65 backdrop-blur-md border border-white/10 max-w-[70%]">
                      <div className="text-[10px] tracking-[0.4em] uppercase text-white/60">
                        № {String(i + 1).padStart(2, "0")}
                      </div>
                      {img.title && (
                        <div className="mt-1 text-2xl md:text-3xl tracking-tight font-medium leading-none text-white">
                          {img.title}
                        </div>
                      )}
                    </div>
                  )}
                  {img.meta && (
                    <div className="text-[11px] tracking-[0.3em] uppercase text-white/85 px-3 py-2 border border-white/20 backdrop-blur-md bg-black/50">
                      {img.meta}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div className="flex-shrink-0 w-[20vw]" />
          </motion.div>
        </div>
      </div>

      {/* MOBILE — простой вертикальный список */}
      <div className="md:hidden px-6 pb-10 space-y-4">
        {items.map((img, i) => (
          <div key={i} className="relative aspect-[4/5] bg-[#0A0A0A] border border-white/10 overflow-hidden">
            <img
              src={resolveMedia(img.src)}
              alt={img.alt || img.title}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 pointer-events-none">
              <div className="px-3 py-2 bg-black/65 backdrop-blur-md border border-white/10 max-w-[70%]">
                <div className="text-[10px] tracking-[0.4em] uppercase text-white/60">
                  № {String(i + 1).padStart(2, "0")}
                </div>
                {img.title && (
                  <div className="mt-1 text-xl tracking-tight font-medium leading-none text-white">
                    {img.title}
                  </div>
                )}
              </div>
              {img.meta && (
                <div className="text-[10px] tracking-[0.3em] uppercase text-white/85 px-2 py-1 border border-white/20 bg-black/50 backdrop-blur">
                  {img.meta}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-[1400px] px-6 md:px-10 pb-16 md:pb-20">
        <div className="border-t border-white/10 pt-6 md:pt-8 flex flex-col md:flex-row md:items-center md:justify-end gap-5">
          <p className="md:hidden text-[#BDBDBD] text-sm font-light leading-relaxed">
            {gallery.cta_text_mobile_prefix}
            <span className="text-white">{gallery.cta_text_mobile_strong}</span>
            {gallery.cta_text_mobile_suffix}
          </p>
          <a
            href="#contact"
            data-testid="gallery-cta"
            className="group inline-flex items-center justify-center gap-4 px-6 py-4 bg-white text-black text-[11px] tracking-[0.3em] uppercase hover:bg-[#EDEDED] transition-all duration-300 shine"
          >
            {gallery.cta_label}
            <span className="block w-8 h-px bg-current transition-all duration-500 group-hover:w-12" />
          </a>
        </div>
      </div>
    </section>
  );
}
