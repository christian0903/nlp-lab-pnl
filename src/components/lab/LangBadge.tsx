const LangBadge = ({ lang }: { lang: string }) => {
  const label = lang === 'en' ? 'EN' : 'FR';
  const colors = lang === 'en'
    ? 'bg-blue-500/10 text-blue-600'
    : 'bg-amber-500/10 text-amber-600';

  return (
    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${colors}`}>
      {label}
    </span>
  );
};

export default LangBadge;
