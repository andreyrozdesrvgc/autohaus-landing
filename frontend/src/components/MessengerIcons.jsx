import React from "react";

/**
 * Единый ряд иконок мессенджеров — Telegram / WhatsApp / MAX.
 * Стиль: тонкие чёрно-белые SVG-иконки, hover — инверсия.
 *
 * Использование:
 *   import MessengerIcons from "@/components/MessengerIcons";
 *   <MessengerIcons variant="footer" telegram="..." whatsapp="..." max="..." />
 */
export default function MessengerIcons({ telegram, whatsapp, max, variant = "footer", className = "" }) {
  const base =
    "inline-flex items-center justify-center border transition-all duration-300";

  const sizeCls =
    variant === "header"
      ? "w-9 h-9 md:w-10 md:h-10"
      : "w-10 h-10 md:w-11 md:h-11";

  const colorCls =
    "border-white/15 text-white/75 hover:text-black hover:bg-white hover:border-white";

  const items = [
    telegram && { key: "telegram", href: telegram, label: "Telegram", node: <TelegramIcon /> },
    whatsapp && { key: "whatsapp", href: whatsapp, label: "WhatsApp", node: <WhatsAppIcon /> },
    max && { key: "max", href: max, label: "MAX", node: <MaxIcon /> },
  ].filter(Boolean);

  if (!items.length) return null;

  return (
    <div className={`flex items-center gap-2 md:gap-3 ${className}`}>
      {items.map((it) => (
        <a
          key={it.label}
          href={it.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={it.label}
          data-testid={`messenger-${it.label.toLowerCase()}`}
          className={`group ${base} ${sizeCls} ${colorCls}`}
        >
          {it.node}
        </a>
      ))}
    </div>
  );
}

function TelegramIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Paper-plane silhouette */}
      <path d="M21.5 3.5L2.5 10.8c-.7.3-.7 1.3 0 1.5l4.7 1.6 1.7 5.6c.2.7 1 .9 1.5.3l2.6-2.7 4.7 3.4c.6.4 1.4.1 1.6-.6L23 4.7c.2-.9-.7-1.6-1.5-1.2z" />
      <path d="M7.2 13.9l10.8-8" />
      <path d="M7.2 13.9l3.7 3.1" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      {/* Official WhatsApp glyph — solid speech bubble with phone handset */}
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.174.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
    </svg>
  );
}

/** MAX (max.ru) — brand logo (white on transparent PNG). */
function MaxIcon() {
  return (
    <img
      src="/img/max-logo.png"
      alt=""
      aria-hidden="true"
      width="18"
      height="18"
      className="w-[18px] h-[18px] object-contain pointer-events-none group-hover:invert transition-[filter] duration-300"
      draggable={false}
    />
  );
}
