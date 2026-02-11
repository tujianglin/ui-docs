import type { CSSMotionProps, MotionEndEventHandler, MotionEventHandler } from '@vc-com/motion';

const getCollapsedHeight: MotionEventHandler = () => ({ height: 0, opacity: 0 });
const getRealHeight: MotionEventHandler = (node) => ({ height: `${node.scrollHeight}px`, opacity: 1 });
const getCurrentHeight: MotionEventHandler = (node) => ({ height: `${node.offsetHeight}px` });
const skipOpacityTransition: MotionEndEventHandler = (_, event) => (event as TransitionEvent).propertyName === 'height';

const collapseMotion: CSSMotionProps = {
  motionName: 'rc-collapse-motion',
  onEnterStart: getCollapsedHeight,
  onEnterActive: getRealHeight,
  onLeaveStart: getCurrentHeight,
  onLeaveActive: getCollapsedHeight,
  onEnterEnd: skipOpacityTransition,
  onLeaveEnd: skipOpacityTransition,
  motionDeadline: 500,
  leavedClassName: 'rc-collapse-panel-hidden',
};

export default collapseMotion;
