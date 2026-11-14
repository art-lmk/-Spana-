import React, { useState } from 'react';
import { WifiOff, Wifi, PhoneCall, RefreshCw, CheckCircle, ChevronRight, X } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { getCacheMetadata } from '../lib/offlineArtisanCache';

interface OfflineIndicatorProps {
  onRetrySync?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onRetrySync }) => {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const cacheMeta = getCacheMetadata();

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/categories', { method: 'HEAD', cache: 'no-store' });
      if (res.ok && onRetrySync) {
        onRetrySync();
      }
    } catch {
      // Still offline
    } finally {
      setTimeout(() => setIsChecking(false), 800);
    }
  };

  if (wasOffline && isOnline) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xl animate-in slide-in-from-bottom-3 duration-300">
        <CheckCircle className="w-4 h-4 text-emerald-100" />
        <span>Back online! Artisan directory and live escrow synchronized.</span>
      </div>
    );
  }

  if (isOnline || dismissed) return null;

  return (
    <aside aria-label="Offline Mode Notification" className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50">
      <div className="rounded-2xl bg-slate-900/95 text-white p-4 shadow-2xl border border-amber-500/40 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-xs text-amber-400 uppercase tracking-wider">
                <WifiOff className="w-3.5 h-3.5" />
                Offline Mode (Service Worker Active)
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Browsing <strong className="text-white font-bold">{cacheMeta.artisanCount}</strong> cached artisans &{' '}
                <strong className="text-white font-bold">{cacheMeta.categoryCount || 10}</strong> trade categories.
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-sm font-mono font-bold text-[10px]">
              *384*45#
            </span>
            <span>Feature phone USSD works with zero internet</span>
          </div>

          <button
            onClick={handleManualCheck}
            disabled={isChecking}
            className="inline-flex items-center gap-1 text-slate-300 hover:text-white font-medium transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin text-amber-400' : ''}`} />
            <span>Check link</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
