//We will render a labeled input/textarea/select with the same Tailwind styling used across forms
const baseFieldClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 transition outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100';

export default function TextInput({ label, id, name, as = 'input', className = '', children, ...rest }) {
  const fieldId = id ?? name;
  const fieldClass = `${baseFieldClass} ${className}`.trim();

  return (
    <div>
      <label htmlFor={fieldId} className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {as === 'textarea' ? (
        <textarea id={fieldId} name={name} className={fieldClass} {...rest} />
      ) : as === 'select' ? (
        <select id={fieldId} name={name} className={`${fieldClass} cursor-pointer`} {...rest}>
          {children}
        </select>
      ) : (
        <input id={fieldId} name={name} className={fieldClass} {...rest} />
      )}
    </div>
  );
}
