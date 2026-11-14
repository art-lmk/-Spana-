import React, { useEffect, useState } from 'react';
import { 
  X, 
  Bell, 
  CheckCheck, 
  HardHat, 
  CheckCircle2, 
  Clock, 
  Send, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Zap,
  CalendarCheck
} from 'lucide-react';
import { AppNotification } from '../types';
import { formatCurrency } from '../utils/format';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'admin' | 'artisan' | 'customer';
  userId?: string;
  onDispatchCash?: (bookingId: string) => void;
  onOpenBookings?: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  userRole,
  userId,
  onDispatchCash,
  onOpenBookings
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      let endpoint = `/api/notifications?role=${encodeURIComponent(userRole)}`;
      if (userId && userRole === 'artisan') {
        endpoint += `&recipientId=${encodeURIComponent(userId)}`;
      }
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, userRole, userId]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: userRole, recipientId: userId })
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div 
        id="notifications-modal-container"
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-md shadow-orange-500/20">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black font-['Outfit',sans-serif] flex items-center gap-2">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-600 text-white">
                      {unreadCount} new
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-300">
                  {userRole === 'admin' 
                    ? 'Admin Alert Desk: Booking dispatches & escrow payouts'
                    : userRole === 'artisan' 
                    ? 'Artisan Job Alerts & M-Pesa Disbursements' 
                    : 'Your Service Updates & Booking Milestones'}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Mark read</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 divide-y divide-slate-100 space-y-3">
          {loading && notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Clock className="w-8 h-8 mx-auto animate-spin mb-2" />
              <p className="text-xs font-semibold">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Bell className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No notifications yet</p>
              <p className="text-xs max-w-xs mx-auto">
                Notifications will appear here when client requests are placed, work is completed, and cash is dispatched.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isUrgentAdminAction = userRole === 'admin' && notif.type === 'client_completed';
              
              return (
                <div 
                  key={notif.id}
                  onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                  className={`pt-3 first:pt-0 p-3 rounded-2xl transition cursor-pointer ${
                    !notif.read ? 'bg-orange-50/50 border border-orange-200/70' : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon based on type */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      notif.type === 'client_completed'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : notif.type === 'cash_dispatched'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : notif.type === 'booking_created'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-700 text-white'
                    }`}>
                      {notif.type === 'client_completed' ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : notif.type === 'cash_dispatched' ? (
                        <Send className="w-5 h-5" />
                      ) : notif.type === 'booking_created' ? (
                        <CalendarCheck className="w-5 h-5" />
                      ) : (
                        <Bell className="w-5 h-5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">
                          {formatTime(notif.timestamp)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Action Pills & Meta */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        {notif.bookingId && (
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                            {notif.bookingId}
                          </span>
                        )}
                        {notif.amountKes !== undefined && notif.amountKes !== null && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                            KES {formatCurrency(notif.amountKes)}
                          </span>
                        )}
                        {notif.mpesaRef && (
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200">
                            M-Pesa: {notif.mpesaRef}
                          </span>
                        )}

                        {/* Admin Action Button inside notification */}
                        {isUrgentAdminAction && notif.bookingId && onDispatchCash && (
                          <button
                            id={`dispatch-cash-btn-${notif.bookingId}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDispatchCash(notif.bookingId!);
                              handleMarkAsRead(notif.id);
                              onClose();
                            }}
                            className="ml-auto text-xs px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1 shadow-sm"
                          >
                            <span>Dispatch Cash</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>M-Pesa Escrow Protected</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenBookings && (
              <button
                onClick={() => {
                  onClose();
                  onOpenBookings();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition"
              >
                View Bookings
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
