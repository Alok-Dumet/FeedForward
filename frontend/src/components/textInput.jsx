export default function TextInput({ label, id, name, as = 'input', className = '', children, ...rest }) {
  return (
    <div>
      <label htmlFor={id ?? name} className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {as === 'textarea' ? (
        <textarea id={id ?? name} name={name} className={`form-control ${className}`.trim()} {...rest} />
      ) : as === 'select' ? (
        <select id={id ?? name} name={name} className={`form-control ${className} cursor-pointer`.trim()} {...rest}>
          {children}
        </select>
      ) : (
        <input id={id ?? name} name={name} className={`form-control ${className}`.trim()} {...rest} />
      )}
    </div>
  );
}
