import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const services = [
  {
    n: "01",
    title: "Полная оклейка полиуретаном",
    desc: "Невидимая броня PPF толщиной 200 мкм. Self-healing покрытие, защита от сколов и царапин на 10+ лет.",
    img: "https://images.pexels.com/photos/10126666/pexels-photo-10126666.jpeg?auto=compress&cs=tinysrgb&w=1400",
    span: "md:col-span-2 md:row-span-2",
  },
  {
    n: "02",
    title: "Смена цвета винилом",
    desc: "От матового сатина до жидкого металла. Полная трансформация без покраски.",
    img: "https://images.unsplash.com/photo-1605036242577-8ee228902af1?auto=format&fit=crop&w=1200&q=80",
    span: "md:col-span-2",
  },
  {
    n: "03",
    title: "Антихром",
    desc: "Превращаем все хромированные элементы в чёрный матовый или глянцевый.",
    img: "https://images.unsplash.com/photo-1680844540129-48dacc7d5d88?auto=format&fit=crop&w=1200&q=80",
  },
  {
    n: "04",
    title: "Защита зон риска",
    desc: "Капот, бампера, фары, пороги, ручки. Частичная оклейка от 1 дня.",
    img: "https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&w=1200&q=80",
  },
];

function ServiceCard({ s, i }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: i * 0.06 }}
      data-testid={`service-card-${s.n}`}
      className={`group relative overflow-hidden bg-[#0A0A0A] border border-white/10 hover:border-white/30 transition-colors duration-500 ${s.span || ""}`}
    >
      <div className="relative aspect-[4/3] md:aspect-auto md:h-full overflow-hidden">
        <img
          src={s.img}
          alt={s.title}
          className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-[60%] scale-105 group-hover:scale-110 transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] tracking-[0.32em] uppercase text-white/60">
              {s.n}
            </span>
            <span className="opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-y-0 transition-all duration-500">
              <ArrowUpRight size={18} strokeWidth={1.5} className="text-white" />
            </span>
          </div>
          <div>
            <h3 className="text-2xl md:text-3xl font-medium tracking-tight leading-tight text-white">
              {s.title}
            </h3>
            <p className="mt-3 text-[#BDBDBD] text-sm md:text-base leading-relaxed max-w-md font-light">
              {s.desc}
            </p>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export default function Services() {
  return (
    <section
      id="services"
      data-testid="services-section"
      className="relative w-full bg-black py-16 md:py-24"
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-14">
          <div className="max-w-3xl">
            <span className="text-[11px] tracking-[0.4em] uppercase text-white/50">
              003 — Services
            </span>
            <h2 className="mt-4 text-4xl md:text-6xl lg:text-7xl tracking-tighter font-medium leading-[0.95]">
              Четыре направления.<br />
              <span className="text-[#BDBDBD]">Один</span> стандарт качества.
            </h2>
          </div>
          <p className="text-[#BDBDBD] text-base md:text-lg leading-relaxed max-w-sm">
            Каждая услуга — отдельный технологический процесс. Мы не делаем
            «всё подряд», поэтому делаем безупречно.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 md:auto-rows-[280px] gap-3 md:gap-4">
          {services.map((s, i) => (
            <ServiceCard key={s.n} s={s} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
