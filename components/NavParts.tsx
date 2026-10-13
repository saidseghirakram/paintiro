import Image from "next/image";
import { LOCALES, type Locale } from "@/lib/content";

/** EN / FR switch, shared by the desktop bar and the mobile menu. */
export function LanguageSwitch({
  locale,
  label,
  tone = "ink",
  path = "",
}: {
  locale: Locale;
  label: string;
  tone?: "ink" | "white";
  /** Path after the locale, kept when switching language (e.g. "/products/irovella"). */
  path?: string;
}) {
  const active = tone === "ink" ? "text-ink" : "text-white";
  const inactive = tone === "ink" ? "text-muted hover:text-ink" : "text-white/60 hover:text-white";
  return (
    <div className="label flex items-center gap-2" role="group" aria-label={label}>
      {LOCALES.map((code, i) => (
        <span key={code} className="flex items-center gap-2">
          {i > 0 && (
            <span className={tone === "ink" ? "text-muted" : "text-white/60"} aria-hidden="true">
              /
            </span>
          )}
          {/* Plain anchor: a full navigation always lands at the top of the new language. */}
          <a
            href={`/${code}${path}`}
            hrefLang={code}
            lang={code}
            aria-current={code === locale ? "true" : undefined}
            className={`link-underline transition-colors duration-300 ${
              code === locale ? active : inactive
            }`}
          >
            {code.toUpperCase()}
          </a>
        </span>
      ))}
    </div>
  );
}

/** PAINTIRO logo with a serif text fallback when /public/logo.png is missing. */
export function Logo({ hasLogo, className = "" }: { hasLogo: boolean; className?: string }) {
  if (hasLogo) {
    return (
      <Image
        src="/logo.png"
        alt="PAINTIRO"
        width={200}
        height={28}
        priority
        unoptimized
        className={`h-7 w-auto ${className}`}
      />
    );
  }
  return (
    <span
      className={`font-heading block text-[26px] font-semibold leading-none tracking-[0.08em] ${className}`}
    >
      PAINTIRO
    </span>
  );
}
