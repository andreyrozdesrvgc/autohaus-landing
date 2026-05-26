import React, { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useContent } from "@/context/ContentContext";
import { resolveMedia } from "@/lib/contentDefaults";

export default function Gallery() {
  const { gallery } = useContent();
  const items = gallery.items || [];
  const wrapper = useRef(null);
  const headerRef = useRef(null);
  const headerIn = useInView(headerRef, { once: true, margin: "-10%" });
  const { scrollYProgress } = useScroll({
    target: wrapper,
    offset: ["start start", "end end"],
  });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-78%"]);

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

      <div ref={wrapper} className="relative h-[260vh] hidden md:block">
        <div className="sticky top-0 h-screen overflow-hidden">
          <motion.div style={{ x }} className="flex h-full items-center gap-6 px-10 will-change-transform">
            {items.map((img, i) => (
              <div
                key={i}
                data-testid={`gallery-item-${i}`}
                className="relative flex-shrink-0 h-[78vh] w-[60vw] max-w-[900px] bg-[#0A0A0A] border border-white/10 overflow-hidden group"
              >
                <img
                  src={resolveMedia(img.src)}
                  alt={img.alt || img.title}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
                  <div>
                    <div className="text-[10px] tracking-[0.4em] uppercase text-white/60">
                      № {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="mt-2 text-3xl tracking-tight font-medium">{img.title}</div>
                  </div>
                  <div className="text-[11px] tracking-[0.3em] uppercase text-white/70 px-3 py-2 border border-white/20 backdrop-blur-md bg-black/40">
                    {img.meta}
                  </div>
                </div>
              </div>
            ))}
            <div className="flex-shrink-0 w-[20vw]" />
          </motion.div>
        </div>
      </div>

      <div className="md:hidden px-6 pb-10 space-y-4">
        {items.map((img, i) => (
          <div key={i} className="relative aspect-[4/5] bg-[#0A0A0A] border border-white/10 overflow-hidden">
            <img src={resolveMedia(img.src)} alt={img.alt || img.title} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover grayscale" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
              <div>
                <div className="text-[10px] tracking-[0.4em] uppercase text-white/60">№ {String(i + 1).padStart(2, "0")}</div>
                <div className="mt-1 text-2xl tracking-tight font-medium">{img.title}</div>
              </div>
              <div className="text-[10px] tracking-[0.3em] uppercase text-white/70 px-2 py-1 border border-white/20 bg-black/40">
                {img.meta}
              </div>
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
