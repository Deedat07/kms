import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// This function runs as a cron job to check for overdue keys
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting overdue check cron job at:', new Date().toISOString())

    // Get all active records that are past due (UTC comparison)
    const now = new Date()
    const { data: activeOverdueRecords, error: activeError } = await supabase
      .from('issue_records')
      .select(`
        *,
        users (name, email, phone),
        keys (label, location)
      `)
      .eq('status', 'active')
      .lt('due_at', now.toISOString())

    if (activeError) {
      console.error('Error fetching active overdue records:', activeError)
      throw activeError
    }

    // Get records that are already overdue but within grace period
    const { data: overdueRecords, error: overdueError } = await supabase
      .from('issue_records')
      .select(`
        *,
        users (name, email, phone),
        keys (label, location)
      `)
      .eq('status', 'overdue')

    if (overdueError) {
      console.error('Error fetching overdue records:', overdueError)
      throw overdueError
    }

    const allOverdueRecords = [...(activeOverdueRecords || []), ...(overdueRecords || [])]
    console.log(`Found ${allOverdueRecords.length} overdue records to process`)

    const GRACE_PERIOD_DAYS = 3
    const ESCALATION_THRESHOLD_DAYS = 7

    const notifications = []
    const escalations = []

    for (const record of allOverdueRecords) {
      const dueDate = new Date(record.due_at)
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

      console.log(`Processing record ${record.id}: ${daysOverdue} days overdue, status: ${record.status}`)

      if (record.status === 'active' && daysOverdue >= 1) {
        // First alert - mark as overdue and send notification
        const auditEntry = {
          action: 'overdue_alert_sent',
          timestamp: now.toISOString(),
          system_action: true,
          notes: `First overdue alert sent - ${daysOverdue} days overdue`,
          grace_period_ends: new Date(now.getTime() + (GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000)).toISOString()
        }

        const updatedAuditTrail = [...(record.audit_trail || []), auditEntry]

        const { error: updateError } = await supabase
          .from('issue_records')
          .update({ 
            status: 'overdue',
            audit_trail: updatedAuditTrail,
            security_notes: `Overdue alert sent on ${now.toISOString()}`
          })
          .eq('id', record.id)

        if (updateError) {
          console.error(`Error updating record ${record.id}:`, updateError)
          continue
        }

        notifications.push({
          recordId: record.id,
          userName: record.users?.name,
          userEmail: record.users?.email,
          keyLabel: record.keys?.label,
          daysOverdue,
          alertType: 'first_overdue'
        })

        console.log(`Sent first overdue alert for record ${record.id}`)

      } else if (record.status === 'overdue' && daysOverdue >= ESCALATION_THRESHOLD_DAYS) {
        // Grace period expired - escalate
        const auditEntry = {
          action: 'escalated',
          timestamp: now.toISOString(),
          system_action: true,
          notes: `Auto-escalated: Grace period expired after ${daysOverdue} days overdue`,
          escalation_reason: 'grace_period_expired'
        }

        const updatedAuditTrail = [...(record.audit_trail || []), auditEntry]

        const { error: escalateError } = await supabase
          .from('issue_records')
          .update({ 
            status: 'escalated',
            audit_trail: updatedAuditTrail,
            security_notes: `Auto-escalated: Grace period expired after ${daysOverdue} days overdue`,
            is_locked: true
          })
          .eq('id', record.id)

        if (escalateError) {
          console.error(`Error escalating record ${record.id}:`, escalateError)
          continue
        }

        escalations.push({
          recordId: record.id,
          userName: record.users?.name,
          userEmail: record.users?.email,
          keyLabel: record.keys?.label,
          daysOverdue,
          escalationReason: 'grace_period_expired'
        })

        console.log(`Escalated record ${record.id} to security`)

        // Send security notification
        try {
          const securityResponse = await fetch(`${supabaseUrl}/functions/v1/security-notification`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              report: {
                id: record.id,
                user_info: {
                  name: record.users?.name || 'Unknown',
                  user_id: record.users?.user_id || 'Unknown',
                  role: record.users?.role || 'Unknown',
                  email: record.users?.email || 'Unknown',
                  phone: record.users?.phone || 'Unknown'
                },
                key_info: {
                  label: record.keys?.label || 'Unknown',
                  location: record.keys?.location || 'Unknown'
                },
                timeline: {
                  issued_at: record.issued_at || '',
                  due_at: record.due_at,
                  first_alert: '',
                  escalated_at: now.toISOString()
                },
                security_notes: record.security_notes || '',
                days_overdue: daysOverdue,
                risk_level: daysOverdue > 14 ? 'critical' : daysOverdue > 7 ? 'high' : 'medium'
              },
              escalated_record: record
            }),
          })

          if (!securityResponse.ok) {
            console.error(`Failed to send security notification for record ${record.id}`)
          } else {
            console.log(`Security notification sent for record ${record.id}`)
          }
        } catch (securityError) {
          console.error(`Error sending security notification for record ${record.id}:`, securityError)
        }

      } else if (record.status === 'overdue' && daysOverdue < ESCALATION_THRESHOLD_DAYS) {
        // Still within grace period - send reminder
        const gracePeriodEnd = new Date(dueDate.getTime() + (ESCALATION_THRESHOLD_DAYS * 24 * 60 * 60 * 1000))
        const daysUntilEscalation = Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        notifications.push({
          recordId: record.id,
          userName: record.users?.name,
          userEmail: record.users?.email,
          keyLabel: record.keys?.label,
          daysOverdue,
          alertType: 'grace_period_reminder',
          daysUntilEscalation
        })

        console.log(`Sent grace period reminder for record ${record.id}`)
      }
    }

    const summary = {
      processed: allOverdueRecords.length,
      firstAlerts: notifications.filter(n => n.alertType === 'first_overdue').length,
      reminders: notifications.filter(n => n.alertType === 'grace_period_reminder').length,
      escalations: escalations.length,
      timestamp: now.toISOString()
    }

    console.log('Cron job completed:', summary)

    return new Response(
      JSON.stringify({ 
        success: true, 
        summary,
        notifications,
        escalations
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in overdue cron job:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Cron job failed', 
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})