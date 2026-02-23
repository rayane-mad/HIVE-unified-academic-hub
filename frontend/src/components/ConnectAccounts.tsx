import { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';

interface Account {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  description: string;
  color: string;
}

export function ConnectAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: 'canvas',
      name: 'Canvas LMS',
      icon: '📚',
      connected: true,
      description: 'Course materials, assignments, and grades',
      color: 'from-red-500 to-orange-500'
    },
    {
      id: 'outlook',
      name: 'Outlook Calendar',
      icon: '📅',
      connected: true,
      description: 'University events and meetings',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'google',
      name: 'Google Calendar',
      icon: '🗓️',
      connected: false,
      description: 'Personal and academic events',
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'teams',
      name: 'Microsoft Teams',
      icon: '👥',
      connected: false,
      description: 'Team meetings and collaborations',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'zoom',
      name: 'Zoom',
      icon: '🎥',
      connected: false,
      description: 'Virtual classes and meetings',
      color: 'from-blue-600 to-indigo-600'
    },
  ]);

  const handleToggleConnection = (accountId: string) => {
    setAccounts(accounts.map(account => {
      if (account.id === accountId) {
        // Simulate OAuth connection
        if (!account.connected) {
          alert(`Redirecting to ${account.name} OAuth authorization...`);
        }
        return { ...account, connected: !account.connected };
      }
      return account;
    }));
  };

  const connectedCount = accounts.filter(a => a.connected).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-gray-900 mb-2">Connected Accounts</h1>
        <p className="text-gray-600">
          Manage your connected platforms. Connect more accounts to get a complete view of your academic life.
        </p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-gray-900 mb-1">Account Integration Status</h3>
            <p className="text-gray-600">
              {connectedCount} of {accounts.length} accounts connected
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl mb-1">{connectedCount}/{accounts.length}</div>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all"
                style={{ width: `${(connectedCount / accounts.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${account.color} flex items-center justify-center text-2xl`}>
                  {account.icon}
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-gray-900">{account.name}</h3>
                    {account.connected && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                        <Check className="w-3 h-3" />
                        Connected
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">{account.description}</p>
                </div>
              </div>

              <button
                onClick={() => handleToggleConnection(account.id)}
                className={`px-6 py-2 rounded-lg transition flex items-center gap-2 ${
                  account.connected
                    ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {account.connected ? (
                  <>
                    <X className="w-4 h-4" />
                    Disconnect
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Connect
                  </>
                )}
              </button>
            </div>

            {account.connected && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div>
                    <span className="text-gray-500">Last synced:</span> 2 minutes ago
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span> Active
                  </div>
                  <button className="text-blue-600 hover:text-blue-700">
                    Refresh Data
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
        <p className="text-gray-700 text-sm">
          🔒 <strong>Security Note:</strong> All connections use OAuth 2.0 for secure authentication. 
          Hive never stores your passwords and can be revoked at any time.
        </p>
      </div>
    </div>
  );
}
