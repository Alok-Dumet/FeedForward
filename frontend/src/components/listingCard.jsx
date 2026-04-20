import { Link } from "react-router-dom";
import { motion } from "motion/react";

export default function ListingCard({
  eyebrow,
  title,
  summary,
  highlightLabel,
  highlightValue,
  detailItems = [],
  tags = [],
  variant = "default",
  metaText,
  action,
}) {
  const inlineAction =
    action?.placement === "inline" ? (
      <Link
        to={action.to}
        className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 transition hover:text-amber-800"
      >
        <span>{action.label}</span>
        <span aria-hidden="true">›</span>
      </Link>
    ) : null;

  if (variant === "compactHistory") {
    return (
      <motion.article
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="rounded-[1.5rem] border border-white/70 bg-white/80 px-5 py-4 shadow-lg backdrop-blur-md"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{metaText}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{summary}</p>
            <p className="mt-3 text-xs font-semibold tracking-[0.15em] text-amber-700 uppercase">
              {eyebrow}
            </p>
          </div>

          {action ? (
            <Link
              to={action.to}
              className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-800"
            >
              {action.label}
            </Link>
          ) : null}
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="rounded-[1.75rem] border border-white/70 bg-white/85 p-6 shadow-xl backdrop-blur-md"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-[0.18em] text-amber-700 uppercase">
            {eyebrow}
          </p>
          <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">{summary}</p>
        </div>

        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
          <p className="text-xs font-semibold tracking-[0.15em] text-emerald-700 uppercase">
            {highlightLabel}
          </p>
          <p className="mt-1 text-lg font-bold text-emerald-900">{highlightValue}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
        {detailItems.map((detail) => (
          <div
            key={`${detail.label}-${detail.value}`}
            className="rounded-2xl bg-slate-100 px-4 py-3"
          >
            <p className="text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase">
              {detail.label}
            </p>
            <p className="mt-1 font-medium text-slate-900">{detail.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800"
          >
            {tag}
          </span>
        ))}
      </div>

      {inlineAction ? <div className="mt-5">{inlineAction}</div> : null}

      {action ? (
        <div className={`mt-5 ${action.placement === "inline" ? "hidden" : ""}`}>
          <Link
            to={action.to}
            className="inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-800"
          >
            {action.label}
          </Link>
        </div>
      ) : null}
    </motion.article>
  );
}
