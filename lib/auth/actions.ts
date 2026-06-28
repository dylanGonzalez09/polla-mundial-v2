"use server";

import { redirect } from "next/navigation";

import { env } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  idleActionState,
  loginSchema,
  signupSchema,
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
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
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
    };
  }

  redirect(await resolveLandingPath(supabase));
}

export async function login(
  previousState: ActionState = idleActionState,
  formData: FormData,
): Promise<ActionState> {
  void previousState;
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
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
    };
  }

  redirect(await resolveLandingPath(supabase));
}

export async function logout() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
