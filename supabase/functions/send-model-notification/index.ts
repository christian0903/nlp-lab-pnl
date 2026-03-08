import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { notification_id, user_id, model_id, type, message } = await req.json();

    if (!user_id || !message) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get model owner email
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(user_id);
    if (!userData?.user?.email) {
      console.log("No email found for user", user_id);
      return new Response(JSON.stringify({ message: "No email found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get model info
    const { data: model } = await supabaseAdmin
      .from("models")
      .select("title")
      .eq("id", model_id)
      .single();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not configured, skipping email");
      return new Response(JSON.stringify({ message: "Email skipped - no API key" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const typeLabels: Record<string, string> = {
      feedback: "💬 Nouveau feedback",
      variation: "🔀 Nouvelle variation",
      post: "📝 Nouveau post lié",
      status_change: "🔄 Changement de statut",
    };

    const subject = `${typeLabels[type] || "Notification"} — ${model?.title || "votre modèle"}`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Lab R&D PNL <onboarding@resend.dev>",
        to: [userData.user.email],
        subject,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <h2 style="color:#2d3748">${subject}</h2>
          <p style="color:#4a5568;line-height:1.6">${message}</p>
          <p style="color:#a0aec0;font-size:12px;margin-top:30px;padding-top:15px;border-top:1px solid #e2e8f0">— Lab R&D PNL</p>
        </div>`,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error("Resend error:", errText);
      return new Response(JSON.stringify({ error: errText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ message: "Email sent" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
