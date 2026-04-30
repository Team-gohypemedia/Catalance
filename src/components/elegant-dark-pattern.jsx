export function DarkGradientBg({ children, className }) {
  const rootClassName = [
    "relative min-h-screen w-full overflow-hidden bg-black",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClassName}>
      <div className="pointer-events-none absolute inset-0 bg-black" />
      <div
        className="pointer-events-none absolute inset-0 opacity-5 bg-repeat"
        style={{
          backgroundImage:
            'url("https://framerusercontent.com/images/6mcf62RlDfRfU61Yg5vb2pefpi4.png")',
          backgroundSize: "149.76px",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)",
          backgroundSize: "20px 20px",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
