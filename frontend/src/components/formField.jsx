export default function FormField({ label, hint, children }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      {hint ? <span className="text-sm text-slate-500">{hint}</span> : null}
      {children}
    </label>
  );
}
