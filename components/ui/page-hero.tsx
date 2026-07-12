export function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="pattern-tricolor rounded-[20px] px-6 py-8 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
        {eyebrow}
      </p>
      <h1 className="font-display mt-2 text-4xl uppercase leading-[1.05] text-white sm:text-5xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
