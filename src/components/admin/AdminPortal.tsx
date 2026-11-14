import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Wallet, 
  Calendar, 
  FileSpreadsheet, 
  ArrowLeft, 
  ShieldCheck, 
  LogOut, 
  HardHat, 
  Layers,
  Sparkles,
  Bell,
  Send,
  CheckCircle2,
  Clock,
  Activity,
  Cpu
} from 'lucide-react';
import { Fundi, BookingResponse, EscrowTransaction, EscrowStatus, AppUser } from '../../types';
import { formatCurrency } from '../../utils/format';
import { AdminAnalyticsTab } from './AdminAnalyticsTab';
import { AdminEscrowTab } from './AdminEscrowTab';
import { AdminBookingsTab } from './AdminBookingsTab';
import { AdminSheetsTab } from './AdminSheetsTab';
import { AdminOpsTab } from './AdminOpsTab';
import { NotificationsModal } from '../NotificationsModal';

interface AdminPortalProps {
  fundis: Fundi[];
  bookings: BookingResponse[];
  escrowTransactions: EscrowTransaction[];
  onUpdateEscrowStatus: (transactionId: string, newStatus: EscrowStatus, notes?: string) => void;
  onUpdateBookingStatus: (bookingId: string, newStatus: BookingResponse['status']) => void;
  onDispatchCash?: (bookingId: string) => Promise<void>;
  activeSheetMeta?: {
    title: string;
    count: number;
    sheetName: string;
    spreadsheetId: string;
  } | null;
  onOpenGoogleSheetsModal: () => void;
  onClearCustomDataset: () => void;
  onOpenFastApiModal: () => void;
  isFastApiActive?: boolean;
  onExitAdmin: () => void;
  onLogout: () => void;
  currentUser: AppUser;
}

export type AdminTab = 'analytics' | 'escrow' | 'bookings' | 'sheets' | 'ops';

export const AdminPortal: React.FC<AdminPortalProps> = ({
  fundis,
  bookings,
  escrowTransactions,
  onUpdateEscrowStatus,
  onUpdateBookingStatus,
  onDispatchCash,
  activeSheetMeta,
  onOpenGoogleSheetsModal,
  onClearCustomDataset,
  onOpenFastApiModal,
  isFastApiActive = false,
  onExitAdmin,
  onLogout,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [payoutToast, setPayoutToast] = useState<string | null>(null);

  // Poll unread notifications count for admin
  const fetchUnreadCount = async () => {
    try {
      const res = await fetch('/api/notifications?role=admin');
      if (res.ok) {
        const notifs = await res.json();
        if (Array.isArray(notifs)) {
          setUnreadNotificationsCount(notifs.filter((n: any) => !n.read).length);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch admin notifications:', err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const timer = setInterval(fetchUnreadCount, 8000);
    return () => clearInterval(timer);
  }, []);

  const pendingEscrow = escrowTransactions.filter(e => e.status === 'held_in_escrow').length;
  const pendingBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending_fundi_ack' || b.status === 'client_completed').length;
  const pendingCashDispatchBookings = bookings.filter(b => b.status === 'client_completed');

  const handleDispatchCashInternal = async (bookingId: string) => {
    setDispatchingId(bookingId);
    try {
      if (onDispatchCash) {
        await onDispatchCash(bookingId);
      } else {
        const res = await fetch(`/api/bookings/${bookingId}/dispatch-cash`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
          const data = await res.json();
          onUpdateBookingStatus(bookingId, 'completed');
          setPayoutToast(`Funds dispatched successfully! M-Pesa Payout Ref: ${data.mpesaPayoutRef}`);
          setTimeout(() => setPayoutToast(null), 6000);
        }
      }
      fetchUnreadCount();
    } catch (err) {
      console.error('Failed to dispatch cash:', err);
    } finally {
      setDispatchingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col">
      
      {/* Top Admin Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
            
            {/* Left: Brand & Admin Badge */}
            <div className="flex items-center gap-3">
              <button
                onClick={onExitAdmin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
                title="Preview the customer marketplace as Admin"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Preview Marketplace</span>
              </button>

              <div className="h-6 w-px bg-slate-700 hidden sm:block" />

              <div className="flex items-center gap-2.5">
                <div className="bg-white px-2.5 py-1 rounded-lg shadow-xs shrink-0 flex items-center">
                  <img
                    src="/assets/aistudio/image_26f206ae_4bec248c.jpg"
                    alt="Spana"
                    className="h-6 w-auto object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Admin Portal
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 hidden md:block">
                    Sheets Dataset • Escrow Holding Vault • Live Bookings • Visualizations
                  </p>
                </div>
              </div>
            </div>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-3">
              
              {/* Admin Notifications Bell */}
              <button
                id="admin-notifications-bell-btn"
                onClick={() => setIsNotificationsOpen(true)}
                className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                title="View Admin Alerts & Booking Requests"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-xs">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>

              <div className="hidden sm:flex items-center gap-2 text-right">
                <div>
                  <div className="text-xs font-bold text-white truncate max-w-[150px]">
                    {currentUser.displayName}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {currentUser.email}
                  </div>
                </div>
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName}
                    className="w-8 h-8 rounded-full border border-slate-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-xs">
                    {currentUser.displayName.charAt(0)}
                  </div>
                )}
              </div>

              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 hover:text-rose-200 text-slate-300 text-xs font-bold transition border border-slate-700 cursor-pointer"
                title="Sign out of Spana"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>

          </div>
        </div>

        {/* Tab Navigation Sub-bar */}
        <div className="bg-slate-950/70 border-t border-slate-800 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto py-2">
            
            {/* Analytics Tab */}
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                activeTab === 'analytics'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics & Insights</span>
            </button>

            {/* Escrow & Holding Money Tab */}
            <button
              onClick={() => setActiveTab('escrow')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 relative ${
                activeTab === 'escrow'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Escrow & Holding Vault</span>
              {pendingEscrow > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                  {pendingEscrow}
                </span>
              )}
            </button>

            {/* Bookings Tab */}
            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 relative ${
                activeTab === 'bookings'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Bookings Queue</span>
              {pendingBookings > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-blue-400 text-slate-950">
                  {pendingBookings}
                </span>
              )}
            </button>

            {/* Google Sheets Tab */}
            <button
              onClick={() => setActiveTab('sheets')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                activeTab === 'sheets'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Google Sheets Dataset</span>
              {activeSheetMeta && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </button>

            {/* System Reliability & Ops Tab */}
            <button
              onClick={() => setActiveTab('ops')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                activeTab === 'ops'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-amber-400/90 hover:text-amber-300 hover:bg-slate-900'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Reliability & Ops Console</span>
            </button>

            {/* Connect External ML Model (FastAPI / Colab) Button */}
            <button
              type="button"
              onClick={onOpenFastApiModal}
              className={`ml-auto flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer border ${
                isFastApiActive
                  ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30'
                  : 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/30'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>{isFastApiActive ? 'ML Model Connected' : 'Connect ML Model (FastAPI)'}</span>
              <span className={`w-2 h-2 rounded-full ${isFastApiActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            </button>

          </div>
        </div>
      </header>

      {/* Admin Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">

        {/* Payout Success Toast */}
        {payoutToast && (
          <div className="mb-6 p-4 bg-emerald-900/90 border border-emerald-500 text-white rounded-2xl flex items-center justify-between gap-3 shadow-lg animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-xs sm:text-sm font-bold">{payoutToast}</p>
            </div>
            <button
              onClick={() => setPayoutToast(null)}
              className="text-emerald-300 hover:text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-emerald-800/50 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Action Required Banner: Client Completed Job Ready for Cash Dispatch */}
        {pendingCashDispatchBookings.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-5 rounded-3xl shadow-lg border border-amber-400/40 animate-in slide-in-from-top duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="p-3 bg-black/30 rounded-2xl shrink-0">
                  <Send className="w-6 h-6 text-amber-200 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-extrabold text-white">
                      Action Required: Client Confirmed Job Completion
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white text-orange-800 shadow-xs">
                      {pendingCashDispatchBookings.length} Ready to Dispatch
                    </span>
                  </div>
                  <p className="text-xs text-amber-100 mt-1 max-w-2xl leading-relaxed">
                    Client <strong>{pendingCashDispatchBookings[0].details?.customerName || 'Client'}</strong> signed off on work completed by <strong>{pendingCashDispatchBookings[0].details?.fundiName || 'Artisan'}</strong> ({pendingCashDispatchBookings[0].bookingId}). You are now authorized to dispatch KES <strong>{formatCurrency(pendingCashDispatchBookings[0].details?.estimatedCostKes ?? (pendingCashDispatchBookings[0].details as any)?.agreedFeeKes ?? 0)}</strong> to the artisan via M-Pesa.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
                <button
                  disabled={dispatchingId === pendingCashDispatchBookings[0].bookingId}
                  onClick={() => handleDispatchCashInternal(pendingCashDispatchBookings[0].bookingId)}
                  className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-md cursor-pointer border border-amber-400/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-emerald-400" />
                  <span>
                    {dispatchingId === pendingCashDispatchBookings[0].bookingId 
                      ? 'Dispatching via M-Pesa...' 
                      : `Dispatch KES ${formatCurrency(pendingCashDispatchBookings[0].details?.estimatedCostKes ?? (pendingCashDispatchBookings[0].details as any)?.agreedFeeKes ?? 0)} via M-Pesa`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <AdminAnalyticsTab
            fundis={fundis}
            bookings={bookings}
            escrowTransactions={escrowTransactions}
            sheetTitle={activeSheetMeta?.title}
            sheetRowsCount={activeSheetMeta?.count}
          />
        )}

        {activeTab === 'escrow' && (
          <AdminEscrowTab
            escrowTransactions={escrowTransactions}
            onUpdateEscrowStatus={onUpdateEscrowStatus}
          />
        )}

        {activeTab === 'bookings' && (
          <AdminBookingsTab
            bookings={bookings}
            onUpdateBookingStatus={onUpdateBookingStatus}
            onDispatchCash={handleDispatchCashInternal}
          />
        )}

        {activeTab === 'sheets' && (
          <AdminSheetsTab
            fundis={fundis}
            activeSheetMeta={activeSheetMeta}
            onOpenGoogleSheetsModal={onOpenGoogleSheetsModal}
            onClearCustomDataset={onClearCustomDataset}
          />
        )}

        {activeTab === 'ops' && (
          <AdminOpsTab />
        )}
      </main>

      {/* Notifications Drawer / Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => {
          setIsNotificationsOpen(false);
          fetchUnreadCount();
        }}
        userRole="admin"
        onDispatchCash={handleDispatchCashInternal}
        onOpenBookings={() => {
          setActiveTab('bookings');
          setIsNotificationsOpen(false);
        }}
      />

    </div>
  );
};
