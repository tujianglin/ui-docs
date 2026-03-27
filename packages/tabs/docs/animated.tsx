import type { CSSMotionProps } from '@vc-com/motion';
import Tabs from '../src';
import './animated.less';
import './assets/index.less';

const motion: CSSMotionProps = {
  motionName: 'switch',
  motionAppear: false,
  motionEnter: true,
  motionLeave: true,
};

export default () => (
  <Tabs
    animated={{
      tabPaneMotion: motion,
    }}
    items={[
      {
        label: 'Light',
        key: 'light',
        children: 'Light!',
        style: {
          height: '200px',
          background: 'rgba(255, 0, 0, 0.05)',
        },
      },
      {
        label: 'Bamboo',
        key: 'bamboo',
        children: 'Bamboo!',
        style: {
          height: '100px',
          background: 'rgba(0, 255, 0, 0.05)',
        },
      },
      {
        label: 'Cute',
        key: 'cute',
        children: 'Cute!',
        style: {
          background: 'rgba(0, 0, 255, 0.05)',
        },
      },
    ]}
  />
);
