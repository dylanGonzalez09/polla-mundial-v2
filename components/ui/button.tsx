"use client";

import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { useFormStatus } from "react-dom";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    tone?: "primary" | "secondary" | "ghost" | "danger";
    block?: boolean;
  }
>;

const toneClassName: Record<NonNullable<ButtonProps["tone"]>, string> = {
  primary:
    "bg-[var(--accent)] text-white shadow-[0_12px_24px_rgba(24,99,62,0.2)] hover:bg-[var(--accent-strong)]",
  secondary:
    "bg-white text-[var(--ink)] border border-[var(--line)] hover:border-[var(--accent)]",
  ghost:
    "bg-transparent text-[var(--muted-ink)] border border-transparent hover:border-[var(--line)]",
  danger:
    "bg-[var(--danger)] text-white hover:bg-[#8f2230]",
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
