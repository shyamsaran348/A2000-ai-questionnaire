"use client";

/** Copyright line shown at the bottom of every page. */
export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-slate-200 bg-white/60 px-4 py-5 text-center text-[12.5px] text-slate-500 print:hidden">
      <p suppressHydrationWarning>
        © {year} A2000. All rights reserved.
      </p>
    </footer>
  );
}
