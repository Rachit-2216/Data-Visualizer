// Animation hooks index
export { useReducedMotion, useMotionSafe, useAnimateSafe } from './use-reduced-motion';
export { useMousePosition, useRelativeMousePosition } from './use-mouse-position';
export type { MousePosition } from './use-mouse-position';
export {
  useSpring,
  useSpringPosition,
  useSpringScale,
  useSpringRotation,
  useSpringOpacity,
  useFollowSpring,
  useSpringTransform,
  getSpringConfig,
  SPRING_PRESETS,
} from './use-spring';
export type { SpringPreset } from './use-spring';
export {
  useIntersection,
  useScrollProgress,
  useStaggeredReveal,
  useAppearOnce,
} from './use-intersection';
export { useMagnetic, useMagneticCursor } from './use-magnetic';
export { useSwipe, useSwipeToDismiss } from './use-swipe';
export type { SwipeDirection } from './use-swipe';
export {
  useGyroscope,
  useGyroscopeParallax,
  useDeviceMotion,
  useShake,
} from './use-gyroscope';
