import React from "react";
import { useContent } from "@/context/ContentContext";
import MessengerIcons from "@/components/MessengerIcons";

export default function Footer() {
  const { footer } = useContent();
  return (
    <footer
      data-testid="footer"
      className="relative w-full bg-black border-t border-white/10 py-12 md:py-14"
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="overflow-hidden mb-10 md:mb-12">
          <div className="text-[clamp(4rem,15vw,12rem)] tracking-tighter font-medium leading-none text-white/10 whitespace-nowrap select-none">
            {footer.marquee}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="block w-2 h-2 rounded-full bg-white" />
              <span className="text-[13px] tracking-[0.32em] uppercase font-medium">{footer.brand}</span>
            </div>
            <p className="text-sm text-[#BDBDBD] font-light leading-relaxed">
              {footer.tagline}
            </p>
          </div>

          <div>
            <div className="text-[11px] tracking-[0.32em] uppercase text-white/40 mb-4">{footer.nav_label}</div>
            <ul className="space-y-2 text-sm">
              <li><a href="#protocol" className="text-white/80 hover:text-white">Протокол</a></li>
              <li><a href="#services" className="text-white/80 hover:text-white">Услуги</a></li>
              <li><a href="#configurator" className="text-white/80 hover:text-white">Конфигуратор</a></li>
              <li><a href="#gallery" className="text-white/80 hover:text-white">Работы</a></li>
            </ul>
          </div>

          <div>
            <div className="text-[11px] tracking-[0.32em] uppercase text-white/40 mb-4">{footer.contacts_label}</div>
            <ul className="space-y-2 text-sm text-[#BDBDBD]">
              <li>{footer.address_line_1}<br />{footer.address_line_2}</li>
              <li><a href={`tel:${footer.phone_link}`} className="hover:text-white">{footer.phone_display}</a></li>
              <li><a href={`mailto:${footer.email}`} className="hover:text-white">{footer.email}</a></li>
            </ul>
            <div className="mt-5">
              <MessengerIcons
                variant="footer"
                telegram={footer.telegram_url}
                whatsapp={footer.whatsapp_url}
                max={footer.max_url}
              />
            </div>
          </div>

          <div>
            <div className="text-[11px] tracking-[0.32em] uppercase text-white/40 mb-4">{footer.hours_label}</div>
            <ul className="space-y-2 text-sm text-[#BDBDBD]">
              <li>{footer.hours_line_1}</li>
              <li>{footer.hours_line_2}</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-6 border-t border-white/10 text-[10px] tracking-[0.32em] uppercase text-white/40">
          <span>{footer.copyright}</span>
          <span>{footer.tagline_right}</span>
        </div>
      </div>
    </footer>
  );
}
