import type { CSSInterpolation, CSSObject } from '@vc-com/cssinjs';
import { unit, useCSSVarRegister, useStyleRegister } from '@vc-com/cssinjs';
import { clsx } from 'clsx';
import { computed, defineComponent, type PropType } from 'vue';
import { useToken, type DerivativeToken } from './theme';

interface ButtonToken extends DerivativeToken {
  buttonPadding: string;
  buttonBorderBottomWidth: string;
}

// 通用框架
const genSharedButtonStyle = (prefixCls: string, token: ButtonToken): CSSInterpolation => ({
  [`.${prefixCls}`]: {
    borderColor: token.borderColor,
    borderWidth: token.borderWidth,
    borderRadius: token.borderRadius,
    lineHeight: token.lineHeight,
    padding: token.buttonPadding,

    cursor: 'pointer',

    transition: 'background 0.3s',

    '&:hover': {
      opacity: 0.6,
    },

    '&:active': {
      opacity: 0.3,
    },
  },
});

// 实心底色样式
const genSolidButtonStyle = (prefixCls: string, token: ButtonToken, postFn: () => CSSObject): CSSInterpolation => [
  genSharedButtonStyle(prefixCls, token),
  {
    [`.${prefixCls}`]: {
      ...postFn(),
    },
  },
];

// 默认样式
const genDefaultButtonStyle = (prefixCls: string, token: ButtonToken): CSSInterpolation =>
  genSolidButtonStyle(prefixCls, token, () => ({
    backgroundColor: token.componentBackgroundColor,
    color: token.textColor,
    borderWidth: token.buttonBorderBottomWidth,

    '&:hover': {
      borderColor: token.primaryColor,
      color: token.primaryColor,
    },
  }));

// 主色样式
const genPrimaryButtonStyle = (prefixCls: string, token: ButtonToken): CSSInterpolation =>
  genSolidButtonStyle(prefixCls, token, () => ({
    backgroundColor: token.primaryColor,
    border: `${unit(token.borderWidth)} solid ${token.primaryColor}`,
    color: token.reverseTextColor,

    '&:hover': {
      backgroundColor: token.primaryColorDisabled,
    },
  }));

// 透明按钮
const genGhostButtonStyle = (prefixCls: string, token: ButtonToken): CSSInterpolation => [
  genSharedButtonStyle(prefixCls, token),
  {
    [`.${prefixCls}`]: {
      backgroundColor: 'transparent',
      color: token.primaryColor,
      border: `${unit(token.borderWidth)} solid ${token.primaryColor}`,

      '&:hover': {
        borderColor: token.primaryColor,
        color: token.primaryColor,
      },
    },
  },
];

type ButtonType = 'primary' | 'ghost' | 'dashed' | 'link' | 'text' | 'default';

const Button = defineComponent({
  name: 'Button',
  props: {
    type: {
      type: String as PropType<ButtonType>,
      default: 'default',
    },
    class: {
      type: String,
      default: '',
    },
  },
  setup(props, { slots }) {
    const prefixCls = 'ant-btn';

    // 【自定义】制造样式
    const [theme, token, hashId, cssVarKey, realToken] = useToken();

    // default 添加默认样式选择器后可以省很多冲突解决问题
    const defaultCls = `${prefixCls}-default`;
    const primaryCls = `${prefixCls}-primary`;
    const ghostCls = `${prefixCls}-ghost`;

    const typeCls = computed(() => {
      const typeClsMap: Record<string, string> = {
        primary: primaryCls,
        ghost: ghostCls,
      };
      return typeClsMap[props.type] || defaultCls;
    });

    return () => {
      const [cssVarToken] = useCSSVarRegister(
        {
          path: [prefixCls],
          key: cssVarKey.value,
          token: realToken.value,
          prefix: prefixCls,
          unitless: {
            lineHeight: true,
          },
          ignore: {
            lineHeightBase: true,
          },
          scope: prefixCls,
          hashId: hashId.value,
        },
        () => ({
          buttonPadding: '4px 8px',
          buttonBorderBottomWidth: `calc(${token.value.borderWidth} * 2)`,
        }),
      );

      const mergedToken = {
        ...token.value,
        ...cssVarToken,
      } as ButtonToken;

      // 全局注册，内部会做缓存优化
      useStyleRegister({ theme: theme.value, token: token.value, hashId: hashId.value, path: [prefixCls] }, () => [
        genDefaultButtonStyle(defaultCls, mergedToken),
        genPrimaryButtonStyle(primaryCls, mergedToken),
        genGhostButtonStyle(ghostCls, mergedToken),
      ]);

      return (
        <button class={clsx(prefixCls, typeCls.value, hashId.value, props.class, cssVarKey.value)}>{slots.default?.()}</button>
      );
    };
  },
});

export default Button;
