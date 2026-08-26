export default function Card({ children, className = "", ...props }) {
  return (
    <section
      className={[
        "rounded-xl border border-slate-200 bg-white shadow-soft",
        className
      ].join(" ")}
      {...props}
    >
      {children}
    </section>
  );
}