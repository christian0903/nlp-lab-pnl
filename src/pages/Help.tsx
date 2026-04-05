import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';

const Help = () => {
  const { t, i18n } = useTranslation();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  const lang = i18n.language?.startsWith('en') ? 'en' : 'fr';
  useEffect(() => {
    const file = lang === 'en' ? '/guide-utilisateur-en.md' : '/guide-utilisateur.md';
    fetch(file)
      .then(res => res.text())
      .then(text => { setContent(text); setLoading(false); })
      .catch(() => { setContent(lang === 'en' ? 'Unable to load the guide.' : 'Impossible de charger le guide.'); setLoading(false); });
  }, [lang]);

  if (loading) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">{t('common.loading')}</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t('common.home')}
      </Link>
      <article className="prose prose-sm max-w-none dark:prose-invert
        prose-headings:font-display prose-headings:text-foreground
        prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-6 prose-h1:border-b prose-h1:border-border prose-h1:pb-4
        prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-4
        prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3
        prose-h4:text-base prose-h4:font-semibold
        prose-p:text-muted-foreground prose-p:leading-relaxed
        prose-li:text-muted-foreground prose-li:marker:text-muted-foreground/50
        prose-strong:text-foreground
        prose-a:text-secondary prose-a:no-underline hover:prose-a:underline
        prose-code:text-secondary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-xl
        prose-table:text-sm
        prose-thead:border-border
        prose-th:text-foreground prose-th:font-semibold prose-th:px-4 prose-th:py-2
        prose-td:text-muted-foreground prose-td:px-4 prose-td:py-2
        prose-tr:border-border
        prose-hr:border-border
        prose-blockquote:border-secondary prose-blockquote:text-muted-foreground
      ">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </article>
    </div>
  );
};

export default Help;
