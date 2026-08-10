import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, AppContext } from './context/AppContext';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/common/Toast';
import { useIsDesktop } from './hooks/useMediaQuery';
import { useContext } from 'react';

const ScannerPage = lazy(() => import('./pages/Scanner').then(m => ({ default: m.ScannerPage })));
const HistoryPage = lazy(() => import('./pages/History').then(m => ({ default: m.HistoryPage })));
const FavoritesPage = lazy(() => import('./pages/Favorites').then(m => ({ default: m.FavoritesPage })));
const SettingsPage = lazy(() => import('./pages/Settings').then(m => ({ default: m.SettingsPage })));

const PageSkeleton = () => (
  <div className="flex-1 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const AppShell: React.FC = () => {
  const isDesktop = useIsDesktop();
  const { toasts, dismissToast } = useContext(AppContext);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white overflow-hidden">
      {/* Sidebar (desktop only) */}
      {isDesktop && <Sidebar />}

      {/* Main content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${isDesktop ? 'ml-60' : ''}`}>
        {/* Mobile header only */}
        {!isDesktop && <Header />}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full pb-20 lg:pb-0">
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
                <Route path="/" element={<ScannerPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
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
      <AppProvider>
        <AppShell />
      </AppProvider>
    </BrowserRouter>
  );
}
