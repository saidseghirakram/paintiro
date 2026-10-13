import type { Locale } from "@/lib/content";
import type { SectionsContent } from "@/lib/content-sections";
import { LanguageSwitch, Logo } from "./NavParts";
import Icon, { type IconName } from "./ui/Icon";

type FooterProps = {
  content: SectionsContent["footer"];
  locale: Locale;
  languageLabel: string;
  hasLogo: boolean;
  /** Prefix for the "#section" links when the footer is not on the homepage (e.g. "/en"). */
  linkPrefix?: string;
  /** Path after the locale, kept by the language switch. */
  path?: string;
};

/** Social profiles: replace the URLs with the real PAINTIRO accounts. */
const SOCIAL: { icon: IconName; label: string; href: string }[] = [
  { icon: "facebook", label: "Facebook", href: "https://www.facebook.com/" },
  { icon: "instagram", label: "Instagram", href: "https://www.instagram.com/" },
  { icon: "youtube", label: "YouTube", href: "https://www.youtube.com/" },
  { icon: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/" },
];

/** 14 — Footer: brand, navigation columns, social links, language and legal line. */
export default function Footer({ content, locale, languageLabel, hasLogo, linkPrefix = "", path }: FooterProps) {
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-[1600px] px-[var(--nav-px)] pb-10 pt-20 min-[900px]:pt-28">
        <div className="grid gap-14 min-[1100px]:grid-cols-[minmax(0,1.2fr)_minmax(0,3fr)]">
          <div>
            <a href={linkPrefix ? linkPrefix : "#hero"} aria-label="PAINTIRO" className="inline-block text-red">
              <Logo hasLogo={hasLogo} className={hasLogo ? "" : "!text-[34px]"} />
            </a>
            <p className="mt-6 max-w-[320px] text-[14px] leading-relaxed text-white/65">{content.description}</p>
            <p className="label mt-10 text-[11px] text-white/50 min-[900px]:text-[11px]">{content.social}</p>
            <ul className="mt-4 flex gap-3">
              {SOCIAL.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    className="flex size-11 items-center justify-center rounded-full border border-white/20 text-white transition-colors duration-300 hover:border-red hover:bg-red"
                  >
                    <Icon name={item.icon} size={18} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 min-[600px]:grid-cols-3 min-[900px]:grid-cols-5">
            {content.columns.map((column) => (
              <div key={column.title}>
                <h3 className="label text-[11px] text-red min-[900px]:text-[11px]">{column.title}</h3>
                <ul className="mt-5 flex flex-col gap-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href.startsWith("#") ? `${linkPrefix}${link.href}` : link.href}
                        className="text-[14px] text-white/70 transition-colors duration-300 hover:text-white"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-20 flex flex-col gap-6 border-t border-white/15 pt-8 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between">
          <p className="text-[12px] text-white/50">
            © {2026} PAINTIRO. {content.rights}
          </p>
          <div className="flex items-center gap-8">
            <LanguageSwitch locale={locale} label={languageLabel} tone="white" path={path} />
            <a href={linkPrefix ? "#top" : "#hero"} className="label link-underline inline-flex items-center gap-2 text-[11px] text-white min-[900px]:text-[11px]">
              {content.backToTop}
              <Icon name="arrow" size={14} className="-rotate-90" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
