import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  Mail, 
  MessageSquare,
  Settings,
  Send,
  Loader2,
  Eye,
  X,
  User,
  Phone,
  Hash,
  Calendar,
  Key,
  MapPin
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'overdue' | 'escalated' | 'system';
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  data?: any;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingNotifications, setSendingNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchUserDetails = async (userId: string) => {
    setLoadingDetails(true);
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUserDetails(user);
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewDetails = async (notification: any) => {
    setSelectedNotification(notification);
    if (notification.data?.user_id) {
      await fetchUserDetails(notification.data.user_id);
    }
  };

  const closeDetailsModal = () => {
    setSelectedNotification(null);
    setUserDetails(null);
  };
  const runOverdueCheck = async () => {
    setSendingNotifications(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/overdue-notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        const summary = result.summary || {};
        const message = `Overdue check completed!\n` +
          `• First alerts: ${summary.firstAlerts || 0}\n` +
          `• Reminders: ${summary.reminders || 0}\n` +
          `• Escalations: ${summary.escalations || 0}\n` +
          `Total actions: ${result.notificationsSent + result.escalationsSent}`;
        alert(message);
        // Refresh notifications
        fetchNotifications();
      } else {
        throw new Error('Failed to run overdue check');
      }
    } catch (error) {
      console.error('Error running overdue check:', error);
      alert('Failed to run overdue check. Please try again.');
    } finally {
      setSendingNotifications(false);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // In a real implementation, you'd fetch from a notifications table
      // For now, we'll simulate notifications based on overdue records
      const { data: overdueRecords } = await supabase
        .from('issue_records')
        .select(`
          *,
          users (name, email),
          keys (label, location)
        `)
        .in('status', ['overdue', 'escalated']);

      const mockNotifications: Notification[] = (overdueRecords || []).map(record => {
        const dueDate = new Date(record.due_at);
        const now = new Date();
        const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        return {
          id: record.id,
          type: record.status === 'escalated' ? 'escalated' : 'overdue',
          title: record.status === 'escalated' ? 'Escalated Key Issue' : 'Overdue Key Return',
          message: `${record.users?.name} has had ${record.keys?.label} for ${daysOverdue} days past due date`,
          created_at: record.created_at || new Date().toISOString(),
          read: false,
          data: record
        };
      });

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'overdue':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'escalated':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'overdue':
        return 'border-l-orange-500 bg-orange-50';
      case 'escalated':
        return 'border-l-red-500 bg-red-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Notification Center</h2>
            <p className="text-gray-600 mt-1">Manage system alerts and notifications</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchNotifications}
              disabled={loading}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Bell className="h-4 w-4 mr-2" />
              )}
              Refresh
            </button>
            <button
              onClick={runOverdueCheck}
              disabled={sendingNotifications}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
            >
              {sendingNotifications ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Run Overdue Check
            </button>
          </div>
        </div>
      </div>

      {/* Notification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue Alerts</p>
              <p className="text-2xl font-bold text-gray-900">
                {notifications.filter(n => n.type === 'overdue').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Escalated Issues</p>
              <p className="text-2xl font-bold text-gray-900">
                {notifications.filter(n => n.type === 'escalated').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <Bell className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Notifications</p>
              <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {notifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No notifications at this time</p>
              <p className="text-sm text-gray-400 mt-1">All keys are returned on time!</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 border-l-4 ${getNotificationColor(notification.type)}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {notification.message}
                    </p>
                    {notification.data && (
                      <div className="mt-3 flex space-x-3">
                        <button className="text-xs text-indigo-600 hover:text-indigo-500 font-medium">
                          onClick={() => handleViewDetails(notification)}
                          <Eye className="h-3 w-3 inline mr-1" />
                          View Details
                        </button>
                        <button className="text-xs text-green-600 hover:text-green-500 font-medium">
                          Send Reminder
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center mb-6">
          <Settings className="h-6 w-6 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
              <p className="text-sm text-gray-500">Send email alerts for overdue keys</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">SMS Notifications</h4>
              <p className="text-sm text-gray-500">Send SMS alerts for escalated issues</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Auto-Escalation</h4>
              <p className="text-sm text-gray-500">Automatically escalate keys overdue by 7+ days</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <Eye className="h-6 w-6 text-indigo-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Notification Details</h3>
              </div>
              <button
                onClick={closeDetailsModal}
                className="text-gray-400 hover:text-gray-500 transition duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Notification Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Bell className="h-4 w-4 mr-2" />
                  Notification Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                      selectedNotification.type === 'overdue' ? 'bg-orange-100 text-orange-800' :
                      selectedNotification.type === 'escalated' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedNotification.type.charAt(0).toUpperCase() + selectedNotification.type.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Title:</span>
                    <span className="font-medium">{selectedNotification.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">{new Date(selectedNotification.created_at).toLocaleString()}</span>
                  </div>
                  <div className="mt-3">
                    <span className="text-gray-600">Message:</span>
                    <p className="font-medium mt-1">{selectedNotification.message}</p>
                  </div>
                </div>
              </div>

              {/* Key Information */}
              {selectedNotification.data?.keys && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Key className="h-4 w-4 mr-2" />
                    Key Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Key Label:</span>
                      <span className="font-medium">{selectedNotification.data.keys.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{selectedNotification.data.keys.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Due Date:</span>
                      <span className="font-medium text-red-600">
                        {new Date(selectedNotification.data.due_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Issued Date:</span>
                      <span className="font-medium">
                        {new Date(selectedNotification.data.issued_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* User Details */}
              {loadingDetails ? (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    <span className="ml-2 text-gray-600">Loading user details...</span>
                  </div>
                </div>
              ) : userDetails ? (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    User Registration Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          Full Name:
                        </span>
                        <span className="font-medium">{userDetails.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center">
                          <Hash className="h-3 w-3 mr-1" />
                          User ID:
                        </span>
                        <span className="font-medium font-mono">{userDetails.user_id}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">User Type:</span>
                        <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                          userDetails.role === 'student' ? 'bg-blue-100 text-blue-800' :
                          userDetails.role === 'lecturer' ? 'bg-green-100 text-green-800' :
                          userDetails.role === 'cleaner' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {userDetails.role?.charAt(0).toUpperCase() + userDetails.role?.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          Email:
                        </span>
                        <span className="font-medium">{userDetails.email || 'Not provided'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          Phone:
                        </span>
                        <span className="font-medium">{userDetails.phone || 'Not provided'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Registered:
                        </span>
                        <span className="font-medium">{new Date(userDetails.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">QR Code:</span>
                        <span className="font-medium font-mono text-xs">{userDetails.qr_code}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">ID Card:</span>
                        <span className="font-medium text-xs">
                          {userDetails.id_card_url ? (
                            <a 
                              href={userDetails.id_card_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-500 underline"
                            >
                              View ID Card
                            </a>
                          ) : (
                            'Not available'
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600 text-center">No user details available for this notification.</p>
                </div>
              )}

              {/* Issue Timeline */}
              {selectedNotification.data?.audit_trail && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Issue Timeline
                  </h4>
                  <div className="space-y-2">
                    {selectedNotification.data.audit_trail.map((entry: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm border-b border-yellow-200 pb-2">
                        <span className="font-medium capitalize">{entry.action.replace('_', ' ')}</span>
                        <span className="text-gray-600">{new Date(entry.timestamp).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={closeDetailsModal}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}