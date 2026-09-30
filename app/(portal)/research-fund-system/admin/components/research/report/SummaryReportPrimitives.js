import Hint from './Hint';

export function CountButton({ value, onClick }) {
  return value == null ? '—' : <button type="button" onClick={onClick} disabled={value === 0} className="rounded px-1 text-blue-700 hover:underline focus:ring-2 focus:ring-blue-300 disabled:text-slate-600 disabled:no-underline">{Number(value).toLocaleString('th-TH')}</button>;
}

export function ReportPanel({ title, hint, children, compact = false, className = '' }) {
  return <section className={`min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white ${className}`}>
    <header className={`flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 ${compact ? 'min-h-16' : 'min-h-14'}`}>
      <h3 className="min-w-0 text-sm font-semibold leading-5 text-slate-900">{title}</h3>
      {hint && <Hint label={title} text={hint}/>}
    </header>
    {children}
  </section>;
}
