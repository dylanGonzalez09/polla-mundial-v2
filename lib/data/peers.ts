import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { PeerInitialRow, PeerRoundRow, RoundKey } from "@/lib/domain/types";

export async function getPeerInitial() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("get_peer_initial");

  if (error) {
    throw error;
  }

  return (data ?? []) as PeerInitialRow[];
}

export async function getPeerRoundScores(round: RoundKey) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("get_peer_round_scores", {
    target_round: round,
  });

  if (error) {
    throw error;
  }

  return (data ?? []) as PeerRoundRow[];
}
