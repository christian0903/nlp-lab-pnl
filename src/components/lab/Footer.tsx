import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import packageJson from '../../../package.json';

const Footer = () => {
  const { t } = useTranslation();
  return (
  <footer className="border-t border-border bg-card/50 mt-auto">
    <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>PNL Lab R&D v{packageJson.version}</span>
        <span>·</span>
        <a href="https://atelierpnl.eu" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">atelierpnl.eu</a>
      </div>
      <div className="flex items-center gap-4">
        <Link to="/resources" className="text-xs text-muted-foreground hover:text-foreground">{t('nav.resources')}</Link>
        <Link to="/community" className="text-xs text-muted-foreground hover:text-foreground">{t('nav.community')}</Link>
        <Link to="/aide" className="text-xs text-muted-foreground hover:text-foreground">{t('nav.help')}</Link>
        <Link to="/soutenir" className="inline-flex items-center gap-1 text-xs font-medium text-secondary hover:underline">
          <Heart className="h-3 w-3" /> {t('footer.support')}
        </Link>
      </div>
    </div>
  </footer>
  );
};

export default Footer;
