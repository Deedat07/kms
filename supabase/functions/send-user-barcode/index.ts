import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { Resend } from 'npm:resend@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  userName: string
  userType: string
  barcode: string
  barcodeImageUrl: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, userName, userType, barcode, barcodeImageUrl }: EmailRequest = await req.json()

    // Initialize Resend client with API key from environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }
    
    const resend = new Resend(resendApiKey)

    // Create email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Your Key Management System ID</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .barcode-section { text-align: center; margin: 30px 0; padding: 20px; background: white; border-radius: 8px; }
            .barcode-code { font-family: monospace; font-size: 18px; font-weight: bold; color: #4f46e5; margin-top: 10px; }
            .instructions { background: #e0e7ff; padding: 20px; border-radius: 8px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔑 Key Management System</h1>
              <p>Your Digital ID Card</p>
            </div>
            <div class="content">
              <h2>Hello ${userName}!</h2>
              <p>Welcome to the Key Management System. Your account has been successfully registered as a <strong>${userType}</strong>.</p>
              
              <div class="barcode-section">
                <h3>Your Unique ID Barcode</h3>
                <img src="${barcodeImageUrl}" alt="Your barcode" style="max-width: 300px; height: auto;">
                <div class="barcode-code">${barcode}</div>
              </div>
              
              <div class="instructions">
                <h4>📱 How to use your barcode:</h4>
                <ul>
                  <li><strong>Save this email</strong> - Keep it accessible on your phone</li>
                  <li><strong>Show for key requests</strong> - Present this barcode when requesting keys</li>
                  <li><strong>Key returns</strong> - Show this barcode when returning keys</li>
                  <li><strong>Verification</strong> - Admin will scan this barcode to verify your identity</li>
                </ul>
              </div>
              
              <p><strong>Important:</strong> This barcode is unique to you and should not be shared with others. It serves as your digital identification within the key management system.</p>
              
              <div class="footer">
                <p>If you have any questions, please contact the system administrator.</p>
                <p>Key Management System - Secure • Efficient • Reliable</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    // Send email using Resend
    const emailResult = await resend.emails.send({
      from: 'Key Management System <deedat30112002@gmail.com>',
      to: to,
      subject: `Your Key Management System ID - ${userType.charAt(0).toUpperCase() + userType.slice(1)}`,
      html: emailHtml
    })

    if (emailResult.error) {
      console.error('Resend email error:', emailResult.error)
      throw new Error(`Failed to send email: ${emailResult.error.message}`)
    }

    console.log(`Email sent successfully to: ${to}`)
    console.log(`Email ID: ${emailResult.data?.id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Barcode email sent successfully',
        emailId: emailResult.data?.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error sending barcode email:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send barcode email',
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})