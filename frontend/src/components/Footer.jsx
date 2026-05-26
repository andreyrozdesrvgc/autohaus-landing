import React from "react";

export default function Footer() {
  return (
    <footer
      data-testid="footer"
      className="relative w-full bg-black border-t border-white/10 py-12 md:py-14"
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        {/* Large marquee word */}
        <div className="overflow-hidden mb-10 md:mb-12">
          <div className="text-[clamp(4rem,15vw,12rem)] tracking-tighter font-medium leading-none text-white/10 whitespace-nowrap select-none">
            AUTOHAUS · PRECISION · DETAILING · AUTOHAUS
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="block w-2 h-2 rounded-full bg-white" />
              <span className="text-[13px] tracking-[0.32em] uppercase font-medium">AUTOHAUS</span>
            </div>
            <p className="text-sm text-[#BDBDBD] font-light leading-relaxed">
              Премиальная оклейка автомобилей в Калининграде с 2019 года.
            </p>
          </div>

          <div>
            <div className="text-[11px] tracking-[0.32em] uppercase text-white/40 mb-4">Навигация</div>
            <ul className="space-y-2 text-sm">
              <li><a href="#protocol" className="text-white/80 hover:text-white">Протокол</a></li>
              <li><a href="#services" className="text-white/80 hover:text-white">Услуги</a></li>
              <li><a href="#configurator" className="text-white/80 hover:text-white">Конфигуратор</a></li>
              <li><a href="#gallery" className="text-white/80 hover:text-white">Работы</a></li>
            </ul>
          </div>

          <div>
            <div className="text-[11px] tracking-[0.32em] uppercase text-white/40 mb-4">Контакты</div>
            <ul className="space-y-2 text-sm text-[#BDBDBD]">
              <li>Калининград,<br />ул. Премиальная, 1</li>
              <li><a href="tel:+70000000000" className="hover:text-white">+7 (XXX) XXX-XX-XX</a></li>
              <li><a href="mailto:hello@detailing-autohaus.ru" className="hover:text-white">hello@detailing-autohaus.ru</a></li>
            </ul>
          </div>

          <div>
            <div className="text-[11px] tracking-[0.32em] uppercase text-white/40 mb-4">Часы</div>
            <ul className="space-y-2 text-sm text-[#BDBDBD]">
              <li>Пн–Сб · 09:00 — 21:00</li>
              <li>Вс · по записи</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-6 border-t border-white/10 text-[10px] tracking-[0.32em] uppercase text-white/40">
          <span>© 2026 AUTOHAUS — Все права защищены</span>
          <span>Made with precision · Kaliningrad</span>
        </div>
      </div>
    </footer>
  );
}
