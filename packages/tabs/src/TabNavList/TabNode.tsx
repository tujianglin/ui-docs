import type { RenderNode, VueNode } from '@vc-com/util/lib/types';
import { clsx } from 'clsx';
import { computed, defineComponent, watch, type CSSProperties } from 'vue';
import {
  useRef,
  type FocusEventHandler,
  type KeyboardEvent,
  type KeyboardEventHandler,
  type MouseEvent,
  type MouseEventHandler,
} from 'vue-jsx-vapor';
import type { EditableConfig, Tab } from '../interface';
import type { SemanticName } from '../Tabs';
import { genDataNodeKey, getRemovable } from '../util';

export interface TabNodeProps {
  id: string;
  prefixCls: string;
  tab: Tab;
  active: boolean;
  focus: boolean;
  closable?: boolean;
  editable?: EditableConfig;
  onClick?: (e: MouseEvent | KeyboardEvent) => void;
  onResize?: (width: number, height: number, left: number, top: number) => void;
  renderWrapper?: (node: VueNode) => VueNode;
  removeAriaLabel?: string;
  tabCount: number;
  currentPosition: number;
  removeIcon?: RenderNode;
  onKeydown: KeyboardEventHandler;
  onMousedown: MouseEventHandler;
  onMouseup: MouseEventHandler;
  onFocus: FocusEventHandler;
  onBlur: FocusEventHandler;
  styles?: Pick<Partial<Record<SemanticName, CSSProperties>>, 'item' | 'remove'>;
  classNames?: Pick<Partial<Record<SemanticName, string>>, 'item' | 'remove'>;
}

const TabNode = defineComponent(
  ({
    prefixCls,
    id,
    active,
    focus,
    tab: { key, label, disabled, closeIcon, icon },
    closable,
    renderWrapper,
    removeAriaLabel,
    editable,
    onClick,
    onFocus,
    onBlur,
    onKeydown,
    onMousedown,
    onMouseup,
    styles,
    classNames: tabNodeClassNames,
    tabCount,
    currentPosition,
  }: TabNodeProps) => {
    const tabPrefix = computed(() => `${prefixCls}-tab`);

    const removable = computed(() => getRemovable(closable, closeIcon, editable, disabled));

    function onInternalClick(e: MouseEvent | KeyboardEvent) {
      if (disabled) {
        return;
      }
      onClick(e);
    }

    function onRemoveTab(event: MouseEvent | KeyboardEvent) {
      event.preventDefault();
      event.stopPropagation();
      editable.onEdit('remove', { key, event });
    }

    const labelNode = computed(() => (icon && typeof label === 'string' ? <span>{label}</span> : label));

    const btnRef = useRef<HTMLDivElement>(null);

    watch(
      () => focus,
      () => {
        if (focus && btnRef.value) {
          btnRef.value.focus();
        }
      },
      { immediate: true },
    );

    return () => {
      const node = (
        <div
          key={key}
          data-node-key={genDataNodeKey(key)}
          class={clsx(tabPrefix.value, tabNodeClassNames?.item, {
            [`${tabPrefix.value}-with-remove`]: removable.value,
            [`${tabPrefix.value}-active`]: active,
            [`${tabPrefix.value}-disabled`]: disabled,
            [`${tabPrefix.value}-focus`]: focus,
          })}
          style={styles?.item}
          onClick={onInternalClick}
        >
          {/* Primary Tab Button */}
          <div
            ref={btnRef}
            role="tab"
            aria-selected={active}
            id={id && `${id}-tab-${key}`}
            class={`${tabPrefix.value}-btn`}
            aria-controls={id && `${id}-panel-${key}`}
            aria-disabled={disabled}
            tabindex={disabled ? null : active ? 0 : -1}
            onClick={(e) => {
              e.stopPropagation();
              onInternalClick(e);
            }}
            onKeydown={onKeydown}
            onMousedown={onMousedown}
            onMouseup={onMouseup}
            onFocus={onFocus}
            onBlur={onBlur}
          >
            <div
              v-if={focus}
              aria-live="polite"
              style={{ width: 0, height: 0, position: 'absolute', overflow: 'hidden', opacity: 0 }}
            >
              {`Tab ${currentPosition} of ${tabCount}`}
            </div>
            <span v-if={icon} class={`${tabPrefix.value}-icon`}>
              {icon}
            </span>
            {label && labelNode.value}
          </div>

          {/* Remove Button */}
          <button
            v-if={removable.value}
            type="button"
            aria-label={removeAriaLabel || 'remove'}
            tabindex={active ? 0 : -1}
            class={clsx(`${tabPrefix.value}-remove`, tabNodeClassNames?.remove)}
            style={styles?.remove}
            onClick={(e) => {
              e.stopPropagation();
              onRemoveTab(e);
            }}
          >
            {closeIcon || editable.removeIcon || '×'}
          </button>
        </div>
      );

      return renderWrapper ? renderWrapper(node) : (node as any);
    };
  },
  { inheritAttrs: false },
);

export default TabNode;
