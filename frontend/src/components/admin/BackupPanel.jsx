import React, { useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { getToken } from "@/lib/adminApi";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * Панель резервного копирования: два больших действия.
 *   • Скачать ZIP со всем контентом + медиа.
 *   • Восстановить сайт из ранее скачанного ZIP.
 * ZIP формируется на сервере (эндпоинты /api/admin/backup/*),
 * ObjectId файлов сохраняются, поэтому ссылки после восстановления не ломаются.
 */
export default function BackupPanel({ onRestored }) {
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleExport = async () => {
    setDownloading(true);
    try {
      const token = getToken();
      const resp = await axios.get(`${API}/admin/backup/export`, {
        responseType: "blob",
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        timeout: 300000,
      });
      // Filename из Content-Disposition, если есть
      let filename = "autohaus-backup.zip";
      const cd = resp.headers["content-disposition"];
      if (cd) {
        const m = cd.match(/filename="?([^"]+)"?/i);
        if (m) filename = m[1];
      }
      const blob = new Blob([resp.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(`Скачано: ${filename}`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[Backup] export failed", err);
      toast.error(err?.response?.data?.detail || "Не удалось скачать бэкап");
    } finally {
      setDownloading(false);
    }
  };

  const handleFilePick = () => fileInputRef.current?.click();

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // reset input
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".zip")) {
      toast.error("Нужен ZIP-архив, скачанный из этой админки");
      return;
    }
    const confirmed = window.confirm(
      `Восстановить сайт из «${file.name}»?\n\nТекущий контент и настройки будут перезаписаны данными из архива. Медиа-файлы, которых нет на сервере, будут добавлены. Существующие файлы не изменятся.`
    );
    if (!confirmed) return;

    setUploading(true);
    try {
      const token = getToken();
      const formData = new FormData();
      formData.append("file", file);
      const resp = await axios.post(`${API}/admin/backup/import`, formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        timeout: 600000,
      });
      const { content_restored, media_restored, media_skipped } = resp.data || {};
      toast.success(
        `Восстановлено: ${content_restored ? "контент ✓" : "контент —"}, медиа-файлов ${
          media_restored || 0
        } (пропущено ${media_skipped || 0})`
      );
      onRestored?.();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[Backup] import failed", err);
      toast.error(err?.response?.data?.detail || "Не удалось восстановить бэкап");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section
      data-testid="admin-backup-panel"
      className="mb-6 bg-[#0A0A0A] border border-white/10 p-5 md:p-6"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="text-[10px] tracking-[0.32em] uppercase text-white/45 mb-1.5">
            Резервное копирование
          </div>
          <h2 className="text-lg md:text-xl font-medium tracking-tight">
            Скачать / восстановить весь сайт
          </h2>
          <p className="mt-2 text-xs md:text-sm text-white/55 leading-relaxed max-w-2xl font-light">
            Один ZIP содержит все тексты, настройки и загруженные фото/видео.
            Скачайте перед серьёзными изменениями — сможете откатиться одной кнопкой.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleExport}
          disabled={downloading || uploading}
          data-testid="admin-backup-export"
          className="group inline-flex items-center justify-between gap-4 px-5 py-4 bg-white text-black hover:bg-[#EDEDED] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="flex items-center gap-3">
            <IconDownload />
            <span className="text-[11px] tracking-[0.32em] uppercase font-medium">
              {downloading ? "Готовим архив…" : "Скачать бэкап"}
            </span>
          </span>
          <span className="text-[10px] text-black/45 tracking-[0.3em]">ZIP</span>
        </button>

        <button
          type="button"
          onClick={handleFilePick}
          disabled={downloading || uploading}
          data-testid="admin-backup-import"
          className="group inline-flex items-center justify-between gap-4 px-5 py-4 border border-white/20 text-white hover:bg-white/[0.05] hover:border-white/40 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="flex items-center gap-3">
            <IconUpload />
            <span className="text-[11px] tracking-[0.32em] uppercase font-medium">
              {uploading ? "Восстанавливаем…" : "Восстановить из бэкапа"}
            </span>
          </span>
          <span className="text-[10px] text-white/40 tracking-[0.3em]">ZIP</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,application/zip"
          className="hidden"
          onChange={handleImport}
          data-testid="admin-backup-file-input"
        />
      </div>

      <div className="mt-4 flex items-start gap-3 text-[11px] text-white/40 leading-relaxed font-light">
        <span className="mt-[3px] block w-3 h-px bg-white/30 shrink-0" />
        <span>
          Рекомендую скачивать бэкап каждую неделю или после серии крупных
          изменений. Файл храните на своём компьютере / в облаке (Яндекс.Диск, Google Drive).
        </span>
      </div>
    </section>
  );
}

function IconDownload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M12 3v13m0 0l-5-5m5 5l5-5M4 21h16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconUpload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M12 21V8m0 0l-5 5m5-5l5 5M4 3h16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
