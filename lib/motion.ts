import type { Variants } from "motion/react";

export const EASE = {
  expoOut: [0.16, 1, 0.3, 1] as const,
  quartInOut: [0.76, 0, 0.24, 1] as const,
  softOut: [0.22, 1, 0.36, 1] as const,
} as const;

export const DURATION = {
  micro: 0.25,
  element: 0.8,
  scene: 1.4,
} as const;

export const SPRING = {
  snappy: {
    stiffness: 400,
    damping: 32,
    mass: 0.6,
  },
  soft: {
    stiffness: 120,
    damping: 22,
    mass: 1.0,
  },
  magnetic: {
    stiffness: 180,
    damping: 14,
    mass: 0.15,
  },
} as const;

export const STAGGER = {
  char: 0.025,
  word: 0.05,
  line: 0.08,
} as const;

export const VARIANTS = {
  maskedLine: {
    hidden: { y: "110%", opacity: 0 },
    visible: {
      y: "0%",
      opacity: 1,
      transition: { duration: DURATION.element, ease: EASE.expoOut },
    },
  } satisfies Variants,

  clipReveal: {
    hidden: { clipPath: "inset(100% 0 0 0)" },
    visible: {
      clipPath: "inset(0% 0 0 0)",
      transition: { duration: DURATION.scene, ease: EASE.quartInOut },
    },
  } satisfies Variants,

  blurIn: {
    hidden: { filter: "blur(12px)", opacity: 0 },
    visible: {
      filter: "blur(0px)",
      opacity: 1,
      transition: { duration: DURATION.element, ease: EASE.softOut },
    },
  } satisfies Variants,

  scaleSettle: {
    hidden: { scale: 1.08, opacity: 0 },
    visible: {
      scale: 1.0,
      opacity: 1,
      transition: { duration: DURATION.element, ease: EASE.expoOut },
    },
  } satisfies Variants,

  messageUser: {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", ...SPRING.snappy },
    },
  } satisfies Variants,

  messageAi: {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: DURATION.element, ease: EASE.expoOut },
    },
  } satisfies Variants,
} as const;
