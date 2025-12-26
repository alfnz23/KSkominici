import { corsHeaders } from "./cors";

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function badRequest(message: string, extra?: unknown) {
  return json({ error: message, details: extra ?? null }, 400);
}

export function serverError(message: string, extra?: unknown) {
  return json({ error: message, details: extra ?? null }, 500);
}