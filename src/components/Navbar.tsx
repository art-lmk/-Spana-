import React, { useState } from 'react';
import {
  CalendarCheck2,
  HardHat,
  Shield,
  LogOut,
  Bell,
  Menu,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { AppUser } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { SpanaLogo } from './SpanaLogo';

interface NavbarProps {
  currentUser?: AppUser | null;
  onOpenSignIn: () => void;
  onLogout?: () => void;
  onOpenBookings: () => void;
  activeBookingsCount: number;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  onOpenAdminPortal?: () => void;
  onOpenArtisanPortal?: () => void;
  onOpenGoogleSheetsModal?: () => void;
  activeSheetMeta?: { title: string; count: number; sheetName: string; spreadsheetId: string } | null;
}

const LANDING_NAV_LINKS = [
  { id: 'about-section', label: 'About' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'escrow-ussd', label: 'Escrow & USSD' },
  { id: 'artisan-map-section', label: 'Live Map' }
];

const CUSTOMER_NAV_LINKS = [
  { id: 'artisans-section', label: 'Nearby Artisans' },
  { id: 'artisan-map-section', label: 'Live Map' }
];

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenSignIn,
  onLogout,
  onOpenBookings,
  activeBookingsCount,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  onOpenAdminPortal,
  onOpenArtisanPortal,
  onOpenGoogleSheetsModal,
  activeSheetMeta
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navLinks = currentUser ? CUSTOMER_NAV_LINKS : LANDING_NAV_LINKS;

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (sectionId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-[#EBF0F5]/95 via-[#F6F8FA]/95 to-[#FFF1E8]/95 backdrop-blur-md border-b border-[#303C43]/15 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 min-h-[84px] py-1.5">
          {/* Zone 1: Clean, Prominent Top-Left Spana Logo (No Background Frame) */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('top');
            }}
            className="flex items-center shrink-0 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#F86828]"
            aria-label="Spana Home"
          >
            <SpanaLogo size="lg" />
          </a>

          {/* Zone 2: Clean Section Navigation Links */}
          <nav
            aria-label="Primary sections"
            className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#303C43]/80"
          >
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(link.id);
                }}
                className="hover:text-[#F86828] hover:underline underline-offset-8 decoration-[#F86828] decoration-2 transition-colors whitespace-nowrap shrink-0 py-1"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Zone 3: Primary Action (Sign In when logged out, Account controls when signed in) */}
          <div className="flex items-center gap-2.5 shrink-0">
            {!currentUser ? (
              <>
                <PWAInstallButton />
                <button
                  id="navbar-signin-btn"
                  type="button"
                  onClick={onOpenSignIn}
                  className="px-5 py-2.5 rounded-lg bg-[#303C43] hover:bg-[#F86828] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
                >
                  Sign In
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                {currentUser.role === 'artisan' && onOpenArtisanPortal && (
                  <button
                    id="artisan-hub-btn"
                    type="button"
                    onClick={onOpenArtisanPortal}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <HardHat className="w-3.5 h-3.5" />
                    <span>Artisan Hub</span>
                  </button>
                )}

                {currentUser.role === 'admin' && onOpenAdminPortal && (
                  <button
                    id="admin-portal-btn"
                    type="button"
                    onClick={onOpenAdminPortal}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2C353D] hover:bg-slate-800 text-white text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-orange-400" />
                    <span>Admin Portal</span>
                  </button>
                )}

                {currentUser.role === 'admin' && onOpenGoogleSheetsModal && (
                  <button
                    id="navbar-connect-sheet-btn"
                    type="button"
                    onClick={onOpenGoogleSheetsModal}
                    className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer"
                    title={
                      activeSheetMeta
                        ? `Active Sheet: ${activeSheetMeta.title} (${activeSheetMeta.count} artisans)`
                        : 'Connect Google Sheet or CSV'
                    }
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{activeSheetMeta ? 'Sheet Connected' : 'Connect Sheet'}</span>
                  </button>
                )}

                <button
                  id="bookings-modal-btn"
                  type="button"
                  onClick={onOpenBookings}
                  className="relative px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  title="View Bookings & Escrow Status"
                >
                  <CalendarCheck2 className="w-3.5 h-3.5 text-slate-700" />
                  <span className="hidden sm:inline">Bookings</span>
                  {activeBookingsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-orange-600 text-white text-[10px] font-bold tabular-nums">
                      {activeBookingsCount}
                    </span>
                  )}
                </button>

                {onOpenNotifications && (
                  <button
                    id="navbar-notifications-bell-btn"
                    type="button"
                    onClick={onOpenNotifications}
                    className="relative p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center tabular-nums">
                        {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                      </span>
                    )}
                  </button>
                )}

                <div className="hidden sm:flex items-center gap-2 pl-1">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName}
                      className="w-8 h-8 rounded-full border border-slate-300"
                      title={`${currentUser.displayName} (${currentUser.email})`}
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full bg-orange-100 text-orange-800 border border-orange-200 flex items-center justify-center font-bold text-xs"
                      title={currentUser.email}
                    >
                      {currentUser.displayName.charAt(0)}
                    </div>
                  )}
                </div>

                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-100 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(link.id);
                }}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-[#2C353D] transition"
              >
                {link.label}
              </a>
            ))}

            {currentUser?.role === 'artisan' && onOpenArtisanPortal && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenArtisanPortal();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-orange-700 hover:bg-orange-50 transition"
              >
                Return to Artisan Hub →
              </button>
            )}

            {currentUser?.role === 'admin' && onOpenAdminPortal && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdminPortal();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-[#2C353D] hover:bg-slate-100 transition"
              >
                Return to Admin Portal →
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
