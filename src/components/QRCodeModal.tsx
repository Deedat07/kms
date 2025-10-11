import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, QrCode, User, Mail, Phone, Hash, Calendar, Key, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { decodeBarcodeData } from '../lib/barcode';

interface QRCodeModalProps {
  qrCode: string;
  userName: string;
  userType: string;
  userId: string;
  onClose: () => void;
}

interface UserActivity {
  id: string;
  issued_at: string;
  due_at: string;
  returned_at: string | null;
  status: string;
  keys: {
    label: string;
    location: string;
  } | null;
}

export function QRCodeModal({ qrCode, userName, userType, userId, onClose }: QRCodeModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [userDetails, setUserDetails] = useState<any>(null);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [barcodeData, setBarcodeData] = useState<any>(null);

  useEffect(() => {
    QRCode.toDataURL(qrCode, {
      width: 256,
      margin: 2,
      color: {
        dark: '#1f2937',
        light: '#ffffff',
      },
    }).then(setQrCodeUrl);

    fetchUserData();
    
    // Try to decode barcode data
    const decoded = decodeBarcodeData(qrCode);
    if (decoded) {
      setBarcodeData(decoded);
    }
  }, [qrCode]);

  const fetchUserData = async () => {
    try {
      // Fetch user details
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      setUserDetails(user);

      // Fetch user activities
      const { data: userActivities, error: activitiesError } = await supabase
        .from('issue_records')
        .select(`
          *,
          keys (label, location)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (activitiesError) throw activitiesError;
      setActivities(userActivities || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.download = `${userName.replace(/\s+/g, '_')}_QR_${qrCode}.png`;
      link.href = qrCodeUrl;
      link.click();
    }
  };

  const getUserTypeColor = (type: string) => {
    switch (type) {
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

  const getActivityIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'escalated':
        return <XCircle className="h-4 w-4 text-orange-600" />;
      case 'closed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Key className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-50 border-blue-200';
      case 'overdue':
        return 'bg-red-50 border-red-200';
      case 'escalated':
        return 'bg-orange-50 border-orange-200';
      case 'closed':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getActivityStats = () => {
    return {
      total: activities.length,
      active: activities.filter(a => a.status === 'active').length,
      overdue: activities.filter(a => a.status === 'overdue').length,
      escalated: activities.filter(a => a.status === 'escalated').length,
      completed: activities.filter(a => a.status === 'closed').length,
    };
  };

  const stats = getActivityStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <QrCode className="h-6 w-6 text-indigo-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">User Profile & QR Code</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - QR Code and Basic Info */}
            <div className="text-center">
              <div className="mb-6">
                <h4 className="text-2xl font-semibold text-gray-900 mb-2">{userName}</h4>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getUserTypeColor(userType)}`}>
                  {userType.charAt(0).toUpperCase() + userType.slice(1)}
                </span>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                {qrCodeUrl && (
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="mx-auto rounded-lg shadow-sm"
                  />
                )}
                <p className="text-sm text-gray-600 mt-4 font-mono">{qrCode}</p>
              </div>

              {/* User Details */}
              {userDetails && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 text-left">
                  <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    User Registration Details
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center">
                        <Hash className="h-3 w-3 mr-1" />
                        ID:
                      </span>
                      <span className="font-mono font-medium">{userDetails.user_id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        Email:
                      </span>
                      <span className="font-medium">{userDetails.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        Phone:
                      </span>
                      <span className="font-medium">{userDetails.phone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Registered:
                      </span>
                      <span className="font-medium">{new Date(userDetails.created_at).toLocaleDateString()}</span>
                    </div>
                    {userDetails.id_card_url && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">ID Card:</span>
                        <a 
                          href={userDetails.id_card_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-500 text-xs underline"
                        >
                          View ID Card
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Barcode Embedded Data */}
              {barcodeData && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
                  <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <QrCode className="h-4 w-4 mr-2" />
                    Barcode Embedded Data
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{barcodeData.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Role:</span>
                      <span className="font-medium capitalize">{barcodeData.role}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">User ID:</span>
                      <span className="font-mono font-medium">{barcodeData.user_id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{barcodeData.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{barcodeData.phone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Generated:</span>
                      <span className="font-medium">{new Date(barcodeData.generated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
                >
                  Close
                </button>
                <button
                  onClick={downloadQRCode}
                  className="flex-1 flex justify-center items-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </button>
              </div>
            </div>

            {/* Right Column - Activity History */}
            <div>
              <h5 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Key className="h-5 w-5 mr-2" />
                Key Activity History
              </h5>

              {/* Activity Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-blue-600">{stats.total}</div>
                  <div className="text-xs text-blue-700">Total Requests</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-green-600">{stats.completed}</div>
                  <div className="text-xs text-green-700">Completed</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-red-600">{stats.overdue}</div>
                  <div className="text-xs text-red-700">Overdue</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-orange-600">{stats.escalated}</div>
                  <div className="text-xs text-orange-700">Escalated</div>
                </div>
              </div>

              {/* Activity List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Loading activities...</p>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-8">
                    <Key className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No key activities yet</p>
                  </div>
                ) : (
                  activities.map((activity) => (
                    <div
                      key={activity.id}
                      className={`border rounded-lg p-4 ${getActivityColor(activity.status)}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center">
                          {getActivityIcon(activity.status)}
                          <span className="ml-2 font-medium text-gray-900">
                            {activity.keys?.label}
                          </span>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          activity.status === 'active' ? 'bg-blue-100 text-blue-800' :
                          activity.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          activity.status === 'escalated' ? 'bg-orange-100 text-orange-800' :
                          activity.status === 'closed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>📍 {activity.keys?.location}</div>
                        <div>📅 Issued: {new Date(activity.issued_at).toLocaleDateString()}</div>
                        <div>⏰ Due: {new Date(activity.due_at).toLocaleDateString()}</div>
                        {activity.returned_at && (
                          <div>✅ Returned: {new Date(activity.returned_at).toLocaleDateString()}</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}