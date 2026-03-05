import type { BaseInputProps, CommonInputProps, InputProps } from '@vc-com/input/interface';
import type { CSSProperties } from 'vue';
import type { KeyboardEventHandler, TextareaHTMLAttributes } from 'vue-jsx-vapor';

export interface AutoSizeType {
  minRows?: number;
  maxRows?: number;
}

// To compatible with origin usage. We have to wrap this
export interface ResizableTextAreaRef {
  textArea: HTMLTextAreaElement;
}

export type HTMLTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export type TextAreaProps = Omit<HTMLTextareaProps, 'onResize' | 'value' | 'disabled' | 'hidden' | 'style' | 'readonly'> & {
  prefixCls?: string;
  class?: string;
  disabled?: boolean;
  hidden?: boolean;
  readonly?: boolean;
  style?: CSSProperties;
  autoSize?: boolean | AutoSizeType;
  onPressEnter?: KeyboardEventHandler<HTMLTextAreaElement>;
  onResize?: (size: { width: number; height: number }) => void;
  classNames?: CommonInputProps['classNames'] & {
    textarea?: string;
    count?: string;
  };
  styles?: {
    textarea?: CSSProperties;
    count?: CSSProperties;
  };
} & Pick<BaseInputProps, 'allowClear' | 'suffix'> &
  Pick<InputProps, 'showCount' | 'count' | 'onClear'>;

export type TextAreaRef = {
  resizableTextArea: ResizableTextAreaRef;
  focus: () => void;
  blur: () => void;
  nativeElement: HTMLElement;
};
