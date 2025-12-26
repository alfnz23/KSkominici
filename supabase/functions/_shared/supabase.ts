import { createClient } from "@supabase/supabase-js";

export function supabaseClient(req: Request) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";
  return createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
}

export function supabaseServiceClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, service);
}