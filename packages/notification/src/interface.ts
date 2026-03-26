import type { Key, RenderNode } from '@vc-com/util/lib/types';
import type { CSSProperties } from 'vue';
import type { AriaAttributes, HTMLAttributes, MouseEventHandler } from 'vue-jsx-vapor';

export type Placement = 'top' | 'topLeft' | 'topRight' | 'bottom' | 'bottomLeft' | 'bottomRight';

type NoticeSemanticProps = 'wrapper';

export interface NoticeConfig {
  content?: RenderNode;
  duration?: number | false | null;
  showProgress?: boolean;
  pauseOnHover?: boolean;

  closable?: boolean | ({ closeIcon?: RenderNode; onClose?: VoidFunction } & AriaAttributes);
  class?: string;
  style?: CSSProperties;
  classNames?: {
    [key in NoticeSemanticProps]?: string;
  };
  styles?: {
    [key in NoticeSemanticProps]?: CSSProperties;
  };
  /** @private Internal usage. Do not override in your code */
  props?: HTMLAttributes<HTMLDivElement> & Record<string, any>;

  onClose?: VoidFunction;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

export interface OpenConfig extends NoticeConfig {
  key: Key;
  placement?: Placement;
  content?: RenderNode;
  duration?: number | false | null;
}

export type InnerOpenConfig = OpenConfig & { times?: number };

export type Placements = Partial<Record<Placement, OpenConfig[]>>;

export type StackConfig =
  | boolean
  | {
      /**
       * When number is greater than threshold, notifications will be stacked together.
       * @default 3
       */
      threshold?: number;
      /**
       * Offset when notifications are stacked together.
       * @default 8
       */
      offset?: number;
      /**
       * Spacing between each notification when expanded.
       */
      gap?: number;
    };
