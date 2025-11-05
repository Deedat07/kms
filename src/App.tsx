import React from 'react';
import { useAuth } from './hooks/useAuth';
import { LandingPage } from './components/LandingPage';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { UserManagement } from './components/UserManagement';
import { KeyManagement } from './components/KeyManagement';
import { IssueManagement } from './components/IssueManagement';
import { Reports } from './components/Reports';
import { NotificationCenter } from './components/NotificationCenter';
import { MobileKeyScanner } from './components/MobileKeyScanner';
import { WebcamScanner } from './components/WebcamScanner';
import { AdvancedSearch, SearchFilters } from './components/AdvancedSearch';
import { BulkOperations } from './components/BulkOperations';
import { SecurityDashboard } from './components/SecurityDashboard';
import { EmailManagement } from './components/EmailManagement';
import { Loader2 } from 'lucide-react';

function App() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = React.useState('dashboard');
  const [showMobileScanner, setShowMobileScanner] = React.useState(false);
  const [showWebcamScanner, setShowWebcamScanner] = React.useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = React.useState(false);
  const [showBulkOperations, setShowBulkOperations] = React.useState(false);
  const [searchFilters, setSearchFilters] = React.useState<SearchFilters | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  const getTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Dashboard';
      case 'users':
        return 'User Management';
      case 'keys':
        return 'Key Management';
      case 'issues':
        return 'Issue Management';
      case 'reports':
        return 'Reports & Analytics';
      case 'notifications':
        return 'Notification Center';
      case 'security':
        return 'Security Dashboard';
      case 'emails':
        return 'Email Management';
      default:
        return 'Dashboard';
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'users':
        return <UserManagement searchFilters={searchFilters} />;
      case 'keys':
        return <KeyManagement searchFilters={searchFilters} />;
      case 'issues':
        return <IssueManagement searchFilters={searchFilters} />;
      case 'reports':
        return <Reports />;
      case 'notifications':
        return <NotificationCenter />;
      case 'security':
        return <SecurityDashboard />;
      case 'emails':
        return <EmailManagement />;
      default:
        return <Dashboard />;
    }
  };

  const handleAdvancedSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
    setShowAdvancedSearch(false);
    // The search filters will be passed to the current view component
  };

  const handleWebcamScan = (barcode: string) => {
    console.log('Webcam scanned barcode:', barcode);
    setShowWebcamScanner(false);
    // Handle the scanned barcode - could trigger user lookup, key operations, etc.
    // For now, just log it
  };
  return (
    <>
    <Layout 
      title={getTitle()} 
      currentView={currentView}
      onViewChange={setCurrentView}
      onMobileScanner={() => setShowMobileScanner(true)}
      onWebcamScanner={() => setShowWebcamScanner(true)}
      onAdvancedSearch={() => setShowAdvancedSearch(true)}
      onBulkOperations={() => setShowBulkOperations(true)}
    >
      {renderCurrentView()}
    </Layout>

    {/* Modals */}
    {showMobileScanner && (
      <MobileKeyScanner onClose={() => setShowMobileScanner(false)} />
    )}

    {showWebcamScanner && (
      <WebcamScanner 
        onScan={handleWebcamScan}
        onClose={() => setShowWebcamScanner(false)} 
        title="Admin Panel Webcam Scanner"
      />
    )}
    {showAdvancedSearch && (
      <AdvancedSearch 
        onSearch={handleAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)} 
      />
    )}

    {showBulkOperations && (
      <BulkOperations onClose={() => setShowBulkOperations(false)} />
    )}
    </>
  );
}

export default App;