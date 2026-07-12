import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { requestPasswordReset } from "@/lib/auth/actions";

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center gap-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-white/80">
            Recuperar acceso
          </p>
          <h1 className="font-display text-4xl uppercase leading-tight sm:text-5xl">
            Te enviamos un enlace y sigues en el cuadro.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-white/85">
            Ingresa el correo con el que te registraste y te mandamos un enlace
            para elegir una contrasena nueva.
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <AuthForm
            title="Olvide mi contrasena"
            subtitle="Te enviaremos un enlace de recuperacion a tu correo."
            submitLabel="Enviar enlace"
            action={requestPasswordReset}
            fields={[
              {
                id: "email",
                label: "Correo",
                type: "email",
                autoComplete: "email",
              },
            ]}
            footer={
              <>
                Ya la recordaste?{" "}
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
