import { useState, useEffect } from 'react';
import { Link, Check, Key, ShieldAlert, HelpCircle } from 'lucide-react';

interface ConnectedAccount {
  id: string;
  name: string;
  description: string;
  connected: boolean;
}

interface AccountLinkingProps {
  onContinue: () => void;
  onHelpClick: () => void;
}

// Helper to get user ID from token
const getUserIdFromToken = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload).id;
  } catch (e) {
    return null;
  }
};

export function AccountLinking({ onContinue, onHelpClick }: AccountLinkingProps) {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([
    {
      id: 'canvas',
      name: 'Canvas',
      description: 'Sync assignments, grades, and course materials',
      connected: false,
    },
    {
      id: 'outlook',
      name: 'Outlook',
      description: 'Import calendar events and email notifications',
      connected: false,
    },
    {
      id: 'google',
      name: 'Google Calendar',
      description: 'Sync your academic and personal calendar',
      connected: false,
    },
  ]);

  // Check status on mount to persist connections
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch('/api/integration/status', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
          setAccounts(prev => prev.map(acc => {
            const found = data.accounts.find((a: any) => a.id === acc.id);
            return found && found.connected ? { ...acc, connected: true } : acc;
          }));
        }
      } catch (err) {
        console.error("Failed to check status", err);
      }
    };
    checkStatus();
  }, []);

  // State for Manual Token Entry
  const [inputAccount, setInputAccount] = useState<string | null>(null);
  const [tokenValue, setTokenValue] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleConnection = (id: string) => {
    // For now, toggle just visually if connected
    // In real OAuth flow, this would redirect
    setAccounts(
      accounts.map((account) =>
        account.id === id
          ? { ...account, connected: !account.connected }
          : account
      )
    );
  };

  const handleManualLink = async () => {
    if (!inputAccount || !tokenValue) return;
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const endpoint = inputAccount === 'canvas' ? '/api/integration/link-canvas'
        : inputAccount === 'google' ? '/api/integration/link-google'
          : '/api/integration/link-outlook';

      const bodyKey = inputAccount === 'canvas' ? 'canvasToken'
        : inputAccount === 'google' ? 'googleToken'
          : 'outlookToken';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          [bodyKey]: tokenValue
        })
      });

      const data = await res.json();
      if (data.success) {
        // Update UI to show connected
        setAccounts(accounts.map(acc => acc.id === inputAccount ? { ...acc, connected: true } : acc));
        setInputAccount(null);
        setTokenValue('');
        alert(`Successfully linked ${accounts.find(a => a.id === inputAccount)?.name}!`);
      } else {
        alert("Linking failed: " + (data.error || "Unknown error"));
      }

    } catch (err) {
      console.error(err);
      alert("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl relative">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-amber-100 rounded-full mb-4">
            <div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center">
              <div className="text-white">🐝</div>
            </div>
          </div>
          <h2 className="text-gray-900 mb-2">Connect Your Academic Life</h2>
          <p className="text-gray-600 mb-3">Link your accounts to populate your smart feed.</p>
          <button
            onClick={onHelpClick}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-white border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors"
          >
            <HelpCircle size={16} />
            Need help getting tokens?
          </button>
        </div>

        {/* List of Accounts */}
        <div className="space-y-4 mb-8">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`flex flex-col p-5 rounded-lg border-2 transition-all ${account.connected
                ? 'border-green-300 bg-green-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${account.connected ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                    {account.connected ? (
                      <Check className="text-green-600" size={24} />
                    ) : (
                      <Link className="text-gray-400" size={24} />
                    )}
                  </div>
                  <div>
                    <h4 className="text-gray-900 font-semibold">{account.name}</h4>
                    <p className="text-sm text-gray-600">{account.description}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {!account.connected && (
                    <>
                      <button
                        onClick={() => {
                          const userId = getUserIdFromToken();
                          if (!userId) {
                            alert("Error: User session invalid. Please log in again.");
                            return;
                          }

                          if (account.id === 'google') {
                            window.location.href = `http://localhost:5000/api/integration/auth/google?userId=${userId}`;
                          } else if (account.id === 'outlook') {
                            window.location.href = `http://localhost:5000/api/integration/auth/outlook?userId=${userId}`;
                          } else {
                            alert("OAuth Mock: Redirecting to " + account.name + " login...");
                          }
                        }}
                        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Connect (Auto)
                      </button>
                      <button
                        onClick={() => setInputAccount(account.id)}
                        className="flex items-center gap-1 px-4 py-2 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                      >
                        <Key size={14} /> Paste Token
                      </button>
                    </>
                  )}
                  {account.connected && (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-2 text-sm text-green-700 font-medium flex items-center gap-1 bg-green-50 rounded-lg border border-green-200">
                        <Check size={14} /> Connected
                      </span>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm(`Disconnect ${account.name}?`)) return;
                          try {
                            const token = localStorage.getItem('token');
                            const res = await fetch(`/api/integration/disconnect/${account.id}`, {
                              method: 'DELETE',
                              headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (res.ok) {
                              setAccounts(accounts.map(a => a.id === account.id ? { ...a, connected: false } : a));
                            }
                          } catch (err) { console.error(err); }
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-colors"
                        title="Disconnect"
                      >
                        <ShieldAlert size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Manual Input Expansion */}
              {inputAccount === account.id && !account.connected && (
                <div className="mt-4 pt-4 border-t border-gray-200 animate-in fade-in slide-in-from-top-2">
                  {account.id === 'canvas' ? (
                    <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                        <Key size={16} />
                        How to get your Canvas token:
                      </h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-amber-800 mb-3">
                        <li>Click the button below to open Canvas settings</li>
                        <li>Scroll to "Approved Integrations"</li>
                        <li>Click "+ New Access Token"</li>
                        <li>Enter a purpose (e.g., "Hive Academic Hub")</li>
                        <li>Leave expiry blank (never expires)</li>
                        <li>Copy the generated token and paste it below</li>
                      </ol>
                      <a
                        href="https://aui.instructure.com/profile/settings"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
                      >
                        <Key size={14} />
                        Open Canvas Settings →
                      </a>
                    </div>
                  ) : (
                    <div className="flex gap-2 items-start mb-2 bg-yellow-50 p-3 rounded text-xs text-yellow-800 border border-yellow-200">
                      <ShieldAlert size={14} className="mt-0.5" />
                      <p>Developer Mode: Use a personal access token generated from your {account.name} settings.</p>
                    </div>
                  )}
                  <label className="block text-sm text-gray-700 mb-1">Access Token</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                      placeholder={`Paste your ${account.name} token here...`}
                      value={tokenValue}
                      onChange={(e) => setTokenValue(e.target.value)}
                    />
                    <button
                      onClick={handleManualLink}
                      disabled={loading}
                      className="bg-amber-600 text-white px-4 py-2 rounded text-sm hover:bg-amber-700 disabled:opacity-50"
                    >
                      {loading ? 'Verifying...' : 'Save'}
                    </button>
                    <button
                      onClick={() => { setInputAccount(null); setTokenValue(''); }}
                      className="text-gray-500 px-3 py-2 text-sm hover:bg-gray-100 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>

        <div className="text-center text-gray-500 mb-6 text-sm">
          <p>You can always manage connections later in Settings</p>
        </div>

        <button
          onClick={onContinue}
          className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 transition-colors font-medium shadow-md"
        >
          Continue to Dashboard
        </button>
      </div>
    </div>
  );
}
