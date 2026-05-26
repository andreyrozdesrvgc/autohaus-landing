import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

const STEPS = [
  { n: "01", title: "Диагностика кузова", desc: "Замер толщины ЛКП, выявление сколов, фотофиксация всех поверхностей." },
  { n: "02", title: "Подбор плёнки", desc: "Подбираем материал под цели: защита, цвет, текстура, бюджет." },
  { n: "03", title: "Разбор элементов", desc: "Снимаем фары, ручки, эмблемы — оклейка с заходом за кромки." },
  { n: "04", title: "Подготовка поверхности", desc: "Мойка, обезжиривание, полировка. Чистый цех — нулевая пыль." },
  { n: "05", title: "Оклейка", desc: "Работа в 2–4 руки. Мастера с опытом 5+ лет. Бесшовные стыки." },
  { n: "06", title: "Контроль качества", desc: "Проверка под холодным светом. Тест воды. Замер всех зазоров." },
  { n: "07", title: "Выдача автомобиля", desc: "Фото- и видеоотчёт, паспорт плёнки, инструкция по уходу." },
];

function Step({ s, i, last }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: i * 0.06 }}
      className="relative grid grid-cols-[60px_1fr] md:grid-cols-[120px_1fr_1fr] gap-6 md:gap-10 items-start py-8 md:py-10 border-b border-white/10 last:border-b-0"
      data-testid={`process-step-${s.n}`}
    >
      <div className="flex items-start gap-4">
        <div className="relative">
          <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.6)]" />
          {!last && (
            <div className="absolute left-1/2 -translate-x-1/2 top-3 w-px h-[calc(100%+5rem)] bg-white/10" />
          )}
        </div>
        <span className="text-[11px] tracking-[0.32em] uppercase text-white/50 mt-[-2px]">
          {s.n}
        </span>
      </div>
      <h3 className="text-2xl md:text-3xl lg:text-4xl tracking-tight font-medium leading-tight text-white">
        {s.title}
      </h3>
      <p className="md:col-start-3 text-[#BDBDBD] text-base leading-relaxed font-light max-w-md">
        {s.desc}
      </p>
    </motion.div>
  );
}

export default function Process() {
  return (
    <section
      id="process"
      data-testid="process-section"
      className="relative w-full bg-black py-24 md:py-36 border-t border-white/5"
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14 md:mb-20">
          <div>
            <span className="text-[11px] tracking-[0.4em] uppercase text-white/50">
              005 — Process
            </span>
            <h2 className="mt-4 text-4xl md:text-6xl lg:text-7xl tracking-tighter font-medium leading-[0.95]">
              Семь этапов.<br />
              Ноль <span className="text-[#BDBDBD]">компромиссов.</span>
            </h2>
          </div>
          <p className="text-[#BDBDBD] text-base md:text-lg leading-relaxed max-w-sm">
            Каждый шаг задокументирован. Процесс выстроен как инженерный
            конвейер премиального производства.
          </p>
        </div>

        <div className="border-t border-white/10">
          {STEPS.map((s, i) => (
            <Step key={s.n} s={s} i={i} last={i === STEPS.length - 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
