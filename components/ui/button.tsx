"use client";

import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { useFormStatus } from "react-dom";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    tone?: "primary" | "secondary" | "ghost" | "danger" | "gold";
    block?: boolean;
  }
>;

const toneClassName: Record<NonNullable<ButtonProps["tone"]>, string> = {
  primary:
    "bg-[var(--primary)] text-white shadow-[0_12px_24px_rgba(0,168,89,0.35),inset_0_1px_0_rgba(255,255,255,0.35)] hover:bg-[var(--primary-strong)]",
  secondary:
    "bg-white text-[var(--ink)] border border-[var(--line)] hover:border-[var(--primary)]",
  ghost:
    "bg-transparent text-[var(--muted-ink)] border border-transparent hover:border-[var(--line)]",
  danger:
    "bg-[var(--live)] text-white shadow-[0_12px_24px_rgba(224,16,47,0.3)] hover:bg-[#b80c26]",
  gold:
    "bg-[var(--gold)] text-[var(--ink)] shadow-[0_12px_24px_rgba(245,179,1,0.4),inset_0_1px_0_rgba(255,255,255,0.5)] hover:bg-[var(--gold-strong)]",
};

export function Button({
  children,
  className = "",
  tone = "primary",
  block = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition ${
        toneClassName[tone]
      } ${block ? "w-full" : ""} ${disabled ? "cursor-not-allowed opacity-50" : ""} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export function SubmitButton({
  children,
  className = "",
  tone = "primary",
  block = false,
  disabled = false,
}: Omit<ButtonProps, "type">) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      tone={tone}
      block={block}
      disabled={pending || disabled}
      className={className}
    >
      {pending ? "Enviando..." : children}
    </Button>
  );
}
