import en from "../i18n/en.json";
import es from "../i18n/es.json";

const dicts = { en, es } as const;
type Dict = typeof dicts.en;

export function calcT(locale: string) {
  const lang = locale.split("-")[0];
  const dict: Dict = lang === "en" ? dicts.en : dicts.es;
  return function t(key: string, opts?: Record<string, unknown>): string {
    const parts = key.split(".");
    let cur: unknown = dict;
    for (const p of parts) {
      cur = (cur as Record<string, unknown>)?.[p];
    }
    if (typeof cur !== "string") return key;
    if (!opts) return cur;
    return cur.replace(/\{\{(\w+)\}\}/g, (_, k) => String(opts[k] ?? `{{${k}}}`));
  };
}
