import { useState, useEffect } from 'react';
import { notificationApi, useAuth } from '@plp/shared';

interface NotificationEntry {
  id: string;
  channel: string;
  subject: string;
  body: string;
  referenceType: string;
  status: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.userId) loadNotifications();
  }, [user]);

  async function loadNotifications() {
    setLoading(true);
    try {
      const res = await notificationApi.list(user!.userId);
      setNotifications(res.data?.data || []);
    } catch { setNotifications([]); }
    setLoading(false);
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Notifications</h1>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">No notifications yet</p>
          <p className="text-sm mt-1">You'll see loan updates, payment reminders and alerts here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div key={n.id} className="bg-white rounded-lg border p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">{n.subject}</p>
                  <p className="text-sm text-gray-600 mt-1">{n.body}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  n.status === 'SENT' ? 'bg-green-100 text-green-800' :
                  n.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-600'
                }`}>{n.status}</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
