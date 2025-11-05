import React, { useState } from 'react';
import { useUsers } from '../hooks/useUsers';
import { UserRegistrationForm } from './UserRegistrationForm';
import { QRCodeModal } from './QRCodeModal';
import { SearchFilters } from './AdvancedSearch';
import { 
  Plus, 
  Search, 
  QrCode, 
  User, 
  GraduationCap, 
  UserCheck, 
  Wrench,
  Calendar,
  Loader2,
  Trash2,
  X
} from 'lucide-react';

interface UserManagementProps {
  searchFilters?: SearchFilters | null;
}

export function UserManagement({ searchFilters }: UserManagementProps) {
  const { users, loading, fetchUsers, deleteUser } = useUsers();
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [selectedQRUser, setSelectedQRUser] = useState<any>(null);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Apply advanced search filters
  const filteredUsers = users.filter(user => {
    let matchesSearch = true;
    let matchesAdvancedFilters = true;

    // Basic search
    if (searchTerm) {
      matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.qr_code.toLowerCase().includes(searchTerm.toLowerCase());
    }

    // Advanced search filters
    if (searchFilters) {
      if (searchFilters.searchTerm) {
        matchesAdvancedFilters = matchesAdvancedFilters && (
          user.name.toLowerCase().includes(searchFilters.searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchFilters.searchTerm.toLowerCase()) ||
          user.user_id.toLowerCase().includes(searchFilters.searchTerm.toLowerCase()) ||
          user.qr_code.toLowerCase().includes(searchFilters.searchTerm.toLowerCase())
        );
      }

      if (searchFilters.userType !== 'all') {
        matchesAdvancedFilters = matchesAdvancedFilters && user.role === searchFilters.userType;
      }

      if (searchFilters.dateRange.start && searchFilters.dateRange.end) {
        const userDate = new Date(user.created_at);
        const startDate = new Date(searchFilters.dateRange.start);
        const endDate = new Date(searchFilters.dateRange.end);
        matchesAdvancedFilters = matchesAdvancedFilters && userDate >= startDate && userDate <= endDate;
      }
    }
    
    const matchesType = filterType === 'all' || user.role === filterType;
    
    return matchesSearch && matchesType && matchesAdvancedFilters;
  });

  const getUserTypeIcon = (role: string) => {
    switch (role) {
      case 'student':
        return <GraduationCap className="h-4 w-4" />;
      case 'lecturer':
        return <UserCheck className="h-4 w-4" />;
      case 'cleaner':
        return <Wrench className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getUserTypeColor = (role: string) => {
    switch (role) {
      case 'student':
        return 'bg-blue-100 text-blue-800';
      case 'lecturer':
        return 'bg-green-100 text-green-800';
      case 'cleaner':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getIdentificationId = (user: any) => {
    switch (user.role) {
      case 'student':
        return user.user_id;
      case 'lecturer':
        return user.user_id;
      case 'cleaner':
        return user.user_id;
      default:
        return 'N/A';
    }
  };

  const getUserStats = () => {
    const stats = {
      total: users.length,
      students: users.filter(u => u.role === 'student').length,
      lecturers: users.filter(u => u.role === 'lecturer').length,
      cleaners: users.filter(u => u.role === 'cleaner').length,
    };
    return stats;
  };

  const stats = getUserStats();

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    const { error } = await deleteUser(userToDelete.id);
    
    if (error) {
      alert('Failed to delete user. Please try again.');
    } else {
      setUserToDelete(null);
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <User className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.students}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <UserCheck className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Lecturers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lecturers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <Wrench className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cleaners</p>
              <p className="text-2xl font-bold text-gray-900">{stats.cleaners}</p>
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
                Advanced search active - {filteredUsers.length} results found
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
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="student">Students</option>
              <option value="lecturer">Lecturers</option>
              <option value="cleaner">Cleaners</option>
            </select>
          </div>

          <button
            onClick={() => setShowRegistrationForm(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Register New User
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registered
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  QR Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No users found</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex items-center justify-center bg-gray-100 rounded-full">
                          {getUserTypeIcon(user.role || 'student')}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getUserTypeColor(user.role || 'student')}`}>
                        {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {getIdentificationId(user)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{user.phone}</div>
                      <div className="text-xs text-gray-400">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {user.qr_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedQRUser(user)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition duration-200"
                        >
                          <QrCode className="h-3 w-3 mr-1" />
                          View QR
                        </button>
                        <button
                          onClick={() => setUserToDelete(user)}
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
        <UserRegistrationForm 
          onClose={() => setShowRegistrationForm(false)} 
          onRefresh={fetchUsers}
        />
      )}

      {selectedQRUser && (
        <QRCodeModal
          qrCode={selectedQRUser.qr_code}
          userName={selectedQRUser.name}
          userType={selectedQRUser.role || 'student'}
          userId={selectedQRUser.id}
          onClose={() => setSelectedQRUser(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
              <button
                onClick={() => setUserToDelete(null)}
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
                <h5 className="font-medium text-gray-900 mb-2">User Details:</h5>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Name:</strong> {userToDelete.name}</p>
                  <p><strong>Type:</strong> {userToDelete.role}</p>
                  <p><strong>ID:</strong> {userToDelete.user_id}</p>
                  <p><strong>Email:</strong> {userToDelete.email}</p>
                </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-700">
                  <strong>Warning:</strong> Deleting this user will permanently remove their account and all associated data. 
                  Any active key issues will also be affected.
                </p>
              </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
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
                      Delete User
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