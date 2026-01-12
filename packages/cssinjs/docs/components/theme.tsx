import { TinyColor } from '@ctrl/tinycolor';
import type { CSSObject, Theme } from '@vc-com/cssinjs';
import { createTheme, useCacheToken } from '@vc-com/cssinjs';
import { useStyleContext } from '@vc-com/cssinjs/StyleContext';
import type { ComputedRef, InjectionKey, Ref } from 'vue';
import { computed, defineComponent, getCurrentInstance, inject, provide, shallowRef, watchEffect } from 'vue';

export type GetStyle = (prefixCls: string, token: DerivativeToken) => CSSObject;

export interface DesignToken {
  primaryColor: string;
  textColor: string;
  reverseTextColor: string;

  componentBackgroundColor: string;

  borderRadius: number;
  borderColor: string;
  borderWidth: number;

  lineHeight: number;
  lineHeightBase: number;
}

export interface DerivativeToken extends DesignToken {
  primaryColorDisabled: string;
}

const defaultDesignToken: DesignToken = {
  primaryColor: '#1890ff',
  textColor: '#333333',
  reverseTextColor: '#FFFFFF',

  componentBackgroundColor: '#FFFFFF',

  borderRadius: 2,
  borderColor: 'black',
  borderWidth: 1,

  lineHeight: 1.5,
  lineHeightBase: 1.5,
};

// 模拟推导过程
function derivative(designToken: DesignToken): DerivativeToken {
  return {
    ...designToken,
    primaryColorDisabled: new TinyColor(designToken.primaryColor).setAlpha(0.5).toString(),
  };
}

// Theme Context
export const ThemeContextKey: InjectionKey<ComputedRef<Theme<any, any>>> = Symbol('ThemeContext');

// 缓存组件实例的 context，避免在 render 中重复 inject
const themeContextCache = new WeakMap<object, ComputedRef<Theme<any, any>>>();

export function useThemeContext() {
  const instance = getCurrentInstance();

  if (instance) {
    const cached = themeContextCache.get(instance);
    if (cached) return cached;
  }

  const context = inject(
    ThemeContextKey,
    computed(() => createTheme(derivative)),
  );

  if (instance) {
    themeContextCache.set(instance, context);
  }

  return context;
}

export function provideThemeContext(theme: Theme<any, any>) {
  provide(
    ThemeContextKey,
    computed(() => theme),
  );
}

// Design Token Context
export interface DesignTokenContextValue {
  token?: Partial<DesignToken>;
  hashed?: string | boolean;
  cssVar?: {
    key: string;
  };
}

export const DesignTokenContextKey: InjectionKey<ComputedRef<DesignTokenContextValue>> = Symbol('DesignTokenContext');

const designTokenContextCache = new WeakMap<object, ComputedRef<DesignTokenContextValue>>();

export function useDesignTokenContext() {
  const instance = getCurrentInstance();

  if (instance) {
    const cached = designTokenContextCache.get(instance);
    if (cached) return cached;
  }

  const context = inject(
    DesignTokenContextKey,
    computed(() => ({ token: defaultDesignToken })),
  );

  if (instance) {
    designTokenContextCache.set(instance, context);
  }

  return context;
}

export function provideDesignTokenContext(value: DesignTokenContextValue) {
  provide(
    DesignTokenContextKey,
    computed(() => value),
  );
}

let idCounter = 0;
function useId() {
  return `id-${++idCounter}`;
}

// DesignTokenProvider 组件
export const DesignTokenProvider = defineComponent({
  name: 'DesignTokenProvider',
  props: {
    value: {
      type: Object as () => {
        token?: Partial<DesignToken>;
        hashed?: string | boolean;
        cssVar?: {
          key?: string;
          prefix?: string;
        };
      },
      default: undefined,
    },
  },
  setup(props, { slots }) {
    const themeKey = useId();
    const cssVarKey = `css-var-${themeKey.replace(/:/g, '')}`;

    const contextValue = computed<DesignTokenContextValue>(() => ({
      token: props.value?.token,
      hashed: props.value?.hashed,
      cssVar: {
        ...props.value?.cssVar,
        key: props.value?.cssVar?.key || cssVarKey,
      },
    }));

    provide(DesignTokenContextKey, contextValue);

    return () => slots.default?.();
  },
});

export function useToken(): [
  ComputedRef<Theme<any, any>>,
  ComputedRef<DerivativeToken>,
  ComputedRef<string>,
  ComputedRef<string>,
  ComputedRef<DerivativeToken>,
] {
  const designTokenContext = useDesignTokenContext();
  const themeContext = useThemeContext();
  // 在 setup 阶段调用 useStyleContext，确保 inject 正确执行
  useStyleContext();

  const theme = computed(() => themeContext.value);

  const cssVarKey = computed(() => designTokenContext.value.cssVar?.key || 'css-var-root');

  const hashed = computed(() => designTokenContext.value.hashed);

  type CacheResult = [DerivativeToken, string, DerivativeToken, string, string];
  const cacheResult: Ref<CacheResult> = shallowRef([{} as DerivativeToken, '', {} as DerivativeToken, '', '']);

  // 使用 watchEffect 来响应式地更新 cacheResult
  watchEffect(() => {
    const { token: rootDesignToken = {} } = designTokenContext.value;
    const result = useCacheToken<DerivativeToken, DesignToken>(themeContext.value, [defaultDesignToken, rootDesignToken], {
      salt: typeof hashed.value === 'string' ? hashed.value : '',
      cssVar: {
        prefix: 'rc',
        key: cssVarKey.value,
        unitless: {
          lineHeight: true,
        },
        hashed: !!hashed.value,
      },
    });
    cacheResult.value = result;
  });

  const token = computed(() => cacheResult.value[0]);
  const hashId = computed(() => (hashed.value ? cacheResult.value[1] : ''));
  const realToken = computed(() => cacheResult.value[2]);

  return [theme, token, hashId, cssVarKey, realToken];
}
