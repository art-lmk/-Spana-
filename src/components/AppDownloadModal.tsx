import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Share,
  PlusSquare,
  MoreVertical,
  ExternalLink,
  CheckCircle2,
  Smartphone
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { SpanaLogo } from './SpanaLogo';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlatform?: 'android' | 'ios';
}

export const AppDownloadModal: React.FC<AppDownloadModalProps> = ({
  isOpen,
  onClose,
  initialPlatform
}) => {
  const { isInstallable, isIOS, playStoreUrl, appStoreUrl, install } = usePWAInstall();
  const [platform, setPlatform] = useState<'android' | 'ios'>(
    initialPlatform || (isIOS ? 'ios' : 'android')
  );
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPlatform(initialPlatform || (isIOS ? 'ios' : 'android'));
      setInstallSuccess(false);
    }
  }, [isOpen, initialPlatform, isIOS]);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    const accepted = await install();
    if (accepted) {
      setInstallSuccess(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#303C43]/65 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        id="app-download-modal"
        className="w-full max-w-md rounded-2xl bg-gradient-to-br from-[#F4F7FA] via-white to-[#FFF4EC] border border-[#303C43]/15 shadow-2xl overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-[#303C43]/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SpanaLogo size="sm" showTagline={false} />
            <div>
              <h3 className="text-base font-extrabold text-[#303C43] font-['Outfit',sans-serif]">
                Get the Spana App
              </h3>
              <p className="text-[11px] text-[#303C43]/70">
                Android (Google Play) &amp; iOS (App Store / iPhone)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#303C43]/60 hover:text-[#303C43] hover:bg-[#303C43]/10 transition cursor-pointer"
            aria-label="Close download modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Switcher Tabs */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#EBF0F5] border border-[#303C43]/10">
            <button
              type="button"
              onClick={() => setPlatform('android')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                platform === 'android'
                  ? 'bg-[#303C43] text-white shadow-xs'
                  : 'text-[#303C43]/75 hover:text-[#303C43]'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
              </svg>
              <span>Android / Play Store</span>
            </button>
            <button
              type="button"
              onClick={() => setPlatform('ios')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                platform === 'ios'
                  ? 'bg-[#303C43] text-white shadow-xs'
                  : 'text-[#303C43]/75 hover:text-[#303C43]'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.96 6.33c.64-.78 1.08-1.86.96-2.94-.93.04-2.06.62-2.72 1.4-.58.68-1.1 1.79-.96 2.84 1.04.08 2.08-.52 2.72-1.3z" />
              </svg>
              <span>iOS / App Store</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {installSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Spana has been installed to your device home screen!</span>
            </div>
          )}

          {platform === 'android' ? (
            <div className="space-y-4">
              {playStoreUrl ? (
                <a
                  href={playStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-[#303C43] hover:bg-[#F86828] text-white text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Open in Google Play Store</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : isInstallable ? (
                <button
                  type="button"
                  onClick={handleNativeInstall}
                  className="w-full py-3 px-4 rounded-xl bg-[#F86828] hover:bg-[#E05618] text-white text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Install Spana App Now (Android / Chrome)</span>
                </button>
              ) : (
                <div className="px-3.5 py-2.5 rounded-xl bg-[#FFF2EA] border border-[#F86828]/25 text-xs text-[#303C43] flex items-start gap-2.5">
                  <Smartphone className="w-4 h-4 text-[#F86828] shrink-0 mt-0.5" />
                  <span>
                    <strong className="font-bold">Instant Android Install Ready:</strong> Install Spana directly onto your phone as a standalone app with offline artisan caching.
                  </span>
                </div>
              )}

              <div className="space-y-2.5 text-xs text-[#303C43]/85">
                <p className="font-bold text-[#303C43] uppercase tracking-wider text-[11px]">
                  How to install on Android (Chrome / Edge):
                </p>
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-[#303C43]/12">
                  <span className="w-5 h-5 rounded-md bg-[#303C43] text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </span>
                  <p>
                    Open this site in <strong>Google Chrome</strong> on your Android phone and tap the{' '}
                    <MoreVertical className="w-3.5 h-3.5 inline text-[#F86828]" /> <strong>Menu</strong> icon (top-right).
                  </p>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-[#303C43]/12">
                  <span className="w-5 h-5 rounded-md bg-[#303C43] text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </span>
                  <p>
                    Tap <strong>Install app</strong> (or <strong>Add to Home screen</strong>) to place the Spana app icon on your Android home screen.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {appStoreUrl ? (
                <a
                  href={appStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-[#303C43] hover:bg-[#F86828] text-white text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Open in Apple App Store</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <div className="px-3.5 py-2.5 rounded-xl bg-[#EBF0F5] border border-[#303C43]/15 text-xs text-[#303C43] flex items-start gap-2.5">
                  <Smartphone className="w-4 h-4 text-[#303C43] shrink-0 mt-0.5" />
                  <span>
                    <strong className="font-bold">Install on iPhone &amp; iPad:</strong> Add Spana straight to your iOS Home Screen via Safari for full-screen native app launch.
                  </span>
                </div>
              )}

              <div className="space-y-2.5 text-xs text-[#303C43]/85">
                <p className="font-bold text-[#303C43] uppercase tracking-wider text-[11px]">
                  How to install on iPhone / iPad (iOS Safari):
                </p>
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-[#303C43]/12">
                  <span className="w-5 h-5 rounded-md bg-[#F86828] text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </span>
                  <p>
                    Open this link in <strong>Safari</strong>, then tap the{' '}
                    <Share className="w-3.5 h-3.5 inline text-[#F86828]" /> <strong>Share</strong> icon at the bottom (or top) of Safari.
                  </p>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-[#303C43]/12">
                  <span className="w-5 h-5 rounded-md bg-[#F86828] text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </span>
                  <p>
                    Scroll down and tap{' '}
                    <PlusSquare className="w-3.5 h-3.5 inline text-[#303C43]" /> <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-[#303C43]/10 flex items-center justify-between text-[11px] text-[#303C43]/70">
            <span>Works offline · Feature phone USSD: *384*45#</span>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-[#303C43] hover:bg-[#F86828] text-white font-semibold transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
