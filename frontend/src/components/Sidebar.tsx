import { LayoutDashboard, Link2, Bell, User, Settings, School } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: 'dashboard' | 'accounts' | 'notifications' | 'profile' | 'settings') => void;
}

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Smart Feed' },
    { id: 'accounts', icon: Link2, label: 'Connected Accounts' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'profile', icon: User, label: 'Profile & Analytics' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <School className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-gray-900">Hive</h2>
            <p className="text-gray-500 text-sm">Academic Hub</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4">
          <p className="text-gray-900 text-sm mb-2">📚 Study Streak</p>
          <p className="text-gray-600 text-xs">You're on a 7-day streak! Keep it up!</p>
        </div>
      </div>
    </aside>
  );
}
