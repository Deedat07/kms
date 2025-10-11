import React, { useState } from 'react';
import { useEmailTemplates, EmailTemplate } from '../hooks/useEmailTemplates';
import { X, Plus, Edit, Trash2, Power, PowerOff, Loader2, FileText, Eye } from 'lucide-react';

export function EmailTemplateManager() {
  const { templates, loading, createTemplate, updateTemplate, deleteTemplate, toggleTemplateStatus } = useEmailTemplates();
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showPreview, setShowPreview] = useState<EmailTemplate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<EmailTemplate | null>(null);

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleDelete = async (template: EmailTemplate) => {
    const { error } = await deleteTemplate(template.id);
    if (!error) {
      setDeleteConfirm(null);
    } else {
      alert('Failed to delete template');
    }
  };

  const handleToggleStatus = async (template: EmailTemplate) => {
    await toggleTemplateStatus(template.id, !template.is_active);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Email Templates</h2>
        <button
          onClick={() => {
            setEditingTemplate(null);
            setShowForm(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map(template => (
          <div
            key={template.id}
            className={`bg-white rounded-xl shadow-sm border p-6 ${
              template.is_active ? 'border-gray-200' : 'border-gray-300 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    template.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                  {template.category}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Subject:</p>
              <p className="text-sm text-gray-600">{template.subject}</p>
            </div>

            {template.variables.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-1">Variables:</p>
                <div className="flex flex-wrap gap-2">
                  {template.variables.map(variable => (
                    <span key={variable} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded font-mono">
                      {`{{${variable}}}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowPreview(template)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center justify-center"
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </button>
              <button
                onClick={() => handleEdit(template)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center justify-center"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </button>
              <button
                onClick={() => handleToggleStatus(template)}
                className={`px-3 py-2 text-sm rounded-lg transition flex items-center justify-center ${
                  template.is_active
                    ? 'border border-orange-300 text-orange-700 hover:bg-orange-50'
                    : 'border border-green-300 text-green-700 hover:bg-green-50'
                }`}
              >
                {template.is_active ? (
                  <PowerOff className="h-4 w-4" />
                ) : (
                  <Power className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => setDeleteConfirm(template)}
                className="px-3 py-2 text-sm border border-red-300 rounded-lg text-red-700 hover:bg-red-50 transition flex items-center justify-center"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No templates found. Create your first template!</p>
        </div>
      )}

      {showForm && (
        <TemplateForm
          template={editingTemplate}
          onClose={() => {
            setShowForm(false);
            setEditingTemplate(null);
          }}
          onSave={async (data) => {
            if (editingTemplate) {
              await updateTemplate(editingTemplate.id, data);
            } else {
              await createTemplate(data as any);
            }
            setShowForm(false);
            setEditingTemplate(null);
          }}
        />
      )}

      {showPreview && (
        <TemplatePreview
          template={showPreview}
          onClose={() => setShowPreview(null)}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Template</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface TemplateFormProps {
  template: EmailTemplate | null;
  onClose: () => void;
  onSave: (data: Partial<EmailTemplate>) => Promise<void>;
}

function TemplateForm({ template, onClose, onSave }: TemplateFormProps) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    subject: template?.subject || '',
    body: template?.body || '',
    category: template?.category || 'custom' as EmailTemplate['category'],
    variables: template?.variables || [],
    is_active: template?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [newVariable, setNewVariable] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  const addVariable = () => {
    if (newVariable && !formData.variables.includes(newVariable)) {
      setFormData({
        ...formData,
        variables: [...formData.variables, newVariable],
      });
      setNewVariable('');
    }
  };

  const removeVariable = (variable: string) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter(v => v !== variable),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">
            {template ? 'Edit Template' : 'Create Template'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as EmailTemplate['category'] })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="welcome">Welcome</option>
              <option value="reminder">Reminder</option>
              <option value="overdue">Overdue</option>
              <option value="return_confirmation">Return Confirmation</option>
              <option value="announcement">Announcement</option>
              <option value="security">Security</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Use {{variableName}} for dynamic content"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Body (HTML)</label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Use {{variableName}} for dynamic content"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Template Variables</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newVariable}
                onChange={(e) => setNewVariable(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVariable())}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Variable name (e.g., userName)"
              />
              <button
                type="button"
                onClick={addVariable}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.variables.map(variable => (
                <span key={variable} className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm">
                  {`{{${variable}}}`}
                  <button
                    type="button"
                    onClick={() => removeVariable(variable)}
                    className="ml-2 text-blue-500 hover:text-blue-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="mr-2"
            />
            <label className="text-sm text-gray-700">Active (available for use)</label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 inline mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Template'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface TemplatePreviewProps {
  template: EmailTemplate;
  onClose: () => void;
}

function TemplatePreview({ template, onClose }: TemplatePreviewProps) {
  const [variables, setVariables] = useState<Record<string, string>>({});

  const getPreviewContent = () => {
    let previewSubject = template.subject;
    let previewBody = template.body;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      previewSubject = previewSubject.replace(regex, value || `[${key}]`);
      previewBody = previewBody.replace(regex, value || `[${key}]`);
    });

    return { subject: previewSubject, body: previewBody };
  };

  const preview = getPreviewContent();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">Template Preview - {template.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {template.variables.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Fill in variables to preview:</h4>
              <div className="grid grid-cols-2 gap-4">
                {template.variables.map(varName => (
                  <div key={varName}>
                    <label className="block text-sm text-gray-600 mb-1">{varName}</label>
                    <input
                      type="text"
                      value={variables[varName] || ''}
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
            <h4 className="font-medium text-gray-900 mb-2">Subject:</h4>
            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{preview.subject}</p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Email Body:</h4>
            <div className="border border-gray-200 rounded-lg bg-white p-6 max-h-96 overflow-y-auto">
              <div dangerouslySetInnerHTML={{ __html: preview.body }} />
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
