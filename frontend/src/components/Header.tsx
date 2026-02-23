import { useState, useEffect } from 'react';
import { Bell, User, Settings, Home, LogOut } from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

export function Header({ currentView, onNavigate, onLogout }: HeaderProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  const [userInitials, setUserInitials] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // 1. Fetch Notifications
        const notifRes = await fetch('/api/notifications', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (notifRes.ok) {
          const data = await notifRes.json();
          if (Array.isArray(data)) {
            setUnreadCount(data.filter((n: any) => !n.is_read).length);
          }
        }

        // 2. Fetch User Profile for Initials
        const profileRes = await fetch('/api/users/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (profileRes.ok) {
          const data = await profileRes.json();
          if (data.success && data.user.display_name) {
            const name = data.user.display_name;
            // Get initials (First Last -> FL)
            const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
            setUserInitials(initials);
          }
        }

      } catch (err) {
        console.error("Failed to fetch header data", err);
      }
    };

    fetchUserData();
    // Poll every 30 seconds for updates
    const interval = setInterval(fetchUserData, 30000);
    return () => clearInterval(interval);
  }, [currentView]); // Re-fetch when view changes (e.g. leaving notifications page)

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
              <span className="text-white">🐝</span>
            </div>
            <h1 className="text-amber-600">Hive</h1>
          </div>

          <nav className="hidden md:flex gap-6">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${currentView === 'dashboard'
                ? 'bg-amber-50 text-amber-600'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <Home size={20} />
              Dashboard
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('notifications')}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell size={20} className={currentView === 'notifications' ? 'text-amber-600' : 'text-gray-600'} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onNavigate('profile')}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${currentView === 'profile' ? 'ring-2 ring-amber-600' : 'hover:bg-gray-100'
              }`}
          >
            {userInitials ? (
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
                {userInitials}
              </div>
            ) : (
              <User size={20} className={currentView === 'profile' ? 'text-amber-600' : 'text-gray-600'} />
            )}
          </button>

          <button
            onClick={() => onNavigate('settings')}
            className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${currentView === 'settings' ? 'text-amber-600' : 'text-gray-600'
              }`}
          >
            <Settings size={20} />
          </button>

          <button
            onClick={onLogout}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
