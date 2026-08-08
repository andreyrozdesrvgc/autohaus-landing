import React, { useRef, useCallback, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useContent } from "@/context/ContentContext";
import { resolveMedia } from "@/lib/contentDefaults";
import LeadPopup from "@/components/LeadPopup";

/** Individual card — теперь ФОТО (9:16), без autoplay-видео и связанного черного фона. */
function LiveCard({ item, index, total, onOpen, onCta }) {
  // Backward-compat: старые записи имеют `poster` (фото-превью); новые — `image`.
  const imageUrl = item.image || item.poster;

  return (
    <article
      data-testid={`live-card-${index}`}
      className="relative flex-shrink-0 snap-center w-[82vw] sm:w-[55vw] md:w-[300px] lg:w-[340px] flex flex-col gap-3"
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Открыть фото: ${item.title || `кадр ${index + 1}`}`}
        data-testid={`live-card-open-${index}`}
        className="relative aspect-[9/16] bg-[#0A0A0A] border border-white/10 overflow-hidden group cursor-pointer text-left"
      >
        {imageUrl ? (
          <img
            src={resolveMedia(imageUrl)}
            alt={`AutoHaus Live — ${item.title || `кадр ${index + 1}`}`}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-[#0A0A0A]" />
        )}

        {/* Cinematic overlays */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.75) 100%)",
          }}
        />
        <div className="absolute inset-0 grain pointer-events-none" />

        {/* Studio badge + counter */}
        <div className="absolute top-4 inset-x-4 flex items-center justify-between text-[10px] tracking-[0.32em] uppercase text-white/80">
          <span className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-60 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
            </span>
            Studio
          </span>
          <span>{String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
        </div>

        {/* Bottom title */}
        <div className="absolute bottom-4 left-4 right-4">
          {item.meta && (
            <div className="text-[10px] tracking-[0.28em] uppercase text-white/55 mb-1.5">
              {item.meta}
            </div>
          )}
          <h3 className="text-lg md:text-xl tracking-tight font-medium leading-tight text-white">
            {item.title}
          </h3>
        </div>
      </button>

      <button
        type="button"
        onClick={onCta}
        data-testid={`live-cta-${index}`}
        className="group inline-flex items-center justify-between gap-3 px-5 py-3.5 bg-white text-black text-[10px] tracking-[0.28em] uppercase hover:bg-[#EDEDED] transition-all shine cursor-pointer"
      >
        {item.cta_label || "Хочу так же"}
        <ArrowUpRight size={14} strokeWidth={1.5} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </button>
    </article>
  );
}

/** Простой лайтбокс для фото (заменяет VideoLightbox). */
function PhotoLightbox({ open, image, title, meta, onClose }) {
  if (!open || !image) return null;
  return (
    <div
      data-testid="photo-lightbox"
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-10"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Закрыть"
        className="absolute top-6 right-6 w-11 h-11 border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all"
      >
        <X size={18} strokeWidth={1.5} />
      </button>
      <div className="relative max-w-full max-h-full flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
        <img
          src={resolveMedia(image)}
          alt={title || "AutoHaus Live"}
          className="max-w-[95vw] md:max-w-[520px] max-h-[85vh] object-contain"
        />
        {(title || meta) && (
          <div className="text-center">
            {meta && (
              <div className="text-[10px] tracking-[0.32em] uppercase text-white/50">{meta}</div>
            )}
            {title && (
              <div className="mt-1 text-lg tracking-tight font-medium text-white">{title}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AutoHausLive() {
  const content = useContent();
  const live = content?.live || {};
  const headerRef = useRef(null);
  const trackRef = useRef(null);
  const headerIn = useInView(headerRef, { once: true, margin: "-15%" });
  const items = live.items || [];
  const [activeIdx, setActiveIdx] = useState(null);
  const [popupIdx, setPopupIdx] = useState(null);
  const active = activeIdx != null ? items[activeIdx] : null;
  const popupItem = popupIdx != null ? items[popupIdx] : null;

  const scrollByCards = useCallback((dir) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector('[data-testid^="live-card-"]');
    const step = card ? card.getBoundingClientRect().width + 24 : 320;
    track.scrollBy({ left: dir * step, behavior: "smooth" });
  }, []);

  if (!items.length) return null;

  return (
    <section
      id="live"
      data-testid="live-section"
      className="relative w-full bg-black py-16 md:py-24 border-t border-white/5"
    >
      {/* HEADER */}
      <div ref={headerRef} className="mx-auto max-w-[1400px] px-6 md:px-10 mb-10 md:mb-14">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <span className="text-[11px] tracking-[0.4em] uppercase text-white/50">
              {live.overline}
            </span>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={headerIn ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              data-testid="live-heading"
              className="mt-4 text-4xl md:text-6xl lg:text-7xl tracking-tighter font-medium leading-[0.95]"
            >
              {live.title_line_1}<br />
              <span className="text-[#BDBDBD]">{live.title_line_2}</span>
            </motion.h2>
          </div>
          <div className="flex flex-col md:items-end gap-5 md:max-w-sm">
            <p className="text-[#BDBDBD] text-base md:text-lg leading-relaxed">
              {live.description}
            </p>
            <div className="hidden md:flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollByCards(-1)}
                aria-label="Предыдущий кадр"
                data-testid="live-prev"
                className="w-11 h-11 border border-white/15 flex items-center justify-center hover:border-white/40 hover:bg-white/[0.04] transition-all"
              >
                <ChevronLeft size={18} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={() => scrollByCards(1)}
                aria-label="Следующий кадр"
                data-testid="live-next"
                className="w-11 h-11 border border-white/15 flex items-center justify-center hover:border-white/40 hover:bg-white/[0.04] transition-all"
              >
                <ChevronRight size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TRACK */}
      <div
        ref={trackRef}
        data-testid="live-track"
        className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory px-6 md:px-10 pb-4 no-scrollbar"
        style={{ scrollPaddingLeft: "24px", scrollPaddingRight: "24px" }}
      >
        {items.map((item, i) => (
          <LiveCard
            key={i}
            item={item}
            index={i}
            total={items.length}
            onOpen={() => setActiveIdx(i)}
            onCta={() => setPopupIdx(i)}
          />
        ))}
        <div className="flex-shrink-0 w-2" aria-hidden="true" />
      </div>

      <div className="md:hidden mx-auto max-w-[1400px] px-6 mt-3 text-center">
        <span className="text-[10px] tracking-[0.32em] uppercase text-white/35">
          Свайпните влево / вправо
        </span>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 md:px-10 pt-10 md:pt-14">
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-[11px] tracking-[0.32em] uppercase text-white/45">
          <span>{live.footer_left}</span>
          <span className="text-white/60 md:max-w-md md:text-right md:normal-case md:tracking-normal md:text-sm md:font-light leading-relaxed">
            {live.footer_right}
          </span>
        </div>
      </div>

      <PhotoLightbox
        open={active != null}
        image={active ? (active.image || active.poster) : null}
        title={active?.title}
        meta={active?.meta}
        onClose={() => setActiveIdx(null)}
      />

      <LeadPopup
        open={popupItem != null}
        onClose={() => setPopupIdx(null)}
        source="autohaus_live"
        subject={popupItem ? `AutoHaus Live · ${popupItem.title || `кадр ${popupIdx + 1}`}` : ""}
      />
    </section>
  );
}
