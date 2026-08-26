export default function Button({
  children,
  variant = "primary",
  icon: Icon,
  disabled = false,
  type = "button",
  onClick,
  className = "",
  ...props
}) {
  const variants = {
    primary: "bg-brand-500 text-white hover:bg-brand-600 shadow-sm",
    secondary: "border border-brand-300 bg-white text-brand-600 hover:bg-brand-50",
    danger: "border border-red-200 bg-white text-red-600 hover:bg-red-50",
    ghost: "text-slate-600 hover:bg-slate-100",
    icon: "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      ].join(" ")}
      {...props}
    >
      {Icon ? <Icon size={18} strokeWidth={2} /> : null}
      {children}
    </button>
  );
}