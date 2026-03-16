// deno-lint-ignore-file
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";

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
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const { amount, recurring } = await req.json();

    // Validate amount (in cents, minimum 1€)
    const amountCents = Math.round(Number(amount) * 100);
    if (!amountCents || amountCents < 100 || amountCents > 100000) {
      return new Response(
        JSON.stringify({ error: "Montant invalide (entre 1€ et 1000€)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the origin for return URLs
    const origin = req.headers.get("origin") || "https://lab.atelierpnl.eu";

    if (recurring) {
      // Recurring donation: create a price on-the-fly + subscription checkout
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [
          {
            price_data: {
              currency: "eur",
              unit_amount: amountCents,
              recurring: { interval: "month" },
              product_data: {
                name: "Don mensuel — PNL Lab R&D",
                description: "Soutien mensuel au laboratoire collaboratif PNL",
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/soutenir?success=true`,
        cancel_url: `${origin}/soutenir?canceled=true`,
      });

      return new Response(
        JSON.stringify({ url: session.url }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // One-time donation
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "eur",
              unit_amount: amountCents,
              product_data: {
                name: "Don — PNL Lab R&D",
                description: "Soutien au laboratoire collaboratif PNL",
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/soutenir?success=true`,
        cancel_url: `${origin}/soutenir?canceled=true`,
      });

      return new Response(
        JSON.stringify({ url: session.url }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    console.error("Donation error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
