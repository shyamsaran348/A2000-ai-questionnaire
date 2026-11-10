/** Shared class strings so every form in the app looks and behaves the same. */

export const inputBase =
  "block w-full rounded-md border bg-white px-3 py-2 text-[15px] text-slate-900 placeholder:text-slate-400 " +
  "transition-colors focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-500";

export function inputClass(hasError?: boolean, extra = "") {
  return `${inputBase} ${
    hasError
      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
      : "border-slate-300 hover:border-slate-400 focus:border-brand focus:ring-brand/20"
  } ${extra}`;
}

export const labelClass = "block text-sm font-medium text-slate-800";
export const hintClass = "mt-1 text-[13px] text-slate-500";
export const errorTextClass = "mt-1.5 flex items-start gap-1.5 text-[13px] font-medium text-red-600";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white " +
  "shadow-sm transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60";

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium " +
  "text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60";

export const btnGhost =
  "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-600 " +
  "transition-colors hover:bg-slate-100 hover:text-slate-900";

export const cardClass = "rounded-lg border border-slate-200 bg-white shadow-sm";
