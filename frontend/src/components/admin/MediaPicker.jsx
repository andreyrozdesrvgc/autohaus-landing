import React, { useState, useRef } from "react";
import { toast } from "sonner";
import { uploadMedia } from "@/lib/adminApi";
import { resolveMedia } from "@/lib/contentDefaults";

/**
 * MediaPicker — лёгкий компонент для замены изображения или видео.
 * value: текущий URL (абсолютный или /api/media/...)
 * onChange: вызывается с новым URL после загрузки
 * accept: "image/*" | "video/*" | "image/*,video/*"
 */
export default function MediaPicker({ value, onChange, accept = "image/*,video/*", label = "Медиа" }) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef(null);
  const isVideo = (value || "").match(/\.(mp4|mov|webm|m4v)(\?|$)/i) || accept === "video/*";

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setProgress(0);
    try {
      const data = await uploadMedia(file, setProgress);
      onChange(data.url);
      toast.success(`Загружено: ${data.filename}`);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 413) toast.error("Файл слишком большой (макс. 80 МБ)");
      else if (status === 400) toast.error("Допустимы только изображения и видео");
      else toast.error("Не удалось загрузить файл");
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  return (
    <div className="border border-white/10 bg-[#070707] p-3 flex gap-3 items-stretch">
      <div className="w-28 h-20 bg-black border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
        {value ? (
          isVideo ? (
            <video src={resolveMedia(value)} className="w-full h-full object-cover" muted playsInline />
          ) : (
            <img src={resolveMedia(value)} alt="preview" className="w-full h-full object-cover" />
          )
        ) : (
          <span className="text-[10px] tracking-[0.3em] uppercase text-white/30">empty</span>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div className="text-[10px] tracking-[0.3em] uppercase text-white/40">{label}</div>
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="URL или /api/media/…"
          className="bg-transparent border-b border-white/15 focus:border-white py-1.5 text-xs outline-none text-white/80 truncate"
        />
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="text-[10px] tracking-[0.3em] uppercase border border-white/20 px-3 py-1.5 hover:border-white/50 disabled:opacity-50"
          >
            {busy ? `Загрузка ${progress}%` : "Загрузить файл"}
          </button>
          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-[10px] tracking-[0.3em] uppercase text-white/40 hover:text-white"
            >
              очистить
            </button>
          ) : null}
        </div>
      </div>
      <input ref={inputRef} type="file" accept={accept} onChange={handleFile} className="hidden" />
    </div>
  );
}
