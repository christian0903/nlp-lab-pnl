// deno-lint-ignore-file
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function getStripeKey(): Promise<string> {
  // Read mode from app_settings
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, supabaseKey);

  const { data } = await sb.from("app_settings").select("value").eq("key", "stripe_mode").single();
  const mode = data?.value === "live" ? "live" : "test";

  const key = mode === "live"
    ? Deno.env.get("STRIPE_SECRET_KEY_LIVE")
    : Deno.env.get("STRIPE_SECRET_KEY_TEST");

  if (!key) throw new Error(`STRIPE_SECRET_KEY_${mode.toUpperCase()} not configured`);
  return key;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = await getStripeKey();
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const { amount, recurring, interval: reqInterval } = await req.json();
    const interval = reqInterval === 'week' ? 'week' : 'month';

    const amountCents = Math.round(Number(amount) * 100);
    if (!amountCents || amountCents < 100 || amountCents > 100000) {
      return new Response(
        JSON.stringify({ error: "Montant invalide (entre 1€ et 1000€)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const origin = req.headers.get("origin") || "https://lab.atelierpnl.eu";

    const sessionConfig: any = {
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: amountCents,
            product_data: {
              name: recurring ? "Don mensuel — PNL Lab R&D" : "Don — PNL Lab R&D",
              description: "Soutien au laboratoire collaboratif PNL",
            },
            ...(recurring ? { recurring: { interval } } : {}),
          },
          quantity: 1,
        },
      ],
      mode: recurring ? "subscription" : "payment",
      success_url: `${origin}/soutenir?success=true`,
      cancel_url: `${origin}/soutenir?canceled=true`,
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Donation error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
