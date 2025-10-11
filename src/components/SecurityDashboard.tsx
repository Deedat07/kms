import React, { useState, useEffect } from 'react';
import { useIssueRecords } from '../hooks/useIssueRecords';
import { supabase } from '../lib/supabase';
import { 
  Shield, 
  AlertTriangle, 
  Lock, 
  User, 
  Key, 
  Calendar,
  Clock,
  FileText,
  Download,
  Mail,
  Eye,
  MessageSquare,
  Loader2
} from 'lucide-react';

interface SecurityReport {
  id: string;
  user_info: {
    name: string;
    user_id: string;
    role: string;
    email: string;
    phone: string;
  };
  key_info: {
    label: string;
    location: string;
  };
  timeline: {
    issued_at: string;
    due_at: string;
    first_alert: string;
    escalated_at: string;
  };
  security_notes: string;
  days_overdue: number;
  risk_level: 'medium' | 'high' | 'critical';
}

export function SecurityDashboard() {
  const { records } = useIssueRecords();
  const [escalatedRecords, setEscalatedRecords] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [securityNotes, setSecurityNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [updatingNotes, setUpdatingNotes] = useState(false);

  useEffect(() => {
    const escalated = records.filter(record => record.status === 'escalated');
    setEscalatedRecords(escalated);
  }, [records]);

  const generateSecurityReport = (record: any): SecurityReport => {
    const dueDate = new Date(record.due_at);
    const now = new Date();
    const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Extract alert timestamps from audit trail
    const auditTrail = record.audit_trail || [];
    const firstAlert = auditTrail.find((entry: any) => entry.action === 'overdue_alert_sent');
    const escalation = auditTrail.find((entry: any) => entry.action === 'escalated');

    return {
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
        first_alert: firstAlert?.timestamp || '',
        escalated_at: escalation?.timestamp || ''
      },
      security_notes: record.security_notes || '',
      days_overdue: daysOverdue,
      risk_level: daysOverdue > 14 ? 'critical' : daysOverdue > 7 ? 'high' : 'medium'
    };
  };

  const updateSecurityNotes = async (recordId: string, notes: string) => {
    setUpdatingNotes(true);
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) throw new Error('Not authenticated');

      // Get current record to update audit trail
      const { data: currentRecord, error: fetchError } = await supabase
        .from('issue_records')
        .select('audit_trail')
        .eq('id', recordId)
        .single();

      if (fetchError) throw fetchError;

      const auditEntry = {
        action: 'security_notes_updated',
        timestamp: new Date().toISOString(),
        admin_id: authUser.user.id,
        notes: 'Security notes updated by admin'
      };

      const updatedAuditTrail = [...(currentRecord.audit_trail || []), auditEntry];

      const { error } = await supabase
        .from('issue_records')
        .update({
          security_notes: notes,
          audit_trail: updatedAuditTrail
        })
        .eq('id', recordId);

      if (error) throw error;

      // Update local state
      setEscalatedRecords(prev => 
        prev.map(record => 
          record.id === recordId 
            ? { ...record, security_notes: notes, audit_trail: updatedAuditTrail }
            : record
        )
      );

      setSecurityNotes('');
      setSelectedRecord(null);
    } catch (error) {
      console.error('Error updating security notes:', error);
      alert('Failed to update security notes. Please try again.');
    } finally {
      setUpdatingNotes(false);
    }
  };

  const exportSecurityReport = (record: any) => {
    const report = generateSecurityReport(record);
    const reportData = {
      'Case ID': report.id,
      'User Name': report.user_info.name,
      'User ID': report.user_info.user_id,
      'User Type': report.user_info.role,
      'Email': report.user_info.email,
      'Phone': report.user_info.phone,
      'Key Label': report.key_info.label,
      'Key Location': report.key_info.location,
      'Issued Date': new Date(report.timeline.issued_at).toLocaleDateString(),
      'Due Date': new Date(report.timeline.due_at).toLocaleDateString(),
      'First Alert': report.timeline.first_alert ? new Date(report.timeline.first_alert).toLocaleDateString() : 'N/A',
      'Escalated Date': report.timeline.escalated_at ? new Date(report.timeline.escalated_at).toLocaleDateString() : 'N/A',
      'Days Overdue': report.days_overdue,
      'Risk Level': report.risk_level.toUpperCase(),
      'Security Notes': report.security_notes || 'None'
    };

    const csvContent = [
      Object.keys(reportData).join(','),
      Object.values(reportData).map(value => `"${value}"`).join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-report-${report.id}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const notifySecurityDivision = async (record: any) => {
    setLoading(true);
    try {
      const report = generateSecurityReport(record);
      
      // Call edge function to send security notification
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/security-notification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report,
          escalated_record: record
        }),
      });

      if (response.ok) {
        alert('Security division has been notified successfully.');
      } else {
        throw new Error('Failed to notify security division');
      }
    } catch (error) {
      console.error('Error notifying security:', error);
      alert('Failed to notify security division. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSecurityStats = () => {
    const reports = escalatedRecords.map(generateSecurityReport);
    return {
      total: reports.length,
      critical: reports.filter(r => r.risk_level === 'critical').length,
      high: reports.filter(r => r.risk_level === 'high').length,
      medium: reports.filter(r => r.risk_level === 'medium').length,
      avgDaysOverdue: reports.length > 0 
        ? Math.round(reports.reduce((sum, r) => sum + r.days_overdue, 0) / reports.length)
        : 0
    };
  };

  const stats = getSecurityStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Security Dashboard</h2>
              <p className="text-gray-600 mt-1">Escalated cases requiring security intervention</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <span className="text-sm font-medium text-red-700">
                {stats.total} Active Cases
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Critical Risk</p>
              <p className="text-2xl font-bold text-gray-900">{stats.critical}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">High Risk</p>
              <p className="text-2xl font-bold text-gray-900">{stats.high}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Medium Risk</p>
              <p className="text-2xl font-bold text-gray-900">{stats.medium}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Days Overdue</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgDaysOverdue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Escalated Cases */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Lock className="h-5 w-5 mr-2 text-red-600" />
            Escalated Security Cases
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {escalatedRecords.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No escalated cases at this time</p>
              <p className="text-sm text-gray-400 mt-1">All security issues have been resolved</p>
            </div>
          ) : (
            escalatedRecords.map((record) => {
              const report = generateSecurityReport(record);
              return (
                <div key={record.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getRiskLevelColor(report.risk_level)}`}>
                            {report.risk_level.toUpperCase()} RISK
                          </span>
                          <span className="text-sm text-gray-500">
                            Case ID: {record.id.slice(0, 8)}
                          </span>
                          <Lock className="h-4 w-4 text-red-500" title="Record Locked" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            User Information
                          </h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p><strong>Name:</strong> {report.user_info.name}</p>
                            <p><strong>ID:</strong> {report.user_info.user_id}</p>
                            <p><strong>Type:</strong> {report.user_info.role}</p>
                            <p><strong>Email:</strong> {report.user_info.email}</p>
                            <p><strong>Phone:</strong> {report.user_info.phone}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                            <Key className="h-4 w-4 mr-1" />
                            Key Information
                          </h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p><strong>Key:</strong> {report.key_info.label}</p>
                            <p><strong>Location:</strong> {report.key_info.location}</p>
                            <p><strong>Days Overdue:</strong> {report.days_overdue}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Timeline
                          </h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p><strong>Issued:</strong> {new Date(report.timeline.issued_at).toLocaleDateString()}</p>
                            <p><strong>Due:</strong> {new Date(report.timeline.due_at).toLocaleDateString()}</p>
                            <p><strong>First Alert:</strong> {report.timeline.first_alert ? new Date(report.timeline.first_alert).toLocaleDateString() : 'N/A'}</p>
                            <p><strong>Escalated:</strong> {report.timeline.escalated_at ? new Date(report.timeline.escalated_at).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                      
                      {report.security_notes && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                          <h5 className="font-medium text-yellow-800 mb-1 flex items-center">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Security Notes
                          </h5>
                          <p className="text-sm text-yellow-700">{report.security_notes}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-6">
                      <button
                        onClick={() => {
                          setSelectedRecord(record);
                          setSecurityNotes(record.security_notes || '');
                        }}
                        className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Add Notes
                      </button>
                      
                      <button
                        onClick={() => exportSecurityReport(record)}
                        className="flex items-center px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </button>
                      
                      <button
                        onClick={() => notifySecurityDivision(record)}
                        disabled={loading}
                        className="flex items-center px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition duration-200"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Mail className="h-4 w-4 mr-1" />
                        )}
                        Notify Security
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Security Notes Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Security Notes
              </h3>
              <button
                onClick={() => {
                  setSelectedRecord(null);
                  setSecurityNotes('');
                }}
                className="text-gray-400 hover:text-gray-500 transition duration-200"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Case: {selectedRecord.users?.name} - {selectedRecord.keys?.label}
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">
                    <Lock className="h-4 w-4 inline mr-1" />
                    This record is locked. Only security notes can be modified.
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Security Notes
                </label>
                <textarea
                  value={securityNotes}
                  onChange={(e) => setSecurityNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Add security notes for this escalated case..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setSelectedRecord(null);
                    setSecurityNotes('');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateSecurityNotes(selectedRecord.id, securityNotes)}
                  disabled={updatingNotes}
                  className="flex-1 flex justify-center items-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition duration-200"
                >
                  {updatingNotes ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Notes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}