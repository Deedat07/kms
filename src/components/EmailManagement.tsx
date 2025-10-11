import React, { useState } from 'react';
import { EmailComposer } from './EmailComposer';
import { EmailTemplateManager } from './EmailTemplateManager';
import { EmailHistory } from './EmailHistory';
import { Mail, FileText, History, Send } from 'lucide-react';

type Tab = 'compose' | 'templates' | 'history';

export function EmailManagement() {
  const [activeTab, setActiveTab] = useState<Tab>('compose');
  const [showComposer, setShowComposer] = useState(false);

  const tabs = [
    { id: 'compose' as Tab, label: 'Compose Email', icon: Send },
    { id: 'templates' as Tab, label: 'Email Templates', icon: FileText },
    { id: 'history' as Tab, label: 'Email History', icon: History },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Mail className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Email Management</h1>
        </div>
        <p className="text-gray-600">
          Send emails to users, manage templates, and view email history
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center py-4 px-1 border-b-2 font-medium text-sm transition
                    ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'compose' && (
            <div>
              <div className="text-center py-12">
                <Mail className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Send Email to Users
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Compose and send emails to individual users or bulk email to multiple recipients based on filters
                </p>
                <button
                  onClick={() => setShowComposer(true)}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
                >
                  <Send className="h-5 w-5 mr-2" />
                  Compose New Email
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 border-t border-gray-200 pt-8">
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Send className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Individual Emails</h4>
                  <p className="text-sm text-gray-600">
                    Send personalized emails to specific users with custom content
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <Mail className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Bulk Emails</h4>
                  <p className="text-sm text-gray-600">
                    Send announcements to all users or filter by role for targeted communication
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-orange-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Use Templates</h4>
                  <p className="text-sm text-gray-600">
                    Save time by using pre-built email templates with variable support
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'templates' && <EmailTemplateManager />}
          {activeTab === 'history' && <EmailHistory />}
        </div>
      </div>

      {showComposer && (
        <EmailComposer onClose={() => setShowComposer(false)} />
      )}
    </div>
  );
}
