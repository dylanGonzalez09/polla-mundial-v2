import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AuthProfile } from "@/lib/domain/types";

export const verifySession = cache(async () => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
});

export const getCurrentProfile = cache(async (): Promise<AuthProfile> => {
  const user = await verifySession();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, is_admin")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    redirect("/login");
  }

  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name,
    isAdmin: data.is_admin,
  };
});

export const requireAdmin = cache(async () => {
  const profile = await getCurrentProfile();
  if (!profile.isAdmin) {
    redirect("/bracket");
  }

  return profile;
});
