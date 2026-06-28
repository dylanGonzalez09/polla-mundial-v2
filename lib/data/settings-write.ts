import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function updateAppSettings(payload: {
  initial_opens_at?: string | null;
  initial_deadline?: string | null;
  initial_override?: "open" | "closed" | null;
}) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("app_settings").upsert({
    id: 1,
    ...payload,
  });

  if (error) {
    throw error;
  }
}
