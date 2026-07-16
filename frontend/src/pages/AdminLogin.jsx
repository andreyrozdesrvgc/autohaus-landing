import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { adminLogin } from "@/lib/adminApi";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Введите email и пароль");
      return;
    }
    setLoading(true);
    try {
      await adminLogin(email.trim().toLowerCase(), password);
      toast.success("Вход выполнен");
      navigate("/admin");
    } catch (err) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      // eslint-disable-next-line no-console
      console.error("[AdminLogin] error", { status, detail, message: err?.message });

      if (status === 401) {
        toast.error("Неверный email или пароль");
      } else if (status === 404) {
        toast.error("API не найден. Проверьте настройку nginx (/api/ → 127.0.0.1:8001).");
      } else if (status === 502 || status === 503 || status === 504) {
        toast.error("Backend недоступен (Bad Gateway). Проверьте `pm2 status` на сервере.");
      } else if (status && status >= 500) {
        toast.error(`Ошибка сервера ${status}. См. логи backend: pm2 logs autohaus-backend`);
      } else if (!status) {
        toast.error("Сервер не отвечает. Backend работает? Проверьте pm2 и nginx.");
      } else {
        toast.error(`Ошибка ${status}: ${detail || "Попробуйте позже."}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main data-testid="admin-login-page" className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-[#0A0A0A] border border-white/10 p-8 md:p-10 flex flex-col gap-7"
        data-testid="admin-login-form"
      >
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="block w-2 h-2 rounded-full bg-white" />
            <span className="text-[11px] tracking-[0.32em] uppercase font-medium">AUTOHAUS · CMS</span>
          </div>
          <h1 className="text-3xl tracking-tighter font-medium leading-[1.05]">
            Вход в админ-панель
          </h1>
          <p className="mt-3 text-sm text-[#BDBDBD] font-light leading-relaxed">
            Управление текстом, фото и видео на сайте.
          </p>
        </div>

        <div>
          <label className="block text-[10px] tracking-[0.32em] uppercase text-white/40 mb-3">Email</label>
          <input
            data-testid="admin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            placeholder="admin@detailing-autohaus.ru"
            className="w-full bg-transparent border-b border-white/15 focus:border-white py-3 text-base outline-none placeholder:text-white/30 transition-colors"
          />
        </div>

        <div>
          <label className="block text-[10px] tracking-[0.32em] uppercase text-white/40 mb-3">Пароль</label>
          <input
            data-testid="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full bg-transparent border-b border-white/15 focus:border-white py-3 text-base outline-none placeholder:text-white/30 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          data-testid="admin-submit"
          className="group inline-flex items-center justify-center gap-4 px-6 py-4 bg-white text-black text-[11px] tracking-[0.3em] uppercase disabled:opacity-60 hover:bg-[#EDEDED] transition-all duration-300"
        >
          {loading ? "Вход…" : "Войти"}
          <span className="block w-8 h-px bg-current transition-all duration-500 group-hover:w-12" />
        </button>
      </form>
    </main>
  );
}
