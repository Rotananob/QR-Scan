import React, { useContext } from 'react';
import {
  Sun, Moon, Monitor, Shield, Trash2, Info, Globe, Crown, ArrowRight, User
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { AppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
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
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { settings, updateSettings, clearAll, showToast, history } = useContext(AppContext);
  const { user, isLifetime } = useAuth();
  const [clearConfirmOpen, setClearConfirmOpen] = React.useState(false);

  const handleClearAll = async () => {
    await clearAll();
    setClearConfirmOpen(false);
    showToast(t('settings.clearAllData'), 'success');
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('qr-scan-lang', lang);
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h2>
      </div>

      <div className="flex-1 px-4 pb-24 space-y-5 max-w-lg mx-auto w-full">
        {/* VIP Membership & Account Status */}
        <section>
          <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/20 text-white relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Crown className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm">
                  {isLifetime ? 'Lifetime VIP Member' : 'Standard Free User'}
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isLifetime
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-white/10 text-slate-300'
              }`}>
                {isLifetime ? 'មួយជីវិត (Active)' : 'Free'}
              </span>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {isLifetime
                ? 'អ្នកកំពុងរីករាយជាមួយមុខងារ VIP ពេញលេញ រួមមាន Cloud Sync, Pro Generator, និង Unlimited History។'
                : 'ជាវ Lifetime VIP ត្រឹមតែ $3.00 មួយជីវិត ដើម្បីដោះសោមុខងារគ្មានដែនកំណត់។'}
            </p>

            <div className="flex items-center gap-2">
              {!isLifetime ? (
                <button
                  type="button"
                  onClick={() => navigate('/upgrade')}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-300" />
                  ជាវ Lifetime ($3.00)
                  <ArrowRight className="w-3 h-3" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/generate')}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all"
                >
                  ប្រើប្រាស់ QR Generator
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="px-3.5 py-2.5 rounded-xl border border-white/15 hover:bg-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                {user ? (user.displayName || 'គណនី') : 'ចូលប្រើ (Login)'}
              </button>
            </div>
          </div>
        </section>

        {/* Language */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
            {t('settings.language')}
          </h3>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/10 p-4">
            <div className="flex items-center gap-4">
              <Globe className="w-5 h-5 text-gray-500" />
              <select
                value={i18n.language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="flex-1 bg-transparent text-sm font-medium text-gray-900 dark:text-white focus:outline-none"
              >
                <option value="en">English</option>
                <option value="km">ខ្មែរ (Khmer)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
            {t('settings.appearance')}
          </h3>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/10 p-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('settings.theme')}</p>
            <div className="flex gap-3">
              <ThemeOption
                value="light"
                current={settings.theme}
                icon={<Sun className="w-5 h-5" />}
                label={t('settings.light')}
                onSelect={() => updateSettings({ theme: 'light' })}
              />
              <ThemeOption
                value="dark"
                current={settings.theme}
                icon={<Moon className="w-5 h-5" />}
                label={t('settings.dark')}
                onSelect={() => updateSettings({ theme: 'dark' })}
              />
              <ThemeOption
                value="system"
                current={settings.theme}
                icon={<Monitor className="w-5 h-5" />}
                label={t('settings.system')}
                onSelect={() => updateSettings({ theme: 'system' })}
              />
            </div>
          </div>
        </section>

        {/* Scanner */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
            {t('settings.scanner')}
          </h3>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/10 px-4 divide-y divide-gray-100 dark:divide-white/10">
            <Toggle
              id="auto-start"
              checked={settings.autoStartScanner}
              onChange={() => updateSettings({ autoStartScanner: !settings.autoStartScanner })}
              label={t('settings.autoStart')}
              description={t('settings.autoStartDesc')}
            />
            <Toggle
              id="prevent-duplicates"
              checked={settings.preventDuplicates}
              onChange={() => updateSettings({ preventDuplicates: !settings.preventDuplicates })}
              label={t('settings.preventDupes')}
              description={t('settings.preventDupesDesc')}
            />
            <Toggle
              id="vibrate"
              checked={settings.vibrate}
              onChange={() => updateSettings({ vibrate: !settings.vibrate })}
              label={t('settings.vibrate')}
              description={t('settings.vibrateDesc')}
            />
            <Toggle
              id="sound"
              checked={settings.sound}
              onChange={() => updateSettings({ sound: !settings.sound })}
              label={t('settings.sound')}
              description={t('settings.soundDesc')}
            />
          </div>
        </section>

        {/* History */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
            {t('history.title')}
          </h3>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/10 px-4 divide-y divide-gray-100 dark:divide-white/10">
            <Toggle
              id="auto-save"
              checked={settings.autoSave}
              onChange={() => updateSettings({ autoSave: !settings.autoSave })}
              label={t('settings.autoSave')}
              description={t('settings.autoSaveDesc')}
            />
            <div className="py-3">
              <Button
                variant="outline"
                onClick={() => setClearConfirmOpen(true)}
                className="gap-2 text-red-500 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
              >
                <Trash2 className="w-4 h-4" />
                {t('settings.clearAllHistory', { count: history.length })}
              </Button>
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
            {t('settings.privacy')}
          </h3>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/10 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('settings.localPrivacy')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  {t('settings.privacyDesc')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* About */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
            {t('settings.about')}
          </h3>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Info className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">QR Scan</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('settings.version')} 1.0.0 · Fast & Private</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Modal open={clearConfirmOpen} onClose={() => setClearConfirmOpen(false)} title={t('settings.clearAllData')}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('settings.clearDataDesc', { count: history.length })}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setClearConfirmOpen(false)} className="flex-1">
              {t('scanner.cancel')}
            </Button>
            <Button variant="danger" onClick={handleClearAll} className="flex-1">
              {t('settings.clearAllData')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
