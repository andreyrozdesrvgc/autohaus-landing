import React, { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useContent } from "@/context/ContentContext";
import { resolveMedia } from "@/lib/contentDefaults";
import LeadPopup from "@/components/LeadPopup";

const cardFade = (i) => ({
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.1 + i * 0.08 },
});

/** Дательный падеж мужских/женских русских имён — для «Записаться к Максиму». */
function toDativeRu(name) {
  if (!name) return name;
  const n = name.trim();
  if (!n) return n;
  const lower = n.toLowerCase();
  // Простые правила для большинства имён
  if (lower.endsWith("ий")) return n.slice(0, -2) + "ию"; // Дмитрий → Дмитрию
  if (lower.endsWith("й"))  return n.slice(0, -1) + "ю";  // Николай → Николаю
  if (lower.endsWith("ь"))  return n.slice(0, -1) + "ю";  // Игорь → Игорю
  if (lower.endsWith("я"))  return n.slice(0, -1) + "е";  // Илья → Илье
  if (lower.endsWith("а"))  return n.slice(0, -1) + "е";  // Никита → Никите, Мария → Марии(упрощаем)
  return n + "у"; // согласная (Максим/Артём/Иван) → +у
}

/**
 * Наша команда — 6 сотрудников (динамическое кол-во из CMS).
 * Каждая карточка: фото 3:4, имя, должность, специализация, стаж, CTA «Записаться к [Имя]».
 * Мягкие анимации появления при скролле.
 * Мобилка: 1 колонка. Планшет: 2. Десктоп: 3.
 */
export default function Team() {
  const content = useContent();
  const team = content?.team || {};
  const members = team.members || [];
  const [popupIdx, setPopupIdx] = useState(null);
  const headerRef = useRef(null);
  const headerIn = useInView(headerRef, { once: true, margin: "-15%" });

  if (!members.length) return null;

  const activeMember = popupIdx != null ? members[popupIdx] : null;
  const ctaPrefix = team.cta_prefix || "Записаться к";

  return (
    <section
      id="team"
      data-testid="team-section"
      className="relative w-full bg-black py-16 md:py-24 border-t border-white/5"
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        {/* Header */}
        <div ref={headerRef} className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-16">
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
          {team.description && (
            <p className="text-[#BDBDBD] text-base md:text-lg leading-relaxed max-w-md">
              {team.description}
            </p>
          )}
        </div>

        {/* Cards grid */}
        <div
          data-testid="team-grid"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6"
        >
          {members.map((m, i) => (
            <TeamCard
              key={i}
              member={m}
              index={i}
              ctaPrefix={ctaPrefix}
              onCta={() => setPopupIdx(i)}
            />
          ))}
        </div>

        {/* Footer meta */}
        {(team.footer_left || team.footer_right) && (
          <div className="mt-12 md:mt-16 border-t border-white/10 pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-[11px] tracking-[0.32em] uppercase text-white/45">
            <span>{team.footer_left}</span>
            <span className="text-white/60 md:max-w-md md:text-right md:normal-case md:tracking-normal md:text-sm md:font-light leading-relaxed">
              {team.footer_right}
            </span>
          </div>
        )}
      </div>

      <LeadPopup
        open={activeMember != null}
        onClose={() => setPopupIdx(null)}
        source="team_member"
        subject={activeMember ? `Запись к мастеру · ${activeMember.name}` : ""}
      />
    </section>
  );
}

function TeamCard({ member, index, ctaPrefix, onCta }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <motion.article
      ref={ref}
      {...cardFade(index)}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      data-testid={`team-card-${index}`}
      className="group relative bg-[#0A0A0A] border border-white/10 overflow-hidden flex flex-col"
    >
      {/* Photo */}
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
              "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0.9) 100%)",
          }}
        />
        {/* Years badge */}
        {member.years && (
          <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 backdrop-blur border border-white/15 text-[10px] tracking-[0.28em] uppercase text-white/85">
            {member.years} в студии
          </div>
        )}
        {/* Name overlay */}
        <div className="absolute bottom-0 inset-x-0 p-5 md:p-6">
          <div className="text-[10px] tracking-[0.32em] uppercase text-white/60">
            № {String(index + 1).padStart(2, "0")}
          </div>
          <h3 className="mt-1 text-2xl md:text-3xl tracking-tighter font-medium leading-none text-white">
            {member.name}
          </h3>
        </div>
      </div>

      {/* Info block */}
      <div className="flex-1 p-5 md:p-6 flex flex-col gap-4">
        <div>
          {member.role && (
            <div className="text-[10px] tracking-[0.32em] uppercase text-white/55">
              {member.role}
            </div>
          )}
          {member.focus && (
            <p className="mt-2 text-[13px] md:text-sm text-[#BDBDBD] leading-relaxed font-light">
              {member.focus}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onCta}
          data-testid={`team-cta-${index}`}
          className="mt-auto group/btn inline-flex items-center justify-between gap-3 px-4 py-3 border border-white/15 text-[10px] tracking-[0.28em] uppercase text-white/85 hover:bg-white hover:text-black hover:border-white transition-all duration-500"
        >
          <span>
            {ctaPrefix} {toDativeRu(member.name)}
          </span>
          <ArrowUpRight
            size={14}
            strokeWidth={1.5}
            className="transition-transform duration-500 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
          />
        </button>
      </div>
    </motion.article>
  );
}
