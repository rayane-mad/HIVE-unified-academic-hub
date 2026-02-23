import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Settings, Filter } from 'lucide-react';

interface Notification {
  notification_id: string; // Updated to match DB
  title: string;
  content: string; // DB column is content, not message
  course?: string; // might be null in DB
  created_at: string;
  is_read: boolean;
  type: 'assignment' | 'event' | 'announcement' | 'grade';
}

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [showSettings, setShowSettings] = useState(false);

  // Fetch Notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/notifications', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setNotifications(data);
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(n => !n.is_read);

  const markAsRead = async (id: string) => {
    // Optimistic Update
    setNotifications(notifications.map(n =>
      n.notification_id === id ? { ...n, is_read: true } : n
    ));
    // API Call
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id: string) => {
    setNotifications(notifications.filter(n => n.notification_id !== id));
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'assignment':
        return 'bg-amber-100 text-amber-700';
      case 'event':
        return 'bg-blue-100 text-blue-700';
      case 'announcement':
        return 'bg-purple-100 text-purple-700';
      case 'grade':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading notifications...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-gray-900 mb-1">Notifications</h2>
            <p className="text-gray-600">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter size={18} />
              {filter === 'all' ? 'Show Unread' : 'Show All'}
            </button>
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
            >
              <Check size={18} />
              Mark All Read
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-gray-900 mb-4">Notification Preferences</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-amber-600" />
                <span className="text-gray-700">Email notifications for new assignments</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-amber-600" />
                <span className="text-gray-700">Push notifications for upcoming deadlines</span>
              </label>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bell size={48} className="mx-auto mb-4 opacity-50" />
              <p>No notifications to display</p>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div
                key={notification.notification_id}
                className={`p-4 rounded-lg border ${notification.is_read
                    ? 'bg-white border-gray-200'
                    : 'bg-amber-50 border-amber-200'
                  }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-gray-900">{notification.title}</h4>
                      <span className={`px-2 py-1 rounded text-xs ${getTypeColor(notification.type)}`}>
                        {notification.type}
                      </span>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-amber-600 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{notification.content}</p>
                    <div className="flex items-center gap-4 text-gray-500">
                      <span>{notification.course || 'System'}</span>
                      <span>•</span>
                      <span>{new Date(notification.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.notification_id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <Check size={18} className="text-green-600" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.notification_id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} className="text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
