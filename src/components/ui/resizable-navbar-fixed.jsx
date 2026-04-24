"use client";
import { cn } from "@/shared/lib/utils";
import Menu from "lucide-react/dist/esm/icons/menu";
import X from "lucide-react/dist/esm/icons/x";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
} from "framer-motion";

import React, { useState } from "react";
import logo from "@/assets/logos/logo.svg";

const DESKTOP_NAV_SCROLL_RANGE = 180;
const DESKTOP_NAV_EXPANDED_MAX_WIDTH = "80rem";
const DESKTOP_NAV_COLLAPSED_MAX_WIDTH = "56rem";

export const Navbar = ({ children, className, isHome, isDark }) => {
  const { scrollY } = useScroll();

  // Add spring physics to the scroll value for smoothness
  const smoothScrollY = useSpring(scrollY, {
    stiffness: 88,
    damping: 24,
    mass: 0.72,
  });

  // Map smoothed scroll to values
  const desktopMaxWidth = useTransform(
    smoothScrollY,
    [0, DESKTOP_NAV_SCROLL_RANGE],
    [DESKTOP_NAV_EXPANDED_MAX_WIDTH, DESKTOP_NAV_COLLAPSED_MAX_WIDTH]
  );
  const mobileWidth = useTransform(
    smoothScrollY,
    [0, DESKTOP_NAV_SCROLL_RANGE],
    ["100%", "90%"]
  );
  const y = useTransform(smoothScrollY, [0, DESKTOP_NAV_SCROLL_RANGE], [0, 18]);
  const padding = useTransform(
    smoothScrollY,
    [0, DESKTOP_NAV_SCROLL_RANGE],
    ["0px", "12px"]
  );
  const borderRadius = useTransform(
    smoothScrollY,
    [0, DESKTOP_NAV_SCROLL_RANGE],
    ["999px", "2rem"]
  );

  // Colors based on theme
  const startTextColor = isHome
    ? isDark
      ? "#ffffff"
      : "#1f2937"
    : isDark
      ? "#d4d4d4"
      : "#525252";
  const endTextColor = isDark ? "#d4d4d4" : "#525252";
  const textColor = useTransform(
    smoothScrollY,
    [0, DESKTOP_NAV_SCROLL_RANGE],
    [startTextColor, endTextColor]
  );

  const startBgColor = isDark
    ? "rgba(10, 10, 10, 0.76)"
    : "rgba(255, 255, 255, 0.86)";
  const endBgColor = isDark
    ? "rgba(10, 10, 10, 0.84)"
    : "rgba(255, 255, 255, 0.88)";
  const backgroundColor = useTransform(
    smoothScrollY,
    [0, DESKTOP_NAV_SCROLL_RANGE],
    [startBgColor, endBgColor]
  );

  const borderColor = useTransform(
    smoothScrollY,
    [0, DESKTOP_NAV_SCROLL_RANGE],
    isDark
      ? ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.1)"]
      : ["rgba(15, 23, 42, 0)", "rgba(15, 23, 42, 0.12)"]
  );

  const shadow = useTransform(
    smoothScrollY,
    [0, DESKTOP_NAV_SCROLL_RANGE],
    [
      "0 16px 40px -40px rgba(0, 0, 0, 0.6)",
      "0 24px 72px -44px rgba(0, 0, 0, 0.9)",
    ]
  );

  const backdropFilter = useTransform(
    smoothScrollY,
    [0, DESKTOP_NAV_SCROLL_RANGE],
    ["blur(8px)", "blur(14px)"]
  );

  return (
    <motion.div className={cn("fixed inset-x-0 top-2 z-40 w-full lg:top-5", className)}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? typeof child.type === "string"
            ? child
            : React.cloneElement(child, {
                desktopMaxWidth,
                mobileWidth,
                y,
                padding,
                borderRadius,
                backgroundColor,
                borderColor,
                shadow,
                backdropFilter,
                textColor,
                isHome,
                isDark,
              })
          : child
      )}
    </motion.div>
  );
};

export const NavBody = ({
  children,
  className,
  desktopMaxWidth,
  y,
  backgroundColor,
  borderColor,
  shadow,
  backdropFilter,
  textColor,
  borderRadius,
}) => {
  return (
    <motion.div
      style={{
        width: "calc(100% - 2rem)",
        maxWidth: desktopMaxWidth,
        y: y,
        backgroundColor: backgroundColor,
        borderColor: borderColor,
        boxShadow: shadow,
        backdropFilter: backdropFilter,
        borderRadius: borderRadius,
      }}
      className={cn(
        "relative z-60 mx-auto hidden w-full flex-row items-center justify-between self-start overflow-hidden border px-3 py-2 lg:flex",
        className
      )}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? typeof child.type === "string"
            ? child
            : React.cloneElement(child, { textColor })
          : child
      )}
    </motion.div>
  );
};

export const NavItems = ({ items, className, onItemClick, textColor }) => {
  const [hovered, setHovered] = useState(null);

  return (
    <motion.div
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "hidden min-w-0 flex-1 flex-row items-center justify-center gap-1 px-4 text-sm font-medium transition duration-200 lg:flex",
        className
      )}
    >
      {items.map((item, idx) => (
        <a
          onMouseEnter={() => setHovered(idx)}
          onClick={onItemClick}
          className="relative rounded-full px-3 py-2 transition-colors"
          key={`link-${idx}`}
          href={item.link}
        >
          {hovered === idx && (
            <motion.div
              layoutId="hovered"
              className="absolute inset-0 h-full w-full rounded-full bg-gray-100 dark:bg-neutral-800"
            />
          )}
          <span className="relative z-20">
            <motion.span style={{ color: textColor }}>{item.name}</motion.span>
          </span>
        </a>
      ))}
    </motion.div>
  );
};

export const MobileNav = ({
  children,
  className,
  mobileWidth,
  y,
  padding,
  borderRadius,
  backgroundColor,
  borderColor,
  shadow,
  backdropFilter,
}) => {
  return (
    <motion.div
      style={{
        width: mobileWidth,
        y: y,
        paddingLeft: padding,
        paddingRight: padding,
        borderRadius: borderRadius,
        borderColor: borderColor,
        boxShadow: shadow,
        backdropFilter: backdropFilter,
        backgroundColor: backgroundColor,
      }}
      className={cn(
        "relative z-50 mx-auto flex w-full max-w-[calc(100vw-2rem)] flex-col items-center justify-between overflow-visible border px-0 py-2 lg:hidden",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export const MobileNavHeader = ({ children, className }) => {
  return (
    <div
      className={cn(
        "flex w-full flex-row items-center justify-between",
        className
      )}
    >
      {children}
    </div>
  );
};

export const MobileNavMenu = ({ children, className, isOpen }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "absolute inset-x-0 top-16 z-50 flex w-full flex-col items-center justify-start gap-4 rounded-lg bg-white px-4 py-8 shadow-[0_0_24px_rgba(34,42,53,0.06),0_1px_1px_rgba(0,0,0,0.05),0_0_0_1px_rgba(34,42,53,0.04),0_0_4px_rgba(34,42,53,0.08),0_16px_68px_rgba(47,48,55,0.05),0_1px_0_rgba(255,255,255,0.1)_inset] dark:bg-neutral-950",
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const MobileNavToggle = ({ isOpen, onClick }) => {
  return isOpen ? (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex size-10 items-center justify-center text-black transition-colors hover:text-neutral-700 dark:text-white dark:hover:text-neutral-200"
      aria-label="Close navigation menu"
      aria-expanded="true"
    >
      <X className="size-6" />
    </button>
  ) : (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex size-10 items-center justify-center text-black transition-colors hover:text-neutral-700 dark:text-white dark:hover:text-neutral-200"
      aria-label="Open navigation menu"
      aria-expanded="false"
    >
      <Menu className="size-6" />
    </button>
  );
};

export const NavbarLogo = () => (
  <div className="flex items-center gap-2">
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
      <img
        src={logo}
        alt="Catalance logo mark"
        className="h-6 w-6 object-contain brightness-0 saturate-100"
      />
    </div>
    <span className="text-lg font-bold tracking-tight text-black dark:text-white">
      Catalance
    </span>
  </div>
);

export const NavbarButton = ({
  href,
  as: Tag = "a",
  children,
  className,
  variant = "primary",
  ...props
}) => {
  const baseStyles =
    "px-4 py-2 rounded-full text-sm font-bold relative cursor-pointer hover:-translate-y-0.5 transition duration-200 inline-block text-center";

  const variantStyles = {
    primary:
      "bg-primary text-white shadow-[0_0_24px_rgba(34,42,53,0.06),0_1px_1px_rgba(0,0,0,0.05),0_0_0_1px_rgba(34,42,53,0.04),0_0_4px_rgba(34,42,53,0.08),0_16px_68px_rgba(47,48,55,0.05),0_1px_0_rgba(255,255,255,0.1)_inset]",
    secondary: "bg-transparent shadow-none dark:text-white",
    outline:
      "bg-black border border-neutral-200 dark:bg-transparent dark:border-white/20 text-white dark:text-white hover:bg-neutral-800 dark:hover:bg-white/10",
    dark: "bg-black text-white shadow-[0_0_24px_rgba(34,42,53,0.06),0_1px_1px_rgba(0,0,0,0.05),0_0_0_1px_rgba(34,42,53,0.04),0_0_4px_rgba(34,42,53,0.08),0_16px_68px_rgba(47,48,55,0.05),0_1px_0_rgba(255,255,255,0.1)_inset]",
    gradient:
      "bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset]",
  };

  return (
    <Tag
      href={href || undefined}
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </Tag>
  );
};
