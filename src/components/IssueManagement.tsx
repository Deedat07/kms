import React, { useState } from 'react';
import { useIssueRecords } from '../hooks/useIssueRecords';
import { IssueKeyForm } from './IssueKeyForm';
import { ReturnKeyModal } from './ReturnKeyModal';
import { CountdownTimer } from './CountdownTimer';
import { IssueRecordDetail } from './IssueRecordDetail';
import { SearchFilters } from './AdvancedSearch';
import { 
  Plus, 
  Search, 
  Key, 
  User, 
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
  Loader2,
  ArrowLeft,
  Lock,
  Eye,
  Download
} from 'lucide-react';

interface IssueManagementProps {
  searchFilters?: SearchFilters | null;
}

export function IssueManagement({ searchFilters }: IssueManagementProps) {
  const { records, loading } = useIssueRecords();
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [selectedDetailRecord, setSelectedDetailRecord] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Apply advanced search filters
  const filteredRecords = records.filter(record => {
    let matchesSearch = true;
    let matchesAdvancedFilters = true;

    // Basic search
    if (searchTerm) {
      matchesSearch = record.users?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.keys?.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.keys?.location.toLowerCase().includes(searchTerm.toLowerCase());
    }

    // Advanced search filters
    if (searchFilters) {
      if (searchFilters.searchTerm) {
        matchesAdvancedFilters = matchesAdvancedFilters && (
          record.users?.name.toLowerCase().includes(searchFilters.searchTerm.toLowerCase()) ||
          record.keys?.label.toLowerCase().includes(searchFilters.searchTerm.toLowerCase()) ||
          record.keys?.location.toLowerCase().includes(searchFilters.searchTerm.toLowerCase())
        );
      }

      if (searchFilters.userType !== 'all') {
        matchesAdvancedFilters = matchesAdvancedFilters && record.users?.role === searchFilters.userType;
      }

      if (searchFilters.issueStatus !== 'all') {
        matchesAdvancedFilters = matchesAdvancedFilters && record.status === searchFilters.issueStatus;
      }

      if (searchFilters.location) {
        matchesAdvancedFilters = matchesAdvancedFilters && 
          record.keys?.location.toLowerCase().includes(searchFilters.location.toLowerCase());
      }

      if (searchFilters.overdueDays) {
        const dueDate = new Date(record.due_at);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        matchesAdvancedFilters = matchesAdvancedFilters && daysDiff >= searchFilters.overdueDays;
      }

      if (searchFilters.dateRange.start && searchFilters.dateRange.end) {
        const issueDate = new Date(record.created_at || '');
        const startDate = new Date(searchFilters.dateRange.start);
        const endDate = new Date(searchFilters.dateRange.end);
        matchesAdvancedFilters = matchesAdvancedFilters && issueDate >= startDate && issueDate <= endDate;
      }
    }
    
    // Date range filter
    if (dateRange.start && dateRange.end) {
      const issueDate = new Date(record.created_at || '');
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      const matchesDateRange = issueDate >= startDate && issueDate <= endDate;
      matchesAdvancedFilters = matchesAdvancedFilters && matchesDateRange;
    }
    
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    
    return matchesSearch && matchesStatus && matchesAdvancedFilters;
  });

  const exportToCSV = () => {
    const csvData = filteredRecords.map(record => ({
      'Issue Date': new Date(record.issued_at || '').toLocaleDateString(),
      'User Name': record.users?.name || '',
      'User Type': record.users?.role || '',
      'User ID': record.users?.user_id || '',
      'Key Label': record.keys?.label || '',
      'Key Location': record.keys?.location || '',
      'Due Date': new Date(record.due_at).toLocaleDateString(),
      'Return Date': record.returned_at ? new Date(record.returned_at).toLocaleDateString() : 'Not Returned',
      'Status': record.status || '',
      'Days Held': record.returned_at 
        ? Math.ceil((new Date(record.returned_at).getTime() - new Date(record.issued_at || '').getTime()) / (1000 * 60 * 60 * 24))
        : Math.ceil((new Date().getTime() - new Date(record.issued_at || '').getTime()) / (1000 * 60 * 60 * 24)),
      'Admin': record.admins?.name || '',
      'Security Notes': record.security_notes || ''
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `issue-records-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'escalated':
        return 'bg-orange-100 text-orange-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4" />;
      case 'escalated':
        return <XCircle className="h-4 w-4" />;
      case 'closed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getRecordStats = () => {
    const stats = {
      total: records.length,
      active: records.filter(r => r.status === 'active').length,
      overdue: records.filter(r => r.status === 'overdue').length,
      escalated: records.filter(r => r.status === 'escalated').length,
      closed: records.filter(r => r.status === 'closed').length,
    };
    return stats;
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && !selectedRecord?.returned_at;
  };

  const stats = getRecordStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <Key className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Issues</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Escalated</p>
              <p className="text-2xl font-bold text-gray-900">{stats.escalated}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Closed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.closed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        {searchFilters && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                Advanced search active - {filteredRecords.length} results found
              </span>
              <button
                onClick={() => window.location.reload()}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Clear filters
              </button>
            </div>
          </div>
        )}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="overdue">Overdue</option>
                <option value="escalated">Escalated</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={exportToCSV}
                disabled={filteredRecords.length === 0}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
              <button
                onClick={() => setShowIssueForm(true)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Issue Key
              </button>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Date Range:</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {(dateRange.start || dateRange.end) && (
                <button
                  onClick={() => setDateRange({ start: '', end: '' })}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="text-sm text-gray-600">
              Showing {filteredRecords.length} of {records.length} records
            </div>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issued
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Remaining
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No issue records found</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex items-center justify-center bg-gray-100 rounded-full">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {record.users?.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {record.users?.user_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {record.keys?.label}
                      </div>
                      <div className="text-sm text-gray-500">
                        {record.keys?.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(record.issued_at || '').toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className={`flex items-center ${isOverdue(record.due_at) ? 'text-red-600' : ''}`}>
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(record.due_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <CountdownTimer 
                        dueDate={record.due_at} 
                        status={record.status || 'active'}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(record.status || 'active')}`}>
                        {getStatusIcon(record.status || 'active')}
                        <span className="ml-1 capitalize">
                          {record.status}
                          {record.status === 'overdue' && (
                            <span className="ml-1 text-xs">(Grace Period)</span>
                          )}
                          {record.status === 'escalated' && (
                            <span className="ml-1 text-xs">(Post-Grace)</span>
                          )}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedDetailRecord(record.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition duration-200"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Details
                        </button>
                        {(record.status === 'active' || record.status === 'overdue') && !record.is_locked ? (
                          <button
                            onClick={() => setSelectedRecord(record)}
                            className="inline-flex items-center px-3 py-1.5 border border-green-300 text-xs font-medium rounded-md text-green-700 bg-white hover:bg-green-50 transition duration-200"
                          >
                            <ArrowLeft className="h-3 w-3 mr-1" />
                            Return
                          </button>
                        ) : record.is_locked ? (
                          <div className="flex items-center text-red-600 text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Locked
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">
                            {record.returned_at ? 'Returned' : 'Closed'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showIssueForm && (
        <IssueKeyForm 
          onClose={() => setShowIssueForm(false)} 
          onRefresh={() => {
            // The real-time subscription should handle this automatically,
            // but we can force a refresh if needed
            window.location.reload();
          }}
        />
      )}

      {selectedRecord && (
        <ReturnKeyModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}

      {selectedDetailRecord && (
        <IssueRecordDetail
          recordId={selectedDetailRecord}
          onClose={() => setSelectedDetailRecord(null)}
        />
      )}
    </>
  );
}