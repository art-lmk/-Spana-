import React, { useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AppDownloadModal } from './AppDownloadModal';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) return;
    }
    setShowDownloadModal(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#303C43]/20 bg-white/85 hover:bg-white text-[#303C43] hover:text-[#F86828] text-xs font-bold transition cursor-pointer shadow-xs whitespace-nowrap"
        title="Install Spana on Android (Google Play / Chrome) or iOS (iPhone / iPad)"
      >
        {isInstallable ? (
          <>
            <Download className="w-3.5 h-3.5 text-[#F86828]" />
            <span>Install App</span>
          </>
        ) : (
          <>
            <Smartphone className="w-3.5 h-3.5 text-[#F86828]" />
            <span>{isIOS ? 'Get iOS App' : 'Get App'}</span>
          </>
        )}
      </button>

      <AppDownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        initialPlatform={isIOS ? 'ios' : 'android'}
      />
    </>
  );
};
