import React, { useState } from 'react';
import { useKeys } from '../hooks/useKeys';
import { KeyRegistrationForm } from './KeyRegistrationForm';
import { KeyEditForm } from './KeyEditForm';
import { SearchFilters } from './AdvancedSearch';
import { Plus, Search, Key, MapPin, CheckCircle, XCircle, Calendar, Loader2, CreditCard as Edit, Trash2, X } from 'lucide-react';

interface KeyManagementProps {
  searchFilters?: SearchFilters | null;
}

export function KeyManagement({ searchFilters }: KeyManagementProps) {
  const { keys, loading, fetchKeys, deleteKey } = useKeys();
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedKey, setSelectedKey] = useState<any>(null);
  const [keyToDelete, setKeyToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Apply advanced search filters
  const filteredKeys = keys.filter(key => {
    let matchesSearch = true;
    let matchesAdvancedFilters = true;

    // Basic search
    if (searchTerm) {
      matchesSearch = key.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         key.location.toLowerCase().includes(searchTerm.toLowerCase());
    }

    // Advanced search filters
    if (searchFilters) {
      if (searchFilters.searchTerm) {
        matchesAdvancedFilters = matchesAdvancedFilters && (
          key.label.toLowerCase().includes(searchFilters.searchTerm.toLowerCase()) ||
          key.location.toLowerCase().includes(searchFilters.searchTerm.toLowerCase())
        );
      }

      if (searchFilters.keyStatus !== 'all') {
        matchesAdvancedFilters = matchesAdvancedFilters && key.status === searchFilters.keyStatus;
      }

      if (searchFilters.location) {
        matchesAdvancedFilters = matchesAdvancedFilters && 
          key.location.toLowerCase().includes(searchFilters.location.toLowerCase());
      }

      if (searchFilters.dateRange.start && searchFilters.dateRange.end) {
        const keyDate = new Date(key.created_at || '');
        const startDate = new Date(searchFilters.dateRange.start);
        const endDate = new Date(searchFilters.dateRange.end);
        matchesAdvancedFilters = matchesAdvancedFilters && keyDate >= startDate && keyDate <= endDate;
      }
    }
    
    const matchesStatus = filterStatus === 'all' || key.status === filterStatus;
    
    return matchesSearch && matchesStatus && matchesAdvancedFilters;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'checked_out':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-4 w-4" />;
      case 'checked_out':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Key className="h-4 w-4" />;
    }
  };

  const getKeyStats = () => {
    const stats = {
      total: keys.length,
      available: keys.filter(k => k.status === 'available').length,
      checkedOut: keys.filter(k => k.status === 'checked_out').length,
    };
    return stats;
  };

  const stats = getKeyStats();

  const handleDeleteKey = async () => {
    if (!keyToDelete) return;

    setDeleting(true);
    const { error } = await deleteKey(keyToDelete.id);
    
    if (error) {
      alert('Failed to delete key. Please try again.');
    } else {
      // Close the modal immediately - the table updates automatically via useKeys hook
      setKeyToDelete(null);
    }
    setDeleting(false);
  };

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <Key className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Keys</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-bold text-gray-900">{stats.available}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Checked Out</p>
              <p className="text-2xl font-bold text-gray-900">{stats.checkedOut}</p>
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
                Advanced search active - {filteredKeys.length} results found
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search keys..."
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
              <option value="available">Available</option>
              <option value="checked_out">Checked Out</option>
            </select>
          </div>

          <button
            onClick={() => setShowRegistrationForm(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Register New Key
          </button>
        </div>
      </div>

      {/* Keys Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredKeys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No keys found</p>
                  </td>
                </tr>
              ) : (
                filteredKeys.map((key) => (
                  <tr key={key.id} className="hover:bg-gray-50 transition duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex items-center justify-center bg-gray-100 rounded-full">
                          <Key className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {key.label}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                        {key.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(key.status || 'available')}`}>
                        {getStatusIcon(key.status || 'available')}
                        <span className="ml-1">
                          {key.status === 'available' ? 'Available' : 'Checked Out'}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(key.created_at || '').toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedKey(key);
                            setShowEditForm(true);
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition duration-200"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => setKeyToDelete(key)}
                          className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 transition duration-200"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </button>
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
      {showRegistrationForm && (
        <KeyRegistrationForm onClose={() => setShowRegistrationForm(false)} />
      )}

      {showEditForm && selectedKey && (
        <KeyEditForm
          keyData={selectedKey}
          onClose={() => {
            setShowEditForm(false);
            setSelectedKey(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {keyToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Delete Key</h3>
              <button
                onClick={() => setKeyToDelete(null)}
                className="text-gray-400 hover:text-gray-500 transition duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">Confirm Deletion</h4>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h5 className="font-medium text-gray-900 mb-2">Key Details:</h5>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Label:</strong> {keyToDelete.label}</p>
                  <p><strong>Location:</strong> {keyToDelete.location}</p>
                  <p><strong>Status:</strong> {keyToDelete.status === 'available' ? 'Available' : 'Checked Out'}</p>
                  <p><strong>Created:</strong> {new Date(keyToDelete.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-700">
                  <strong>Warning:</strong> Deleting this key will permanently remove it from the system. 
                  Any active issues associated with this key will also be affected.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setKeyToDelete(null)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteKey}
                  disabled={deleting}
                  className="flex-1 flex justify-center items-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Key
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}