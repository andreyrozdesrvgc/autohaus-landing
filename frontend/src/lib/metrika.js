/**
 * Yandex Metrika event helpers — тонкая обёртка вокруг window.ym.
 * Использовать после успешной отправки формы для отслеживания целей.
 */

const COUNTER_ID = 111530949;

function isMetrikaReady() {
  return typeof window !== "undefined" && typeof window.ym === "function";
}

/** Отправить цель в Метрику. Безопасно вызывать до загрузки счётчика. */
export function reachGoal(goalName, params = {}) {
  if (!isMetrikaReady()) return;
  try {
    window.ym(COUNTER_ID, "reachGoal", goalName, params);
  } catch (_) {
    /* noop — never break UI over analytics */
  }
}

/** Универсальный трекинг успешной отправки формы. */
export function trackLeadSubmit(source, extraParams = {}) {
  reachGoal("lead_submit", { source, ...extraParams });
  reachGoal(`lead_submit_${source}`, extraParams);
}
