// Get Started: https://www.framer.com/developers

import { motion } from "framer-motion"

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */

// const lineMaxDelay = 1.4
// const lineDuration = 1.4

// const pulseMaxDelay = 1.4
// const pulseDuration = 1.4

// const ringDelay = 0.4
// const ringStagger = 0.06
// const ringDuration = 0.4
// const y = -30

function remap(value, low1, high1, low2, high2) {
    return low2 + ((high2 - low2) * (value - low1)) / (high1 - low1)
}

function randomDelay(max) {
    return Math.random() * max
}

export function Wormhole({ lines, pulse, rings, delay: globalDelay }) {
    const {
        delay: pulseDelay,
        duration: pulseDuration,
        loopDelay: pulseLoopDelay,
        stroke: pulseStroke,
        colors: pulseColors,
        opacity: pulseOpacity,
    } = pulse

    const {
        delay: lineDelay,
        duration: lineDuration,
        stroke: lineStroke,
        colors: lineColors,
        opacity: lineOpacity,
    } = lines

    const {
        delay: ringDelay,
        stagger: ringStagger,
        offset: ringOffset,
        duration: ringDuration,
        stroke: ringStroke,
        colors: ringColors,
        opacity: ringOpacity,
    } = rings

    const ringContainerVariants = {
        start: {},
        end: {
            transition: {
                delayChildren: globalDelay + ringDelay,
                staggerChildren: ringStagger,
            },
        },
    }

    const ringVariants = {
        start: {
            opacity: 0,
            y: ringOffset,
        },
        end: {
            stroke: ringColors,
            opacity: ringOpacity,
            y: 0,
            transition: {
                ease: "easeOut",
                duration: ringDuration,
            },
        },
    }

    const lineVariants = {
        start: {
            opacity: 1,
            pathLength: 0,
        },
        end: {
            stroke: lineColors,
            opacity: lineOpacity,
            pathLength: 1,
        },
    }

    const pulseVariants = {
        start: {
            opacity: 1,
            pathLength: 0,
        },
        end: {
            stroke: pulseColors,
            opacity: pulseOpacity,
            pathLength: 1,
        },
    }

    return (
        <svg
            width="100%"
            height="100%"
            viewBox="867 0 2400 1080"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <style type="text/css">
                    {`.cls-1 {
                        // stroke: #000;
                        // stroke-width: 1px;
                    }
                    `}
                </style>
            </defs>
            <motion.g initial="start" animate="end">
                <motion.g variants={ringContainerVariants}>
                        {/* <motion.path
        className="cls-1"
        transition={{
          duration: pulseDuration,
          ease: "easeOut",
          delay: globalDelay + randomDelay(pulseDelay),
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: pulseLoopDelay,
        }}
        strokeWidth={pulseStroke}
        variants={pulseVariants}
        d="M3157.4 81.4922C2910.39 186.082 2664.14 290.932 2418.55 399.562C2359.66 422.532 2321.89 439.732 2290.71 472.452C2271.59 492.512 2254.96 518.412 2237.45 555.052C2216.58 594.402 2201.47 633.882 2190.68 673.722"
      /> */}
                        <motion.path
                            className="cls-1"
                            transition={{
                                duration: pulseDuration,
                                ease: "easeOut",
                                delay: globalDelay + randomDelay(pulseDelay),
                                repeat: Infinity,
                                repeatType: "loop",
                                repeatDelay: pulseLoopDelay,
                            }}
                            strokeWidth={pulseStroke}
                            variants={pulseVariants}
                            d="M3377.53 122.914C3082.07 217.704 2787.43 312.654 2492.99 411.744C2425 432.424 2377.17 446.174 2335.9 480.914C2313.3 499.944 2292.66 525.284 2271.77 561.504C2248.17 598.394 2230.71 634.784 2217.96 671.284"
                        />
                        {/* <motion.path
        className="cls-1"
        transition={{
          duration: pulseDuration,
          ease: "easeOut",
          delay: globalDelay + randomDelay(pulseDelay),
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: pulseLoopDelay,
        }}
        strokeWidth={pulseStroke}
        variants={pulseVariants}
        d="M3575.23 171.539C3265.47 248.099 2956.34 324.029 2647.08 404.369C2600.93 416.249 2554.09 428.649 2507.05 440.059C2466.74 449.009 2425.4 459.109 2389.72 481.949C2385.44 484.719 2381.27 487.599 2377.19 490.589C2317.07 534.619 2277.7 601.739 2244.42 668.409H2244.41"
      /> */}
                        <motion.path
                            className="cls-1"
                            transition={{
                                duration: pulseDuration,
                                ease: "easeOut",
                                delay: globalDelay + randomDelay(pulseDelay),
                                repeat: Infinity,
                                repeatType: "loop",
                                repeatDelay: pulseLoopDelay,
                            }}
                            strokeWidth={pulseStroke}
                            variants={pulseVariants}
                            d="M3747.18 226.555C3406.12 291.065 3065.8 354.925 2725.01 423.155C2670.83 433.885 2615.88 445.105 2560.81 455.435C2515.22 463.195 2468.19 471.155 2426.45 493.695C2421.57 496.315 2416.79 499.075 2412.13 501.965C2350.27 540.355 2306.88 602.275 2269.98 665.145"
                        />
                        {/* <motion.path
        className="cls-1"
        transition={{
          duration: pulseDuration,
          ease: "easeOut",
          delay: globalDelay + randomDelay(pulseDelay),
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: pulseLoopDelay,
        }}
        strokeWidth={pulseStroke}
        variants={pulseVariants}
        d="M3890.33 286.953C3520.26 339.163 3151.04 390.783 2781.04 446.773C2720.93 455.753 2659.92 465.263 2598.89 473.683C2549.97 479.673 2499.64 486.223 2454.12 507.963C2449.66 510.043 2445.29 512.243 2440.99 514.553C2379.35 547.643 2333.62 603.373 2294.39 661.483"
      /> */}
                        <motion.path
                            className="cls-1"
                            transition={{
                                duration: pulseDuration,
                                ease: "easeOut",
                                delay: globalDelay + randomDelay(pulseDelay),
                                repeat: Infinity,
                                repeatType: "loop",
                                repeatDelay: pulseLoopDelay,
                            }}
                            strokeWidth={pulseStroke}
                            variants={pulseVariants}
                            d="M4002.35 351.789C3609.62 390.839 3217.75 429.299 2824.92 472.169C2761.05 479.009 2696.32 486.349 2631.56 492.599C2578.83 496.939 2524.48 501.609 2474.71 523.059C2470.95 524.609 2467.24 526.239 2463.58 527.949C2403.79 555.889 2357.57 605.049 2317.32 657.499"
                        />
                        {/* <motion.path
        className="cls-1"
        transition={{
          duration: pulseDuration,
          ease: "easeOut",
          delay: globalDelay + randomDelay(pulseDelay),
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: pulseLoopDelay,
        }}
        strokeWidth={pulseStroke}
        variants={pulseVariants}
        d="M4081.24 419.992C3675.01 445.062 3269.66 469.572 2863.16 498.392C2794.25 503.132 2724.39 508.392 2654.55 512.512C2599.94 515.012 2543.65 517.602 2491.31 537.442C2487.39 538.842 2483.53 540.332 2479.71 541.912C2423.59 565.112 2378.15 607.012 2338.46 653.262"
      /> */}
                        <motion.path
                            className="cls-1"
                            transition={{
                                duration: pulseDuration,
                                ease: "easeOut",
                                delay: globalDelay + randomDelay(pulseDelay),
                                repeat: Infinity,
                                repeatType: "loop",
                                repeatDelay: pulseLoopDelay,
                            }}
                            strokeWidth={pulseStroke}
                            variants={pulseVariants}
                            d="M4125.68,490.234C3710.48,501.124 3296.27,511.494 2880.71,526.134C2810.26,528.464 2738.85,531.294 2667.5,532.974C2610.65,533.634 2551.98,534.154 2497.11,553.434C2494.41,554.324 2491.72,555.254 2489.07,556.234C2437.91,574.944 2394.88,609.474 2357.13,649.004"
                        />
                        {/* <motion.path
        className="cls-1"
        transition={{
          duration: pulseDuration,
          ease: "easeOut",
          delay: globalDelay + randomDelay(pulseDelay),
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: pulseLoopDelay,
        }}
        strokeWidth={pulseStroke}
        variants={pulseVariants}
        d="M4134.9 561.362C3717.89 557.942 3301.91 553.962 2884.37 554.222C2813.62 554.132 2741.84 554.492 2670.2 553.702C2613.35 552.412 2554.62 550.802 2499.05 568.272C2496.48 569.022 2493.93 569.812 2491.4 570.642C2446.5 585.332 2407.57 612.562 2372.98 644.882"
      /> */}
                        <motion.path
                            className="cls-1"
                            transition={{
                                duration: pulseDuration,
                                ease: "easeOut",
                                delay: globalDelay + randomDelay(pulseDelay),
                                repeat: Infinity,
                                repeatType: "loop",
                                repeatDelay: pulseLoopDelay,
                            }}
                            strokeWidth={pulseStroke}
                            variants={pulseVariants}
                            d="M4108.68,632.289C3697.01,614.559 3286.33,596.299 2874,582.249C2804.16,579.719 2733.25,577.649 2662.56,574.389C2606.63,571.199 2548.79,567.419 2493.58,583.079C2491.18,583.699 2488.8,584.369 2486.43,585.069C2448.92,596.129 2415.49,616.409 2385.34,641.289"
                        />
                        {/* <motion.path
        className="cls-1"
        transition={{
          duration: pulseDuration,
          ease: "easeOut",
          delay: globalDelay + randomDelay(pulseDelay),
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: pulseLoopDelay,
        }}
        strokeWidth={pulseStroke}
        variants={pulseVariants}
        d="M4047.65 701.68C3648.33 669.93 3250.03 637.72 2849.92 609.66C2782.16 604.76 2713.38 600.25 2644.8 594.59C2590.78 589.56 2534.79 583.73 2480.87 597.55C2478.57 598.08 2476.28 598.66 2474.01 599.27C2444.59 607.15 2417.77 621.16 2393.15 638.8"
      /> */}
                        <motion.path
                            className="cls-1"
                            transition={{
                                duration: pulseDuration,
                                ease: "easeOut",
                                delay: globalDelay + randomDelay(pulseDelay),
                                repeat: Infinity,
                                repeatType: "loop",
                                repeatDelay: pulseLoopDelay,
                            }}
                            strokeWidth={pulseStroke}
                            variants={pulseVariants}
                            d="M3952.62 768.376C3572.5 723.206 3193.37 677.576 2812.33 636.016C2747.84 628.816 2682.32 622.006 2617.07 614.046C2566.94 607.396 2514.96 599.766 2464.23 610.756C2460.91 611.396 2457.62 612.126 2454.37 612.956C2433.23 618.226 2413.52 626.996 2395.09 638.176"
                        />
                        {/* <motion.path
        className="cls-1"
        transition={{
          duration: pulseDuration,
          ease: "easeOut",
          delay: globalDelay + randomDelay(pulseDelay),
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: pulseLoopDelay,
        }}
        strokeWidth={pulseStroke}
        variants={pulseVariants}
        d="M3825.41 831.242C3468.87 773.042 3113.23 714.442 2755.64 659.862C2697.64 650.882 2638.68 642.162 2579.98 632.392C2533.47 624.142 2485.15 614.692 2437.45 624.002C2434.2 624.562 2430.99 625.222 2427.81 625.982C2414.31 629.162 2401.48 633.972 2389.27 640.062"
      /> */}
                        <motion.path
                            className="cls-1"
                            transition={{
                                duration: pulseDuration,
                                ease: "easeOut",
                                delay: globalDelay + randomDelay(pulseDelay),
                                repeat: Infinity,
                                repeatType: "loop",
                                repeatDelay: pulseLoopDelay,
                            }}
                            strokeWidth={pulseStroke}
                            variants={pulseVariants}
                            d="M3668.09 889.21C3343.51 819.3 3019.82 749.02 2694.05 682.6C2641.25 671.68 2587.49 661.02 2534.1 649.31C2492.92 639.83 2450.04 628.91 2406.98 635.75C2403.58 636.23 2400.24 636.83 2396.94 637.55C2388.95 639.27 2381.24 641.68 2373.79 644.66"
                        />
                        {/* <motion.path
        className="cls-1"
        transition={{
          duration: pulseDuration,
          ease: "easeOut",
          delay: globalDelay + randomDelay(pulseDelay),
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: pulseLoopDelay,
        }}
        strokeWidth={pulseStroke}
        variants={pulseVariants}
        d="M3483.4 941.22C3193.04 859.79 2903.54 778.13 2611.77 700.23C2567.4 688.22 2522.17 676.47 2477.34 663.58C2442.26 653.12 2405.4 641.44 2367.82 646.73C2366.51 646.89 2365.21 647.08 2363.92 647.29C2358.18 648.21 2352.63 649.57 2347.25 651.32"
      /> */}
                        <motion.path
                            className="cls-1"
                            transition={{
                                duration: pulseDuration,
                                ease: "easeOut",
                                delay: globalDelay + randomDelay(pulseDelay),
                                repeat: Infinity,
                                repeatType: "loop",
                                repeatDelay: pulseLoopDelay,
                            }}
                            strokeWidth={pulseStroke}
                            variants={pulseVariants}
                            d="M3274.53 986.494C3021.3 893.684 2768.92 800.784 2513.97 711.494C2480.47 699.544 2446.02 687.864 2412.22 674.874C2383.71 663.974 2353.07 651.864 2321.6 656.694H2321.57C2320.87 656.804 2320.17 656.914 2319.47 657.044C2317.4 657.364 2315.36 657.754 2313.36 658.234C2313.29 658.234 2313.23 658.254 2313.16 658.274"
                        />
                        {/* <motion.path
        className="cls-1"
        transition={{
          duration: pulseDuration,
          ease: "easeOut",
          delay: globalDelay + randomDelay(pulseDelay),
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: pulseLoopDelay,
        }}
        strokeWidth={pulseStroke}
        variants={pulseVariants}
        d="M3044.91 1024.2C2838.72 922.904 2633.28 821.634 2425.07 723.564C2400.56 711.884 2375.23 700.144 2350.43 687.634C2327.63 676.094 2303.01 661.764 2276.21 664.264C2275.22 664.354 2274.22 664.464 2273.22 664.604C2272.21 664.744 2271.21 664.914 2270.22 665.104"
      /> */}
                        <motion.path
                            className="cls-1"
                            transition={{
                                duration: pulseDuration,
                                ease: "easeOut",
                                delay: globalDelay + randomDelay(pulseDelay),
                                repeat: Infinity,
                                repeatType: "loop",
                                repeatDelay: pulseLoopDelay,
                            }}
                            strokeWidth={pulseStroke}
                            variants={pulseVariants}
                            d="M2798.6 1053.67C2643.52 945.56 2489.14 837.62 2331.79 732.21C2314.53 720.5 2296.54 708.59 2279.12 696.15C2263.45 685.23 2245.97 669.82 2225.69 670.49C2223.98 670.55 2222.24 670.72 2220.48 671.02"
                        />
                        {/* <motion.path
        className="cls-1"
        transition={{
          duration: pulseDuration,
          ease: "easeOut",
          delay: globalDelay + randomDelay(pulseDelay),
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: pulseLoopDelay,
        }}
        strokeWidth={pulseStroke}
        variants={pulseVariants}
        d="M2539.83 1074.43C2440.55 963.002 2341.83 851.732 2240.28 741.952C2228.42 728.982 2216.04 715.762 2204.21 702.172C2195.25 692.992 2185.69 676.862 2171.82 675.292C2169.73 675.062 2167.54 675.152 2165.24 675.652C2165.23 675.652 2165.21 675.672 2165.2 675.682"
      /> */}
                        <motion.path
                            className="cls-1"
                            transition={{
                                duration: pulseDuration,
                                ease: "easeOut",
                                delay: globalDelay + randomDelay(pulseDelay),
                                repeat: Infinity,
                                repeatType: "loop",
                                repeatDelay: pulseLoopDelay,
                            }}
                            strokeWidth={pulseStroke}
                            variants={pulseVariants}
                            d="M2272.89 1086.14C2220.29 950.631 2171.83 812.871 2115.05 679.241C2114.05 678.421 2113.11 678.021 2112.21 677.971C2112 677.951 2111.79 677.961 2111.58 677.991"
                        />
                        {/* <motion.path
        className="cls-1"
        transition={{
          duration: pulseDuration,
          ease: "easeOut",
          delay: globalDelay + randomDelay(pulseDelay),
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: pulseLoopDelay,
        }}
        strokeWidth={pulseStroke}
        variants={pulseVariants}
        d="M2002.53 1088.54C2013.59 1001.12 2023.08 913.293 2033.72 825.723C2039.67 776.663 2045.98 727.683 2053.12 678.903C2053.16 678.613 2053.21 678.313 2053.25 678.023C2053.42 678.313 2053.57 678.613 2053.72 678.913"
      /> */}
                        <motion.path
                            className="cls-1"
                            transition={{
                                duration: pulseDuration,
                                ease: "easeOut",
                                delay: globalDelay + randomDelay(pulseDelay),
                                repeat: Infinity,
                                repeatType: "loop",
                                repeatDelay: pulseLoopDelay,
                            }}
                            strokeWidth={pulseStroke}
                            variants={pulseVariants}
                            d="M1733.22 1081.67C1807.03 962.841 1880.65 844.401 1956.64 726.691C1965.84 715.171 1979.18 682.961 1992.09 677.541C1994.65 676.461 1997.19 676.441 1999.68 677.841"
                        />
                        {/* <motion.path
        className="cls-1"
        transition={{
          duration: pulseDuration,
          ease: "easeOut",
          delay: globalDelay + randomDelay(pulseDelay),
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: pulseLoopDelay,
        }}
        strokeWidth={pulseStroke}
        variants={pulseVariants}
        d="M1469.67 1065.58C1596.32 955.072 1722.35 844.792 1851.34 736.522C1865.47 724.542 1880.22 712.302 1894.42 699.602C1905.13 690.552 1917.19 676.792 1931.65 673.752C1935.85 672.862 1940.25 672.872 1944.88 674.172C1945.5 674.412 1946.11 674.672 1946.7 674.942"
      /> */}
                        <motion.path
                            className="cls-1"
                            transition={{
                                duration: pulseDuration,
                                ease: "easeOut",
                                delay: globalDelay + randomDelay(pulseDelay),
                                repeat: Infinity,
                                repeatType: "loop",
                                repeatDelay: pulseLoopDelay,
                            }}
                            strokeWidth={pulseStroke}
                            variants={pulseVariants}
                            d="M1216.27 1040.58C1396.94 935.17 1576.89 829.86 1759.7 727.47C1779.83 716.09 1800.71 704.54 1821.03 692.37C1837.92 682.38 1856.24 669.58 1876.45 667.8C1880.79 667.42 1885.22 667.55 1889.74 668.32C1892.34 668.81 1894.84 669.49 1897.23 670.35"
                        />
                        {/* <motion.path
        className="cls-1"
        transition={{
          duration: pulseDuration,
          ease: "easeOut",
          delay: globalDelay + randomDelay(pulseDelay),
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: pulseLoopDelay,
        }}
        strokeWidth={pulseStroke}
        variants={pulseVariants}
        d="M977.471 1007.13C1207.51 909.386 1436.73 811.636 1668.66 717.316C1696.72 705.736 1725.67 694.216 1754.03 681.716C1777.21 671.496 1802.1 659.616 1828.18 660.226C1832.05 660.306 1835.95 660.666 1839.87 661.356C1843.83 661.976 1847.64 662.926 1851.3 664.166"
      /> */}
                        <motion.path
                            className="cls-1"
                            transition={{
                                duration: pulseDuration,
                                ease: "easeOut",
                                delay: globalDelay + randomDelay(pulseDelay),
                                repeat: Infinity,
                                repeatType: "loop",
                                repeatDelay: pulseLoopDelay,
                            }}
                            strokeWidth={pulseStroke}
                            variants={pulseVariants}
                            d="M757.369 965.665C1029.01 878.255 1299.84 790.645 1573.03 706.785C1611.84 694.675 1651.56 682.865 1690.76 669.775C1721.77 659.245 1754.54 647.685 1788.26 651.785C1788.68 651.825 1789.09 651.875 1789.51 651.935C1796.75 652.755 1803.64 654.395 1810.23 656.705"
                        />
                        {/* <motion.path
        className="cls-1"
        transition={{
          duration: pulseDuration,
          ease: "easeOut",
          delay: globalDelay + randomDelay(pulseDelay),
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: pulseLoopDelay,
        }}
        strokeWidth={pulseStroke}
        variants={pulseVariants}
        d="M559.631 917.069C865.371 841.499 1170.16 765.599 1477.18 693.489C1526.92 681.679 1577.55 670.059 1627.84 657.429C1665.69 647.489 1705.12 636.049 1745.17 641.309C1748.73 641.719 1752.24 642.279 1755.69 642.989C1762.1 644.279 1768.31 646.059 1774.33 648.259"
      /> */}
                        <motion.path
                            className="cls-1"
                            transition={{
                                duration: pulseDuration,
                                ease: "easeOut",
                                delay: globalDelay + randomDelay(pulseDelay),
                                repeat: Infinity,
                                repeatType: "loop",
                                repeatDelay: pulseLoopDelay,
                            }}
                            strokeWidth={pulseStroke}
                            variants={pulseVariants}
                            d="M387.73 862.06C728.38 797.61 1068.11 732.8 1409.89 671.94C1465.32 661.94 1521.68 652.17 1577.75 641.37C1621.13 632.52 1666.19 622.391 1711.15 629.961C1716.11 630.691 1720.97 631.67 1725.75 632.87C1734.62 635.08 1743.17 638.06 1751.43 641.68"
                        />
                        {/* <motion.path
        className="cls-1"
        transition={{
          duration: pulseDuration,
          ease: "easeOut",
          delay: globalDelay + randomDelay(pulseDelay),
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: pulseLoopDelay,
        }}
        strokeWidth={pulseStroke}
        variants={pulseVariants}
        d="M244.57,801.603C612.1,749.713 978.65,697.443 1347.17,649.143C1409.52,640.853 1472.93,632.853 1536.01,623.743C1584.36,616.243 1634.5,607.653 1683.77,617.753C1688.53,618.623 1693.22,619.693 1697.83,620.933C1711.53,624.613 1724.58,629.843 1737.04,636.293C1738.21,636.903 1739.37,637.523 1740.53,638.153"
      /> */}
                        <motion.path
                            className="cls-1"
                            transition={{
                                duration: pulseDuration,
                                ease: "easeOut",
                                delay: globalDelay + randomDelay(pulseDelay),
                                repeat: Infinity,
                                repeatType: "loop",
                                repeatDelay: pulseLoopDelay,
                            }}
                            strokeWidth={pulseStroke}
                            variants={pulseVariants}
                            d="M132.58,736.779C522.74,697.959 911.92,658.709 1302.93,623.539C1369.14,617.449 1436.37,611.729 1503.37,604.849C1556.04,598.869 1610.65,591.989 1663.55,604.889C1666.72,605.579 1669.85,606.349 1672.96,607.199C1695.9,613.409 1717.2,623.549 1737.04,636.289C1737.77,636.759 1738.5,637.229 1739.22,637.709"
                        />
                        {/* <motion.path
        className="cls-1"
        transition={{
          duration: pulseDuration,
          ease: "easeOut",
          delay: globalDelay + randomDelay(pulseDelay),
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: pulseLoopDelay,
        }}
        strokeWidth={pulseStroke}
        variants={pulseVariants}
        d="M53.6602 668.641C459.76 643.581 864.91 618.011 1271.74 596.631C1340.68 592.841 1410.58 589.491 1480.34 584.981C1535.38 580.801 1592.4 575.971 1647.05 590.671C1649.64 591.301 1652.21 591.981 1654.76 592.721C1687.64 602.041 1717.33 618.711 1744.38 639.431"
      /> */}
                        <motion.path
                            className="cls-1"
                            transition={{
                                duration: pulseDuration,
                                ease: "easeOut",
                                delay: globalDelay + randomDelay(pulseDelay),
                                repeat: Infinity,
                                repeatType: "loop",
                                repeatDelay: pulseLoopDelay,
                            }}
                            strokeWidth={pulseStroke}
                            variants={pulseVariants}
                            d="M9.2207 598.375C424.351 587.455 838.461 576.035 1254.18 568.835C1324.64 567.485 1396.08 566.565 1467.4 564.485C1523.89 562.215 1582.29 559.485 1637.79 576.005C1640.53 576.755 1643.24 577.555 1645.93 578.405C1686.68 591.165 1722.63 614.525 1754.8 642.715"
                        />
                        {/* <motion.path
        className="cls-1"
        transition={{
          duration: pulseDuration,
          ease: "easeOut",
          delay: globalDelay + randomDelay(pulseDelay),
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: pulseLoopDelay,
        }}
        strokeWidth={pulseStroke}
        variants={pulseVariants}
        d="M0,527.211C417.01,530.671 833.06,533.561 1250.53,540.731C1321.28,541.821 1393.05,543.361 1464.7,543.761C1521.68,543.401 1580.48,542.811 1635.85,561.161C1638.48,561.971 1641.08,562.821 1643.66,563.721C1691.73,580.301 1732.85,611.011 1769.13,646.861"
      /> */}
                        <motion.path
                            className="cls-1"
                            transition={{
                                duration: pulseDuration,
                                ease: "easeOut",
                                delay: globalDelay + randomDelay(pulseDelay),
                                repeat: Infinity,
                                repeatType: "loop",
                                repeatDelay: pulseLoopDelay,
                            }}
                            strokeWidth={pulseStroke}
                            variants={pulseVariants}
                            d="M26.2207 456.281C437.961 474.051 848.811 491.221 1260.9 512.701C1330.74 516.191 1401.59 520.201 1472.34 523.071C1528.8 524.611 1587.1 526.191 1641.32 546.331C1643.81 547.191 1646.27 548.101 1648.72 549.031C1702.97 569.811 1747.65 608.231 1786.74 651.411"
                        />
                        {/* <motion.path
        className="cls-1"
        transition={{
          duration: pulseDuration,
          ease: "easeOut",
          delay: globalDelay + randomDelay(pulseDelay),
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: pulseLoopDelay,
        }}
        strokeWidth={pulseStroke}
        variants={pulseVariants}
        d="M87.3203 386.961C486.81 418.711 885.37 449.831 1285.05 485.331C1352.77 491.191 1421.48 497.601 1490.16 502.871C1543.98 506.251 1599.45 509.841 1650.67 530.471C1654.23 531.831 1657.75 533.271 1661.23 534.781C1719.98 560.311 1766.43 606.121 1806.88 655.991"
      /> */}
                        <motion.path
                            className="cls-1"
                            transition={{
                                duration: pulseDuration,
                                ease: "easeOut",
                                delay: globalDelay + randomDelay(pulseDelay),
                                repeat: Infinity,
                                repeatType: "loop",
                                repeatDelay: pulseLoopDelay,
                            }}
                            strokeWidth={pulseStroke}
                            variants={pulseVariants}
                            d="M182.221 320.211C562.601 365.451 942.121 410.031 1322.53 458.951C1386.99 467.071 1452.38 475.831 1517.79 483.391C1569.34 488.591 1622.44 494.281 1670.63 516.421C1674.08 517.951 1677.47 519.541 1680.83 521.211C1742.34 551.721 1788.77 604.641 1829 660.361"
                        />
                        {/* <motion.path
        className="cls-1"
        transition={{
          duration: pulseDuration,
          ease: "easeOut",
          delay: globalDelay + randomDelay(pulseDelay),
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: pulseLoopDelay,
        }}
        strokeWidth={pulseStroke}
        variants={pulseVariants}
        d="M309.43 257.414C666.36 315.644 1022.49 373.254 1379.22 435.264C1437.23 445.204 1495.99 455.694 1554.88 465.104C1602.22 471.884 1650.94 479.384 1694.51 501.724C1698.76 503.864 1702.93 506.104 1707.02 508.464C1769.44 544.234 1814.18 603.654 1852.75 664.394"
      /> */}
                        <motion.path
                            className="cls-1"
                            transition={{
                                duration: pulseDuration,
                                ease: "easeOut",
                                delay: globalDelay + randomDelay(pulseDelay),
                                repeat: Infinity,
                                repeatType: "loop",
                                repeatDelay: pulseLoopDelay,
                            }}
                            strokeWidth={pulseStroke}
                            variants={pulseVariants}
                            d="M466.811 199.406C791.851 269.446 1116.17 338.796 1440.85 412.526C1492.47 424.136 1544.81 436.246 1597.31 447.466C1640.95 455.956 1685.98 464.866 1725.34 487.896C1730.09 490.666 1734.73 493.576 1739.26 496.626C1800.78 537.916 1842.17 603.076 1877.77 667.976"
                        />
                        {/* <motion.path
        className="cls-1"
        transition={{
          duration: pulseDuration,
          ease: "easeOut",
          delay: globalDelay + randomDelay(pulseDelay),
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: pulseLoopDelay,
        }}
        strokeWidth={pulseStroke}
        variants={pulseVariants}
        d="M651.471 147.352C954.931 232.332 1257.71 316.922 1560.42 405.972C1631.44 430.712 1712.4 437.002 1774.39 483.812C1775.3 484.522 1776.19 485.232 1777.09 485.962C1835.96 533.342 1871.88 603.162 1904 671.102"
      /> */}
                        <motion.path
                            className="cls-1"
                            transition={{
                                duration: pulseDuration,
                                ease: "easeOut",
                                delay: globalDelay + randomDelay(pulseDelay),
                                repeat: Infinity,
                                repeatType: "loop",
                                repeatDelay: pulseLoopDelay,
                            }}
                            strokeWidth={pulseStroke}
                            variants={pulseVariants}
                            d="M860.4 102.125C1133.79 201.975 1406.46 302.115 1678.64 406.215C1742.48 427.685 1784.74 443.705 1820.13 476.625C1842.49 497.425 1862.11 524.975 1882.69 564.915C1903.64 600.785 1919.1 636.985 1930.37 673.635"
                        />
                        {/* <motion.path
        className="cls-1"
        transition={{
          duration: pulseDuration,
          ease: "easeOut",
          delay: globalDelay + randomDelay(pulseDelay),
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: pulseLoopDelay,
        }}
        strokeWidth={pulseStroke}
        variants={pulseVariants}
        d="M1090.02 64.4141C1311.66 172.954 1532.59 281.684 1752.62 394.074C1806.77 418.384 1840.2 436.804 1867.2 468.814C1884 488.734 1898.32 513.924 1913.59 549.064C1933.59 590.874 1947.83 633.064 1957.81 675.704"
      /> */}
                        <motion.path
                            className="cls-1"
                            transition={{
                                duration: pulseDuration,
                                ease: "easeOut",
                                delay: globalDelay + randomDelay(pulseDelay),
                                repeat: Infinity,
                                repeatType: "loop",
                                repeatDelay: pulseLoopDelay,
                            }}
                            strokeWidth={pulseStroke}
                            variants={pulseVariants}
                            d="M1336.3 34.9453C1510.09 155.225 1682.39 276.915 1854.3 400.225C1881.66 415.385 1901.76 437.375 1917.3 462.815C1938.07 496.795 1950.7 536.915 1961.65 575.085C1972.64 608.635 1980.72 642.775 1986.6 677.305"
                        />
                        {/* <motion.path
        className="cls-1"
        transition={{
          duration: pulseDuration,
          ease: "easeOut",
          delay: globalDelay + randomDelay(pulseDelay),
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: pulseLoopDelay,
        }}
        strokeWidth={pulseStroke}
        variants={pulseVariants}
        d="M1595.07 14.1562C1714.77 148.616 1834.67 282.546 1951.27 419.866C1959.13 432.136 1965.44 445.146 1970.68 458.626C1982.66 489.396 1989.11 522.626 1995.84 555.086C2004.75 595.826 2011.05 636.966 2015.44 678.346"
      /> */}
                        <motion.path
                            className="cls-1"
                            transition={{
                                duration: pulseDuration,
                                ease: "easeOut",
                                delay: globalDelay + randomDelay(pulseDelay),
                                repeat: Infinity,
                                repeatType: "loop",
                                repeatDelay: pulseLoopDelay,
                            }}
                            strokeWidth={pulseStroke}
                            variants={pulseVariants}
                            d="M1861.98 2.46875C1914.25 140.449 1966.69 278.069 2016.92 416.999C2020.36 429.949 2023.1 443.029 2025.34 456.209C2031.49 492.169 2033.98 528.839 2037.31 565.509C2040.76 603.169 2043.22 640.969 2044.96 678.859"
                        />
                        {/* <motion.path
        className="cls-1"
        transition={{
          duration: pulseDuration,
          ease: "easeOut",
          delay: globalDelay + randomDelay(pulseDelay),
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: pulseLoopDelay,
        }}
        strokeWidth={pulseStroke}
        variants={pulseVariants}
        d="M2132.41 0.0625C2115.77 140.253 2098.74 280.042 2083.06 420.522C2082.36 432.272 2081.72 444.023 2081.12 455.783C2077.33 530.013 2075.38 604.403 2074.4 678.843"
      /> */}
                    </motion.g>
                }
                <motion.g>
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M2401.65 6.94531C2316.2 145.945 2227.7 283.165 2146.6 424.835C2142.46 435.405 2138.97 446.175 2135.98 457.085C2126.24 492.515 2121.65 529.435 2116.46 566.165C2110.92 603.365 2106.94 640.765 2104.13 678.305H2104.12"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M2665.26 23.0312C2518.25 149.961 2373.78 279.151 2228.39 408.191C2211.76 422.911 2199.48 440.791 2189.86 460.301C2174.47 491.491 2165.88 526.861 2157.14 560.211C2146.5 598.761 2138.88 637.841 2133.5 677.261"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M2918.59 48.0312C2726.2 159.961 2534.52 271.881 2343.91 387.421C2294.06 414.311 2264.93 433.361 2241.74 465.471C2228.12 484.311 2216.55 507.641 2204.05 539.681C2185.11 584.301 2171.8 629.711 2162.65 675.711"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M3157.4 81.4922C2910.39 186.082 2664.14 290.932 2418.55 399.562C2359.66 422.532 2321.89 439.732 2290.71 472.452C2271.59 492.512 2254.96 518.412 2237.45 555.052C2216.58 594.402 2201.47 633.882 2190.68 673.722"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M3377.53 122.914C3082.07 217.704 2787.43 312.654 2492.99 411.744C2425 432.424 2377.17 446.174 2335.9 480.914C2313.3 499.944 2292.66 525.284 2271.77 561.504C2248.17 598.394 2230.71 634.784 2217.96 671.284"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M3575.23 171.539C3265.47 248.099 2956.34 324.029 2647.08 404.369C2600.93 416.249 2554.09 428.649 2507.05 440.059C2466.74 449.009 2425.4 459.109 2389.72 481.949C2385.44 484.719 2381.27 487.599 2377.19 490.589C2317.07 534.619 2277.7 601.739 2244.42 668.409H2244.41"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M3747.18 226.555C3406.12 291.065 3065.8 354.925 2725.01 423.155C2670.83 433.885 2615.88 445.105 2560.81 455.435C2515.22 463.195 2468.19 471.155 2426.45 493.695C2421.57 496.315 2416.79 499.075 2412.13 501.965C2350.27 540.355 2306.88 602.275 2269.98 665.145"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M3890.33 286.953C3520.26 339.163 3151.04 390.783 2781.04 446.773C2720.93 455.753 2659.92 465.263 2598.89 473.683C2549.97 479.673 2499.64 486.223 2454.12 507.963C2449.66 510.043 2445.29 512.243 2440.99 514.553C2379.35 547.643 2333.62 603.373 2294.39 661.483"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M4002.35 351.789C3609.62 390.839 3217.75 429.299 2824.92 472.169C2761.05 479.009 2696.32 486.349 2631.56 492.599C2578.83 496.939 2524.48 501.609 2474.71 523.059C2470.95 524.609 2467.24 526.239 2463.58 527.949C2403.79 555.889 2357.57 605.049 2317.32 657.499"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M4081.24 419.992C3675.01 445.062 3269.66 469.572 2863.16 498.392C2794.25 503.132 2724.39 508.392 2654.55 512.512C2599.94 515.012 2543.65 517.602 2491.31 537.442C2487.39 538.842 2483.53 540.332 2479.71 541.912C2423.59 565.112 2378.15 607.012 2338.46 653.262"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M4125.68,490.234C3710.48,501.124 3296.27,511.494 2880.71,526.134C2810.26,528.464 2738.85,531.294 2667.5,532.974C2610.65,533.634 2551.98,534.154 2497.11,553.434C2494.41,554.324 2491.72,555.254 2489.07,556.234C2437.91,574.944 2394.88,609.474 2357.13,649.004"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M4134.9 561.362C3717.89 557.942 3301.91 553.962 2884.37 554.222C2813.62 554.132 2741.84 554.492 2670.2 553.702C2613.35 552.412 2554.62 550.802 2499.05 568.272C2496.48 569.022 2493.93 569.812 2491.4 570.642C2446.5 585.332 2407.57 612.562 2372.98 644.882"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M4108.68,632.289C3697.01,614.559 3286.33,596.299 2874,582.249C2804.16,579.719 2733.25,577.649 2662.56,574.389C2606.63,571.199 2548.79,567.419 2493.58,583.079C2491.18,583.699 2488.8,584.369 2486.43,585.069C2448.92,596.129 2415.49,616.409 2385.34,641.289"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M4047.65 701.68C3648.33 669.93 3250.03 637.72 2849.92 609.66C2782.16 604.76 2713.38 600.25 2644.8 594.59C2590.78 589.56 2534.79 583.73 2480.87 597.55C2478.57 598.08 2476.28 598.66 2474.01 599.27C2444.59 607.15 2417.77 621.16 2393.15 638.8"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M3952.62 768.376C3572.5 723.206 3193.37 677.576 2812.33 636.016C2747.84 628.816 2682.32 622.006 2617.07 614.046C2566.94 607.396 2514.96 599.766 2464.23 610.756C2460.91 611.396 2457.62 612.126 2454.37 612.956C2433.23 618.226 2413.52 626.996 2395.09 638.176"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M3825.41 831.242C3468.87 773.042 3113.23 714.442 2755.64 659.862C2697.64 650.882 2638.68 642.162 2579.98 632.392C2533.47 624.142 2485.15 614.692 2437.45 624.002C2434.2 624.562 2430.99 625.222 2427.81 625.982C2414.31 629.162 2401.48 633.972 2389.27 640.062"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M3668.09 889.21C3343.51 819.3 3019.82 749.02 2694.05 682.6C2641.25 671.68 2587.49 661.02 2534.1 649.31C2492.92 639.83 2450.04 628.91 2406.98 635.75C2403.58 636.23 2400.24 636.83 2396.94 637.55C2388.95 639.27 2381.24 641.68 2373.79 644.66"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M3483.4 941.22C3193.04 859.79 2903.54 778.13 2611.77 700.23C2567.4 688.22 2522.17 676.47 2477.34 663.58C2442.26 653.12 2405.4 641.44 2367.82 646.73C2366.51 646.89 2365.21 647.08 2363.92 647.29C2358.18 648.21 2352.63 649.57 2347.25 651.32"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M3274.53 986.494C3021.3 893.684 2768.92 800.784 2513.97 711.494C2480.47 699.544 2446.02 687.864 2412.22 674.874C2383.71 663.974 2353.07 651.864 2321.6 656.694H2321.57C2320.87 656.804 2320.17 656.914 2319.47 657.044C2317.4 657.364 2315.36 657.754 2313.36 658.234C2313.29 658.234 2313.23 658.254 2313.16 658.274"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M3044.91 1024.2C2838.72 922.904 2633.28 821.634 2425.07 723.564C2400.56 711.884 2375.23 700.144 2350.43 687.634C2327.63 676.094 2303.01 661.764 2276.21 664.264C2275.22 664.354 2274.22 664.464 2273.22 664.604C2272.21 664.744 2271.21 664.914 2270.22 665.104"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M2798.6 1053.67C2643.52 945.56 2489.14 837.62 2331.79 732.21C2314.53 720.5 2296.54 708.59 2279.12 696.15C2263.45 685.23 2245.97 669.82 2225.69 670.49C2223.98 670.55 2222.24 670.72 2220.48 671.02"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M2539.83 1074.43C2440.55 963.002 2341.83 851.732 2240.28 741.952C2228.42 728.982 2216.04 715.762 2204.21 702.172C2195.25 692.992 2185.69 676.862 2171.82 675.292C2169.73 675.062 2167.54 675.152 2165.24 675.652C2165.23 675.652 2165.21 675.672 2165.2 675.682"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M2272.89 1086.14C2220.29 950.631 2171.83 812.871 2115.05 679.241C2114.05 678.421 2113.11 678.021 2112.21 677.971C2112 677.951 2111.79 677.961 2111.58 677.991"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M2002.53 1088.54C2013.59 1001.12 2023.08 913.293 2033.72 825.723C2039.67 776.663 2045.98 727.683 2053.12 678.903C2053.16 678.613 2053.21 678.313 2053.25 678.023C2053.42 678.313 2053.57 678.613 2053.72 678.913"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M1733.22 1081.67C1807.03 962.841 1880.65 844.401 1956.64 726.691C1965.84 715.171 1979.18 682.961 1992.09 677.541C1994.65 676.461 1997.19 676.441 1999.68 677.841"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M1469.67 1065.58C1596.32 955.072 1722.35 844.792 1851.34 736.522C1865.47 724.542 1880.22 712.302 1894.42 699.602C1905.13 690.552 1917.19 676.792 1931.65 673.752C1935.85 672.862 1940.25 672.872 1944.88 674.172C1945.5 674.412 1946.11 674.672 1946.7 674.942"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M1216.27 1040.58C1396.94 935.17 1576.89 829.86 1759.7 727.47C1779.83 716.09 1800.71 704.54 1821.03 692.37C1837.92 682.38 1856.24 669.58 1876.45 667.8C1880.79 667.42 1885.22 667.55 1889.74 668.32C1892.34 668.81 1894.84 669.49 1897.23 670.35"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M977.471 1007.13C1207.51 909.386 1436.73 811.636 1668.66 717.316C1696.72 705.736 1725.67 694.216 1754.03 681.716C1777.21 671.496 1802.1 659.616 1828.18 660.226C1832.05 660.306 1835.95 660.666 1839.87 661.356C1843.83 661.976 1847.64 662.926 1851.3 664.166"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M757.369 965.665C1029.01 878.255 1299.84 790.645 1573.03 706.785C1611.84 694.675 1651.56 682.865 1690.76 669.775C1721.77 659.245 1754.54 647.685 1788.26 651.785C1788.68 651.825 1789.09 651.875 1789.51 651.935C1796.75 652.755 1803.64 654.395 1810.23 656.705"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M559.631 917.069C865.371 841.499 1170.16 765.599 1477.18 693.489C1526.92 681.679 1577.55 670.059 1627.84 657.429C1665.69 647.489 1705.12 636.049 1745.17 641.309C1748.73 641.719 1752.24 642.279 1755.69 642.989C1762.1 644.279 1768.31 646.059 1774.33 648.259"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M387.73 862.06C728.38 797.61 1068.11 732.8 1409.89 671.94C1465.32 661.94 1521.68 652.17 1577.75 641.37C1621.13 632.52 1666.19 622.391 1711.15 629.961C1716.11 630.691 1720.97 631.67 1725.75 632.87C1734.62 635.08 1743.17 638.06 1751.43 641.68"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M244.57,801.603C612.1,749.713 978.65,697.443 1347.17,649.143C1409.52,640.853 1472.93,632.853 1536.01,623.743C1584.36,616.243 1634.5,607.653 1683.77,617.753C1688.53,618.623 1693.22,619.693 1697.83,620.933C1711.53,624.613 1724.58,629.843 1737.04,636.293C1738.21,636.903 1739.37,637.523 1740.53,638.153"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M132.58,736.779C522.74,697.959 911.92,658.709 1302.93,623.539C1369.14,617.449 1436.37,611.729 1503.37,604.849C1556.04,598.869 1610.65,591.989 1663.55,604.889C1666.72,605.579 1669.85,606.349 1672.96,607.199C1695.9,613.409 1717.2,623.549 1737.04,636.289C1737.77,636.759 1738.5,637.229 1739.22,637.709"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M53.6602 668.641C459.76 643.581 864.91 618.011 1271.74 596.631C1340.68 592.841 1410.58 589.491 1480.34 584.981C1535.38 580.801 1592.4 575.971 1647.05 590.671C1649.64 591.301 1652.21 591.981 1654.76 592.721C1687.64 602.041 1717.33 618.711 1744.38 639.431"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M9.2207 598.375C424.351 587.455 838.461 576.035 1254.18 568.835C1324.64 567.485 1396.08 566.565 1467.4 564.485C1523.89 562.215 1582.29 559.485 1637.79 576.005C1640.53 576.755 1643.24 577.555 1645.93 578.405C1686.68 591.165 1722.63 614.525 1754.8 642.715"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M0,527.211C417.01,530.671 833.06,533.561 1250.53,540.731C1321.28,541.821 1393.05,543.361 1464.7,543.761C1521.68,543.401 1580.48,542.811 1635.85,561.161C1638.48,561.971 1641.08,562.821 1643.66,563.721C1691.73,580.301 1732.85,611.011 1769.13,646.861"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M26.2207 456.281C437.961 474.051 848.811 491.221 1260.9 512.701C1330.74 516.191 1401.59 520.201 1472.34 523.071C1528.8 524.611 1587.1 526.191 1641.32 546.331C1643.81 547.191 1646.27 548.101 1648.72 549.031C1702.97 569.811 1747.65 608.231 1786.74 651.411"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M87.3203 386.961C486.81 418.711 885.37 449.831 1285.05 485.331C1352.77 491.191 1421.48 497.601 1490.16 502.871C1543.98 506.251 1599.45 509.841 1650.67 530.471C1654.23 531.831 1657.75 533.271 1661.23 534.781C1719.98 560.311 1766.43 606.121 1806.88 655.991"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M182.221 320.211C562.601 365.451 942.121 410.031 1322.53 458.951C1386.99 467.071 1452.38 475.831 1517.79 483.391C1569.34 488.591 1622.44 494.281 1670.63 516.421C1674.08 517.951 1677.47 519.541 1680.83 521.211C1742.34 551.721 1788.77 604.641 1829 660.361"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M309.43 257.414C666.36 315.644 1022.49 373.254 1379.22 435.264C1437.23 445.204 1495.99 455.694 1554.88 465.104C1602.22 471.884 1650.94 479.384 1694.51 501.724C1698.76 503.864 1702.93 506.104 1707.02 508.464C1769.44 544.234 1814.18 603.654 1852.75 664.394"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M466.811 199.406C791.851 269.446 1116.17 338.796 1440.85 412.526C1492.47 424.136 1544.81 436.246 1597.31 447.466C1640.95 455.956 1685.98 464.866 1725.34 487.896C1730.09 490.666 1734.73 493.576 1739.26 496.626C1800.78 537.916 1842.17 603.076 1877.77 667.976"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M651.471 147.352C954.931 232.332 1257.71 316.922 1560.42 405.972C1631.44 430.712 1712.4 437.002 1774.39 483.812C1775.3 484.522 1776.19 485.232 1777.09 485.962C1835.96 533.342 1871.88 603.162 1904 671.102"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M860.4 102.125C1133.79 201.975 1406.46 302.115 1678.64 406.215C1742.48 427.685 1784.74 443.705 1820.13 476.625C1842.49 497.425 1862.11 524.975 1882.69 564.915C1903.64 600.785 1919.1 636.985 1930.37 673.635"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M1090.02 64.4141C1311.66 172.954 1532.59 281.684 1752.62 394.074C1806.77 418.384 1840.2 436.804 1867.2 468.814C1884 488.734 1898.32 513.924 1913.59 549.064C1933.59 590.874 1947.83 633.064 1957.81 675.704"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M1336.3 34.9453C1510.09 155.225 1682.39 276.915 1854.3 400.225C1881.66 415.385 1901.76 437.375 1917.3 462.815C1938.07 496.795 1950.7 536.915 1961.65 575.085C1972.64 608.635 1980.72 642.775 1986.6 677.305"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M1595.07 14.1562C1714.77 148.616 1834.67 282.546 1951.27 419.866C1959.13 432.136 1965.44 445.146 1970.68 458.626C1982.66 489.396 1989.11 522.626 1995.84 555.086C2004.75 595.826 2011.05 636.966 2015.44 678.346"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M1861.98 2.46875C1914.25 140.449 1966.69 278.069 2016.92 416.999C2020.36 429.949 2023.1 443.029 2025.34 456.209C2031.49 492.169 2033.98 528.839 2037.31 565.509C2040.76 603.169 2043.22 640.969 2044.96 678.859"
                    />
                    <motion.path
                        className="cls-1"
                        transition={{
                            duration: lineDuration,
                            ease: "easeOut",
                            delay: globalDelay + randomDelay(lineDelay),
                        }}
                        strokeWidth={lineStroke}
                        variants={lineVariants}
                        d="M2132.41 0.0625C2115.77 140.253 2098.74 280.042 2083.06 420.522C2082.36 432.272 2081.72 444.023 2081.12 455.783C2077.33 530.013 2075.38 604.403 2074.4 678.843"
                    />
                </motion.g>
            </motion.g>
        </svg>
    )
}

const defaultProps = {
    delay: 0.0,
    lines: {
        delay: 1.4,
        duration: 1.4,
        stroke: 1,
        opacity: [0, 1, 0.25],
        colors: ["hsl(var(--accent))"],
    },
    rings: {
        delay: 0.4,
        duration: 0.4,
        stagger: 0.06,
        offset: -30,
        stroke: 1,
        opacity: [0, 1, 0.25],
        colors: ["hsl(var(--accent))", "hsl(var(--accent))", "hsl(var(--accent))"],
    },
    pulse: {
        delay: 1.4,
        loopDelay: 0,
        duration: 1.4,
        stroke: 1.5,
        opacity: [0, 1, 0],
        colors: ["#330014", "#F16D00", "#FAAF01"],
    },
}

Wormhole.defaultProps = defaultProps
