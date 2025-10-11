import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  X, 
  User, 
  Key, 
  Calendar, 
  Clock, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Shield,
  Download,
  Eye,
  MapPin,
  Phone,
  Mail,
  Hash
} from 'lucide-react';

interface IssueRecordDetailProps {
  recordId: string;
  onClose: () => void;
}

interface DetailedRecord {
  id: string;
  user_id: string;
  admin_id: string;
  key_id: string;
  issued_at: string;
  due_at: string;
  returned_at: string | null;
  status: string;
  audit_trail: any[];
  security_notes: string | null;
  is_locked: boolean;
  created_at: string;
  users: {
    name: string;
    role: string;
    user_id: string;
    email: string;
    phone: string;
    qr_code: string;
    id_card_url: string;
  };
  keys: {
    label: string;
    location: string;
  };
  admins: {
    name: string;
    staff_id: string;
  };
}

export function IssueRecordDetail({ recordId, onClose }: IssueRecordDetailProps) {
  const [record, setRecord] = useState<DetailedRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecordDetails();
  }, [recordId]);

  const fetchRecordDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('issue_records')
        .select(`
          *,
          users (name, role, user_id, email, phone, qr_code, id_card_url),
          keys (label, location),
          admins (name, staff_id)
        `)
        .eq('id', recordId)
        .single();

      if (error) throw error;
      setRecord(data);
    } catch (error) {
      console.error('Error fetching record details:', error);
      setError('Failed to load record details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'escalated':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'closed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4" />;
      case 'escalated':
        return <Shield className="h-4 w-4" />;
      case 'closed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      full: date.toLocaleString()
    };
  };

  const calculateDuration = () => {
    if (!record) return null;
    
    const startDate = new Date(record.issued_at);
    const endDate = record.returned_at ? new Date(record.returned_at) : new Date();
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const exportRecordDetails = () => {
    if (!record) return;

    const exportData = {
      'Record ID': record.id,
      'User Name': record.users.name,
      'User ID': record.users.user_id,
      'User Type': record.users.role,
      'User Email': record.users.email,
      'User Phone': record.users.phone,
      'Key Label': record.keys.label,
      'Key Location': record.keys.location,
      'Issued Date': formatDateTime(record.issued_at).full,
      'Due Date': formatDateTime(record.due_at).full,
      'Returned Date': record.returned_at ? formatDateTime(record.returned_at).full : 'Not Returned',
      'Status': record.status,
      'Duration (Days)': calculateDuration(),
      'Admin': record.admins?.name || 'Unknown',
      'Security Notes': record.security_notes || 'None',
      'Is Locked': record.is_locked ? 'Yes' : 'No'
    };

    const csvContent = [
      Object.keys(exportData).join(','),
      Object.values(exportData).map(value => `"${value}"`).join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `issue-record-${record.id}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-4 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-gray-600">Loading record details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Record</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-indigo-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Issue Record Details</h3>
            {record.is_locked && (
              <div className="ml-3 flex items-center px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Locked
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportRecordDetails}
              className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Record Overview */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Record Overview</h4>
              <div className={`flex items-center px-3 py-1 rounded-full border ${getStatusColor(record.status)}`}>
                {getStatusIcon(record.status)}
                <span className="ml-2 font-medium capitalize">{record.status}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-white rounded-lg">
                <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-sm text-gray-600">Issued</div>
                <div className="font-semibold">{formatDateTime(record.issued_at).date}</div>
                <div className="text-xs text-gray-500">{formatDateTime(record.issued_at).time}</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-sm text-gray-600">Due</div>
                <div className="font-semibold">{formatDateTime(record.due_at).date}</div>
                <div className="text-xs text-gray-500">{formatDateTime(record.due_at).time}</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-sm text-gray-600">Duration</div>
                <div className="font-semibold">{calculateDuration()} days</div>
                <div className="text-xs text-gray-500">
                  {record.returned_at ? 'Completed' : 'Ongoing'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Information */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                User Information
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Name:
                  </span>
                  <span className="font-medium">{record.users.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <Hash className="h-4 w-4 mr-2" />
                    ID:
                  </span>
                  <span className="font-medium font-mono">{record.users.user_id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    record.users.role === 'student' ? 'bg-blue-100 text-blue-800' :
                    record.users.role === 'lecturer' ? 'bg-green-100 text-green-800' :
                    record.users.role === 'cleaner' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {record.users.role.charAt(0).toUpperCase() + record.users.role.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Email:
                  </span>
                  <span className="font-medium">{record.users.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    Phone:
                  </span>
                  <span className="font-medium">{record.users.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">QR Code:</span>
                  <span className="font-medium font-mono text-xs">{record.users.qr_code}</span>
                </div>
                {record.users.id_card_url && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">ID Card:</span>
                    <a 
                      href={record.users.id_card_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-indigo-600 hover:text-indigo-500 text-sm underline"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Key Information */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Key className="h-5 w-5 mr-2 text-green-600" />
                Key Information
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <Key className="h-4 w-4 mr-2" />
                    Label:
                  </span>
                  <span className="font-medium">{record.keys.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Location:
                  </span>
                  <span className="font-medium">{record.keys.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Admin:</span>
                  <span className="font-medium">{record.admins?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Staff ID:</span>
                  <span className="font-medium font-mono">{record.admins?.staff_id || 'N/A'}</span>
                </div>
              </div>

              {/* Security Notes */}
              {record.security_notes && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h5 className="font-medium text-yellow-800 mb-2 flex items-center">
                    <Shield className="h-4 w-4 mr-1" />
                    Security Notes
                  </h5>
                  <p className="text-sm text-yellow-700">{record.security_notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Full Audit Trail */}
          <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-purple-600" />
              Complete Audit Trail
            </h4>
            <div className="space-y-4">
              {record.audit_trail && record.audit_trail.length > 0 ? (
                record.audit_trail.map((entry, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-indigo-600">{index + 1}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-gray-900 capitalize">
                          {entry.action.replace('_', ' ')}
                        </h5>
                        <span className="text-sm text-gray-500">
                          {formatDateTime(entry.timestamp).full}
                        </span>
                      </div>
                      {entry.notes && (
                        <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                      )}
                      {entry.admin_id && (
                        <p className="text-xs text-gray-500 mt-1">
                          Admin ID: {entry.admin_id}
                        </p>
                      )}
                      {entry.system_action && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                          System Action
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No audit trail available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}