function AuraBackground({ children, className = "" }) {
  return (
    <div
      className={`relative min-h-screen overflow-hidden bg-[#faf8f2] text-foreground dark:bg-[#100e0b] ${className}`}
    >
      {/* =====================================================
          LIGHT MODE — Glacier Mist
          ===================================================== */}

      <div
        className="absolute inset-0 blur-[90px] md:blur-[130px] dark:hidden"
        style={{
          background:
            "linear-gradient(rgba(0,0,0,0) 0%, rgba(77,210,255,0.12) 28%, rgb(255,255,255) 48%, rgb(53,230,192) 68%, rgb(91,110,245) 100%)",
          mixBlendMode: "multiply",
        }}
        aria-hidden="true"
      />

      <div
        className="absolute inset-0 blur-[90px] md:blur-[130px] dark:hidden"
        style={{
          background:
            "linear-gradient(rgba(0,0,0,0) 0%, rgba(77,210,255,0.22) 34%, rgb(255,255,255) 66%, rgba(53,230,192,0.82) 82%, rgb(91,110,245) 100%)",
          mixBlendMode: "multiply",
        }}
        aria-hidden="true"
      />

      {/* =====================================================
          DARK MODE — Abyssal Floor
          ===================================================== */}

      <div
        className="absolute inset-0 hidden blur-[125px] dark:block md:blur-[180px]"
        style={{
          background:
            "radial-gradient(ellipse 120% 70% at 50% 110%, rgba(0,90,110,0.8) 0%, rgba(0,45,60,0.5) 40%, rgba(0,0,0,0) 75%)",
          mixBlendMode: "screen",
        }}
        aria-hidden="true"
      />

      <div
        className="absolute inset-0 hidden blur-[50px] dark:block md:blur-[72px]"
        style={{
          background:
            "linear-gradient(to top, rgba(0,130,150,0.25) 0%, rgba(0,0,0,0) 35%)",
          mixBlendMode: "screen",
        }}
        aria-hidden="true"
      />

      {/* =====================================================
          CONTENT
          ===================================================== */}

      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default AuraBackground;