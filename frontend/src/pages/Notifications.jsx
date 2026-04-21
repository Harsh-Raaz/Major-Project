import { useState, useEffect } from 'react';
import AppLayout from '../layouts/AppLayout';
import { getPatientNotifications } from '../api/patient';
import Loader from '../components/Loader';
import { Bell, Trash2 } from 'lucide-react';
import { getPatient } from '../utils/storage';

export default function Notifications() {
  const patient = getPatient();
  const patientId = patient?._id || patient?.id;
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [readNotifications, setReadNotifications] = useState(new Set());

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await getPatientNotifications(patientId);
        const items = response.data?.notifications || response.data || [];
        setNotifications(items);
      } catch (error) {
        console.error('Failed to load notifications', error);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      loadNotifications();
    } else {
      setLoading(false);
    }
  }, [patientId]);

  const markAsRead = (index) => {
    setReadNotifications(new Set([...readNotifications, index]));
  };

  const deleteNotification = (index) => {
    setNotifications(notifications.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <AppLayout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-blue-950">Notifications</h2>
            <p className="mt-2 text-blue-700">
              Stay updated with your appointments and reminders
            </p>
          </div>
          <div className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
            {notifications.length - readNotifications.size} new
          </div>
        </div>

        {loading ? (
          <div className="mt-10 flex justify-center">
            <Loader />
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification, index) => {
              const isRead = readNotifications.has(index);
              const priority = notification.priority || 'normal';

              return (
                <div
                  key={index}
                  className={`rounded-xl border p-4 transition ${
                    isRead
                      ? 'border-blue-100 bg-white'
                      : priority === 'critical'
                        ? 'border-red-100 bg-red-50'
                        : priority === 'high'
                          ? 'border-orange-100 bg-orange-50'
                          : 'border-yellow-100 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex flex-1 items-start gap-3">
                      <div
                        className={`mt-1 rounded-full p-2 ${
                          priority === 'critical'
                            ? 'bg-red-100'
                            : priority === 'high'
                              ? 'bg-orange-100'
                              : 'bg-yellow-100'
                        }`}
                      >
                        {priority === 'critical' || priority === 'high' ? (
                          <div className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
                        ) : (
                          <Bell size={16} className="text-yellow-600" />
                        )}
                      </div>

                      <div className="flex-1">
                        <p
                          className={`font-semibold ${
                            isRead ? 'text-blue-700' : 'text-blue-950'
                          }`}
                        >
                          {notification.title || notification.message}
                        </p>
                        {notification.message && notification.title && (
                          <p className="mt-1 text-sm text-blue-700">
                            {notification.message}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-blue-600">
                          {new Date().toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div className="ml-2 flex gap-2">
                      {!isRead && (
                        <button
                          onClick={() => markAsRead(index)}
                          className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(index)}
                        className="rounded-lg border border-red-200 p-1 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-blue-100 p-8 text-center">
            <Bell size={40} className="mx-auto mb-3 text-blue-400" />
            <p className="text-lg font-semibold text-blue-900">All caught up!</p>
            <p className="text-sm text-blue-700">
              You have no notifications at the moment
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
