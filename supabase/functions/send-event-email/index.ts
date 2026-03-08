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
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is admin
    const { data: userData } = await supabaseUser.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleCheck } = await supabaseAdmin.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });

    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { event_id, subject, body } = await req.json();

    if (!event_id || !subject || !body) {
      return new Response(
        JSON.stringify({ error: "event_id, subject, body required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get registrations for this event
    const { data: registrations } = await supabaseAdmin
      .from("event_registrations")
      .select("user_id")
      .eq("event_id", event_id);

    if (!registrations || registrations.length === 0) {
      return new Response(
        JSON.stringify({ message: "Aucun inscrit pour cet événement" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get user emails from auth.users via admin
    const userIds = registrations.map((r: any) => r.user_id);
    const emails: string[] = [];

    for (const uid of userIds) {
      const { data } = await supabaseAdmin.auth.admin.getUserById(uid);
      if (data?.user?.email) {
        emails.push(data.user.email);
      }
    }

    if (emails.length === 0) {
      return new Response(
        JSON.stringify({ message: "Aucun email trouvé" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Send email via Resend
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({
          error:
            "RESEND_API_KEY non configurée. Ajoutez votre clé Resend dans les secrets.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get event title for the from name
    const { data: event } = await supabaseAdmin
      .from("events")
      .select("title")
      .eq("id", event_id)
      .single();

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Lab R&D PNL <onboarding@resend.dev>",
        to: emails,
        subject: subject,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <h2 style="color:#2d3748">${subject}</h2>
          <p style="color:#4a5568;white-space:pre-line;line-height:1.6">${body}</p>
          ${event ? `<p style="color:#718096;font-size:14px;margin-top:20px;padding-top:20px;border-top:1px solid #e2e8f0">Événement : ${event.title}</p>` : ""}
          <p style="color:#a0aec0;font-size:12px;margin-top:20px">— Lab R&D PNL</p>
        </div>`,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error("Resend error:", errText);
      return new Response(
        JSON.stringify({ error: "Erreur envoi Resend: " + errText }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: `Email envoyé à ${emails.length} inscrit(s) !`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
