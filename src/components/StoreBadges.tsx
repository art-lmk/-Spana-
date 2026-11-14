import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AppDownloadModal } from './AppDownloadModal';

interface StoreBadgesProps {
  compact?: boolean;
}

export const StoreBadges: React.FC<StoreBadgesProps> = ({ compact = false }) => {
  const { isInstalled, isInstallable, playStoreUrl, appStoreUrl, install } = usePWAInstall();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPlatform, setModalPlatform] = useState<'android' | 'ios'>('android');

  if (isInstalled) {
    return null;
  }

  const handleAndroidClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) return;
    }
    setModalPlatform('android');
    setModalOpen(true);
  };

  const handleIosClick = () => {
    setModalPlatform('ios');
    setModalOpen(true);
  };

  const badgeBase = compact
    ? 'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#303C43] hover:bg-[#F86828] text-white border border-[#303C43]/20 transition-colors cursor-pointer shadow-xs'
    : 'inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#303C43] hover:bg-[#F86828] text-white border border-[#303C43]/20 transition-colors cursor-pointer shadow-sm';

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Google Play / Android */}
        {playStoreUrl ? (
          <a
            href={playStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={badgeBase}
            aria-label="Get Spana on Google Play Store"
          >
            <svg className="w-4 h-4 shrink-0 text-[#FF9B6B]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
            </svg>
            <div className="text-left leading-tight">
              <span className="block text-[9px] uppercase tracking-wider text-slate-300">Get it on</span>
              <span className="block text-xs font-bold">Google Play</span>
            </div>
          </a>
        ) : (
          <button
            type="button"
            onClick={handleAndroidClick}
            className={badgeBase}
            aria-label="Install Spana Android App (Google Play / PWA)"
          >
            <svg className="w-4 h-4 shrink-0 text-[#FF9B6B]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
            </svg>
            <div className="text-left leading-tight">
              <span className="block text-[9px] uppercase tracking-wider text-slate-300">Android App</span>
              <span className="block text-xs font-bold">Google Play</span>
            </div>
          </button>
        )}

        {/* Apple App Store / iOS */}
        {appStoreUrl ? (
          <a
            href={appStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={badgeBase}
            aria-label="Download Spana on the App Store"
          >
            <svg className="w-4 h-4 shrink-0 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.96 6.33c.64-.78 1.08-1.86.96-2.94-.93.04-2.06.62-2.72 1.4-.58.68-1.1 1.79-.96 2.84 1.04.08 2.08-.52 2.72-1.3z" />
            </svg>
            <div className="text-left leading-tight">
              <span className="block text-[9px] uppercase tracking-wider text-slate-300">Download on the</span>
              <span className="block text-xs font-bold">App Store</span>
            </div>
          </a>
        ) : (
          <button
            type="button"
            onClick={handleIosClick}
            className={badgeBase}
            aria-label="Install Spana iOS App (App Store / iPhone)"
          >
            <svg className="w-4 h-4 shrink-0 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.96 6.33c.64-.78 1.08-1.86.96-2.94-.93.04-2.06.62-2.72 1.4-.58.68-1.1 1.79-.96 2.84 1.04.08 2.08-.52 2.72-1.3z" />
            </svg>
            <div className="text-left leading-tight">
              <span className="block text-[9px] uppercase tracking-wider text-slate-300">iPhone &amp; iPad</span>
              <span className="block text-xs font-bold">App Store</span>
            </div>
          </button>
        )}
      </div>

      <AppDownloadModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialPlatform={modalPlatform}
      />
    </>
  );
};
