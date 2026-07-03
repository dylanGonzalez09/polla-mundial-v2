import { SubmitButton } from "@/components/ui/button";
import { Surface } from "@/components/ui/card";
import { confirmPasswordRecovery } from "@/lib/auth/actions";

export default async function ConfirmRecoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; next?: string }>;
}) {
  const { code, next } = await searchParams;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10">
      <Surface className="w-full p-8 sm:p-10">
        <div className="mb-6 flex flex-col gap-3">
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
            Polla Mundial
          </div>
          <h1 className="font-serif text-3xl leading-tight text-[var(--ink)]">
            Confirma tu solicitud
          </h1>
          <p className="text-sm leading-6 text-[var(--muted-ink)]">
            Por seguridad, confirma con un clic para continuar y elegir tu
            nueva contrasena.
          </p>
        </div>

        <form action={confirmPasswordRecovery}>
          <input type="hidden" name="code" value={code ?? ""} />
          <input type="hidden" name="next" value={next ?? "/update-password"} />
          <SubmitButton block disabled={!code}>
            Continuar
          </SubmitButton>
        </form>

        {!code ? (
          <p className="mt-4 text-sm text-[var(--muted-ink)]">
            Este enlace no es valido o ya expiro.
          </p>
        ) : null}
      </Surface>
    </div>
  );
}
