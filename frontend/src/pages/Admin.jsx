import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { fetchMe, saveContent, adminLogout, getToken } from "@/lib/adminApi";
import { useContentRefresh } from "@/context/ContentContext";
import MediaPicker from "@/components/admin/MediaPicker";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Section descriptors — drive the tab list, the labels, and which fields are media.
// Keep this in sync with /app/backend/default_content.py.
const SECTIONS = [
  {
    key: "hero",
    label: "Hero (главный экран)",
    fields: [
      { k: "overline", label: "Верхняя плашка" },
      { k: "geo_label", label: "Гео-координаты (правый верх)" },
      { k: "studio_label", label: "Подпись над заголовком" },
      { k: "title_line_1", label: "Заголовок — строка 1" },
      { k: "title_line_2", label: "Заголовок — строка 2" },
      { k: "title_line_3_grey", label: "Заголовок — слово серым" },
      { k: "title_line_3_white", label: "Заголовок — окончание (белым)" },
      { k: "description", label: "Описание", type: "textarea" },
      { k: "cta_primary", label: "Кнопка основная" },
      { k: "cta_secondary", label: "Кнопка вторичная" },
      { k: "footer_meta", label: "Нижняя плашка — центр" },
      { k: "footer_edition", label: "Нижняя плашка — справа" },
      { k: "poster_url", label: "Постер видео (картинка-заглушка)", type: "image" },
      { k: "video_url", label: "Фоновое видео", type: "video" },
    ],
  },
  {
    key: "before_after",
    label: "Before / After",
    fields: [
      { k: "overline", label: "Верхняя плашка" },
      { k: "title_line_1", label: "Заголовок — строка 1" },
      { k: "title_line_2", label: "Заголовок — строка 2" },
      { k: "description", label: "Описание", type: "textarea" },
      { k: "before_image", label: "Фото «До»", type: "image" },
      { k: "after_image", label: "Фото «После»", type: "image" },
      { k: "label_before", label: "Метка «До»" },
      { k: "label_after", label: "Метка «После»" },
      { k: "cta_label", label: "Кнопка" },
      { k: "cta_text_mobile_prefix", label: "CTA-текст (мобильный) — начало" },
      { k: "cta_text_mobile_strong", label: "CTA-текст (мобильный) — выделение" },
      { k: "cta_text_mobile_suffix", label: "CTA-текст (мобильный) — окончание" },
    ],
  },
  {
    key: "protocol",
    label: "Протокол безопасности",
    fields: [
      { k: "overline", label: "Верхняя плашка" },
      { k: "title_line_1", label: "Заголовок — строка 1" },
      { k: "title_line_2_grey", label: "Заголовок — слово серым" },
      { k: "title_line_2_white", label: "Заголовок — окончание" },
      { k: "description", label: "Описание", type: "textarea" },
      { k: "footer_left", label: "Низ — слева" },
      { k: "footer_right", label: "Низ — справа", type: "textarea" },
    ],
    listKey: "stages",
    listLabel: "Этапы (Stage 01 / 02 / 03)",
    listItem: [
      { k: "n", label: "Номер" },
      { k: "title", label: "Заголовок" },
      { k: "overline", label: "Подзаголовок" },
      { k: "desc", label: "Описание", type: "textarea" },
      { k: "points", label: "Чек-лист (через перенос строки)", type: "lines" },
      { k: "poster", label: "Постер", type: "image" },
      { k: "video", label: "Видео", type: "video" },
    ],
  },
  {
    key: "services",
    label: "Услуги",
    fields: [
      { k: "overline", label: "Верхняя плашка" },
      { k: "title_line_1", label: "Заголовок — строка 1" },
      { k: "title_line_2_grey", label: "Заголовок — слово серым" },
      { k: "title_line_2_white", label: "Заголовок — окончание" },
      { k: "description", label: "Описание", type: "textarea" },
    ],
    listKey: "items",
    listLabel: "Карточки услуг",
    listItem: [
      { k: "n", label: "Номер" },
      { k: "title", label: "Название" },
      { k: "desc", label: "Описание", type: "textarea" },
      { k: "alt", label: "Alt-текст (SEO)" },
      { k: "img", label: "Изображение", type: "image" },
    ],
  },
  {
    key: "configurator",
    label: "Конфигуратор",
    fields: [
      { k: "overline", label: "Верхняя плашка" },
      { k: "title_line_1", label: "Заголовок — строка 1" },
      { k: "title_line_2", label: "Заголовок — строка 2" },
      { k: "description", label: "Описание", type: "textarea" },
      { k: "form_heading", label: "Заголовок формы", type: "textarea" },
      { k: "form_description", label: "Описание формы", type: "textarea" },
      { k: "trust_response_label", label: "Бейдж 1 — заголовок" },
      { k: "trust_response_value", label: "Бейдж 1 — значение" },
      { k: "trust_warranty_label", label: "Бейдж 2 — заголовок" },
      { k: "trust_warranty_value", label: "Бейдж 2 — значение" },
      { k: "trust_experience_label", label: "Бейдж 3 — заголовок" },
      { k: "trust_experience_value", label: "Бейдж 3 — значение" },
    ],
  },
  {
    key: "stats",
    label: "Цифры",
    fields: [
      { k: "overline", label: "Верхняя плашка" },
      { k: "title_line_1_white", label: "Заголовок — начало" },
      { k: "title_line_1_grey", label: "Заголовок — слово серым" },
      { k: "title_line_2", label: "Заголовок — строка 2" },
      { k: "description", label: "Описание", type: "textarea" },
    ],
    listKey: "items",
    listLabel: "Карточки цифр",
    listItem: [
      { k: "value", label: "Значение (число)", type: "number" },
      { k: "suffix", label: "Суффикс (+, %, и т.д.)" },
      { k: "label", label: "Подпись" },
    ],
  },
  {
    key: "gallery",
    label: "Работы (галерея)",
    fields: [
      { k: "overline", label: "Верхняя плашка" },
      { k: "title_line_1", label: "Заголовок — строка 1" },
      { k: "title_line_2", label: "Заголовок — строка 2 (серым)" },
      { k: "description", label: "Описание", type: "textarea" },
      { k: "cta_label", label: "Кнопка" },
      { k: "cta_text_mobile_prefix", label: "CTA — начало (мобильный)" },
      { k: "cta_text_mobile_strong", label: "CTA — выделение (мобильный)" },
      { k: "cta_text_mobile_suffix", label: "CTA — окончание (мобильный)" },
    ],
    listKey: "items",
    listLabel: "Работы в галерее",
    listItem: [
      { k: "title", label: "Название" },
      { k: "meta", label: "Подпись (PPF · Gloss и т.п.)" },
      { k: "alt", label: "Alt-текст (SEO)" },
      { k: "src", label: "Фото", type: "image" },
    ],
  },
  {
    key: "live",
    label: "AutoHaus Live (видео)",
    fields: [
      { k: "overline", label: "Верхняя плашка" },
      { k: "title_line_1", label: "Заголовок — строка 1" },
      { k: "title_line_2", label: "Заголовок — строка 2 (серым)" },
      { k: "description", label: "Описание", type: "textarea" },
      { k: "footer_left", label: "Низ — слева" },
      { k: "footer_right", label: "Низ — справа", type: "textarea" },
      { k: "cta_default_label", label: "Подпись на кнопке (по умолчанию)" },
    ],
    listKey: "items",
    listLabel: "Ролики (вертикальные 9:16)",
    listItem: [
      { k: "title", label: "Название" },
      { k: "meta", label: "Подпись (услуга · срок)" },
      { k: "cta_label", label: "Текст на кнопке" },
      { k: "instagram_url", label: "Ссылка на Instagram-пост" },
      { k: "poster", label: "Превью (картинка-заглушка)", type: "image" },
      { k: "src", label: "Видео (вертикальное)", type: "video" },
    ],
  },
  {
    key: "contact",
    label: "Контакты",
    fields: [
      { k: "overline", label: "Верхняя плашка" },
      { k: "title_line_1", label: "Заголовок — строка 1" },
      { k: "title_line_2_grey", label: "Заголовок — строка 2 (серым)" },
      { k: "address_label", label: "Подпись «Адрес»" },
      { k: "address", label: "Адрес" },
      { k: "address_sub", label: "Адрес — уточнение" },
      { k: "phone_label", label: "Подпись «Телефон»" },
      { k: "phone_display", label: "Телефон (как видно)" },
      { k: "phone_link", label: "Телефон для tel: (только цифры)" },
      { k: "socials_label", label: "Подпись «Соц-сети»" },
      { k: "form_consent", label: "Текст согласия", type: "textarea" },
      { k: "submit_label", label: "Кнопка отправки" },
    ],
  },
  {
    key: "footer",
    label: "Подвал",
    fields: [
      { k: "marquee", label: "Большой бегущий текст" },
      { k: "brand", label: "Бренд" },
      { k: "tagline", label: "Описание", type: "textarea" },
      { k: "nav_label", label: "Заголовок «Навигация»" },
      { k: "contacts_label", label: "Заголовок «Контакты»" },
      { k: "address_line_1", label: "Адрес — строка 1" },
      { k: "address_line_2", label: "Адрес — строка 2" },
      { k: "phone_display", label: "Телефон (как видно)" },
      { k: "phone_link", label: "Телефон для tel:" },
      { k: "email", label: "E-mail" },
      { k: "hours_label", label: "Заголовок «Часы»" },
      { k: "hours_line_1", label: "Часы — строка 1" },
      { k: "hours_line_2", label: "Часы — строка 2" },
      { k: "copyright", label: "Копирайт" },
      { k: "tagline_right", label: "Подпись справа" },
    ],
  },
];

function setIn(obj, path, value) {
  // path is a list like ["hero", "title_line_1"] or ["protocol","stages",0,"title"]
  const root = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
  let cur = root;
  for (let i = 0; i < path.length - 1; i++) {
    const k = path[i];
    const next = cur[k];
    const cloned = Array.isArray(next) ? [...next] : { ...(next || {}) };
    cur[k] = cloned;
    cur = cloned;
  }
  cur[path[path.length - 1]] = value;
  return root;
}

function Field({ field, value, onChange }) {
  if (field.type === "image" || field.type === "video") {
    return (
      <MediaPicker
        value={value}
        onChange={onChange}
        accept={field.type === "video" ? "video/*" : "image/*"}
        label={field.label}
      />
    );
  }
  if (field.type === "textarea") {
    return (
      <div>
        <label className="block text-[10px] tracking-[0.32em] uppercase text-white/40 mb-2">{field.label}</label>
        <textarea
          rows={3}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#070707] border border-white/10 focus:border-white/40 p-3 text-sm outline-none resize-y"
        />
      </div>
    );
  }
  if (field.type === "lines") {
    const text = Array.isArray(value) ? value.join("\n") : (value ?? "");
    return (
      <div>
        <label className="block text-[10px] tracking-[0.32em] uppercase text-white/40 mb-2">{field.label}</label>
        <textarea
          rows={4}
          value={text}
          onChange={(e) => onChange(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
          className="w-full bg-[#070707] border border-white/10 focus:border-white/40 p-3 text-sm outline-none resize-y"
        />
      </div>
    );
  }
  if (field.type === "number") {
    return (
      <div>
        <label className="block text-[10px] tracking-[0.32em] uppercase text-white/40 mb-2">{field.label}</label>
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          className="w-full bg-transparent border-b border-white/15 focus:border-white py-2.5 text-sm outline-none"
        />
      </div>
    );
  }
  return (
    <div>
      <label className="block text-[10px] tracking-[0.32em] uppercase text-white/40 mb-2">{field.label}</label>
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent border-b border-white/15 focus:border-white py-2.5 text-sm outline-none"
      />
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const refreshLanding = useContentRefresh();
  const [authChecked, setAuthChecked] = useState(false);
  const [content, setContent] = useState(null);
  const [activeKey, setActiveKey] = useState(SECTIONS[0].key);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!getToken()) {
        navigate("/admin/login");
        return;
      }
      try {
        await fetchMe();
      } catch {
        navigate("/admin/login");
        return;
      }
      try {
        const { data } = await axios.get(`${API}/content`);
        setContent(data || {});
      } catch {
        toast.error("Не удалось загрузить контент");
      }
      setAuthChecked(true);
    })();
  }, [navigate]);

  const activeSection = useMemo(
    () => SECTIONS.find((s) => s.key === activeKey),
    [activeKey]
  );

  if (!authChecked || !content) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <span className="text-[11px] tracking-[0.32em] uppercase text-white/40">Загрузка…</span>
      </main>
    );
  }

  const updateField = (path, value) => {
    setContent((prev) => setIn(prev, path, value));
  };

  const addListItem = (sectionKey, listKey, listSpec) => {
    const empty = listSpec.reduce((acc, f) => ({ ...acc, [f.k]: f.type === "lines" ? [] : "" }), {});
    const current = (content[sectionKey] || {})[listKey] || [];
    updateField([sectionKey, listKey], [...current, empty]);
  };

  const removeListItem = (sectionKey, listKey, idx) => {
    const current = (content[sectionKey] || {})[listKey] || [];
    updateField([sectionKey, listKey], current.filter((_, i) => i !== idx));
  };

  const moveListItem = (sectionKey, listKey, idx, dir) => {
    const current = [...((content[sectionKey] || {})[listKey] || [])];
    const j = idx + dir;
    if (j < 0 || j >= current.length) return;
    [current[idx], current[j]] = [current[j], current[idx]];
    updateField([sectionKey, listKey], current);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await saveContent(content);
      setContent(saved);
      await refreshLanding();
      toast.success("Сохранено. Откройте сайт — изменения уже видны.");
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        toast.error("Сессия истекла. Войдите снова.");
        navigate("/admin/login");
      } else toast.error("Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await adminLogout();
    navigate("/admin/login");
  };

  const sectionData = content[activeSection.key] || {};

  return (
    <main data-testid="admin-page" className="min-h-screen bg-black text-white">
      {/* TOP BAR */}
      <header className="sticky top-0 z-30 bg-black/95 backdrop-blur border-b border-white/10">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="block w-2 h-2 rounded-full bg-white" />
            <span className="text-[12px] tracking-[0.32em] uppercase font-medium">AUTOHAUS · CMS</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="text-[10px] tracking-[0.3em] uppercase border border-white/15 px-3 py-2 hover:border-white/40"
            >
              открыть сайт
            </a>
            <button
              onClick={handleSave}
              disabled={saving}
              data-testid="admin-save"
              className="text-[10px] tracking-[0.3em] uppercase bg-white text-black px-4 py-2 hover:bg-[#EDEDED] disabled:opacity-60"
            >
              {saving ? "сохранение…" : "сохранить"}
            </button>
            <button
              onClick={handleLogout}
              data-testid="admin-logout"
              className="text-[10px] tracking-[0.3em] uppercase border border-white/15 px-3 py-2 text-white/60 hover:text-white hover:border-white/40"
            >
              выйти
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-6 md:px-10 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SIDEBAR — section list */}
        <aside className="lg:col-span-3">
          <div className="lg:sticky lg:top-24 bg-[#0A0A0A] border border-white/10 p-3 flex lg:flex-col gap-1 overflow-x-auto">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveKey(s.key)}
                data-testid={`admin-tab-${s.key}`}
                className={`text-left text-[11px] tracking-[0.2em] uppercase px-3 py-3 transition-colors whitespace-nowrap ${
                  s.key === activeKey
                    ? "bg-white text-black"
                    : "text-white/70 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </aside>

        {/* EDITOR */}
        <section className="lg:col-span-9 flex flex-col gap-8">
          {/* Scalar fields */}
          <div className="bg-[#0A0A0A] border border-white/10 p-6 md:p-8">
            <h2 className="text-xl tracking-tight font-medium mb-6">{activeSection.label}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {activeSection.fields.map((f) => (
                <Field
                  key={f.k}
                  field={f}
                  value={sectionData[f.k]}
                  onChange={(v) => updateField([activeSection.key, f.k], v)}
                />
              ))}
            </div>
          </div>

          {/* List items (services, gallery items, stats items, protocol stages) */}
          {activeSection.listKey && (
            <div className="bg-[#0A0A0A] border border-white/10 p-6 md:p-8">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg tracking-tight font-medium">{activeSection.listLabel}</h3>
                <button
                  type="button"
                  onClick={() => addListItem(activeSection.key, activeSection.listKey, activeSection.listItem)}
                  className="text-[10px] tracking-[0.3em] uppercase border border-white/20 px-3 py-2 hover:border-white/50"
                >
                  + добавить
                </button>
              </div>
              <div className="flex flex-col gap-6">
                {((sectionData[activeSection.listKey]) || []).map((item, idx) => (
                  <div key={idx} className="border border-white/10 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] tracking-[0.3em] uppercase text-white/40">№ {String(idx + 1).padStart(2, "0")}</span>
                      <div className="flex gap-2">
                        <button onClick={() => moveListItem(activeSection.key, activeSection.listKey, idx, -1)} className="text-[10px] uppercase border border-white/15 px-2 py-1 hover:border-white/40">↑</button>
                        <button onClick={() => moveListItem(activeSection.key, activeSection.listKey, idx, 1)} className="text-[10px] uppercase border border-white/15 px-2 py-1 hover:border-white/40">↓</button>
                        <button onClick={() => removeListItem(activeSection.key, activeSection.listKey, idx)} className="text-[10px] tracking-[0.3em] uppercase border border-white/15 px-3 py-1 text-white/50 hover:text-white hover:border-white/40">удалить</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {activeSection.listItem.map((f) => (
                        <Field
                          key={f.k}
                          field={f}
                          value={item[f.k]}
                          onChange={(v) => updateField([activeSection.key, activeSection.listKey, idx, f.k], v)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              data-testid="admin-save-bottom"
              className="group inline-flex items-center justify-center gap-4 px-6 py-4 bg-white text-black text-[11px] tracking-[0.3em] uppercase disabled:opacity-60 hover:bg-[#EDEDED] transition-all"
            >
              {saving ? "сохранение…" : "сохранить изменения"}
              <span className="block w-8 h-px bg-current transition-all duration-500 group-hover:w-12" />
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
