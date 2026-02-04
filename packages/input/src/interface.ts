import type { InputFocusOptions } from '@vc-com/util/lib/Dom/focus';
import type { VueNode } from '@vc-com/util/lib/types';
import type { CSSProperties } from 'vue';
import type { InputHTMLAttributes, KeyboardEventHandler, MouseEventHandler } from 'vue-jsx-vapor';
import type { LiteralUnion } from './utils/types';

export interface CommonInputProps {
  prefix?: (() => VueNode) | VueNode;
  suffix?: (() => VueNode) | VueNode;
  addonBefore?: (() => VueNode) | VueNode;
  addonAfter?: (() => VueNode) | VueNode;
  classNames?: {
    affixWrapper?: string;
    prefix?: string;
    suffix?: string;
    groupWrapper?: string;
    wrapper?: string;
    variant?: string;
  };
  styles?: {
    affixWrapper?: CSSProperties;
    prefix?: CSSProperties;
    suffix?: CSSProperties;
  };
  allowClear?: boolean | { clearIcon?: (() => VueNode) | VueNode };
}

type DataAttr = Record<`data-${string}`, string>;

export type ValueType = InputHTMLAttributes<HTMLInputElement>['value'] | bigint;

export interface BaseInputProps extends CommonInputProps {
  prefixCls?: string;
  class?: string;
  style?: CSSProperties;
  disabled?: boolean;
  focused?: boolean;
  triggerFocus?: () => void;
  readOnly?: boolean;
  handleReset?: MouseEventHandler;
  onClear?: () => void;
  hidden?: boolean;
  dataAttrs?: {
    affixWrapper?: DataAttr;
  };
  components?: {
    affixWrapper?: 'span' | 'div';
    groupWrapper?: 'span' | 'div';
    wrapper?: 'span' | 'div';
    groupAddon?: 'span' | 'div';
  };
}

export type ShowCountFormatter = (args: { value: string; count: number; maxLength?: number }) => (() => VueNode) | VueNode;

export type ExceedFormatter = (value: string, config: { max: number }) => string;

export interface CountConfig {
  max?: number;
  strategy?: (value: string) => number;
  show?: boolean | ShowCountFormatter;
  /** Trigger when content larger than the `max` limitation */
  exceedFormatter?: ExceedFormatter;
}

export interface InputProps
  extends CommonInputProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix' | 'type' | 'value'> {
  prefixCls?: string;
  // ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#%3Cinput%3E_types
  type?: LiteralUnion<
    | 'button'
    | 'checkbox'
    | 'color'
    | 'date'
    | 'datetime-local'
    | 'email'
    | 'file'
    | 'hidden'
    | 'image'
    | 'month'
    | 'number'
    | 'password'
    | 'radio'
    | 'range'
    | 'reset'
    | 'search'
    | 'submit'
    | 'tel'
    | 'text'
    | 'time'
    | 'url'
    | 'week',
    string
  >;
  onPressEnter?: KeyboardEventHandler<HTMLInputElement>;
  /** It's better to use `count.show` instead */
  showCount?:
    | boolean
    | {
        formatter: ShowCountFormatter;
      };
  autoComplete?: string;
  htmlSize?: number;
  classNames?: CommonInputProps['classNames'] & {
    input?: string;
    count?: string;
  };
  styles?: CommonInputProps['styles'] & {
    input?: CSSProperties;
    count?: CSSProperties;
  };
  count?: CountConfig;
  onClear?: () => void;
}

export interface InputRef {
  focus: (options?: InputFocusOptions) => void;
  blur: () => void;
  setSelectionRange: (start: number, end: number, direction?: 'forward' | 'backward' | 'none') => void;
  select: () => void;
  input: HTMLInputElement | null;
  nativeElement: HTMLElement | null;
}

export interface ChangeEventInfo {
  source: 'compositionEnd' | 'change';
}
