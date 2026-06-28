import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { signup } from "@/lib/auth/actions";

export default function RegisterPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center gap-6 text-[var(--ink)]">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--accent)]">
            Nuevo jugador
          </p>
          <h1 className="font-serif text-5xl leading-tight sm:text-6xl">
            Tu nombre visible pesa mas que tu correo.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-[var(--muted-ink)]">
            El ranking y la vista de jugadores muestran solo tu nombre visible.
            Registra tu cuenta, llena el bracket y congela tu lectura del torneo.
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <AuthForm
            title="Crea tu cuenta"
            subtitle="Usa un nombre visible claro. Ese nombre sera el que aparezca en el ranking y en la vista de peers."
            submitLabel="Registrarme"
            action={signup}
            fields={[
              {
                id: "displayName",
                label: "Nombre visible",
                type: "text",
                autoComplete: "name",
              },
              {
                id: "email",
                label: "Correo",
                type: "email",
                autoComplete: "email",
              },
              {
                id: "password",
                label: "Contrasena",
                type: "password",
                autoComplete: "new-password",
              },
            ]}
            footer={
              <>
                Ya tienes cuenta?{" "}
                <Link className="font-semibold text-[var(--accent)]" href="/login">
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
