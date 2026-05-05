import { Link } from 'react-router-dom';

export default function ListingCard({ eyebrow, title, summary, highlightLabel, highlightValue, detailItems = [], tags = [], variant = 'default', metaText, action }) {
  if (variant === 'compactHistory') {
    return (
      <article className="surface-glass-compact px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{metaText}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
              {tag}
            </span>
          ))}
        </div>

        {action ? (
          <div className="mt-5">
            <Link to={action.to} className="btn-soft">
              {action.label}
            </Link>
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <article className="surface-glass p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="label-small tracking-[0.18em] text-amber-700">{eyebrow}</p>
          <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">{summary}</p>
        </div>

        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
          <p className="label-small tracking-[0.15em] text-emerald-700">{highlightLabel}</p>
          <p className="mt-1 text-lg font-bold text-emerald-900">{highlightValue}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
        {detailItems.map((detail) => (
          <div key={`${detail.label}-${detail.value}`} className="rounded-2xl bg-slate-100 px-4 py-3">
            <p className="label-small tracking-[0.15em] text-slate-500">{detail.label}</p>
            <p className="mt-1 font-medium text-slate-900">{detail.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
            {tag}
          </span>
        ))}
      </div>

      {action ? (
        <div className="mt-5">
          <Link to={action.to} className="btn-soft">
            {action.label}
          </Link>
        </div>
      ) : null}
    </article>
  );
}
