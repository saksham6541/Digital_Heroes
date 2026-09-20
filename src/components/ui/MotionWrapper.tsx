"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

interface MotionFadeInProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  delay?: number;
  duration?: number;
}

export function MotionFadeIn({
  children,
  delay = 0,
  duration = 0.5,
  className,
  ...props
}: MotionFadeInProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function MotionStaggerContainer({
  children,
  className,
  delayChildren = 0.1,
  staggerChildren = 0.12,
  ...props
}: {
  children: ReactNode;
  className?: string;
  delayChildren?: number;
  staggerChildren?: number;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : "hidden"}
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            delayChildren,
            staggerChildren,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function MotionStaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.45, ease: "easeOut" },
        },
      }}
      whileHover={reduceMotion ? undefined : { y: -4, transition: { duration: 0.2 } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function MotionCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      whileHover={reduceMotion ? undefined : { scale: 1.015, transition: { duration: 0.2 } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
