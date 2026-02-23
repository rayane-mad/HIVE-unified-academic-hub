import { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { AccountLinking } from './components/AccountLinking';
import { Dashboard } from './components/Dashboard';
import { Header } from './components/Header';
import { Notifications } from './components/Notifications';
import { Profile } from './components/Profile';
import { Settings } from './components/Settings';
import { AssignmentDetail } from './components/AssignmentDetail';
import { TokenGuide } from './components/TokenGuide';

type ViewType = 'dashboard' | 'notifications' | 'profile' | 'settings' | 'assignment' | 'token-guide';

interface Assignment {
  id: string;
  title: string;
  [key: string]: any;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAccountLinking, setShowAccountLinking] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => {
      setIsAuthenticated(true);
      setShowAccountLinking(true);
    }} />;
  }

  if (showAccountLinking) {
    return <AccountLinking
      onContinue={() => setShowAccountLinking(false)}
      onHelpClick={() => {
        setShowAccountLinking(false);
        setCurrentView('token-guide');
      }}
    />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onSelectAssignment={(assignment: Assignment) => {
          setSelectedAssignment(assignment);
          setCurrentView('assignment');
        }} />;
      case 'notifications':
        return <Notifications />;
      case 'profile':
        return <Profile />;
      case 'settings':
        return <Settings />;
      case 'assignment':
        return selectedAssignment ? (
          <AssignmentDetail
            assignment={selectedAssignment}
            onBack={() => setCurrentView('dashboard')}
          />
        ) : null;
      case 'token-guide':
        return <TokenGuide onBack={() => setCurrentView('dashboard')} />;
      default:
        return <Dashboard onSelectAssignment={(assignment: Assignment) => {
          setSelectedAssignment(assignment);
          setCurrentView('assignment');
        }} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        currentView={currentView}
        onNavigate={setCurrentView}
        onLogout={() => setIsAuthenticated(false)}
      />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {renderView()}
      </main>
    </div>
  );
}