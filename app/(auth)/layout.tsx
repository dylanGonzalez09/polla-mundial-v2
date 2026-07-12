export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="pattern-tricolor relative min-h-screen overflow-hidden">
      <span
        aria-hidden
        className="font-display pointer-events-none absolute -right-6 -top-10 select-none text-[260px] leading-none text-white/10 sm:text-[380px]"
      >
        26
      </span>
      <div className="relative">{children}</div>
    </div>
  );
}
