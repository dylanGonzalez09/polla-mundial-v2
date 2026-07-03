import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { login } from "@/lib/auth/actions";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center gap-6 text-[var(--ink)]">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--accent)]">
            Bracket Prediction Pool
          </p>
          <h1 className="font-serif text-5xl leading-tight sm:text-6xl">
            El cuadro se gana antes del primer pitazo.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-[var(--muted-ink)]">
            Confirma tu llave completa, desbloquea rondas a medida que avanza el
            torneo y compara tus picks con el resto del grupo.
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <AuthForm
            title="Inicia sesion"
            subtitle="Entra a tu cuadro, continua con las rondas abiertas y revisa el ranking en tiempo real."
            submitLabel="Entrar"
            action={login}
            fields={[
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
                autoComplete: "current-password",
              },
            ]}
            footer={
              <>
                No tienes cuenta?{" "}
                <Link className="font-semibold text-[var(--accent)]" href="/register">
                  Registrate
                </Link>
                <br />
                <Link
                  className="font-semibold text-[var(--accent)]"
                  href="/forgot-password"
                >
                  Olvidaste tu contrasena?
                </Link>
              </>
            }
          />
        </div>
      </div>
    </div>
  );
}
