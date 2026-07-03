"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  idleActionState,
  loginSchema,
  signupSchema,
  updatePasswordSchema,
  type ActionState,
} from "@/lib/domain/validation";

function fieldErrors(error: unknown) {
  return error instanceof Error ? error.message : "Ocurrio un error inesperado.";
}

async function resolveLandingPath(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
): Promise<"/admin" | "/bracket"> {
  if (env.ADMIN_EMAIL) {
    await supabase.rpc("sync_my_admin_flag", {
      admin_email: env.ADMIN_EMAIL,
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return "/bracket";
  }

  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return data?.is_admin ? "/admin" : "/bracket";
}

export async function signup(
  previousState: ActionState = idleActionState,
  formData: FormData,
): Promise<ActionState> {
  void previousState;
  const rawEmail = formData.get("email");
  const rawDisplayName = formData.get("displayName");
  const parsed = signupSchema.safeParse({
    email: rawEmail,
    password: formData.get("password"),
    displayName: rawDisplayName,
  });

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: {
        email: typeof rawEmail === "string" ? rawEmail : "",
        displayName: typeof rawDisplayName === "string" ? rawDisplayName : "",
      },
    };
  }

  const supabase = await createServerSupabaseClient();
  const { email, password, displayName } = parsed.data;
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  });

  if (error) {
    const duplicate =
      error.message.toLowerCase().includes("already") ||
      error.message.toLowerCase().includes("registered");

    return {
      ok: false,
      fieldErrors: duplicate ? { email: ["Ese correo ya esta registrado."] } : undefined,
      message: duplicate ? undefined : fieldErrors(error),
      values: { email, displayName },
    };
  }

  redirect(await resolveLandingPath(supabase));
}

export async function login(
  previousState: ActionState = idleActionState,
  formData: FormData,
): Promise<ActionState> {
  void previousState;
  const rawEmail = formData.get("email");
  const parsed = loginSchema.safeParse({
    email: rawEmail,
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: { email: typeof rawEmail === "string" ? rawEmail : "" },
    };
  }

  const supabase = await createServerSupabaseClient();
  const { email, password } = parsed.data;
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      ok: false,
      fieldErrors: {
        email: ["Credenciales invalidas."],
        password: ["Credenciales invalidas."],
      },
      message: "No fue posible iniciar sesion.",
      values: { email },
    };
  }

  redirect(await resolveLandingPath(supabase));
}

export async function logout() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(
  previousState: ActionState = idleActionState,
  formData: FormData,
): Promise<ActionState> {
  void previousState;
  const rawEmail = formData.get("email");
  const parsed = forgotPasswordSchema.safeParse({
    email: rawEmail,
  });

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: { email: typeof rawEmail === "string" ? rawEmail : "" },
    };
  }

  const supabase = await createServerSupabaseClient();
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? `https://${requestHeaders.get("host")}`;

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/confirm?next=/update-password`,
  });

  return {
    ok: true,
    message:
      "Si ese correo esta registrado, te enviamos un enlace para restablecer tu contrasena.",
  };
}

export async function confirmPasswordRecovery(formData: FormData) {
  const code = formData.get("code");
  const nextParam = formData.get("next");
  const next = typeof nextParam === "string" && nextParam.startsWith("/")
    ? nextParam
    : "/update-password";

  if (typeof code !== "string" || !code) {
    redirect("/login");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    redirect("/login");
  }

  redirect(next);
}

export async function updatePassword(
  previousState: ActionState = idleActionState,
  formData: FormData,
): Promise<ActionState> {
  void previousState;
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return {
      ok: false,
      message: fieldErrors(error),
    };
  }

  redirect(await resolveLandingPath(supabase));
}
