// deno-lint-ignore-file
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Non autorisé");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Verify the user is admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await sb.auth.getUser(token);
    if (authError || !user) throw new Error("Non autorisé");

    const { data: roleData } = await sb.from("user_roles").select("role").eq("user_id", user.id).single();
    if (!roleData || !["admin", "moderator"].includes(roleData.role)) {
      throw new Error("Accès réservé aux administrateurs");
    }

    // Get stripe mode
    const { data: modeData } = await sb.from("app_settings").select("value").eq("key", "stripe_mode").single();
    const mode = modeData?.value === "live" ? "live" : "test";

    const stripeKey = mode === "live"
      ? Deno.env.get("STRIPE_SECRET_KEY_LIVE")
      : Deno.env.get("STRIPE_SECRET_KEY_TEST");

    if (!stripeKey) throw new Error(`STRIPE_SECRET_KEY_${mode.toUpperCase()} not configured`);

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Fetch recent payments
    const payments = await stripe.checkout.sessions.list({
      limit: 50,
      expand: ["data.line_items"],
    });

    // Fetch active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      limit: 50,
      status: "active",
    });

    const donations = payments.data
      .filter(s => s.payment_status === "paid")
      .map(s => ({
        id: s.id,
        amount: (s.amount_total || 0) / 100,
        currency: s.currency,
        email: s.customer_details?.email || s.customer_email || "—",
        date: new Date((s.created || 0) * 1000).toISOString(),
        mode: s.mode === "subscription" ? "mensuel" : "unique",
        status: s.payment_status,
      }));

    const activeSubscriptions = subscriptions.data.map(s => ({
      id: s.id,
      amount: (s.items.data[0]?.price?.unit_amount || 0) / 100,
      currency: s.currency,
      email: typeof s.customer === "string" ? s.customer : "—",
      start_date: new Date((s.start_date || 0) * 1000).toISOString(),
      status: s.status,
    }));

    return new Response(
      JSON.stringify({ mode, donations, subscriptions: activeSubscriptions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("List donations error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: err.message?.includes("autorisé") ? 403 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
