import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogOut, Key, Users, Settings, FileText, BarChart3, Bell, Smartphone, Search, Package, Shield, Camera } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  currentView?: string;
  onViewChange?: (view: string) => void;
  onMobileScanner?: () => void;
  onWebcamScanner?: () => void;
  onAdvancedSearch?: () => void;
  onBulkOperations?: () => void;
}

export function Layout({ 
  children, 
  title, 
  currentView = 'users', 
  onViewChange,
  onMobileScanner,
  onWebcamScanner,
  onAdvancedSearch,
  onBulkOperations
}: LayoutProps) {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center">
                <Key className="h-8 w-8 text-indigo-600 mr-3" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Key Management System
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Mobile Tools */}
              <div className="flex items-center space-x-2">
                {onMobileScanner && (
                  <button
                    onClick={onMobileScanner}
                    className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition duration-200"
                    title="Mobile Scanner"
                  >
                    <Smartphone className="h-4 w-4" />
                  </button>
                )}
                {onWebcamScanner && (
                  <button
                    onClick={onWebcamScanner}
                    className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition duration-200"
                    title="Webcam Scanner"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                )}
                {onAdvancedSearch && (
                  <button
                    onClick={onAdvancedSearch}
                    className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition duration-200"
                    title="Advanced Search"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                )}
                {onBulkOperations && (
                  <button
                    onClick={onBulkOperations}
                    className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition duration-200"
                    title="Bulk Operations"
                  >
                    <Package className="h-4 w-4" />
                  </button>
                )}
              </div>

              <nav className="flex space-x-1">
                <button
                  onClick={() => onViewChange?.('dashboard')}
                  className={`flex items-center px-3 py-2 text-sm rounded-md transition duration-200 ${
                    currentView === 'dashboard'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Dashboard
                </button>
                <button
                  onClick={() => onViewChange?.('users')}
                  className={`flex items-center px-3 py-2 text-sm rounded-md transition duration-200 ${
                    currentView === 'users'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Users className="h-4 w-4 mr-1" />
                  Users
                </button>
                <button
                  onClick={() => onViewChange?.('keys')}
                  className={`flex items-center px-3 py-2 text-sm rounded-md transition duration-200 ${
                    currentView === 'keys'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Key className="h-4 w-4 mr-1" />
                  Keys
                </button>
                <button
                  onClick={() => onViewChange?.('issues')}
                  className={`flex items-center px-3 py-2 text-sm rounded-md transition duration-200 ${
                    currentView === 'issues'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Issues
                </button>
                <button
                  onClick={() => onViewChange?.('reports')}
                  className={`flex items-center px-3 py-2 text-sm rounded-md transition duration-200 ${
                    currentView === 'reports'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Reports
                </button>
                <button
                  onClick={() => onViewChange?.('notifications')}
                  className={`flex items-center px-3 py-2 text-sm rounded-md transition duration-200 ${
                    currentView === 'notifications'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Bell className="h-4 w-4 mr-1" />
                  Notifications
                </button>
                <button
                  onClick={() => onViewChange?.('security')}
                  className={`flex items-center px-3 py-2 text-sm rounded-md transition duration-200 ${
                    currentView === 'security'
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Shield className="h-4 w-4 mr-1" />
                  Security
                </button>
              </nav>
              <span className="text-sm text-gray-500">Admin Panel</span>
              <button
                onClick={handleSignOut}
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition duration-200"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>
        {children}
      </div>
    </div>
  );
}