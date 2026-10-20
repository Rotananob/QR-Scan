import React from 'react';
import { useTranslation } from 'react-i18next';
import { Info, Shield, Code2, ExternalLink } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Info className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          {t('about.title')}
        </h2>
      </div>

      <div className="flex-1 px-4 pb-8 space-y-6 max-w-2xl mx-auto w-full mt-4">
        
        {/* Developer Section */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
              <Code2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t('about.developer')}
            </h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {t('about.developerDesc')}
          </p>
        </div>

        {/* Purpose Section */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
              <Info className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t('about.purpose')}
            </h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {t('about.purposeDesc')}
          </p>
        </div>

        {/* Privacy Section */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t('about.privacy')}
            </h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {t('about.privacyDesc')}
          </p>
        </div>

        {/* Contact / Links */}
        <div className="pt-2">
          <a
            href="https://github.com/Rotananob"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-white/5 transition-all group"
          >
            <span className="font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {t('about.github')}
            </span>
            <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
          </a>
        </div>

      </div>
    </div>
  );
};
