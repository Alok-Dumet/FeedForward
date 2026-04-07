export default function DetailFieldGrid({ fields = [] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {fields.map((field) => (
        <div
          key={`${field.label}-${field.value}`}
          className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700"
        >
          <p className="text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase">
            {field.label}
          </p>
          <p className="mt-1 font-medium text-slate-900">{field.value}</p>
        </div>
      ))}
    </div>
  );
}
