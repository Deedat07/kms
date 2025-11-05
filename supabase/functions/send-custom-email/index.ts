import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://kms-92yu47z5l-ahmads-projects-aa5e9061.vercel.app",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailRequest {
  to: string | string[];
  subject: string;
  body: string;
  templateId?: string;
  variables?: Record<string, string>;
}

Deno.serve(async (req: Request) => {
  // ✅ Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) throw new Error("RESEND_API_KEY not set");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);
    const { to, subject, body, templateId, variables }: EmailRequest = await req.json();

    let finalSubject = subject;
    let finalBody = body;

    if (templateId) {
      const { data: template, error: templateError } = await supabase
        .from("email_templates")
        .select("*")
        .eq("id", templateId)
        .eq("is_active", true)
        .maybeSingle();
      if (templateError) throw templateError;
      if (template) {
        finalSubject = template.subject;
        finalBody = template.body;

        if (variables) {
          for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, "g");
            finalSubject = finalSubject.replace(regex, value);
            finalBody = finalBody.replace(regex, value);
          }
        }
      }
    }

    const recipients = Array.isArray(to) ? to : [to];
    const results = [];

    for (const recipient of recipients) {
      try {
        const { data: prefs } = await supabase
          .from("user_email_preferences")
          .select("*")
          .eq("user_email", recipient)
          .maybeSingle();

        if (prefs?.unsubscribed_at) {
          await supabase.from("email_logs").insert({
            recipient_email: recipient,
            subject: finalSubject,
            body: finalBody,
            template_id: templateId || null,
            status: "failed",
            error_message: "User has unsubscribed",
            metadata: { variables },
          });
          results.push({ recipient, status: "skipped" });
          continue;
        }

        const emailResult = await resend.emails.send({
          from: "Key Management System <deedat30112002@gmail.com>",
          to: recipient,
          subject: finalSubject,
          html: finalBody,
        });

        const logData = {
          recipient_email: recipient,
          subject: finalSubject,
          body: finalBody,
          template_id: templateId || null,
          metadata: { variables },
        };

        if (emailResult.error) {
          await supabase.from("email_logs").insert({
            ...logData,
            status: "failed",
            error_message: emailResult.error.message,
          });
          results.push({ recipient, status: "failed" });
        } else {
          await supabase.from("email_logs").insert({
            ...logData,
            status: "sent",
            external_id: emailResult.data?.id,
          });
          results.push({ recipient, status: "sent" });
        }
      } catch (error) {
        await supabase.from("email_logs").insert({
          recipient_email: recipient,
          subject: finalSubject,
          body: finalBody,
          template_id: templateId || null,
          status: "failed",
          error_message: error.message,
          metadata: { variables },
        });
        results.push({ recipient, status: "failed", error: error.message });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-custom-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
