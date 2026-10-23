import React, { Suspense, lazy, useEffect, useContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, AppContext } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/common/Toast';
import { useIsDesktop } from './hooks/useMediaQuery';
import { trackVisitor } from './services/tracker';

const ScannerPage = lazy(() => import('./pages/Scanner').then(m => ({ default: m.ScannerPage })));
const HistoryPage = lazy(() => import('./pages/History').then(m => ({ default: m.HistoryPage })));
const FavoritesPage = lazy(() => import('./pages/Favorites').then(m => ({ default: m.FavoritesPage })));
const SettingsPage = lazy(() => import('./pages/Settings').then(m => ({ default: m.SettingsPage })));
const AboutPage = lazy(() => import('./pages/About').then((m) => ({ default: m.AboutPage })));
const UpgradePage = lazy(() => import('./pages/Upgrade').then(m => ({ default: m.UpgradePage })));
const GeneratorPage = lazy(() => import('./pages/Generator').then(m => ({ default: m.GeneratorPage })));
const AuthPage = lazy(() => import('./pages/Auth').then(m => ({ default: m.AuthPage })));

const PageSkeleton = () => (
  <div className="p-4 space-y-4 animate-pulse">
    <div className="h-48 bg-slate-200 dark:bg-white/5 rounded-2xl w-full max-w-sm mx-auto" />
    <div className="h-10 bg-slate-200 dark:bg-white/5 rounded-xl w-3/4 mx-auto" />
  </div>
);

const AppShell: React.FC = () => {
  const isDesktop = useIsDesktop();
  const { toasts, dismissToast } = useContext(AppContext);
  const { user, loading } = useAuth();

  // Realtime visitor tracking to Telegram (once per session)
  useEffect(() => {
    if (!loading) {
      trackVisitor(user);
    }
  }, [user, loading]);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white overflow-hidden relative selection:bg-indigo-500/30">
      {/* Subtle modern background gradient (visible mainly in dark mode) */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-slate-950/0 to-slate-950/0 dark:from-indigo-500/5 dark:via-slate-950/0 dark:to-slate-950/0" />

      {/* Sidebar (desktop only) */}
      {isDesktop && <Sidebar />}

      {/* Main content */}
      <div className={`flex-1 flex flex-col overflow-hidden relative z-10 ${isDesktop ? 'ml-60' : ''}`}>
        {/* Mobile header only */}
        {!isDesktop && <Header />}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scroll-smooth scrollbar-none">
          <div className="min-h-full pb-24 lg:pb-8">
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
                <Route path="/" element={<ScannerPage />} />
                <Route path="/generate" element={<GeneratorPage />} />
                <Route path="/upgrade" element={<UpgradePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/register" element={<AuthPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/about" element={<AboutPage />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>

      {/* Bottom nav (mobile only) */}
      {!isDesktop && <BottomNavigation />}

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <AppShell />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
