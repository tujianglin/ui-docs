import type { CSSInterpolation } from '@vc-com/cssinjs';
import { Keyframes, useStyleRegister } from '@vc-com/cssinjs';
import { useStyleContext } from '@vc-com/cssinjs/StyleContext';
import { defineComponent, watchEffect } from 'vue';
import type { DerivativeToken } from './theme';
import { useToken } from './theme';

const prefixCls = 'ant-spin';

// 定义旋转动画
const animation = new Keyframes('loadingCircle', {
  to: {
    transform: 'rotate(360deg)',
  },
});

// 通用框架
const genSpinStyle = (prefixCls: string, token: DerivativeToken): CSSInterpolation => [
  {
    [`.${prefixCls}`]: {
      width: 20,
      height: 20,
      backgroundColor: token.primaryColor,

      animationName: animation,
      animationDuration: '1s',
      animationTimingFunction: 'linear',
      animationIterationCount: 'infinite',
    },
  },
  animation,
];

const Spin = defineComponent({
  name: 'Spin',
  props: {
    class: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const [theme, token, hashId] = useToken();
    // 预先调用 useStyleContext，确保 inject 在 setup 中执行并缓存
    useStyleContext();

    // 在 setup 中使用 watchEffect 响应式注册样式
    watchEffect(() => {
      useStyleRegister({ theme: theme.value, token: token.value, hashId: hashId.value, path: [prefixCls] }, () => [
        genSpinStyle(prefixCls, token.value),
      ]);
    });

    return () => {
      const spinClass = [prefixCls, hashId.value, props.class].filter(Boolean).join(' ');
      return <div class={spinClass} style={{ background: 'red' }}></div>;
    };
  },
});

export default Spin;
