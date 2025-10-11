import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
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
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { to, subject, body, templateId, variables }: EmailRequest = await req.json();

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }

    const resend = new Resend(resendApiKey);

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

        if (prefs && prefs.unsubscribed_at) {
          console.log(`User ${recipient} has unsubscribed, skipping email`);
          await supabase.from("email_logs").insert({
            recipient_email: recipient,
            subject: finalSubject,
            body: finalBody,
            template_id: templateId || null,
            status: "failed",
            error_message: "User has unsubscribed",
            metadata: { variables },
          });
          results.push({ recipient, status: "skipped", reason: "unsubscribed" });
          continue;
        }

        const emailResult = await resend.emails.send({
          from: "Key Management System <deedat30112002@gmail.com>",
          to: recipient,
          subject: finalSubject,
          html: finalBody,
        });

        if (emailResult.error) {
          console.error(`Failed to send email to ${recipient}:`, emailResult.error);
          await supabase.from("email_logs").insert({
            recipient_email: recipient,
            subject: finalSubject,
            body: finalBody,
            template_id: templateId || null,
            status: "failed",
            error_message: emailResult.error.message,
            external_id: null,
            metadata: { variables },
          });
          results.push({ recipient, status: "failed", error: emailResult.error.message });
        } else {
          console.log(`Email sent successfully to ${recipient}`);
          await supabase.from("email_logs").insert({
            recipient_email: recipient,
            subject: finalSubject,
            body: finalBody,
            template_id: templateId || null,
            status: "sent",
            error_message: null,
            external_id: emailResult.data?.id,
            metadata: { variables },
          });
          results.push({ recipient, status: "sent", emailId: emailResult.data?.id });
        }
      } catch (error) {
        console.error(`Error processing email for ${recipient}:`, error);
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
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} email(s)`,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-custom-email function:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to send email",
        details: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
