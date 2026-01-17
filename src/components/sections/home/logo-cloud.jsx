import { useTheme } from "@/components/providers/theme-provider";
import Marquee from "./Marquee";

export default function LogoCloud() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section
      className={`py-16 transition-colors duration-300 ${isDark ? "bg-black" : "bg-white"}`}
    >
      <div className="mx-auto max-w-5xl px-6">
        <h2
          className={`text-center text-lg font-medium mb-12 transition-colors ${isDark ? "text-white" : "text-gray-900"}`}
        >
          Trusted by innovative teams worldwide
        </h2>
        <div
          className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg py-4 md:shadow-xl ${isDark ? "bg-black" : "bg-white"}`}
        >
          <Marquee pauseOnHover className="[--duration:20s]">
            <img
              className={`h-8 w-auto px-8 transition-all duration-300 ${isDark ? "invert" : ""}`}
              src="https://html.tailus.io/blocks/customers/nvidia.svg"
              alt="Nvidia"
            />
            <img
              className={`h-8 w-auto px-8 transition-all duration-300 ${isDark ? "invert" : ""}`}
              src="https://html.tailus.io/blocks/customers/column.svg"
              alt="Column"
            />
            <img
              className={`h-8 w-auto px-8 transition-all duration-300 ${isDark ? "invert" : ""}`}
              src="https://html.tailus.io/blocks/customers/github.svg"
              alt="GitHub"
            />
            <img
              className={`h-8 w-auto px-8 transition-all duration-300 ${isDark ? "invert" : ""}`}
              src="https://html.tailus.io/blocks/customers/nike.svg"
              alt="Nike"
            />
            <img
              className={`h-8 w-auto px-8 transition-all duration-300 ${isDark ? "invert" : ""}`}
              src="https://html.tailus.io/blocks/customers/laravel.svg"
              alt="Laravel"
            />
            <img
              className={`h-8 w-auto px-8 transition-all duration-300 ${isDark ? "invert" : ""}`}
              src="https://html.tailus.io/blocks/customers/lilly.svg"
              alt="Lilly"
            />
            <img
              className={`h-8 w-auto px-8 transition-all duration-300 ${isDark ? "invert" : ""}`}
              src="https://html.tailus.io/blocks/customers/lemonsqueezy.svg"
              alt="Lemon Squeezy"
            />
            <img
              className={`h-8 w-auto px-8 transition-all duration-300 ${isDark ? "invert" : ""}`}
              src="https://html.tailus.io/blocks/customers/openai.svg"
              alt="OpenAI"
            />
            <img
              className={`h-8 w-auto px-8 transition-all duration-300 ${isDark ? "invert" : ""}`}
              src="https://html.tailus.io/blocks/customers/tailwindcss.svg"
              alt="Tailwind CSS"
            />
            <img
              className={`h-8 w-auto px-8 transition-all duration-300 ${isDark ? "invert" : ""}`}
              src="https://html.tailus.io/blocks/customers/vercel.svg"
              alt="Vercel"
            />
            <img
              className={`h-8 w-auto px-8 transition-all duration-300 ${isDark ? "invert" : ""}`}
              src="https://html.tailus.io/blocks/customers/zapier.svg"
              alt="Zapier"
            />
          </Marquee>
          <div
            className={`pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-linear-to-r ${isDark ? "from-black" : "from-white"}`}
          ></div>
          <div
            className={`pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-linear-to-l ${isDark ? "from-black" : "from-white"}`}
          ></div>
        </div>
      </div>
    </section>
  );
}
