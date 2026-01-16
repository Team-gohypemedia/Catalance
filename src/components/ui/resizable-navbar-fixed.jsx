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
import logo from "@/assets/react.svg";

export const Navbar = ({ children, className, isHome, isDark }) => {
  const { scrollY } = useScroll();

  // Add spring physics to the scroll value for smoothness
  const smoothScrollY = useSpring(scrollY, {
    stiffness: 100,
    damping: 20,
    mass: 0.5,
  });

  // Map smoothed scroll to values
  const width = useTransform(smoothScrollY, [0, 100], ["100%", "40%"]);
  const mobileWidth = useTransform(smoothScrollY, [0, 100], ["100%", "90%"]);
  const y = useTransform(smoothScrollY, [0, 100], [0, 20]);
  const padding = useTransform(smoothScrollY, [0, 100], ["0px", "12px"]);
  const borderRadius = useTransform(smoothScrollY, [0, 100], ["0rem", "2rem"]);

  // Colors based on theme
  const startTextColor = isHome ? "#ffffff" : isDark ? "#d4d4d4" : "#525252";
  const endTextColor = isDark ? "#d4d4d4" : "#525252";
  const textColor = useTransform(
    smoothScrollY,
    [0, 100],
    [startTextColor, endTextColor]
  );

  const startBgColor = "rgba(0, 0, 0, 0)";
  const endBgColor = isDark
    ? "rgba(10, 10, 10, 0.8)"
    : "rgba(255, 255, 255, 0.8)";
  const backgroundColor = useTransform(
    smoothScrollY,
    [0, 100],
    [startBgColor, endBgColor]
  );

  // Shadow without the orange line
  const shadow = useTransform(
    smoothScrollY,
    [0, 100],
    [
      "none",
      "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset",
    ]
  );

  const backdropFilter = useTransform(
    smoothScrollY,
    [0, 100],
    ["blur(0px)", "blur(10px)"]
  );

  return (
    <motion.div className={cn("fixed inset-x-0 top-5 z-40 w-full", className)}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? typeof child.type === "string"
            ? child
            : React.cloneElement(child, {
                width,
                mobileWidth,
                y,
                padding,
                borderRadius,
                backgroundColor,
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
  width,
  y,
  backgroundColor,
  shadow,
  backdropFilter,
  textColor,
  borderRadius,
}) => {
  return (
    <motion.div
      style={{
        width: width,
        y: y,
        minWidth: "800px",
        backgroundColor: backgroundColor,
        boxShadow: shadow,
        backdropFilter: backdropFilter,
        borderRadius: borderRadius,
      }}
      className={cn(
        "relative z-60 mx-auto hidden w-full max-w-7xl flex-row items-center justify-between self-start bg-transparent px-3 py-2 lg:flex dark:bg-transparent",
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
        "absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium transition duration-200 lg:flex lg:space-x-2",
        className
      )}
    >
      {items.map((item, idx) => (
        <a
          onMouseEnter={() => setHovered(idx)}
          onClick={onItemClick}
          className="relative px-4 py-2 transition-colors"
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
        boxShadow: shadow,
        backdropFilter: backdropFilter,
        backgroundColor: backgroundColor,
      }}
      className={cn(
        "relative z-50 mx-auto flex w-full max-w-[calc(100vw-2rem)] flex-col items-center justify-between bg-transparent px-0 py-2 lg:hidden",
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
            "absolute inset-x-0 top-16 z-50 flex w-full flex-col items-start justify-start gap-4 rounded-lg bg-white px-4 py-8 shadow-[0_0_24px_rgba(34,42,53,0.06),0_1px_1px_rgba(0,0,0,0.05),0_0_0_1px_rgba(34,42,53,0.04),0_0_4px_rgba(34,42,53,0.08),0_16px_68px_rgba(47,48,55,0.05),0_1px_0_rgba(255,255,255,0.1)_inset] dark:bg-neutral-950",
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
    <X className="text-black dark:text-white" onClick={onClick} />
  ) : (
    <Menu className="text-black dark:text-white" onClick={onClick} />
  );
};

export const NavbarLogo = ({ textColor }) => {
  return (
    <>
      <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-full mr-2">
        <img src={logo} alt="Catalance" className="h-5 w-5" />
      </div>
      <div className={cn("grid flex-1 text-left text-sm leading-tight")}>
        <span className="truncate text-lg font-semibold">
          <motion.span style={{ color: textColor }}>Catalance</motion.span>
        </span>
      </div>
    </>
  );
};

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
