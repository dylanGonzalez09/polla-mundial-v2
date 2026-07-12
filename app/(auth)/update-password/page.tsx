import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { updatePassword } from "@/lib/auth/actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function UpdatePasswordPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/forgot-password");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center gap-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-white/80">
            Nueva contrasena
          </p>
          <h1 className="font-display text-4xl uppercase leading-tight sm:text-5xl">
            Elige una contrasena nueva y listo.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-white/85">
            Este enlace es de un solo uso. Una vez actualices tu contrasena,
            entraras directo a tu cuadro.
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <AuthForm
            title="Actualiza tu contrasena"
            subtitle="Elige una contrasena de al menos 8 caracteres."
            submitLabel="Actualizar contrasena"
            action={updatePassword}
            fields={[
              {
                id: "password",
                label: "Contrasena nueva",
                type: "password",
                autoComplete: "new-password",
              },
            ]}
            footer={
              <>
                Cambiaste de opinion?{" "}
                <Link className="font-semibold text-[var(--primary)]" href="/login">
                  Inicia sesion
                </Link>
              </>
            }
          />
        </div>
      </div>
    </div>
  );
}
