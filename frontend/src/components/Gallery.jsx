import React, { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";

const IMAGES = [
  { src: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=2000&q=85", title: "BMW M4", meta: "PPF · Gloss", alt: "Оклейка BMW M4 полиуретановой плёнкой PPF в Калининграде" },
  { src: "https://images.unsplash.com/photo-1617814086367-b8cb20edbe98?auto=format&fit=crop&w=2000&q=85", title: "BMW M5", meta: "Vinyl · Matte", alt: "Смена цвета BMW M5 матовым винилом — премиум детейлинг" },
  { src: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=2000&q=85", title: "BMW X5 M", meta: "PPF · Stealth", alt: "BMW X5 M в плёнке stealth — полная защита кузова Калининград" },
  { src: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=2000&q=85", title: "BMW G80", meta: "Anti-chrome", alt: "Антихром BMW G80 — затемнение хромированных элементов" },
  { src: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2000&q=85", title: "BMW M3 Touring", meta: "Vinyl · Satin", alt: "BMW M3 Touring в сатиновом виниле — смена цвета авто Калининград" },
  { src: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=2000&q=85", title: "BMW i7", meta: "Full Wrap", alt: "BMW i7 — полная оклейка кузова виниловой плёнкой AUTOHAUS" },
];

export default function Gallery() {
  const wrapper = useRef(null);
  const headerRef = useRef(null);
  const headerIn = useInView(headerRef, { once: true, margin: "-10%" });
  const { scrollYProgress } = useScroll({
    target: wrapper,
    offset: ["start start", "end end"],
  });
  // Translate horizontally based on scroll
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
              008 — Selected Works
            </span>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={headerIn ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 text-4xl md:text-6xl lg:text-7xl tracking-tighter font-medium leading-[0.95]"
            >
              BMW.<br />
              <span className="text-[#BDBDBD]">Серия избранных работ.</span>
            </motion.h2>
          </div>
          <p className="text-[#BDBDBD] text-base md:text-lg leading-relaxed max-w-sm">
            Скрольте — галерея движется горизонтально. Каждый автомобиль —
            отдельная история точности.
          </p>
        </div>
      </div>

      <div ref={wrapper} className="relative h-[260vh] hidden md:block">
        <div className="sticky top-0 h-screen overflow-hidden">
          <motion.div style={{ x }} className="flex h-full items-center gap-6 px-10 will-change-transform">
            {IMAGES.map((img, i) => (
              <div
                key={i}
                data-testid={`gallery-item-${i}`}
                className="relative flex-shrink-0 h-[78vh] w-[60vw] max-w-[900px] bg-[#0A0A0A] border border-white/10 overflow-hidden group"
              >
                <img
                  src={img.src}
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

      {/* Mobile: vertical fallback */}
      <div className="md:hidden px-6 pb-10 space-y-4">
        {IMAGES.map((img, i) => (
          <div key={i} className="relative aspect-[4/5] bg-[#0A0A0A] border border-white/10 overflow-hidden">
            <img src={img.src} alt={img.alt || img.title} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover grayscale" />
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

      {/* Inline CTA — second conversion moment, right after the cases */}
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 pb-16 md:pb-20">
        <div className="border-t border-white/10 pt-6 md:pt-8 flex flex-col md:flex-row md:items-center md:justify-end gap-5">
          {/* Supporting line — mobile only */}
          <p className="md:hidden text-[#BDBDBD] text-sm font-light leading-relaxed">
            Хотите также?{" "}
            <span className="text-white">Приезжайте на осмотр</span> — подберём
            решение под Ваш автомобиль.
          </p>
          <a
            href="#contact"
            data-testid="gallery-cta"
            className="group inline-flex items-center justify-center gap-4 px-6 py-4 bg-white text-black text-[11px] tracking-[0.3em] uppercase hover:bg-[#EDEDED] transition-all duration-300 shine"
          >
            Записаться на осмотр
            <span className="block w-8 h-px bg-current transition-all duration-500 group-hover:w-12" />
          </a>
        </div>
      </div>
    </section>
  );
}
