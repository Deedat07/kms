import React, { useState } from 'react';
import { useKeys } from '../hooks/useKeys';
import { useUsers } from '../hooks/useUsers';
import { useIssueRecords } from '../hooks/useIssueRecords';
import { 
  Package, 
  Upload, 
  Download, 
  Trash2, 
  Key, 
  User, 
  FileText,
  CheckCircle,
  AlertTriangle,
  X,
  Loader2
} from 'lucide-react';

interface BulkOperationsProps {
  onClose: () => void;
}

export function BulkOperations({ onClose }: BulkOperationsProps) {
  const [activeTab, setActiveTab] = useState<'keys' | 'users' | 'issues'>('keys');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const { keys, deleteKey } = useKeys();
  const { users, deleteUser } = useUsers();
  const { records, escalateRecord } = useIssueRecords();

  const handleSelectAll = () => {
    let allIds: string[] = [];
    switch (activeTab) {
      case 'keys':
        allIds = keys.map(k => k.id);
        break;
      case 'users':
        allIds = users.map(u => u.id);
        break;
      case 'issues':
        allIds = records.map(r => r.id);
        break;
    }
    setSelectedItems(allIds);
  };

  const handleSelectNone = () => {
    setSelectedItems([]);
  };

  const handleItemToggle = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedItems.length === 0) return;

    setLoading(true);
    setMessage(null);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const id of selectedItems) {
        try {
          switch (bulkAction) {
            case 'delete-keys':
              await deleteKey(id);
              successCount++;
              break;
            case 'delete-users':
              await deleteUser(id);
              successCount++;
              break;
            case 'escalate-issues':
              await escalateRecord(id, 'Bulk escalated by admin');
              successCount++;
              break;
            default:
              break;
          }
        } catch (error) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        setMessage({
          type: 'success',
          text: `Successfully processed ${successCount} items${errorCount > 0 ? ` (${errorCount} failed)` : ''}`
        });
      } else {
        setMessage({
          type: 'error',
          text: 'Failed to process any items'
        });
      }

      setSelectedItems([]);
      setBulkAction('');
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occurred during bulk operation'
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    let data: any[] = [];
    let filename = '';

    switch (activeTab) {
      case 'keys':
        data = keys.filter(k => selectedItems.includes(k.id)).map(key => ({
          'Label': key.label,
          'Location': key.location,
          'Status': key.status,
          'Created': new Date(key.created_at || '').toLocaleDateString()
        }));
        filename = 'keys-export.csv';
        break;
      case 'users':
        data = users.filter(u => selectedItems.includes(u.id)).map(user => ({
          'Name': user.name,
          'Type': user.role,
          'User ID': user.user_id,
          'Email': user.email,
          'Phone': user.phone,
          'QR Code': user.qr_code,
          'Created': new Date(user.created_at).toLocaleDateString()
        }));
        filename = 'users-export.csv';
        break;
      case 'issues':
        data = records.filter(r => selectedItems.includes(r.id)).map(record => ({
          'User': record.users?.name,
          'Key': record.keys?.label,
          'Issued': new Date(record.issued_at || '').toLocaleDateString(),
          'Due': new Date(record.due_at).toLocaleDateString(),
          'Returned': record.returned_at ? new Date(record.returned_at).toLocaleDateString() : 'Not Returned',
          'Status': record.status
        }));
        filename = 'issues-export.csv';
        break;
    }

    if (data.length === 0) return;

    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);

    setMessage({
      type: 'success',
      text: `Exported ${data.length} items to ${filename}`
    });
  };

  const renderItemList = () => {
    let items: any[] = [];
    let ItemIcon = Key;

    switch (activeTab) {
      case 'keys':
        items = keys;
        ItemIcon = Key;
        break;
      case 'users':
        items = users;
        ItemIcon = User;
        break;
      case 'issues':
        items = records;
        ItemIcon = FileText;
        break;
    }

    return (
      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
              selectedItems.includes(item.id) ? 'bg-indigo-50' : ''
            }`}
            onClick={() => handleItemToggle(item.id)}
          >
            <input
              type="checkbox"
              checked={selectedItems.includes(item.id)}
              onChange={() => handleItemToggle(item.id)}
              className="mr-3"
            />
            <ItemIcon className="h-5 w-5 text-gray-400 mr-3" />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">
                {activeTab === 'keys' && item.label}
                {activeTab === 'users' && item.name}
                {activeTab === 'issues' && `${item.users?.name} - ${item.keys?.label}`}
              </div>
              <div className="text-xs text-gray-500">
                {activeTab === 'keys' && item.location}
                {activeTab === 'users' && `${item.role} - ${item.user_id}`}
                {activeTab === 'issues' && `Status: ${item.status}`}
              </div>
            </div>
            {selectedItems.includes(item.id) && (
              <CheckCircle className="h-5 w-5 text-indigo-600" />
            )}
          </div>
        ))}
      </div>
    );
  };

  const getBulkActions = () => {
    switch (activeTab) {
      case 'keys':
        return [
          { value: 'delete-keys', label: 'Delete Selected Keys', icon: Trash2, color: 'text-red-600' }
        ];
      case 'users':
        return [
          { value: 'delete-users', label: 'Delete Selected Users', icon: Trash2, color: 'text-red-600' }
        ];
      case 'issues':
        return [
          { value: 'escalate-issues', label: 'Escalate Selected Issues', icon: AlertTriangle, color: 'text-orange-600' }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-indigo-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Bulk Operations</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => {
                setActiveTab('keys');
                setSelectedItems([]);
                setBulkAction('');
              }}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition duration-200 ${
                activeTab === 'keys'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Key className="h-4 w-4 mr-2" />
              Keys ({keys.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('users');
                setSelectedItems([]);
                setBulkAction('');
              }}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition duration-200 ${
                activeTab === 'users'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="h-4 w-4 mr-2" />
              Users ({users.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('issues');
                setSelectedItems([]);
                setBulkAction('');
              }}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition duration-200 ${
                activeTab === 'issues'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="h-4 w-4 mr-2" />
              Issues ({records.length})
            </button>
          </div>

          {/* Selection Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-2">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition duration-200"
              >
                Select All
              </button>
              <button
                onClick={handleSelectNone}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition duration-200"
              >
                Select None
              </button>
            </div>
            <div className="text-sm text-gray-600">
              {selectedItems.length} items selected
            </div>
          </div>

          {/* Item List */}
          {renderItemList()}

          {/* Actions */}
          {selectedItems.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center space-x-4">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select an action...</option>
                  {getBulkActions().map((action) => (
                    <option key={action.value} value={action.value}>
                      {action.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={exportToCSV}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </button>
              </div>

              {bulkAction && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => setBulkAction('')}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkAction}
                    disabled={loading}
                    className="flex-1 flex justify-center items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Execute Action
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`mt-4 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 border border-green-200' :
              message.type === 'error' ? 'bg-red-50 border border-red-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              <p className={`text-sm ${
                message.type === 'success' ? 'text-green-700' :
                message.type === 'error' ? 'text-red-700' :
                'text-blue-700'
              }`}>
                {message.text}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}