"use client";

import React, { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "motion/react";
import { EASE, DURATION, SPRING, STAGGER } from "@/lib/motion";

/* -------------------------------------------------------------------------- */
/*                                1. REVEAL                                   */
/* -------------------------------------------------------------------------- */
interface RevealProps {
  children: React.ReactNode;
  mode?: "mask" | "clip" | "blur";
  delay?: number;
  className?: string;
}

export function Reveal({
  children,
  mode = "mask",
  delay = 0,
  className = "",
}: RevealProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={`reveal-target ${className}`}>{children}</div>;
  }

  if (mode === "mask") {
    return (
      <div className={`overflow-hidden ${className}`}>
        <motion.div
          initial={{ y: "110%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          transition={{
            duration: DURATION.element,
            ease: EASE.expoOut,
            delay,
          }}
        >
          {children}
        </motion.div>
      </div>
    );
  }

  if (mode === "clip") {
    return (
      <motion.div
        className={className}
        initial={{ clipPath: "inset(100% 0 0 0)", opacity: 0 }}
        animate={{ clipPath: "inset(0% 0 0 0)", opacity: 1 }}
        transition={{
          duration: DURATION.scene,
          ease: EASE.quartInOut,
          delay,
        }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ filter: "blur(12px)", opacity: 0 }}
      animate={{ filter: "blur(0px)", opacity: 1 }}
      transition={{
        duration: DURATION.element,
        ease: EASE.softOut,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               2. SPLIT TEXT                                */
/* -------------------------------------------------------------------------- */
interface SplitTextProps {
  text: string;
  delay?: number;
  className?: string;
  by?: "char" | "word";
}

export function SplitText({
  text,
  delay = 0,
  className = "",
  by = "char",
}: SplitTextProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <span className={className}>{text}</span>;
  }

  const items = by === "char" ? Array.from(text) : text.split(" ");
  const staggerDuration = by === "char" ? STAGGER.char : STAGGER.word;

  return (
    <span className={`inline-flex flex-wrap overflow-hidden ${className}`}>
      {items.map((item, idx) => (
        <span key={idx} className="inline-block overflow-hidden">
          <motion.span
            className="inline-block"
            initial={{ y: "115%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{
              duration: DURATION.element,
              ease: EASE.expoOut,
              delay: delay + idx * staggerDuration,
            }}
          >
            {item === " " ? "\u00A0" : item}
          </motion.span>
          {by === "word" && idx < items.length - 1 && "\u00A0"}
        </span>
      ))}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                                3. MAGNETIC                                 */
/* -------------------------------------------------------------------------- */
interface MagneticProps {
  children: React.ReactNode;
  pullFactor?: number;
  className?: string;
}

export function Magnetic({
  children,
  pullFactor = 0.35,
  className = "",
}: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, SPRING.magnetic);
  const springY = useSpring(mouseY, SPRING.magnetic);

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const deltaX = (e.clientX - centerX) * pullFactor;
    const deltaY = (e.clientY - centerY) * pullFactor;

    mouseX.set(deltaX);
    mouseY.set(deltaY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                4. CLEAN CARD                               */
/* -------------------------------------------------------------------------- */
interface CleanCardProps {
  children: React.ReactNode;
  className?: string;
}

export function CleanCard({ children, className = "" }: CleanCardProps) {
  return (
    <div
      className={`bg-white rounded-3xl border border-[#E4E4E7] lab-shadow-md transition-shadow duration-300 hover:shadow-lg ${className}`}
    >
      {children}
    </div>
  );
}
