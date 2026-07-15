/**
 * ============================================================================
 *  AUTOHAUS — Центральный конфиг медиафайлов (фото и видео)
 * ============================================================================
 *  Все ссылки на изображения и видео сайта — в одном месте.
 *  Замените URL на свои (Яндекс.Клауд, S3, любое CDN) — контент обновится
 *  автоматически по всему сайту.
 *
 *  Правила:
 *   - Оставляйте пустой пробел '' если хотите скрыть медиа (fallback пойдёт из CMS).
 *   - Для видео используйте прямые ссылки на .mp4 (не YouTube-страницы).
 *   - Изображения: JPG / WebP / PNG.
 *   - Иконки в Navigation и Footer менять не нужно — они SVG-компоненты.
 * ============================================================================
 */

export const MEDIA = {
  // ─────────────────────────────────────────────────────────────
  // HERO (главный экран)
  // ─────────────────────────────────────────────────────────────
  hero: {
    // Постер (картинка, которую видно пока грузится видео)
    poster: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1920&q=85",
    // Фоновое видео Hero (mp4)
    video: "https://assets.mixkit.co/videos/35540/35540-720.mp4",
  },

  // ─────────────────────────────────────────────────────────────
  // ПРОТОКОЛ БЕЗОПАСНОСТИ (3 этапа)
  // ─────────────────────────────────────────────────────────────
  protocol: {
    stage1: {
      poster: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=2000&q=85",
      video: "https://assets.mixkit.co/videos/35230/35230-720.mp4",
    },
    stage2: {
      poster: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2000&q=85",
      video: "https://assets.mixkit.co/videos/35205/35205-720.mp4",
    },
    stage3: {
      poster: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=2000&q=85",
      video: "https://assets.mixkit.co/videos/35540/35540-720.mp4",
    },
  },

  // ─────────────────────────────────────────────────────────────
  // BEFORE / AFTER (слайдер "До / После")
  // ─────────────────────────────────────────────────────────────
  beforeAfter: {
    before: "https://images.unsplash.com/photo-1616591938558-fb03d845567b?auto=format&fit=crop&w=1800&q=85",
    after: "https://images.unsplash.com/photo-1626381958625-f4e4ea343925?auto=format&fit=crop&w=1800&q=85",
  },

  // ─────────────────────────────────────────────────────────────
  // УСЛУГИ (4 карточки)
  // ─────────────────────────────────────────────────────────────
  services: {
    ppfFull: "https://images.pexels.com/photos/10126666/pexels-photo-10126666.jpeg?auto=compress&cs=tinysrgb&w=1400",
    vinylColor: "https://images.unsplash.com/photo-1605036242577-8ee228902af1?auto=format&fit=crop&w=1200&q=80",
    antichrome: "https://images.unsplash.com/photo-1680844540129-48dacc7d5d88?auto=format&fit=crop&w=1200&q=80",
    riskZones: "https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&w=1200&q=80",
  },

  // ─────────────────────────────────────────────────────────────
  // КОНФИГУРАТОР (превью машины по типу финиша)
  // ─────────────────────────────────────────────────────────────
  configurator: {
    gloss: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=2000&q=85",
    matte: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2000&q=85",
    satin: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=2000&q=85",
    stealth: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=2000&q=85",
  },

  // ─────────────────────────────────────────────────────────────
  // ГАЛЕРЕЯ РАБОТ (по одному фото на кейс)
  // ─────────────────────────────────────────────────────────────
  gallery: {
    bmwM4: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=2000&q=85",
    bmwM5: "https://images.unsplash.com/photo-1617814086367-b8cb20edbe98?auto=format&fit=crop&w=2000&q=85",
    bmwX5M: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=2000&q=85",
    bmwG80: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=2000&q=85",
    bmwM3Touring: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2000&q=85",
    bmwI7: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=2000&q=85",
  },

  // ─────────────────────────────────────────────────────────────
  // AUTOHAUS LIVE (вертикальные ролики)
  //  poster — картинка превью, video — сам ролик (mp4, вертикальный 9:16)
  // ─────────────────────────────────────────────────────────────
  live: {
    reel1: {
      poster: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=900&q=85",
      video: "https://assets.mixkit.co/videos/35540/35540-720.mp4",
    },
    reel2: {
      poster: "https://images.unsplash.com/photo-1617814086367-b8cb20edbe98?auto=format&fit=crop&w=900&q=85",
      video: "https://assets.mixkit.co/videos/35205/35205-720.mp4",
    },
    reel3: {
      poster: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=900&q=85",
      video: "https://assets.mixkit.co/videos/35230/35230-720.mp4",
    },
    reel4: {
      poster: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=900&q=85",
      video: "https://assets.mixkit.co/videos/35540/35540-720.mp4",
    },
    reel5: {
      poster: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=85",
      video: "https://assets.mixkit.co/videos/35205/35205-720.mp4",
    },
    // Добавьте reel6, reel7 и т.д. и обновите список в contentDefaults.js
  },

  // ─────────────────────────────────────────────────────────────
  // КВИЗ (фото менеджера-эксперта)
  // ─────────────────────────────────────────────────────────────
  quiz: {
    expertPhoto: "https://images.unsplash.com/photo-1607853554439-0069ec0f29b6?auto=format&fit=crop&w=1200&q=85",
  },
};
