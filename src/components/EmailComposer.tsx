import React, { useState, useEffect } from 'react';
import { useEmailTemplates } from '../hooks/useEmailTemplates';
import { useUsers } from '../hooks/useUsers';
import { sendCustomEmail, sendBulkEmail } from '../lib/email';
import { X, Send, Users, User, Loader2, Mail, FileText, Eye } from 'lucide-react';

interface EmailComposerProps {
  onClose: () => void;
  preSelectedEmails?: string[];
}

export function EmailComposer({ onClose, preSelectedEmails = [] }: EmailComposerProps) {
  const { templates } = useEmailTemplates();
  const { users } = useUsers();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [emailType, setEmailType] = useState<'individual' | 'bulk'>('individual');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedEmails, setSelectedEmails] = useState<string[]>(preSelectedEmails);
  const [filterRoles, setFilterRoles] = useState<string[]>([]);
  const [variables, setVariables] = useState<Record<string, string>>({});

  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate);
      if (template) {
        setSubject(template.subject);
        setBody(template.body);
        const vars: Record<string, string> = {};
        template.variables.forEach(v => {
          vars[v] = '';
        });
        setVariables(vars);
      }
    }
  }, [selectedTemplate, templates]);

  const handleSend = async () => {
    if (!subject || !body) {
      setError('Please provide both subject and body');
      return;
    }

    if (emailType === 'individual' && selectedEmails.length === 0) {
      setError('Please select at least one recipient');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (emailType === 'individual') {
        const result = await sendCustomEmail({
          to: selectedEmails,
          subject,
          body,
          templateId: selectedTemplate || undefined,
          variables,
        });

        if (result.success) {
          setSuccess(true);
          setTimeout(() => {
            onClose();
          }, 2000);
        } else {
          setError(result.error || 'Failed to send email');
        }
      } else {
        const result = await sendBulkEmail({
          subject,
          body,
          templateId: selectedTemplate || undefined,
          filters: {
            roles: filterRoles.length > 0 ? filterRoles : undefined,
          },
          variables,
        });

        if (result.success) {
          setSuccess(true);
          setTimeout(() => {
            onClose();
          }, 2000);
        } else {
          setError(result.error || 'Failed to send bulk email');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailToggle = (email: string) => {
    if (selectedEmails.includes(email)) {
      setSelectedEmails(selectedEmails.filter(e => e !== email));
    } else {
      setSelectedEmails([...selectedEmails, email]);
    }
  };

  const handleRoleToggle = (role: string) => {
    if (filterRoles.includes(role)) {
      setFilterRoles(filterRoles.filter(r => r !== role));
    } else {
      setFilterRoles([...filterRoles, role]);
    }
  };

  const getPreviewContent = () => {
    let previewSubject = subject;
    let previewBody = body;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      previewSubject = previewSubject.replace(regex, value || `[${key}]`);
      previewBody = previewBody.replace(regex, value || `[${key}]`);
    });

    return { subject: previewSubject, body: previewBody };
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
          <div className="text-center p-8">
            <div className="mx-auto h-16 w-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
              <Send className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Sent Successfully!</h2>
            <p className="text-gray-600">
              {emailType === 'individual'
                ? `Email sent to ${selectedEmails.length} recipient(s)`
                : 'Bulk email sent successfully'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const preview = getPreviewContent();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Mail className="h-5 w-5 mr-2 text-blue-600" />
            Compose Email
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setEmailType('individual')}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition ${
                emailType === 'individual'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <User className="h-5 w-5 inline mr-2" />
              Individual Email
            </button>
            <button
              onClick={() => setEmailType('bulk')}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition ${
                emailType === 'bulk'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Users className="h-5 w-5 inline mr-2" />
              Bulk Email
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-1" />
              Email Template (Optional)
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">No template - Write custom email</option>
              {templates.filter(t => t.is_active).map(template => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.category})
                </option>
              ))}
            </select>
          </div>

          {emailType === 'individual' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Recipients ({selectedEmails.length} selected)
              </label>
              <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                {users.filter(u => u.email).map(user => (
                  <label key={user.id} className="flex items-center py-2 hover:bg-gray-50 px-2 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedEmails.includes(user.email!)}
                      onChange={() => handleEmailToggle(user.email!)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-sm text-gray-500 ml-2">({user.role})</span>
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {emailType === 'bulk' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Role (All users if none selected)
              </label>
              <div className="flex gap-3">
                {['student', 'lecturer', 'cleaner'].map(role => (
                  <label key={role} className="flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={filterRoles.includes(role)}
                      onChange={() => handleRoleToggle(role)}
                      className="mr-2"
                    />
                    <span className="capitalize">{role}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {selectedTemplate && Object.keys(variables).length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Variables
              </label>
              <div className="grid grid-cols-2 gap-4">
                {Object.keys(variables).map(varName => (
                  <div key={varName}>
                    <label className="block text-xs text-gray-600 mb-1">{varName}</label>
                    <input
                      type="text"
                      value={variables[varName]}
                      onChange={(e) => setVariables({ ...variables, [varName]: e.target.value })}
                      placeholder={`Enter ${varName}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter email body (HTML supported)"
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200 flex items-center"
            >
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={loading}
              className="flex-1 flex justify-center items-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </button>
          </div>

          {showPreview && (
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold text-gray-900 mb-2">Email Preview</h4>
              <div className="mb-3">
                <span className="text-sm font-medium text-gray-700">Subject: </span>
                <span className="text-sm text-gray-900">{preview.subject}</span>
              </div>
              <div className="border border-gray-200 rounded bg-white p-4 max-h-96 overflow-y-auto">
                <div dangerouslySetInnerHTML={{ __html: preview.body }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
