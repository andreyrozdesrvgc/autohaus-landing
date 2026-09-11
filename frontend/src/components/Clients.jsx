import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useContent } from "@/context/ContentContext";
import { resolveMedia } from "@/lib/contentDefaults";

/**
 * Наши клиенты — блок доверия.
 * Компьютер: логотипы в один ряд (auto-fit).
 * Мобильный: 2 колонки, 2 строки при 4 лого.
 * Количество лого меняется в админке — сетка адаптируется.
 */
export default function Clients() {
  const content = useContent();
  const clients = content?.clients || {};
  const items = clients.items || [];
  const headerRef = useRef(null);
  const inView = useInView(headerRef, { once: true, margin: "-15%" });

  if (!items.length) return null;

  return (
    <section
      id="clients"
      data-testid="clients-section"
      className="relative w-full bg-black py-16 md:py-24 border-t border-white/5"
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        {/* Header */}
        <div ref={headerRef} className="max-w-3xl">
          <span className="text-[11px] tracking-[0.4em] uppercase text-white/50">
            {clients.overline}
          </span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            data-testid="clients-heading"
            className="mt-4 text-4xl md:text-5xl lg:text-6xl tracking-tighter font-medium leading-[0.95]"
          >
            {clients.title_line_1}{" "}
            <span className="text-[#BDBDBD]">{clients.title_line_2_grey}</span>
          </motion.h2>
          {clients.description && (
            <p className="mt-6 text-[#BDBDBD] text-base md:text-lg leading-relaxed max-w-2xl">
              {clients.description}
            </p>
          )}
        </div>

        {/* Logos grid — 2 cols on mobile, N cols on desktop where N = items.length
             capped at 6, so 7 logos gracefully split into 6+1 stays centred, and
             1-6 logos fit exactly in one row without a lonely orphan. */}
        {(() => {
          const desktopCols = Math.min(items.length, 6);
          return (
            <div
              data-testid="clients-grid"
              className="mt-10 md:mt-16 grid grid-cols-2 gap-px bg-white/[0.06] border border-white/[0.06] justify-center"
              style={{
                gridTemplateColumns: undefined,
              }}
            >
              <style>{`
                @media (min-width: 768px) {
                  [data-testid="clients-grid"] {
                    grid-template-columns: repeat(${desktopCols}, minmax(0, 1fr)) !important;
                  }
                }
              `}</style>
              {items.map((item, i) => {
                // If total items > desktopCols, last row may be short — centre orphans.
                const rem = items.length % desktopCols;
                const orphanCount = rem === 0 ? 0 : rem;
                const isOrphan = orphanCount > 0 && i >= items.length - orphanCount;
                const firstOrphanIdx = items.length - orphanCount;
                const orphanPosition = i - firstOrphanIdx; // 0-based within orphan row
                // Compute starting column for first orphan to centre the group.
                const orphanStartCol = Math.floor((desktopCols - orphanCount) / 2) + 1;
                const orphanStyle = isOrphan
                  ? { gridColumnStart: orphanStartCol + orphanPosition }
                  : undefined;
                return (
                  <div
                    key={i}
                    data-testid={`client-item-${i}`}
                    className="flex flex-col items-center justify-center gap-3 md:gap-4 bg-black px-4 py-8 md:py-12 min-h-[160px] md:min-h-[200px]"
                    style={orphanStyle}
                  >
                    {item.logo ? (
                      <img
                        src={resolveMedia(item.logo)}
                        alt={`Логотип ${item.name || `клиент ${i + 1}`}`}
                        loading="lazy"
                        className="h-16 md:h-20 max-w-[80%] object-contain transition-transform duration-500 hover:scale-105"
                      />
                    ) : (
                      <div className="h-10 md:h-14 w-24 bg-white/5 border border-white/10 flex items-center justify-center text-[10px] tracking-[0.32em] uppercase text-white/30">
                        Empty
                      </div>
                    )}
                    {item.name && (
                      <div className="text-[10px] md:text-[11px] tracking-[0.3em] uppercase text-white/55 text-center">
                        {item.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {clients.footer_note && (
          <div className="mt-6 md:mt-8 text-[10px] tracking-[0.28em] uppercase text-white/35 text-center md:text-left">
            {clients.footer_note}
          </div>
        )}
      </div>
    </section>
  );
}
