import type { SupabaseClient } from "@supabase/supabase-js";

export async function requireUser(sb: SupabaseClient) {
  const { data, error } = await sb.auth.getUser();
  if (error || !data?.user) throw new Error("Unauthorized");
  return data.user;
}

export async function getProfile(sb: SupabaseClient, userId: string) {
  const { data, error } = await sb
    .from("profiles")
    .select("id, company_id, role")
    .eq("id", userId)
    .single();
  if (error) throw new Error("Profile not found");
  if (!data.company_id) throw new Error("Profile missing company_id");
  return data as { id: string; company_id: string; role: "admin" | "technician" };
}