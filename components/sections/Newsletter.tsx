"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import type { SectionsContent } from "@/lib/content-sections";
import { getProduct } from "@/lib/products";
import Icon from "../ui/Icon";
import Reveal from "../ui/Reveal";

type NewsletterProps = { content: SectionsContent["newsletter"] };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * 13 — Newsletter. Validates the email on the client.
 * Connect `onSubmit` to your mailing service (Brevo, Mailchimp...) to store signups.
 */
export default function Newsletter({ content }: NewsletterProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "invalid" | "success">("idle");
  const product = getProduct("plafonya");

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!EMAIL.test(email.trim())) {
      setStatus("invalid");
      return;
    }
    setStatus("success");
    setEmail("");
  };

  return (
    <section id="newsletter" aria-label={content.title} className="relative overflow-hidden bg-[#F6F5F2]">
      <Reveal className="relative mx-auto grid max-w-[1600px] items-center gap-10 px-[var(--nav-px)] py-20 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] min-[900px]:py-24">
        <div>
          <p data-reveal className="label tabular flex items-center gap-3 text-muted">
            <span className="text-red">13</span>
            <span className="block h-px w-8 bg-red" aria-hidden="true" />
            <Icon name="mail" size={16} />
          </p>
          <h2 data-reveal className="font-heading mt-5 text-[clamp(36px,4vw,64px)] font-normal leading-none text-ink">
            {content.title}
          </h2>
          <p data-reveal className="mt-4 max-w-[380px] text-[14px] leading-relaxed text-muted">
            {content.text}
          </p>
        </div>

        <form data-reveal onSubmit={onSubmit} noValidate className="w-full">
          <div className="flex flex-col gap-3 min-[600px]:flex-row min-[600px]:gap-0">
            <label htmlFor="newsletter-email" className="sr-only">
              {content.placeholder}
            </label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status !== "idle") setStatus("idle");
              }}
              placeholder={content.placeholder}
              autoComplete="email"
              aria-invalid={status === "invalid"}
              aria-describedby="newsletter-status"
              className="h-14 w-full border min-[600px]:w-auto min-[600px]:flex-1 border-ink/20 bg-white px-5 text-[15px] text-ink placeholder:text-muted focus:border-red focus:outline-none"
            />
            <button type="submit" className="label btn-red h-14 !py-0">
              {content.button}
            </button>
          </div>
          <p
            id="newsletter-status"
            role="status"
            className={`mt-3 min-h-5 text-[13px] ${status === "invalid" ? "text-red" : "text-ink"}`}
          >
            {status === "invalid" && content.invalid}
            {status === "success" && content.success}
          </p>
        </form>

        <Image
          src={product.image}
          alt=""
          width={product.width}
          height={product.height}
          sizes="200px"
          className="hidden h-[200px] w-auto drop-shadow-[0_24px_30px_rgba(20,20,20,0.18)] min-[900px]:block"
        />
      </Reveal>
    </section>
  );
}
