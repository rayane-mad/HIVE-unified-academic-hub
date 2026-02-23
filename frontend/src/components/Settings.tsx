import { useState, useEffect } from 'react';
import { Link, Unlink, Shield, Bell, User } from 'lucide-react';

interface ConnectedAccount {
  id: string;
  name: string;
  connected: boolean;
  email?: string;
  last_sync?: string;
}

interface UserProfile {
  display_name: string;
  email: string;
  major?: string;
  year?: string;
  gpa?: string;
}

export function Settings() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [profile, setProfile] = useState<UserProfile>({ display_name: '', email: '' });
  const [loading, setLoading] = useState(true);

  // Load Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // 1. Fetch Integration Status
        const integRes = await fetch('/api/integration/status', { headers });
        const integData = await integRes.json();

        if (integData.success) {
          // Merge with base list to show all options even if not connected
          const platforms = [
            { id: 'canvas', name: 'Canvas' },
            { id: 'outlook', name: 'Outlook' },
            { id: 'google', name: 'Google Calendar' }
          ];

          const merged = platforms.map(p => {
            const found = integData.accounts.find((a: any) => a.id === p.id);
            return {
              ...p,
              connected: !!found?.connected,
              last_sync: found?.last_sync
            };
          });
          setAccounts(merged);
        }

        // 2. Fetch Profile
        const profileRes = await fetch('/api/users/profile', { headers });
        const profileData = await profileRes.json();
        if (profileData.success) {
          setProfile(profileData.user);
        }

      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Helper to get user ID (copied from AccountLinking)
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

  const handleConnect = (platform: string) => {
    const userId = getUserIdFromToken();
    if (!userId) {
      alert("Session invalid");
      return;
    }

    if (platform === 'google') {
      window.location.href = `http://localhost:5000/api/integration/auth/google?userId=${userId}`;
    } else if (platform === 'outlook') {
      window.location.href = `http://localhost:5000/api/integration/auth/outlook?userId=${userId}`;
    } else {
      alert("This platform is not yet supported.");
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });
      alert("Profile updated!");
    } catch (err) {
      alert("Failed to update profile");
    }
  };

  const handleDisconnect = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to disconnect ${name}?`)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/integration/disconnect/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setAccounts(accounts.map(acc => acc.id === id ? { ...acc, connected: false } : acc));
        alert(`Disconnected ${name}`);
      } else {
        alert("Failed to disconnect");
      }
    } catch (err) {
      console.error(err);
      alert("Error disconnecting");
    }
  };

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  if (loading) return <div className="p-8 text-center">Loading settings...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-gray-900 mb-2">Settings</h2>
        <p className="text-gray-600">Manage your account preferences and connected services</p>
      </div>

      {/* Account Connections */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Link className="text-amber-600" size={24} />
          <h3 className="text-gray-900">Connected Accounts</h3>
        </div>
        <p className="text-gray-600 mb-6">
          Manage your OAuth connections to third-party platforms. Connect or disconnect accounts to control which data sources appear in your feed.
        </p>
        <div className="space-y-4">
          {accounts.map(account => (
            <div
              key={account.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${account.connected ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                  {account.connected ? (
                    <Link className="text-green-600" size={24} />
                  ) : (
                    <Unlink className="text-gray-400" size={24} />
                  )}
                </div>
                <div>
                  <h4 className="text-gray-900">{account.name}</h4>
                  {account.connected ? (
                    <p className="text-green-600 text-sm">Active • Last sync: {account.last_sync ? new Date(account.last_sync).toLocaleDateString() : 'Never'}</p>
                  ) : (
                    <p className="text-gray-500">Not connected</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => account.connected ? handleDisconnect(account.id, account.name) : handleConnect(account.id)}
                className={`px-4 py-2 rounded-lg transition-colors ${account.connected
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-amber-600 text-white hover:bg-amber-700'
                  }`}
                disabled={false}
              >
                {account.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="text-amber-600" size={24} />
          <h3 className="text-gray-900">Notification Preferences</h3>
        </div>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <div>
              <h4 className="text-gray-900">Email Notifications</h4>
              <p className="text-gray-600">Receive important updates via email</p>
            </div>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="w-5 h-5 text-amber-600 rounded"
            />
          </label>
        </div>
      </div>

      {/* Profile Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <User className="text-amber-600" size={24} />
          <h3 className="text-gray-900">Profile Settings</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Display Name</label>
            <input
              type="text"
              value={profile.display_name}
              onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            onClick={handleProfileUpdate}
            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Academic Info */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="text-amber-600" size={24} />
          <h3 className="text-gray-900">Academic Info</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 mb-2">Major</label>
            <input
              type="text"
              value={profile.major || ''}
              onChange={(e) => setProfile({ ...profile, major: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="e.g. Computer Science"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Year</label>
            <select
              value={profile.year || 'Student'}
              onChange={(e) => setProfile({ ...profile, year: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="Freshman">Freshman</option>
              <option value="Sophomore">Sophomore</option>
              <option value="Junior">Junior</option>
              <option value="Senior">Senior</option>
              <option value="Graduate">Graduate</option>
              <option value="Student">Student</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-2">GPA (Optional)</label>
            <input
              type="text"
              value={profile.gpa || ''}
              onChange={(e) => setProfile({ ...profile, gpa: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="e.g. 3.8"
            />
          </div>
        </div>
        <button
          onClick={handleProfileUpdate}
          className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          Save Changes
        </button>
      </div>

      {/* Privacy & Data */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="text-amber-600" size={24} />
          <h3 className="text-gray-900">Privacy & Data</h3>
        </div>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-900">
              <strong>Hive Academic Hub</strong> securely stores your tokens to fetch your assignments. You can revoke access at any time by changing your password on the respective platforms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
