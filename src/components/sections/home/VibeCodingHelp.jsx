import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/providers/theme-provider";
import VibeCodingVideo from "@/assets/Vibe coding marketing banner loop.mp4";

const VibeCodingHelp = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section className="w-full py-12 px-4 md:px-8 lg:px-16">
      <div
        className="relative max-w-7xl mx-auto rounded-3xl overflow-hidden transition-colors duration-500"
        style={{
          background: isDark
            ? "linear-gradient(135deg, #4a3540 0%, #3d2a35 50%, #2e1f28 100%)"
            : "linear-gradient(135deg, #c88a9c 0%, #a67180 50%, #8e5a6a 100%)",
        }}
      >
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 p-8 md:p-12 lg:p-16">
          {/* Left Content */}
          <div className="flex-1 text-left max-w-lg">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-4 leading-tight">
              Need help with Vibe coding?
            </h2>
            <p className="text-white/90 text-base md:text-lg mb-8 leading-relaxed">
              Get matched with the right expert to keep building and marketing
              your project
            </p>
            <Link to="/service">
              <Button
                size="lg"
                className={`font-medium px-8 py-6 text-base rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
                  isDark
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : "bg-white hover:bg-white/90 text-gray-900"
                }`}
              >
                Find an expert
              </Button>
            </Link>
          </div>

          {/* Right Video Container - Single Browser Window */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <div
              className="relative rounded-2xl overflow-hidden shadow-2xl transition-colors duration-500"
              style={{
                background: isDark
                  ? "rgba(40, 35, 38, 0.8)"
                  : "rgba(180, 140, 150, 0.5)",
                backdropFilter: "blur(10px)",
                padding: "12px",
              }}
            >
              {/* Browser Window with Video */}
              <div
                className="rounded-xl overflow-hidden shadow-lg transition-colors duration-500"
                style={{
                  background: isDark ? "#1a1a1a" : "white",
                }}
              >
                {/* Browser Top Bar */}
                <div
                  className="flex items-center gap-2 px-3 py-2 border-b transition-colors duration-500"
                  style={{
                    background: isDark ? "#2a2a2a" : "#f8f8f8",
                    borderColor: isDark ? "#333" : "#eee",
                  }}
                >
                  <div className="flex gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full transition-colors duration-500"
                      style={{ background: isDark ? "#555" : "#ddd" }}
                    ></div>
                    <div
                      className="w-2.5 h-2.5 rounded-full transition-colors duration-500"
                      style={{ background: isDark ? "#555" : "#ddd" }}
                    ></div>
                    <div
                      className="w-2.5 h-2.5 rounded-full transition-colors duration-500"
                      style={{ background: isDark ? "#555" : "#ddd" }}
                    ></div>
                  </div>
                </div>

                {/* Video Content */}
                <div className="relative w-[360px] md:w-[440px] lg:w-[520px] aspect-video">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  >
                    <source src={VibeCodingVideo} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VibeCodingHelp;
