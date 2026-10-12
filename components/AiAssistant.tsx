"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import type { SectionsContent } from "@/lib/content-sections";
import { getProduct, type ProductId } from "@/lib/products";
import { useSiteState } from "@/lib/store";
import Icon from "./ui/Icon";

type AiAssistantProps = { content: SectionsContent["ai"] };

type Message =
  | { from: "user"; text: string }
  | { from: "bot"; text: string; product?: ProductId };

/**
 * Keyword rules (EN + FR), checked in order. The first match wins.
 * Replace `recommend` with a call to an AI API later if needed.
 */
const RULES: { product: ProductId; words: string[] }[] = [
  { product: "irofacade", words: ["exterior", "extérieur", "exterieur", "façade", "facade", "outside", "outdoor", "rain", "pluie", "soleil", "sun"] },
  { product: "plafonya", words: ["ceiling", "plafond"] },
  { product: "irocryl-4l", words: ["powder", "farin", "porous", "poreux", "poreuse", "primer", "primaire", "penetr", "pénètr", "old wall", "vieux mur"] },
  { product: "fix-one", words: ["fixer", "fixateur", "opacity", "opacité", "prepar", "prépar", "unify", "unifier", "undercoat", "sous-couche"] },
  { product: "irovella", words: ["kitchen", "cuisine", "living", "salon", "bedroom", "chambre", "interior", "intérieur", "interieur", "wash", "lessiv", "clean", "nettoy", "satin", "bathroom", "salle", "wall", "mur", "finish", "finition"] },
];

function recommend(question: string): ProductId | null {
  const q = question.toLowerCase();
  for (const rule of RULES) {
    if (rule.words.some((word) => q.includes(word))) return rule.product;
  }
  return null;
}

/** 06 — PAINTIRO AI: floating assistant bubble with product recommendations. */
export default function AiAssistant({ content }: AiAssistantProps) {
  const introDone = useSiteState((s) => s.introDone);
  const [open, setOpen] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const teaserShown = useRef(false);

  // Bubble appears after the loader.
  useEffect(() => {
    if (!introDone || !rootRef.current) return;
    gsap.fromTo(
      rootRef.current,
      { autoAlpha: 0, y: 24 },
      { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", delay: 1.2 },
    );
  }, [introDone]);

  // Teaser once, when the colors section comes into view (after the pinned gallery).
  useEffect(() => {
    const target = document.getElementById("colors");
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !teaserShown.current) {
          teaserShown.current = true;
          setTeaser(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  // The teaser hides itself after a few seconds.
  useEffect(() => {
    if (!teaser) return;
    const timer = window.setTimeout(() => setTeaser(false), 8000);
    return () => window.clearTimeout(timer);
  }, [teaser]);

  // Panel open animation + focus.
  useEffect(() => {
    if (!open || !panelRef.current) return;
    gsap.fromTo(
      panelRef.current,
      { autoAlpha: 0, y: 20, scale: 0.97 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" },
    );
    inputRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Keep the latest message visible.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const ask = (question: string) => {
    const text = question.trim();
    if (!text || thinking) return;
    setMessages((m) => [...m, { from: "user", text }]);
    setInput("");
    setThinking(true);
    window.setTimeout(() => {
      const product = recommend(text);
      setMessages((m) => [
        ...m,
        product
          ? { from: "bot", text: content.answers[product], product }
          : { from: "bot", text: content.fallback },
      ]);
      setThinking(false);
    }, 700);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    ask(input);
  };

  const openPanel = () => {
    setTeaser(false);
    setOpen(true);
  };

  return (
    <div
      ref={rootRef}
      className="invisible fixed bottom-4 right-4 z-[70] flex flex-col items-end gap-3 opacity-0 min-[900px]:bottom-8 min-[900px]:right-8"
    >
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={content.title}
          className="flex max-h-[min(640px,calc(100svh-120px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden bg-white shadow-[0_30px_80px_-20px_rgba(20,20,20,0.35)]"
        >
          <div className="flex items-start gap-4 bg-red p-5 text-white">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-red">
              <Icon name="sparkle" size={20} />
            </span>
            <div className="flex-1">
              <p className="font-heading text-[22px] leading-[1.1]">{content.title}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-white/85">{content.intro}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={content.close}
              className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/40 transition-colors hover:bg-white hover:text-red"
            >
              <Icon name="close" size={14} />
            </button>
          </div>

          <div ref={listRef} data-lenis-prevent className="flex-1 overflow-y-auto p-5" aria-live="polite">
            {messages.length === 0 ? (
              <div>
                <p className="label text-[10px] text-muted min-[900px]:text-[10px]">{content.examplesLabel}</p>
                <ul className="mt-3 flex flex-col gap-2">
                  {content.examples.map((example) => (
                    <li key={example}>
                      <button
                        type="button"
                        onClick={() => ask(example)}
                        className="flex w-full items-center gap-3 border border-ink/10 px-4 py-3 text-left text-[13px] text-ink transition-colors duration-300 hover:border-red hover:text-red"
                      >
                        <Icon name="arrow" size={14} className="shrink-0 text-red" />
                        {example}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <ul className="flex flex-col gap-4">
                {messages.map((message, i) => (
                  <li key={i} className={message.from === "user" ? "self-end" : "self-start"}>
                    {message.from === "user" ? (
                      <p className="max-w-[260px] bg-ink px-4 py-3 text-[13px] leading-relaxed text-white">
                        {message.text}
                      </p>
                    ) : (
                      <div className="max-w-[300px]">
                        <p className="bg-[#F3F2EF] px-4 py-3 text-[13px] leading-relaxed text-ink">{message.text}</p>
                        {message.product && <ProductCard id={message.product} label={content.recommendation} />}
                      </div>
                    )}
                  </li>
                ))}
                {thinking && (
                  <li className="self-start bg-[#F3F2EF] px-4 py-3 text-[13px] text-muted">{content.thinking}</li>
                )}
              </ul>
            )}
          </div>

          <form onSubmit={onSubmit} className="flex border-t border-ink/10">
            <label htmlFor="ai-input" className="sr-only">
              {content.placeholder}
            </label>
            <input
              ref={inputRef}
              id="ai-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={content.placeholder}
              autoComplete="off"
              className="h-14 flex-1 px-5 text-[14px] text-ink placeholder:text-muted focus:outline-none"
            />
            <button
              type="submit"
              aria-label={content.send}
              className="flex h-14 w-14 items-center justify-center bg-ink text-white transition-colors hover:bg-red"
            >
              <Icon name="send" size={18} />
            </button>
          </form>
          <p className="px-5 pb-3 text-[10px] text-muted">{content.disclaimer}</p>
        </div>
      )}

      {teaser && !open && (
        <button
          type="button"
          onClick={openPanel}
          className="label bg-white px-4 py-3 text-[11px] text-ink shadow-[0_12px_30px_-10px_rgba(20,20,20,0.3)] transition-colors hover:text-red min-[900px]:text-[11px]"
        >
          {content.teaser}
        </button>
      )}

      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-label={open ? content.close : content.open}
        aria-expanded={open}
        className="flex size-14 items-center justify-center rounded-full bg-red text-white shadow-[0_16px_40px_-12px_rgba(232,55,44,0.7)] transition-transform duration-500 ease-power3-out hover:scale-105 min-[900px]:size-16"
      >
        {open ? <Icon name="close" size={20} /> : <span className="font-heading text-[22px] leading-none">AI</span>}
      </button>
    </div>
  );
}

function ProductCard({ id, label }: { id: ProductId; label: string }) {
  const product = getProduct(id);
  return (
    <a
      href="#contact"
      className="group mt-2 flex items-center gap-4 border border-ink/10 p-3 transition-colors duration-300 hover:border-red"
    >
      <span className="flex size-16 shrink-0 items-center justify-center bg-[#F3F2EF]">
        <Image src={product.image} alt="" width={product.width} height={product.height} className="h-12 w-auto" />
      </span>
      <span className="flex-1">
        <span className="label block text-[10px] text-red min-[900px]:text-[10px]">{label}</span>
        <span className="font-heading mt-1 block text-[22px] leading-none text-ink">{product.name}</span>
      </span>
      <Icon name="arrow" size={16} className="text-ink transition-transform group-hover:translate-x-1" />
    </a>
  );
}
