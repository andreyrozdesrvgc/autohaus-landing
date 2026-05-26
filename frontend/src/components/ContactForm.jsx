import React, { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", phone: "", car: "", message: "" });
  const [sending, setSending] = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Заполните имя и телефон");
      return;
    }
    setSending(true);
    try {
      await axios.post(`${API}/leads`, { ...form, source: "contact_form" });
      toast.success("Заявка отправлена. Свяжемся в течение 30 минут.");
      setForm({ name: "", phone: "", car: "", message: "" });
    } catch {
      toast.error("Ошибка отправки. Попробуйте позже.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section
      id="contact"
      data-testid="contact-section"
      className="relative w-full bg-black py-24 md:py-36 border-t border-white/5"
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16">
          <div className="md:col-span-5">
            <span className="text-[11px] tracking-[0.4em] uppercase text-white/50">
              009 — Contact
            </span>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 text-4xl md:text-6xl lg:text-7xl tracking-tighter font-medium leading-[0.95]"
            >
              Запишитесь<br />
              <span className="text-[#BDBDBD]">на диагностику.</span>
            </motion.h2>

            <div className="mt-12 space-y-8">
              <div>
                <div className="text-[11px] tracking-[0.32em] uppercase text-white/40 mb-2">Адрес</div>
                <div className="text-lg text-white">Калининград, ул. Премиальная, 1</div>
                <div className="text-sm text-[#BDBDBD] mt-1">Цех — закрытая территория</div>
              </div>
              <div>
                <div className="text-[11px] tracking-[0.32em] uppercase text-white/40 mb-2">Телефон</div>
                <a href="tel:+70000000000" className="text-lg text-white hover:text-[#BDBDBD] transition-colors">
                  +7 (XXX) XXX-XX-XX
                </a>
              </div>
              <div>
                <div className="text-[11px] tracking-[0.32em] uppercase text-white/40 mb-2">Контакты</div>
                <div className="flex flex-wrap gap-3">
                  {["Instagram", "Telegram", "WhatsApp"].map((s) => (
                    <span key={s} className="px-4 py-2 border border-white/15 text-[11px] tracking-[0.28em] uppercase text-white/80 hover:text-white hover:border-white/40 cursor-pointer transition-all">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <form
            onSubmit={submit}
            data-testid="contact-form"
            className="md:col-span-7 bg-[#0A0A0A] border border-white/10 p-8 md:p-12 flex flex-col gap-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[11px] tracking-[0.32em] uppercase text-white/40 mb-3">Имя</label>
                <input
                  data-testid="contact-name"
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Александр"
                  className="w-full bg-transparent border-b border-white/15 focus:border-white py-3 text-base outline-none placeholder:text-white/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] tracking-[0.32em] uppercase text-white/40 mb-3">Телефон</label>
                <input
                  data-testid="contact-phone"
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="+7 (XXX) XXX-XX-XX"
                  className="w-full bg-transparent border-b border-white/15 focus:border-white py-3 text-base outline-none placeholder:text-white/30 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] tracking-[0.32em] uppercase text-white/40 mb-3">Автомобиль</label>
              <input
                data-testid="contact-car"
                value={form.car}
                onChange={set("car")}
                placeholder="BMW M3 Competition, 2024"
                className="w-full bg-transparent border-b border-white/15 focus:border-white py-3 text-base outline-none placeholder:text-white/30 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] tracking-[0.32em] uppercase text-white/40 mb-3">Задача</label>
              <textarea
                data-testid="contact-message"
                value={form.message}
                onChange={set("message")}
                rows={3}
                placeholder="Полная оклейка PPF + антихром"
                className="w-full bg-transparent border-b border-white/15 focus:border-white py-3 text-base outline-none resize-none placeholder:text-white/30 transition-colors"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <p className="text-xs text-white/40 max-w-md">
                Отправляя форму, вы соглашаетесь на обработку персональных данных.
                Звоним и пишем только по делу.
              </p>
              <button
                type="submit"
                disabled={sending}
                data-testid="contact-submit"
                className="group inline-flex items-center justify-center gap-4 px-8 py-5 bg-white text-black text-[11px] tracking-[0.3em] uppercase disabled:opacity-60 hover:bg-[#EDEDED] transition-all duration-300 shine"
              >
                {sending ? "Отправка…" : "Отправить заявку"}
                <span className="block w-8 h-px bg-current transition-all duration-500 group-hover:w-12" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
