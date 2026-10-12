import Icon from "./Icon";

type SectionHeaderProps = {
  /** Section number shown in red, e.g. "05". */
  index: string;
  eyebrow: string;
  title: string;
  link?: { label: string; href: string };
  tone?: "ink" | "white";
  className?: string;
};

/**
 * Editorial section header: "05 — EYEBROW", a large serif title and an optional
 * "View all" link aligned right. Children are marked for <Reveal>.
 */
export default function SectionHeader({
  index,
  eyebrow,
  title,
  link,
  tone = "ink",
  className = "",
}: SectionHeaderProps) {
  const white = tone === "white";
  return (
    <div
      className={`flex flex-col gap-6 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between ${className}`}
    >
      <div>
        <p
          data-reveal
          className={`label tabular flex items-center gap-3 ${white ? "text-white/80" : "text-muted"}`}
        >
          <span className={white ? "text-white" : "text-red"}>{index}</span>
          <span className={`block h-px w-8 ${white ? "bg-white/60" : "bg-red"}`} aria-hidden="true" />
          <span>{eyebrow}</span>
        </p>
        <h2
          data-reveal
          className={`font-heading mt-5 max-w-[16ch] text-[clamp(40px,5.2vw,84px)] font-normal leading-[1.02] ${
            white ? "text-white" : "text-ink"
          }`}
        >
          {title}
        </h2>
      </div>
      {link && (
        <a
          data-reveal
          href={link.href}
          className={`label link-underline group inline-flex items-center gap-3 self-start min-[900px]:self-auto ${
            white ? "text-white" : "text-ink"
          }`}
        >
          {link.label}
          <Icon
            name="arrow"
            size={16}
            className="transition-transform duration-500 ease-power3-out group-hover:translate-x-1"
          />
        </a>
      )}
    </div>
  );
}
