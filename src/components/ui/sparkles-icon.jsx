import { forwardRef, useState } from "react";

const SparklesIcon = forwardRef((
  { size = 24, color = "currentColor", strokeWidth = 2, className = "" },
  ref,
) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <style>
        {`
          @keyframes sparkle-main {
            0% { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(90deg) scale(1.2); }
            100% { transform: rotate(180deg) scale(1); }
          }
          @keyframes sparkle-top {
            0% { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(-45deg) scale(0.8); }
            100% { transform: rotate(-90deg) scale(1.1); }
          }
          @keyframes sparkle-bottom {
            0% { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(45deg) scale(1.15); }
            100% { transform: rotate(90deg) scale(0.9); }
          }
          .sparkle-icon-main {
            transform-origin: 9px 12px;
            transition: transform 0.3s ease-out;
          }
          .sparkle-icon-top {
            transform-origin: 18px 6px;
            transition: transform 0.3s ease-out;
          }
          .sparkle-icon-bottom {
            transform-origin: 18px 18px;
            transition: transform 0.3s ease-out;
          }
          .sparkle-icon-hovered .sparkle-icon-main {
            animation: sparkle-main 0.6s ease-in-out forwards;
          }
          .sparkle-icon-hovered .sparkle-icon-top {
            animation: sparkle-top 0.5s ease-in-out 0.1s forwards;
          }
          .sparkle-icon-hovered .sparkle-icon-bottom {
            animation: sparkle-bottom 0.5s ease-in-out 0.05s forwards;
          }
        `}
      </style>
      <svg
        ref={ref}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className} ${isHovered ? 'sparkle-icon-hovered' : ''}`}
        style={{ overflow: "visible" }}>
        {/* bottom sparkle */}
        <path
          className="sparkle-icon-bottom"
          d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2z" />
        {/* top sparkle */}
        <path
          className="sparkle-icon-top"
          d="M16 6a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2z" />
        {/* main sparkle */}
        <path
          className="sparkle-icon-main"
          d="M9 18a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z" />
      </svg>
    </>
  );
});

SparklesIcon.displayName = "SparklesIcon";
export default SparklesIcon;
