"use client";

const LINKS = [
  { href: "https://a2000india.com/terms-of-service", label: "Terms of Service" },
  { href: "https://a2000india.com/privacy-policy", label: "Privacy Policy" },
];

/** Copyright line and legal links shown at the bottom of every page. */
export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-slate-200 bg-white/60 px-4 py-5 text-[12.5px] text-slate-500 print:hidden">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-x-4 gap-y-1.5 text-center sm:flex-row">
        <p suppressHydrationWarning>© {year} A2000 Group. All rights reserved.</p>
        <nav aria-label="Legal" className="flex items-center gap-3">
          {LINKS.map((l, i) => (
            <span key={l.href} className="flex items-center gap-3">
              {i > 0 && <span aria-hidden className="text-slate-300">·</span>}
              <a href={l.href} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-brand hover:underline">
                {l.label}
              </a>
            </span>
          ))}
        </nav>
      </div>
    </footer>
  );
}
