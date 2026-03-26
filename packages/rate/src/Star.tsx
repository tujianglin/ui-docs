import KeyCode from '@vc-com/util/lib/KeyCode';
import type { VueNode } from '@vc-com/util/lib/types';
import { clsx } from 'clsx';
import { defineComponent } from 'vue';
import type { KeyboardEventHandler, MouseEvent, MouseEventHandler } from 'vue-jsx-vapor';

export interface StarProps {
  value?: number;
  index?: number;
  prefixCls?: string;
  allowHalf?: boolean;
  disabled?: boolean;
  onHover?: (e: MouseEvent<HTMLDivElement>, index: number) => void;
  onClick?: (e, index: number) => void;
  character?: VueNode | ((props: StarProps) => VueNode);
  characterRender?: (origin: VueNode, props: StarProps) => VueNode;
  focused?: boolean;
  count?: number;
}

const Star = defineComponent(
  ({ disabled, prefixCls, character, characterRender, index, count, value, allowHalf, focused, onHover, onClick }: StarProps) => {
    // =========================== Events ===========================
    const onInternalHover: MouseEventHandler<HTMLDivElement> = (e) => {
      onHover(e, index);
    };

    const onInternalClick: MouseEventHandler<HTMLDivElement> = (e) => {
      onClick(e, index);
    };

    const onInternalKeyDown: KeyboardEventHandler<HTMLDivElement> = (e) => {
      if (e.keyCode === KeyCode.ENTER) {
        onClick(e, index);
      }
    };

    // =========================== Render ===========================
    return () => {
      // >>>>> ClassName
      const starValue = index + 1;
      const classNameList = new Set([prefixCls]);

      // TODO: Current we just refactor from CC to FC. This logic seems can be optimized.
      if (value === 0 && index === 0 && focused) {
        classNameList.add(`${prefixCls}-focused`);
      } else if (allowHalf && value + 0.5 >= starValue && value < starValue) {
        classNameList.add(`${prefixCls}-half`);
        classNameList.add(`${prefixCls}-active`);
        if (focused) {
          classNameList.add(`${prefixCls}-focused`);
        }
      } else {
        if (starValue <= value) {
          classNameList.add(`${prefixCls}-full`);
        } else {
          classNameList.add(`${prefixCls}-zero`);
        }
        if (starValue === value && focused) {
          classNameList.add(`${prefixCls}-focused`);
        }
      }

      // >>>>> Node
      const characterNode = typeof character === 'function' ? character(__props) : character;

      let start = (
        <li class={clsx(Array.from(classNameList))}>
          <div
            onClick={disabled ? null : onInternalClick}
            onKeydown={disabled ? null : onInternalKeyDown}
            onMousemove={disabled ? null : onInternalHover}
            role="radio"
            aria-checked={value > index ? 'true' : 'false'}
            aria-posinset={index + 1}
            aria-setsize={count}
            tabindex={disabled ? -1 : 0}
          >
            <div class={`${prefixCls}-first`}>{characterNode}</div>
            <div class={`${prefixCls}-second`}>{characterNode}</div>
          </div>
        </li>
      );

      if (characterRender) {
        start = characterRender(start, __props) as JSX.Element;
      }

      return start;
    };
  },
  { inheritAttrs: false },
);

export default Star;
