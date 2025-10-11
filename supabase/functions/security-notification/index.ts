import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { Resend } from 'npm:resend@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SecurityNotificationRequest {
  report: {
    id: string
    user_info: {
      name: string
      user_id: string
      role: string
      email: string
      phone: string
    }
    key_info: {
      label: string
      location: string
    }
    timeline: {
      issued_at: string
      due_at: string
      first_alert: string
      escalated_at: string
    }
    security_notes: string
    days_overdue: number
    risk_level: string
  }
  escalated_record: any
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { report, escalated_record }: SecurityNotificationRequest = await req.json()

    // Initialize Resend client with API key from environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }
    
    const resend = new Resend(resendApiKey)

    // Get security email from environment variable or use default
    const securityEmail = Deno.env.get('SECURITY_EMAIL') || 'security@yourdomain.com'

    // Create security notification email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>SECURITY ALERT - Key Management System</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .alert-box { background: #fef2f2; border: 2px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .info-section { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626; }
            .risk-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; text-transform: uppercase; }
            .risk-critical { background: #fef2f2; color: #dc2626; border: 2px solid #dc2626; }
            .risk-high { background: #fff7ed; color: #ea580c; border: 2px solid #ea580c; }
            .risk-medium { background: #fefce8; color: #ca8a04; border: 2px solid #ca8a04; }
            .timeline { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .timeline-item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 SECURITY ESCALATION ALERT</h1>
              <p>Key Management System - Immediate Action Required</p>
            </div>
            <div class="content">
              <div class="alert-box">
                <h2>⚠️ ESCALATED CASE NOTIFICATION</h2>
                <p><strong>Case ID:</strong> ${report.id}</p>
                <p><strong>Risk Level:</strong> <span class="risk-badge risk-${report.risk_level}">${report.risk_level} RISK</span></p>
                <p><strong>Days Overdue:</strong> ${report.days_overdue} days</p>
                <p><strong>Escalated:</strong> ${new Date(report.timeline.escalated_at).toLocaleString()}</p>
              </div>
              
              <div class="info-grid">
                <div class="info-section">
                  <h3>👤 User Information</h3>
                  <p><strong>Name:</strong> ${report.user_info.name}</p>
                  <p><strong>ID:</strong> ${report.user_info.user_id}</p>
                  <p><strong>Type:</strong> ${report.user_info.role}</p>
                  <p><strong>Email:</strong> ${report.user_info.email}</p>
                  <p><strong>Phone:</strong> ${report.user_info.phone}</p>
                </div>
                
                <div class="info-section">
                  <h3>🔑 Key Information</h3>
                  <p><strong>Key:</strong> ${report.key_info.label}</p>
                  <p><strong>Location:</strong> ${report.key_info.location}</p>
                  <p><strong>Security Risk:</strong> Unauthorized access possible</p>
                </div>
              </div>
              
              <div class="timeline">
                <h3>📅 Case Timeline</h3>
                <div class="timeline-item">
                  <strong>Key Issued:</strong> ${new Date(report.timeline.issued_at).toLocaleString()}
                </div>
                <div class="timeline-item">
                  <strong>Due Date:</strong> ${new Date(report.timeline.due_at).toLocaleString()}
                </div>
                <div class="timeline-item">
                  <strong>First Alert Sent:</strong> ${report.timeline.first_alert ? new Date(report.timeline.first_alert).toLocaleString() : 'N/A'}
                </div>
                <div class="timeline-item">
                  <strong>Escalated to Security:</strong> ${new Date(report.timeline.escalated_at).toLocaleString()}
                </div>
              </div>
              
              ${report.security_notes ? `
                <div class="info-section">
                  <h3>📝 Security Notes</h3>
                  <p>${report.security_notes}</p>
                </div>
              ` : ''}
              
              <div class="alert-box">
                <h3>🎯 REQUIRED ACTIONS</h3>
                <ul>
                  <li><strong>Immediate:</strong> Contact user to retrieve key</li>
                  <li><strong>Security Check:</strong> Verify key location security</li>
                  <li><strong>Documentation:</strong> Update case with findings</li>
                  <li><strong>Follow-up:</strong> Monitor for resolution</li>
                </ul>
              </div>
              
              <div class="footer">
                <p><strong>This is an automated security alert from the Key Management System</strong></p>
                <p>Please log into the admin dashboard to view full case details and update security notes.</p>
                <p>Key Management System - Security Division</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    // Send security notification email using Resend
    const emailResult = await resend.emails.send({
      from: 'Key Management System Security <deedat30112002@gmail.com>',
      to: securityEmail,
      subject: `🚨 SECURITY ESCALATION - ${report.risk_level.toUpperCase()} RISK - Case ${report.id.slice(0, 8)}`,
      html: emailHtml
    })

    if (emailResult.error) {
      console.error('Resend security email error:', emailResult.error)
      throw new Error(`Failed to send security notification: ${emailResult.error.message}`)
    }

    // Log the security notification
    console.log(`SECURITY NOTIFICATION SENT:`)
    console.log(`Case ID: ${report.id}`)
    console.log(`Risk Level: ${report.risk_level.toUpperCase()}`)
    console.log(`User: ${report.user_info.name} (${report.user_info.user_id})`)
    console.log(`Key: ${report.key_info.label} at ${report.key_info.location}`)
    console.log(`Days Overdue: ${report.days_overdue}`)
    console.log(`Email ID: ${emailResult.data?.id}`)
    console.log(`Sent to: ${securityEmail}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Security division notified successfully',
        case_id: report.id,
        risk_level: report.risk_level,
        notification_sent_at: new Date().toISOString(),
        emailId: emailResult.data?.id,
        sent_to: securityEmail
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error sending security notification:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send security notification',
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})