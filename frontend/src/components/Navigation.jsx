import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useContent } from "@/context/ContentContext";
import MessengerIcons from "@/components/MessengerIcons";
import LeadPopup from "@/components/LeadPopup";

const links = [
  { label: "Протокол", href: "#protocol" },
  { label: "Услуги", href: "#services" },
  { label: "Конфигуратор", href: "#configurator" },
  { label: "Работы", href: "#gallery" },
  { label: "Контакты", href: "#contact" },
];

export default function Navigation() {
  const { footer } = useContent();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      data-testid="main-nav"
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? "py-3" : "py-6"
      }`}
    >
      <div
        className={`mx-auto max-w-[1400px] px-6 md:px-10 flex items-center justify-between transition-all duration-500 ${
          scrolled ? "glass-strong" : ""
        }`}
        style={{ borderRadius: 0 }}
      >
        <a
          href="#top"
          data-testid="brand-logo"
          className={`flex items-center gap-2 py-3 select-none transition-all`}
        >
          <span className="block w-2 h-2 rounded-full bg-white" />
          <span className="text-[15px] tracking-[0.32em] font-medium uppercase">
            AUTOHAUS
          </span>
          <span className="hidden md:inline ml-2 text-[10px] tracking-[0.4em] uppercase text-[#BDBDBD]">
            Kaliningrad
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-10">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              data-testid={`nav-link-${l.href.replace("#", "")}`}
              className="text-[12px] tracking-[0.22em] uppercase text-[#BDBDBD] hover:text-white transition-colors duration-300"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Messenger row — desktop */}
          <div className="hidden lg:block">
            <MessengerIcons
              variant="header"
              telegram={footer?.telegram_url}
              whatsapp={footer?.whatsapp_url}
              max={footer?.max_url}
            />
          </div>
          <a
            href="#contact"
            onClick={(e) => { e.preventDefault(); setPopupOpen(true); }}
            data-testid="nav-cta-button"
            className="hidden md:inline-flex items-center gap-2 px-5 py-3 border border-white/20 text-[11px] tracking-[0.28em] uppercase hover:bg-white hover:text-black transition-all duration-500 shine cursor-pointer"
          >
            Записаться
            <span className="block w-3 h-px bg-current" />
          </a>
          <button
            data-testid="mobile-menu-toggle"
            onClick={() => setOpen((s) => !s)}
            className="md:hidden p-3 border border-white/15"
            aria-label="Menu"
          >
            <span className="block w-5 h-px bg-white mb-1.5" />
            <span className="block w-5 h-px bg-white" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          data-testid="mobile-menu"
          className="md:hidden mt-2 mx-4 glass-strong p-6 flex flex-col gap-4"
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-[13px] tracking-[0.2em] uppercase text-white/80 hover:text-white"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#contact"
            onClick={(e) => { e.preventDefault(); setOpen(false); setPopupOpen(true); }}
            className="mt-2 inline-flex items-center gap-2 px-5 py-3 border border-white/20 text-[11px] tracking-[0.28em] uppercase cursor-pointer"
          >
            Записаться
          </a>
          <div className="mt-3 pt-4 border-t border-white/10">
            <div className="text-[10px] tracking-[0.32em] uppercase text-white/40 mb-3">
              Мессенджеры
            </div>
            <MessengerIcons
              variant="header"
              telegram={footer?.telegram_url}
              whatsapp={footer?.whatsapp_url}
              max={footer?.max_url}
            />
          </div>
        </div>
      )}

      <LeadPopup
        open={popupOpen}
        onClose={() => setPopupOpen(false)}
        source="header_cta"
        mode="chooser"
      />
    </motion.header>
  );
}
