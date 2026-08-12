import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, MessageCircle, MapPin } from "lucide-react";
import { useContent } from "@/context/ContentContext";
import { reachGoal } from "@/lib/metrika";

/**
 * Страница «Спасибо» после успешной отправки формы.
 * Показывает: сообщение благодарности, кнопки для перехода в мессенджеры,
 * ссылку на Яндекс.Карты, кнопку возврата на главную.
 * Все ссылки редактируются через CMS (контент.thank_you).
 */
export default function ThankYou() {
  const content = useContent();
  const ty = content?.thank_you || {};
  const location = useLocation();
  const source = new URLSearchParams(location.search).get("source") || "form";

  useEffect(() => {
    reachGoal("thank_you_view", { source });
  }, [source]);

  const messengers = [
    { key: "telegram", label: "Telegram", url: ty.telegram_url },
    { key: "whatsapp", label: "WhatsApp", url: ty.whatsapp_url },
    { key: "max", label: "MAX", url: ty.max_url },
  ].filter((m) => m.url);

  return (
    <main
      data-testid="thank-you-page"
      className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-20"
    >
      <div className="max-w-2xl w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="text-[11px] tracking-[0.4em] uppercase text-white/50 mb-6">
            {ty.overline || "AUTOHAUS · Kaliningrad"}
          </div>
          <h1
            data-testid="thank-you-heading"
            className="text-5xl md:text-6xl lg:text-7xl tracking-tighter font-medium leading-[0.95]"
          >
            {ty.title_line_1 || "Спасибо."}
            <br />
            <span className="text-[#BDBDBD]">
              {ty.title_line_2_grey || "Скоро свяжемся."}
            </span>
          </h1>
          <p className="mt-8 text-[#BDBDBD] text-base md:text-lg leading-relaxed max-w-md mx-auto">
            {ty.description ||
              "Мы уже видим вашу заявку и вернёмся с расчётом в течение 15 минут в рабочее время."}
          </p>

          {messengers.length > 0 && (
            <div className="mt-12">
              <div className="text-[10px] tracking-[0.32em] uppercase text-white/45 mb-4">
                {ty.messenger_prompt || "Хотите быстрее? Напишите напрямую"}
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {messengers.map((m) => (
                  <a
                    key={m.key}
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => reachGoal("thank_you_messenger_click", { messenger: m.key })}
                    data-testid={`thank-you-messenger-${m.key}`}
                    className="group inline-flex items-center gap-2 px-5 py-3 border border-white/20 text-[11px] tracking-[0.3em] uppercase hover:bg-white hover:text-black hover:border-white transition-all duration-500"
                  >
                    <MessageCircle size={14} strokeWidth={1.5} />
                    {m.label}
                    <ArrowUpRight
                      size={12}
                      strokeWidth={1.5}
                      className="transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {ty.maps_url && (
              <a
                href={ty.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => reachGoal("thank_you_maps_click")}
                data-testid="thank-you-maps"
                className="inline-flex items-center gap-2 px-5 py-3 border border-white/15 text-[11px] tracking-[0.3em] uppercase text-white/70 hover:text-white hover:border-white/40 transition-all"
              >
                <MapPin size={14} strokeWidth={1.5} />
                {ty.maps_label || "Открыть на карте"}
              </a>
            )}
            <Link
              to="/"
              data-testid="thank-you-back-home"
              className="inline-flex items-center gap-2 px-5 py-3 border border-white/15 text-[11px] tracking-[0.3em] uppercase text-white/70 hover:text-white hover:border-white/40 transition-all"
            >
              <ArrowLeft size={14} strokeWidth={1.5} />
              {ty.back_home_label || "На главную"}
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
