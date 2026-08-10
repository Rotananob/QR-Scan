import React, { useContext } from 'react';
import {
  Sun, Moon, Monitor, Shield, Trash2, Info
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { AppContext } from '../context/AppContext';
import type { AppSettings } from '../types/qr';

const ThemeOption: React.FC<{
  value: AppSettings['theme'];
  current: AppSettings['theme'];
  icon: React.ReactNode;
  label: string;
  onSelect: () => void;
}> = ({ value, current, icon, label, onSelect }) => (
  <button
    onClick={onSelect}
    aria-pressed={current === value}
    className={`flex-1 flex flex-col items-center gap-2 py-3 px-2 rounded-xl border-2 transition-all ${
      current === value
        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
        : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20'
    }`}
  >
    {icon}
    <span className="text-xs font-medium">{label}</span>
  </button>
);

const Toggle: React.FC<{
  checked: boolean;
  onChange: () => void;
  id: string;
  label: string;
  description?: string;
}> = ({ checked, onChange, id, label, description }) => (
  <div className="flex items-center justify-between py-3">
    <div className="pr-4">
      <label htmlFor={id} className="text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer">
        {label}
      </label>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      )}
    </div>
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex w-11 h-6 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
        checked ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
      }`}
    >
      <span
        className={`inline-block w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${
          checked ? 'translate-x-5.5' : 'translate-x-0.5'
        }`}
      />
    </button>
  </div>
);

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, clearAll, showToast, history } = useContext(AppContext);
  const [clearConfirmOpen, setClearConfirmOpen] = React.useState(false);

  const handleClearAll = async () => {
    await clearAll();
    setClearConfirmOpen(false);
    showToast('All data cleared', 'success');
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
      </div>

      <div className="flex-1 px-4 pb-24 space-y-5 max-w-lg mx-auto w-full">
        {/* Appearance */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
            Appearance
          </h3>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/10 p-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Theme</p>
            <div className="flex gap-3">
              <ThemeOption
                value="light"
                current={settings.theme}
                icon={<Sun className="w-5 h-5" />}
                label="Light"
                onSelect={() => updateSettings({ theme: 'light' })}
              />
              <ThemeOption
                value="dark"
                current={settings.theme}
                icon={<Moon className="w-5 h-5" />}
                label="Dark"
                onSelect={() => updateSettings({ theme: 'dark' })}
              />
              <ThemeOption
                value="system"
                current={settings.theme}
                icon={<Monitor className="w-5 h-5" />}
                label="System"
                onSelect={() => updateSettings({ theme: 'system' })}
              />
            </div>
          </div>
        </section>

        {/* Scanner */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
            Scanner
          </h3>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/10 px-4 divide-y divide-gray-100 dark:divide-white/10">
            <Toggle
              id="auto-start"
              checked={settings.autoStartScanner}
              onChange={() => updateSettings({ autoStartScanner: !settings.autoStartScanner })}
              label="Auto-start scanner"
              description="Start camera automatically when opening the app"
            />
            <Toggle
              id="prevent-duplicates"
              checked={settings.preventDuplicates}
              onChange={() => updateSettings({ preventDuplicates: !settings.preventDuplicates })}
              label="Prevent duplicate scans"
              description="Ignore the same QR code scanned within 2 seconds"
            />
            <Toggle
              id="vibrate"
              checked={settings.vibrate}
              onChange={() => updateSettings({ vibrate: !settings.vibrate })}
              label="Vibrate on scan"
              description="Haptic feedback when QR code is detected"
            />
            <Toggle
              id="sound"
              checked={settings.sound}
              onChange={() => updateSettings({ sound: !settings.sound })}
              label="Sound on scan"
              description="Play a sound when QR code is detected"
            />
          </div>
        </section>

        {/* History */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
            History
          </h3>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/10 px-4 divide-y divide-gray-100 dark:divide-white/10">
            <Toggle
              id="auto-save"
              checked={settings.autoSave}
              onChange={() => updateSettings({ autoSave: !settings.autoSave })}
              label="Auto-save scans"
              description="Automatically save each scan to history"
            />
            <div className="py-3">
              <Button
                variant="outline"
                onClick={() => setClearConfirmOpen(true)}
                className="gap-2 text-red-500 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
              >
                <Trash2 className="w-4 h-4" />
                Clear All History ({history.length} items)
              </Button>
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
            Privacy
          </h3>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/10 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Local-first privacy</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Your scan history is stored exclusively on this device. QR Scan does not upload camera frames, scan data, or any personal information to any server. No account required.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* About */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
            About
          </h3>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Info className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">QR Scan</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Version 1.0.0 · Fast & Private</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Modal open={clearConfirmOpen} onClose={() => setClearConfirmOpen(false)} title="Clear All Data">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            This will permanently delete all {history.length} scan{history.length !== 1 ? 's' : ''} from your history. This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setClearConfirmOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="danger" onClick={handleClearAll} className="flex-1">
              Clear All
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
