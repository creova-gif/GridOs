import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../i18n';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{
      backgroundColor: 'var(--bg-surface)'
    }}>
      <Globe className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
      <select
        value={i18n.language}
        onChange={(e) => handleChange(e.target.value)}
        className="bg-transparent text-sm border-none outline-none cursor-pointer"
        style={{ color: 'var(--text-muted)' }}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} style={{ backgroundColor: 'var(--bg-card)' }}>
            {lang.flag} {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}