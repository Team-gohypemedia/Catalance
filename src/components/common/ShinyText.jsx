import { useEffect, useState } from "react";

const ShinyText = ({ text, disabled = false, speed = 5, className = '' }) => {
  const animationDuration = `${speed}s`;
  const [isDark, setIsDark] = useState(false);

  // Detect if dark mode is active
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsDark(document.documentElement.classList.contains("dark"));

      const observer = new MutationObserver(() => {
        setIsDark(document.documentElement.classList.contains("dark"));
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

      return () => observer.disconnect();
    }
  }, []);

  // Theme-specific colors
  const baseColor = isDark ? "#A1A4A5" : "#000000";
  const shineColor = isDark ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.8)";

  return (
    <div
      className={`inline-block ${disabled ? '' : 'animate-shine'} ${className}`}
      style={{
        backgroundImage: `linear-gradient(120deg, ${baseColor} 40%, ${shineColor} 50%, ${baseColor} 60%)`,
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        color: baseColor,              // fallback if bg-clip:text unsupported
        WebkitTextFillColor: "transparent",
        animationDuration,
      }}
    >
      {text}
    </div>
  );
};

export default ShinyText;
