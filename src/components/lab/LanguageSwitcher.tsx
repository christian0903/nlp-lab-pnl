import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith('en') ? 'en' : 'fr';

  const toggle = (lang: 'fr' | 'en') => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="flex items-center rounded-md border border-border text-xs font-medium">
      <button
        onClick={() => toggle('fr')}
        className={`rounded-l-md px-2 py-1 transition-colors ${
          current === 'fr'
            ? 'bg-secondary text-secondary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        FR
      </button>
      <button
        onClick={() => toggle('en')}
        className={`rounded-r-md px-2 py-1 transition-colors ${
          current === 'en'
            ? 'bg-secondary text-secondary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
