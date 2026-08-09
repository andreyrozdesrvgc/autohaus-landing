import React, { useRef, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useContent } from "@/context/ContentContext";
import { resolveMedia } from "@/lib/contentDefaults";

/**
 * Наша команда — горизонтальный snap-scroll ряд компактных карточек.
 * На экране видно 3 карточки + краешек 4-й. БЕЗ per-card анимации, чтобы
 * карточки не "летали" при горизонтальном скролле. Без CTA-кнопок.
 */
export default function Team() {
  const content = useContent();
  const team = content?.team || {};
  const members = team.members || [];
  const headerRef = useRef(null);
  const trackRef = useRef(null);
  const headerIn = useInView(headerRef, { once: true, margin: "-15%" });

  const scrollByCards = useCallback((dir) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector('[data-testid^="team-card-"]');
    const step = card ? card.getBoundingClientRect().width + 16 : 300;
    track.scrollBy({ left: dir * step, behavior: "smooth" });
  }, []);

  if (!members.length) return null;

  return (
    <section
      id="team"
      data-testid="team-section"
      className="relative w-full bg-black py-16 md:py-24 border-t border-white/5"
    >
      <div ref={headerRef} className="mx-auto max-w-[1400px] px-6 md:px-10 mb-8 md:mb-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-2xl">
            <span className="text-[11px] tracking-[0.4em] uppercase text-white/50">
              {team.overline}
            </span>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={headerIn ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              data-testid="team-heading"
              className="mt-4 text-4xl md:text-5xl lg:text-6xl tracking-tighter font-medium leading-[0.95]"
            >
              {team.title_line_1}{" "}
              <span className="text-[#BDBDBD]">{team.title_line_2_grey}</span>
              {team.title_line_2_white}
            </motion.h2>
          </div>
          <div className="flex flex-col md:items-end gap-5 md:max-w-sm">
            {team.description && (
              <p className="text-[#BDBDBD] text-base md:text-lg leading-relaxed">
                {team.description}
              </p>
            )}
            <div className="hidden md:flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollByCards(-1)}
                aria-label="Предыдущий сотрудник"
                data-testid="team-prev"
                className="w-11 h-11 border border-white/15 flex items-center justify-center hover:border-white/40 hover:bg-white/[0.04] transition-all"
              >
                <ChevronLeft size={18} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={() => scrollByCards(1)}
                aria-label="Следующий сотрудник"
                data-testid="team-next"
                className="w-11 h-11 border border-white/15 flex items-center justify-center hover:border-white/40 hover:bg-white/[0.04] transition-all"
              >
                <ChevronRight size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={trackRef}
        data-testid="team-track"
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-6 md:px-10 pb-4 no-scrollbar"
        style={{ scrollPaddingLeft: "24px", scrollPaddingRight: "24px" }}
      >
        {members.map((m, i) => (
          <TeamCard key={i} member={m} index={i} />
        ))}
        <div className="flex-shrink-0 w-2" aria-hidden="true" />
      </div>

      <div className="md:hidden mx-auto max-w-[1400px] px-6 mt-3 text-center">
        <motion.span
          animate={{ opacity: [0.35, 0.85, 0.35], x: [0, 4, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="inline-flex items-center gap-2 text-[10px] tracking-[0.32em] uppercase text-white/55"
        >
          Свайпните — ещё мастера
          <ChevronRight size={14} strokeWidth={1.5} />
        </motion.span>
      </div>

      {(team.footer_left || team.footer_right) && (
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 pt-10 md:pt-14">
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-[11px] tracking-[0.32em] uppercase text-white/45">
            <span>{team.footer_left}</span>
            <span className="text-white/60 md:max-w-md md:text-right md:normal-case md:tracking-normal md:text-sm md:font-light leading-relaxed">
              {team.footer_right}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

function TeamCard({ member, index }) {
  return (
    <article
      data-testid={`team-card-${index}`}
      className="group relative flex-shrink-0 snap-start w-[62vw] sm:w-[42vw] md:w-[240px] lg:w-[260px] bg-[#0A0A0A] border border-white/10 overflow-hidden flex flex-col"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        {member.photo ? (
          <img
            src={resolveMedia(member.photo)}
            alt={`${member.name} — ${member.role || "мастер AUTOHAUS"}`}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover grayscale-[0.4] transition-all duration-700 group-hover:grayscale-0 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-[#0A0A0A] flex items-center justify-center text-[10px] tracking-[0.32em] uppercase text-white/30">
            No photo
          </div>
        )}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0.92) 100%)",
          }}
        />
        {member.years && (
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur border border-white/15 text-[9px] tracking-[0.28em] uppercase text-white/85">
            {member.years}
          </div>
        )}
        <div className="absolute bottom-0 inset-x-0 p-4">
          <div className="text-[9px] tracking-[0.32em] uppercase text-white/55">
            № {String(index + 1).padStart(2, "0")}
          </div>
          <h3 className="mt-0.5 text-lg md:text-xl tracking-tighter font-medium leading-none text-white">
            {member.name}
          </h3>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-1.5">
        {member.role && (
          <div className="text-[10px] tracking-[0.28em] uppercase text-white/55">
            {member.role}
          </div>
        )}
        {member.focus && (
          <p className="text-[12px] text-[#BDBDBD] leading-relaxed font-light line-clamp-2">
            {member.focus}
          </p>
        )}
      </div>
    </article>
  );
}
