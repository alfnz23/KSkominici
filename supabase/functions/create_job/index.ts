import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateJobRequest {
  customer: {
    email: string;
    name?: string;
    phone?: string;
    address?: string;
  };
  type: "inspection" | "passport";
  assigned_to?: string;
  scheduled_at?: string;
  notes?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Use POST" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });

    // Auth
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const user = authData?.user;
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Profile -> company_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return new Response(JSON.stringify({ error: "Company not found for user" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: CreateJobRequest = await req.json();
    const { customer, type, assigned_to, scheduled_at, notes } = body ?? {};

    if (!customer?.email) {
      return new Response(JSON.stringify({ error: "customer.email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (type !== "inspection" && type !== "passport") {
      return new Response(JSON.stringify({ error: "Invalid type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Customer upsert (best way)
    const { data: cust, error: custErr } = await supabase
      .from("customers")
      .upsert(
        {
          company_id: profile.company_id,
          email: customer.email,
          name: customer.name ?? null,
          phone: customer.phone ?? null,
          address: customer.address ?? null,
        },
        { onConflict: "company_id,email" },
      )
      .select("*")
      .single();

    if (custErr || !cust?.id) {
      return new Response(JSON.stringify({ error: "Failed to upsert customer", details: custErr?.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const assigned = assigned_to ?? user.id;

    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .insert({
        company_id: profile.company_id,
        customer_id: cust.id,
        type,
        status: "in_progress",
        assigned_to: assigned,
        scheduled_at: scheduled_at ?? null,
        notes: notes ?? null,
      })
      .select(`
        *,
        customer:customers(*),
        assigned_technician:profiles!jobs_assigned_to_fkey(id, full_name, role)
      `)
      .single();

    if (jobErr) {
      return new Response(JSON.stringify({ error: "Failed to create job", details: jobErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ job, customer: cust }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: "Internal server error", details: error?.message ?? String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
