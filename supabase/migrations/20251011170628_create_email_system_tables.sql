/*
  # Email Management System Tables

  ## Overview
  This migration creates three essential tables for a comprehensive email notification system:
  1. email_templates - Store reusable email templates
  2. email_logs - Track all sent emails with delivery status
  3. user_email_preferences - Manage user notification preferences

  ## New Tables

  ### `email_templates`
  Stores customizable email templates for various notification types
  - `id` (uuid, primary key) - Unique template identifier
  - `name` (text) - Template display name
  - `subject` (text) - Email subject line with variable support
  - `body` (text) - Email HTML body with variable support
  - `category` (text) - Template category (welcome, reminder, overdue, etc.)
  - `variables` (jsonb) - Available template variables and descriptions
  - `is_active` (boolean) - Whether template is currently active
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `email_logs`
  Tracks all sent emails for auditing and analytics
  - `id` (uuid, primary key) - Unique log entry identifier
  - `recipient_email` (text) - Email address used
  - `subject` (text) - Email subject
  - `body` (text) - Email body content
  - `template_id` (uuid, nullable) - Reference to template if used
  - `status` (text) - Delivery status (sent, failed, pending)
  - `error_message` (text, nullable) - Error details if failed
  - `sent_at` (timestamptz) - When email was sent
  - `external_id` (text, nullable) - External email service ID (Resend)
  - `metadata` (jsonb, nullable) - Additional context data

  ### `user_email_preferences`
  Manages user notification preferences
  - `id` (uuid, primary key) - Unique preference record identifier
  - `user_email` (text) - User email address
  - `welcome_emails` (boolean) - Receive welcome emails
  - `reminder_emails` (boolean) - Receive key return reminders
  - `overdue_emails` (boolean) - Receive overdue notifications
  - `announcement_emails` (boolean) - Receive system announcements
  - `digest_frequency` (text) - Email frequency (immediate, daily, weekly)
  - `unsubscribed_at` (timestamptz, nullable) - Full unsubscribe timestamp
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - All tables have RLS enabled
  - Public access for reading active templates
  - Users can view their own email logs and manage their preferences
  - Service role can insert email logs for system-generated emails

  ## Indexes
  - email_logs indexed by sent_at and status for performance
  - user_email_preferences indexed by user_email for quick lookups
  - email_templates indexed by category and is_active
*/

-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  category text NOT NULL CHECK (category IN ('welcome', 'reminder', 'overdue', 'return_confirmation', 'announcement', 'security', 'custom')),
  variables jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  template_id uuid REFERENCES email_templates(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message text,
  sent_at timestamptz DEFAULT now(),
  external_id text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create user_email_preferences table
CREATE TABLE IF NOT EXISTS user_email_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text UNIQUE NOT NULL,
  welcome_emails boolean DEFAULT true,
  reminder_emails boolean DEFAULT true,
  overdue_emails boolean DEFAULT true,
  announcement_emails boolean DEFAULT true,
  digest_frequency text DEFAULT 'immediate' CHECK (digest_frequency IN ('immediate', 'daily', 'weekly', 'none')),
  unsubscribed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_user_email_prefs_email ON user_email_preferences(user_email);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);

-- Enable Row Level Security
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_email_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_templates

CREATE POLICY "Anyone can view active email templates"
  ON email_templates FOR SELECT
  USING (is_active = true);

CREATE POLICY "System can manage email templates"
  ON email_templates FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for email_logs

CREATE POLICY "Users can view their own email logs"
  ON email_logs FOR SELECT
  USING (recipient_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "System can insert email logs"
  ON email_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can view all email logs"
  ON email_logs FOR SELECT
  USING (true);

-- RLS Policies for user_email_preferences

CREATE POLICY "Users can view their own email preferences"
  ON user_email_preferences FOR SELECT
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can update their own email preferences"
  ON user_email_preferences FOR UPDATE
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email')
  WITH CHECK (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "System can create email preferences"
  ON user_email_preferences FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can view all email preferences"
  ON user_email_preferences FOR SELECT
  USING (true);

-- Insert default email templates

INSERT INTO email_templates (name, subject, body, category, variables) VALUES
(
  'Welcome Email',
  'Welcome to Key Management System - {{userName}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Key Management System</h1>
    </div>
    <div class="content">
      <h2>Hello {{userName}}!</h2>
      <p>Welcome to the Key Management System. Your account has been successfully created.</p>
      <p><strong>Your Role:</strong> {{userRole}}</p>
      <p><strong>User ID:</strong> {{userId}}</p>
      <p>You can now access keys through our system. Please keep your QR code handy for quick identification.</p>
      <div class="footer">
        <p>If you have any questions, please contact the system administrator.</p>
        <p>Key Management System - Secure • Efficient • Reliable</p>
      </div>
    </div>
  </div>
</body>
</html>',
  'welcome',
  '["userName", "userRole", "userId"]'::jsonb
),
(
  'Key Return Reminder',
  'Reminder: Key Return Due Soon - {{keyLabel}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .reminder-box { background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Key Return Reminder</h1>
    </div>
    <div class="content">
      <h2>Hello {{userName}},</h2>
      <div class="reminder-box">
        <h3>Your key return is due soon!</h3>
        <p><strong>Key:</strong> {{keyLabel}}</p>
        <p><strong>Location:</strong> {{keyLocation}}</p>
        <p><strong>Due Date:</strong> {{dueDate}}</p>
        <p><strong>Time Remaining:</strong> {{timeRemaining}}</p>
      </div>
      <p>Please return the key on time to avoid any overdue charges or penalties.</p>
      <div class="footer">
        <p>Thank you for using the Key Management System responsibly.</p>
        <p>Key Management System</p>
      </div>
    </div>
  </div>
</body>
</html>',
  'reminder',
  '["userName", "keyLabel", "keyLocation", "dueDate", "timeRemaining"]'::jsonb
),
(
  'System Announcement',
  '{{announcementTitle}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3b82f6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .announcement-box { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>System Announcement</h1>
    </div>
    <div class="content">
      <div class="announcement-box">
        <h2>{{announcementTitle}}</h2>
        <p>{{announcementBody}}</p>
      </div>
      <p><em>Posted on: {{date}}</em></p>
      <div class="footer">
        <p>Key Management System</p>
      </div>
    </div>
  </div>
</body>
</html>',
  'announcement',
  '["announcementTitle", "announcementBody", "date"]'::jsonb
);
