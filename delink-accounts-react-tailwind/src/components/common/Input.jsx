export default function Input({
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  type = "text",
  ...props
}) {
  return (
    <div className="w-full">
      {label ? (
        <label className="mb-2 block text-sm font-medium text-slate-700">
          {label}
        </label>
      ) : null}
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={[
          "w-full rounded-lg border bg-white px-4 py-3 text-sm text-slate-900",
          "placeholder:text-slate-400 transition",
          "focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
          error ? "border-red-300" : "border-slate-200"
        ].join(" ")}
        {...props}
      />
      {error ? <p className="mt-2 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}