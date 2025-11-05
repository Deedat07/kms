import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BulkEmailRequest {
  subject: string;
  body: string;
  templateId?: string;
  filters?: {
    roles?: string[];
    includeEmails?: string[];
    excludeEmails?: string[];
  };
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

    const { subject, body, templateId, filters, variables }: BulkEmailRequest = await req.json();

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

    let query = supabase.from("users").select("email, name, role");

    if (filters?.roles && filters.roles.length > 0) {
      query = query.in("role", filters.roles);
    }

    const { data: users, error: usersError } = await query;

    if (usersError) throw usersError;

    let recipients = users?.filter((u) => u.email) || [];

    if (filters?.includeEmails && filters.includeEmails.length > 0) {
      recipients = recipients.filter((u) => filters.includeEmails!.includes(u.email!));
    }

    if (filters?.excludeEmails && filters.excludeEmails.length > 0) {
      recipients = recipients.filter((u) => !filters.excludeEmails!.includes(u.email!));
    }

    const { data: allPrefs } = await supabase
      .from("user_email_preferences")
      .select("*")
      .not("unsubscribed_at", "is", null);

    const unsubscribedEmails = new Set(allPrefs?.map((p) => p.user_email) || []);
    recipients = recipients.filter((u) => !unsubscribedEmails.has(u.email!));

    const results = [];
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const recipient of recipients) {
      try {
        let personalizedSubject = finalSubject;
        let personalizedBody = finalBody;

        personalizedSubject = personalizedSubject.replace(/{{userName}}/g, recipient.name);
        personalizedBody = personalizedBody.replace(/{{userName}}/g, recipient.name);
        personalizedBody = personalizedBody.replace(/{{userRole}}/g, recipient.role || "user");

        const emailResult = await resend.emails.send({
          from: "Key Management System <deedat30112002@gmail.com>",
          to: recipient.email!,
          subject: personalizedSubject,
          html: personalizedBody,
        });

        if (emailResult.error) {
          console.error(`Failed to send email to ${recipient.email}:`, emailResult.error);
          await supabase.from("email_logs").insert({
            recipient_email: recipient.email!,
            subject: personalizedSubject,
            body: personalizedBody,
            template_id: templateId || null,
            status: "failed",
            error_message: emailResult.error.message,
            external_id: null,
            metadata: { bulk: true, filters, variables },
          });
          failedCount++;
          results.push({ recipient: recipient.email, status: "failed", error: emailResult.error.message });
        } else {
          console.log(`Email sent successfully to ${recipient.email}`);
          await supabase.from("email_logs").insert({
            recipient_email: recipient.email!,
            subject: personalizedSubject,
            body: personalizedBody,
            template_id: templateId || null,
            status: "sent",
            error_message: null,
            external_id: emailResult.data?.id,
            metadata: { bulk: true, filters, variables },
          });
          successCount++;
          results.push({ recipient: recipient.email, status: "sent", emailId: emailResult.data?.id });
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error processing email for ${recipient.email}:`, error);
        await supabase.from("email_logs").insert({
          recipient_email: recipient.email!,
          subject: finalSubject,
          body: finalBody,
          template_id: templateId || null,
          status: "failed",
          error_message: error.message,
          metadata: { bulk: true, filters, variables },
        });
        failedCount++;
        results.push({ recipient: recipient.email, status: "failed", error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Bulk email send completed`,
        summary: {
          total: recipients.length,
          sent: successCount,
          failed: failedCount,
          skipped: skippedCount,
        },
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-bulk-email function:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to send bulk email",
        details: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
