import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GRACE_PERIOD_DAYS = 3; // Grace period after first alert
const ESCALATION_THRESHOLD_DAYS = 7; // Total days before escalation

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all active records that are past due
    const { data: activeOverdueRecords, error: activeError } = await supabase
      .from('issue_records')
      .select(`
        *,
        users (name, email, phone),
        keys (label, location)
      `)
      .eq('status', 'active')
      .lt('due_at', new Date().toISOString())

    if (activeError) throw activeError

    // Get records that are already overdue but within grace period
    const { data: overdueRecords, error: overdueError } = await supabase
      .from('issue_records')
      .select(`
        *,
        users (name, email, phone),
        keys (label, location)
      `)
      .eq('status', 'overdue')
      .lt('due_at', new Date().toISOString())

    if (overdueError) throw overdueError

    const allOverdueRecords = [...(activeOverdueRecords || []), ...(overdueRecords || [])]

    const notifications = []
    const escalations = []

    for (const record of allOverdueRecords) {
      const dueDate = new Date(record.due_at)
      const now = new Date()
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

      // Decision Branch Logic
      if (record.status === 'active' && daysOverdue >= 1) {
        // First alert - mark as overdue and send notification
        const auditEntry = {
          action: 'overdue_alert_sent',
          timestamp: new Date().toISOString(),
          system_action: true,
          notes: `First overdue alert sent - ${daysOverdue} days overdue`,
          grace_period_ends: new Date(now.getTime() + (GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000)).toISOString()
        }

        const updatedAuditTrail = [...(record.audit_trail || []), auditEntry]

        await supabase
          .from('issue_records')
          .update({ 
            status: 'overdue',
            audit_trail: updatedAuditTrail,
            security_notes: `Overdue alert sent on ${now.toISOString()}`
          })
          .eq('id', record.id)

        notifications.push({
          recordId: record.id,
          userName: record.users?.name,
          userEmail: record.users?.email,
          keyLabel: record.keys?.label,
          daysOverdue,
          alertType: 'first_overdue',
          gracePeriodEnds: new Date(now.getTime() + (GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000)).toISOString()
        })

      } else if (record.status === 'overdue' && daysOverdue >= ESCALATION_THRESHOLD_DAYS) {
        // Grace period expired - escalate
        const auditEntry = {
          action: 'escalated',
          timestamp: new Date().toISOString(),
          system_action: true,
          notes: `Auto-escalated: Grace period expired after ${daysOverdue} days overdue`,
          escalation_reason: 'grace_period_expired'
        }

        const updatedAuditTrail = [...(record.audit_trail || []), auditEntry]

        await supabase
          .from('issue_records')
          .update({ 
            status: 'escalated',
            audit_trail: updatedAuditTrail,
            security_notes: `Auto-escalated: Grace period expired after ${daysOverdue} days overdue`
          })
          .eq('id', record.id)

        escalations.push({
          recordId: record.id,
          userName: record.users?.name,
          userEmail: record.users?.email,
          keyLabel: record.keys?.label,
          daysOverdue,
          escalationReason: 'grace_period_expired'
        })

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
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsSent: notifications.length,
        escalationsSent: escalations.length,
        notifications,
        escalations,
        summary: {
          firstAlerts: notifications.filter(n => n.alertType === 'first_overdue').length,
          reminders: notifications.filter(n => n.alertType === 'grace_period_reminder').length,
          escalations: escalations.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error processing overdue notifications:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process overdue notifications' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})