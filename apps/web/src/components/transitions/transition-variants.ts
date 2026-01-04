import { Variants, Transition } from 'framer-motion';

// Spring transition presets
export const springTransitions = {
  snappy: { type: 'spring', stiffness: 400, damping: 30 } as Transition,
  smooth: { type: 'spring', stiffness: 100, damping: 20 } as Transition,
  bouncy: { type: 'spring', stiffness: 300, damping: 15 } as Transition,
  gentle: { type: 'spring', stiffness: 50, damping: 15 } as Transition,
};

// Easing presets
export const easings = {
  easeOutExpo: [0.16, 1, 0.3, 1],
  easeOutBack: [0.34, 1.56, 0.64, 1],
  easeInOutCirc: [0.85, 0, 0.15, 1],
};

// Page transition variants
export const pageVariants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  } as Variants,

  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  } as Variants,

  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  } as Variants,

  slideLeft: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
  } as Variants,

  slideRight: {
    initial: { opacity: 0, x: -100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 100 },
  } as Variants,

  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
  } as Variants,

  scaleDown: {
    initial: { opacity: 0, scale: 1.1 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  } as Variants,
};

// Wipe transition variants (requires clip-path)
export const wipeVariants = {
  wipeRight: {
    initial: { clipPath: 'inset(0 100% 0 0)' },
    animate: { clipPath: 'inset(0 0% 0 0)' },
    exit: { clipPath: 'inset(0 0 0 100%)' },
  } as Variants,

  wipeLeft: {
    initial: { clipPath: 'inset(0 0 0 100%)' },
    animate: { clipPath: 'inset(0 0 0 0%)' },
    exit: { clipPath: 'inset(0 100% 0 0)' },
  } as Variants,

  wipeUp: {
    initial: { clipPath: 'inset(100% 0 0 0)' },
    animate: { clipPath: 'inset(0% 0 0 0)' },
    exit: { clipPath: 'inset(0 0 100% 0)' },
  } as Variants,

  wipeDown: {
    initial: { clipPath: 'inset(0 0 100% 0)' },
    animate: { clipPath: 'inset(0 0 0% 0)' },
    exit: { clipPath: 'inset(100% 0 0 0)' },
  } as Variants,

  wipeDiagonal: {
    initial: { clipPath: 'polygon(0 0, 0 0, 0 0)' },
    animate: { clipPath: 'polygon(0 0, 200% 0, 0 200%)' },
    exit: { clipPath: 'polygon(100% 100%, 100% 100%, 100% 100%)' },
  } as Variants,
};

// Expand transition variants
export const expandVariants = {
  expandFromCenter: {
    initial: {
      clipPath: 'circle(0% at 50% 50%)',
      opacity: 0,
    },
    animate: {
      clipPath: 'circle(150% at 50% 50%)',
      opacity: 1,
    },
    exit: {
      clipPath: 'circle(0% at 50% 50%)',
      opacity: 0,
    },
  } as Variants,

  expandFromTopLeft: {
    initial: {
      clipPath: 'circle(0% at 0% 0%)',
      opacity: 0,
    },
    animate: {
      clipPath: 'circle(200% at 0% 0%)',
      opacity: 1,
    },
    exit: {
      clipPath: 'circle(0% at 0% 0%)',
      opacity: 0,
    },
  } as Variants,

  expandFromBottomRight: {
    initial: {
      clipPath: 'circle(0% at 100% 100%)',
      opacity: 0,
    },
    animate: {
      clipPath: 'circle(200% at 100% 100%)',
      opacity: 1,
    },
    exit: {
      clipPath: 'circle(0% at 100% 100%)',
      opacity: 0,
    },
  } as Variants,
};

// Slice transition variants
export const sliceVariants = {
  sliceDiagonal: {
    initial: {
      clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)',
    },
    animate: {
      clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
    },
    exit: {
      clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)',
    },
  } as Variants,

  sliceReverse: {
    initial: {
      clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)',
    },
    animate: {
      clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
    },
    exit: {
      clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)',
    },
  } as Variants,
};

// 3D transition variants
export const flip3DVariants = {
  flipX: {
    initial: {
      rotateX: -90,
      opacity: 0,
    },
    animate: {
      rotateX: 0,
      opacity: 1,
    },
    exit: {
      rotateX: 90,
      opacity: 0,
    },
  } as Variants,

  flipY: {
    initial: {
      rotateY: -90,
      opacity: 0,
    },
    animate: {
      rotateY: 0,
      opacity: 1,
    },
    exit: {
      rotateY: 90,
      opacity: 0,
    },
  } as Variants,
};

// Stagger container variants
export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
} as Variants;

// Stagger item variants
export const staggerItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: easings.easeOutExpo,
    },
  },
} as Variants;

// Default transition configuration
export const defaultTransition: Transition = {
  duration: 0.4,
  ease: easings.easeOutExpo,
};

// Get transition variant by name
export function getTransitionVariant(
  name: string
): Variants {
  const allVariants: Record<string, Variants> = {
    ...pageVariants,
    ...wipeVariants,
    ...expandVariants,
    ...sliceVariants,
    ...flip3DVariants,
  };

  return allVariants[name] || pageVariants.fade;
}
