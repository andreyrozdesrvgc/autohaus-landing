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
    telegram && { href: telegram, label: "Telegram", node: <TelegramIcon /> },
    whatsapp && { href: whatsapp, label: "WhatsApp", node: <WhatsAppIcon /> },
    max && { href: max, label: "MAX", node: <MaxIcon /> },
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
          className={`${base} ${sizeCls} ${colorCls}`}
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
      {/* Chat bubble with WA tail */}
      <path d="M3 20.5l1.3-4A8.5 8.5 0 1 1 8 20l-5 .5z" />
      <path d="M8.5 9.2c.5 2.2 2.2 3.9 4.4 4.4l1.4-1.4a.9.9 0 0 1 1-.2l2 .8a.9.9 0 0 1 .6.9 3.6 3.6 0 0 1-3.6 3.4A7.6 7.6 0 0 1 6.6 9.2 3.6 3.6 0 0 1 10 5.6a.9.9 0 0 1 .9.6l.8 2a.9.9 0 0 1-.2 1L10 10.5" />
    </svg>
  );
}

/** MAX (максимум-ру / max.ru) — стилизованная буква "M" в квадратной рамке. */
function MaxIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Speech-bubble frame */}
      <path d="M4 4h16v14a2 2 0 0 1-2 2h-6l-4 3v-3H6a2 2 0 0 1-2-2V4z" />
      {/* Letter M */}
      <path d="M8 15V8l4 5 4-5v7" />
    </svg>
  );
}
