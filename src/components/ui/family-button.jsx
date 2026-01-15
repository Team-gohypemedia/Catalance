import { useState } from "react";
import PlusIcon from "lucide-react/dist/esm/icons/plus";
import XIcon from "lucide-react/dist/esm/icons/x";
import { motion } from "motion/react";

import { cn } from "@/shared/lib/utils";

const CONTAINER_SIZE = 260;

const FamilyButton = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <div
      className={cn(
        "rounded-[24px] border shadow-sm",
        "border-black/5 dark:border-white/10",
        "bg-gradient-to-b from-[#FFFBF0] to-[#F2EFE9] dark:from-neutral-900 dark:to-black",
        isExpanded
          ? "w-[204px] bg-gradient-to-b from-[#FFFBF0] to-[#F2EFE9] dark:from-neutral-900 dark:to-stone-950"
          : "bg-gradient-to-b from-[#FFFBF0] to-[#F2EFE9] dark:from-neutral-900 dark:to-black"
      )}
    >
      <div className="rounded-[23px] border border-white/50 dark:border-white/5">
        <div className="rounded-[22px] border border-black/5 dark:border-black/20">
          <div className="rounded-[21px] border border-white/20 dark:border-white/10 flex items-center justify-center">
            <FamilyButtonContainer
              isExpanded={isExpanded}
              toggleExpand={toggleExpand}
            >
              {isExpanded ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: {
                      delay: 0.3,
                      duration: 0.4,
                      ease: "easeOut",
                    },
                  }}
                >
                  {children}
                </motion.div>
              ) : null}
            </FamilyButtonContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const FamilyButtonContainer = ({ isExpanded, toggleExpand, children }) => {
  return (
    <motion.div
      className={cn(
        "relative border shadow-lg flex flex-col space-y-1 items-center cursor-pointer z-10",
        "border-white/40 dark:border-white/10",
        "text-black dark:text-white",
        !isExpanded
          ? "bg-gradient-to-b from-[#FFFBF0] to-[#F2EFE9] dark:from-neutral-900 dark:to-stone-900"
          : ""
      )}
      layoutRoot
      layout
      initial={{ borderRadius: 21, width: "4rem", height: "4rem" }}
      animate={
        isExpanded
          ? {
              borderRadius: 20,
              width: CONTAINER_SIZE,
              height: CONTAINER_SIZE + 50,

              transition: {
                type: "spring",
                damping: 25,
                stiffness: 400,
                when: "beforeChildren",
              },
            }
          : {
              borderRadius: 21,
              width: "4rem",
              height: "4rem",
            }
      }
    >
      {children}
      <motion.div
        className="absolute"
        initial={{ x: "-50%", y: "-50%" }}
        animate={{
          x: isExpanded ? "0%" : "-50%",
          y: isExpanded ? "0%" : "-50%",
          transition: {
            type: "tween",
            ease: "easeOut",
            duration: 0.3,
          },
        }}
        style={{
          left: isExpanded ? "" : "50%",
          top: isExpanded ? "" : "50%",
          bottom: isExpanded ? 6 : "",
        }}
      >
        {isExpanded ? (
          <motion.div
            className={cn(
              "p-[10px] group rounded-full shadow-xl transition-colors duration-300 border",
              "bg-white/80 dark:bg-neutral-800/80",
              "border-black/5 dark:border-white/10",
              "hover:border-black/20 dark:hover:border-white/30",
              "text-neutral-800 dark:text-neutral-200"
            )}
            onClick={toggleExpand}
            layoutId="expand-toggle"
            initial={false}
            animate={{
              rotate: -360,
              transition: {
                duration: 0.4,
              },
            }}
          >
            <XIcon
              className={cn(
                "h-7 w-7 transition-colors duration-200",
                "text-neutral-600 dark:text-neutral-400",
                "group-hover:text-black dark:group-hover:text-white"
              )}
            />
          </motion.div>
        ) : (
          <motion.div
            className={cn("px-4 py-2 cursor-pointer")}
            onClick={toggleExpand}
            layoutId="expand-toggle"
            initial={{ scale: 1 }}
            animate={{
              scale: 1,
              transition: {
                duration: 0.3,
              },
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-base font-bold tracking-wide text-black dark:text-white">
              Help
            </span>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export { FamilyButton };
export default FamilyButton;
