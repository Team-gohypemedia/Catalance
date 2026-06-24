import React from "react";
import PropTypes from "prop-types";
import loaderOuter from "@/assets/loader/loader-outer.svg";
import loaderInner from "@/assets/loader/loader-inner.svg";

/**
 * Reusable Loader Component
 * 
 * Features:
 * - Flexible sizing - can be full screen or inline
 * - Circular container with primary theme color background
 * - Outer SVG rotates clockwise
 * - Inner SVG rotates counter-clockwise
 * - Smooth continuous animation
 * 
 * @param {string} size - Size variant: 'sm' (24px), 'md' (32px), 'lg' (128px), 'full' (full screen)
 * @param {string} className - Additional CSS classes
 */
export default function Loader({ size = "full", className = "" }) {
  const sizeMap = {
    sm: {
      container: "h-6 w-6",
      outer: "h-5 w-5",
      inner: "h-4 w-4",
      padding: "p-0.5",
      wrapper: "inline-flex",
    },
    md: {
      container: "h-8 w-8",
      outer: "h-6 w-6",
      inner: "h-5 w-5",
      padding: "p-1",
      wrapper: "inline-flex",
    },
    lg: {
      container: "h-16 w-16",
      outer: "h-14 w-14",
      inner: "h-12 w-12",
      padding: "p-1.5",
      wrapper: "flex",
    },
    full: {
      container: "h-16 w-16",
      outer: "h-14 w-14",
      inner: "h-12 w-12",
      padding: "p-1.5",
      wrapper: "flex min-h-screen items-center justify-center",
    },
  };

  const isFixedOrAbsolute = className.includes("fixed") || className.includes("absolute");

  const config = sizeMap[size] || sizeMap.full;
  const wrapperClass =
    size === "full"
      ? `flex ${isFixedOrAbsolute ? "h-full w-full" : "min-h-[100dvh] w-full"} items-center justify-center bg-background`
      : "inline-flex items-center justify-center";

  const isFlex = size === "lg" || size === "full";

  return (
    <div className={`${wrapperClass} ${className}`}>
      <div className={`relative ${config.container} ${config.padding} items-center justify-center rounded-full bg-primary ${isFlex ? "flex" : "inline-flex"}`}>
        {/* Outer loader - rotates clockwise */}
        <img
          src={loaderOuter}
          alt="Loading outer"
          className={`absolute inset-0 m-auto ${config.outer} animate-spin-clockwise invert dark:invert-0`}
        />
        
        {/* Inner loader - rotates counter-clockwise */}
        <img
          src={loaderInner}
          alt="Loading inner"
          className={`absolute inset-0 m-auto ${config.inner} animate-spin-counter-clockwise invert dark:invert-0`}
        />
      </div>
    </div>
  );
}

Loader.propTypes = {
  size: PropTypes.oneOf(["sm", "md", "lg", "full"]),
  className: PropTypes.string,
};
