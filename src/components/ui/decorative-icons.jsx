import React from "react";
import { motion } from "motion/react";
import Code2 from "lucide-react/dist/esm/icons/code-2";
import Palette from "lucide-react/dist/esm/icons/palette";
import PenTool from "lucide-react/dist/esm/icons/pen-tool";
import Cpu from "lucide-react/dist/esm/icons/cpu";
import Globe from "lucide-react/dist/esm/icons/globe";
import Layers from "lucide-react/dist/esm/icons/layers";
import Zap from "lucide-react/dist/esm/icons/zap";
import Smartphone from "lucide-react/dist/esm/icons/smartphone";
import Terminal from "lucide-react/dist/esm/icons/terminal";
import Database from "lucide-react/dist/esm/icons/database";
import Cloud from "lucide-react/dist/esm/icons/cloud";
import Wifi from "lucide-react/dist/esm/icons/wifi";
import Settings from "lucide-react/dist/esm/icons/settings";
import GitBranch from "lucide-react/dist/esm/icons/git-branch";
import Box from "lucide-react/dist/esm/icons/box";
import Monitor from "lucide-react/dist/esm/icons/monitor";

const DecorativeIcons = ({ isDark = true }) => {
  const icons = [
    // Left side icons - moved further from edge (10-18% range) and two columns
    { id: 1, Icon: Code2, x: "10%", y: "12%", delay: 0, size: 36, glow: true },
    { id: 2, Icon: Terminal, x: "15%", y: "28%", delay: 0.3, size: 28 },
    { id: 3, Icon: GitBranch, x: "8%", y: "38%", delay: 0.6, size: 26 },
    {
      id: 4,
      Icon: Palette,
      x: "14%",
      y: "50%",
      delay: 0.9,
      size: 32,
      glow: true,
    },
    { id: 5, Icon: PenTool, x: "9%", y: "62%", delay: 1.2, size: 26 },
    { id: 6, Icon: Database, x: "16%", y: "75%", delay: 1.5, size: 30 },
    { id: 7, Icon: Settings, x: "11%", y: "88%", delay: 1.8, size: 28 },

    // Right side icons - moved further from edge (82-92% range) and two columns
    {
      id: 8,
      Icon: Globe,
      x: "90%",
      y: "10%",
      delay: 0.2,
      size: 34,
      glow: true,
    },
    { id: 9, Icon: Cloud, x: "85%", y: "24%", delay: 0.5, size: 28 },
    { id: 10, Icon: Wifi, x: "92%", y: "36%", delay: 0.8, size: 26 },
    {
      id: 11,
      Icon: Layers,
      x: "86%",
      y: "48%",
      delay: 1.1,
      size: 32,
      glow: true,
    },
    { id: 12, Icon: Box, x: "91%", y: "60%", delay: 1.4, size: 26 },
    { id: 13, Icon: Monitor, x: "84%", y: "72%", delay: 1.7, size: 30 },
    { id: 14, Icon: Smartphone, x: "89%", y: "86%", delay: 2, size: 28 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden -z-20">
      {icons.map(({ id, Icon, x, y, delay, size, glow }) => (
        <motion.div
          key={id}
          className="absolute"
          style={{
            left: x,
            top: y,
            transform: "translate(-50%, -50%)",
          }}
          initial={{ opacity: 0, scale: 0, rotate: -20 }}
          animate={{
            opacity: isDark ? [0.8, 0.3, 0.15] : [0.8, 0.85, 0.15],
            scale: [1, 1.15, 1],
            y: [0, -15, 0],
            rotate: [0, 8, -8, 0],
          }}
          transition={{
            duration: 5 + delay,
            repeat: Infinity,
            ease: "easeInOut",
            delay: delay,
          }}
        >
          {/* Outer glow for special icons */}
          {glow && (
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: `radial-gradient(circle, rgba(250, 204, 21, 0.4) 0%, transparent 70%)`,
                filter: "blur(20px)",
                transform: "scale(2)",
              }}
              animate={{
                opacity: isDark ? [0.1, 0.2, 0.1] : [0.2, 0.35, 0.2],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}

          {/* Icon container */}
          <div
            className="relative p-3 rounded-2xl backdrop-blur-md"
            style={{
              background: isDark
                ? "linear-gradient(135deg, rgba(250, 204, 21, 0.15) 0%, rgba(250, 204, 21, 0.05) 100%)"
                : "linear-gradient(135deg, rgba(250, 204, 21, 0.2) 0%, rgba(250, 204, 21, 0.08) 100%)",
              border: `1px solid rgba(250, 204, 21, ${isDark ? 0.3 : 0.4})`,
              boxShadow: glow
                ? `0 0 30px rgba(250, 204, 21, ${
                    isDark ? 0.3 : 0.2
                  }), inset 0 0 20px rgba(250, 204, 21, 0.1)`
                : `0 0 15px rgba(250, 204, 21, ${isDark ? 0.15 : 0.1})`,
            }}
          >
            <Icon
              size={size}
              className="text-primary"
              strokeWidth={1.5}
              style={{
                filter: glow
                  ? `drop-shadow(0 0 8px rgba(250, 204, 21, 0.6))`
                  : "none",
              }}
            />
          </div>
        </motion.div>
      ))}

      {/* Ambient floating particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 rounded-full bg-primary/40"
          style={{
            left: i < 4 ? `${8 + i * 3}%` : `${82 + (i - 4) * 3}%`,
            top: `${20 + i * 10}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: isDark ? [0.1, 0.25, 0.1] : [0.2, 0.4, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export default DecorativeIcons;
