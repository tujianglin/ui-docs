import Render from '@vc-com/render';
import type { ActionType, AlignType, ArrowType, TriggerProps, TriggerRef } from '@vc-com/trigger';
import Trigger from '@vc-com/trigger';
import { useId } from '@vc-com/util/lib/hooks/useId';
import { filterEmpty } from '@vc-com/util/lib/props-util';
import type { VueNode } from '@vc-com/util/lib/types';
import { clsx } from 'clsx';
import { computed, createVNode, defineComponent, getCurrentInstance, type CSSProperties } from 'vue';
import { placements } from './placements';
import Popup from './Popup';

export type SemanticName = 'root' | 'arrow' | 'container' | 'uniqueContainer';

export interface TooltipProps extends Pick<
  TriggerProps,
  | 'onPopupAlign'
  | 'builtinPlacements'
  | 'fresh'
  | 'mouseLeaveDelay'
  | 'mouseEnterDelay'
  | 'prefixCls'
  | 'forceRender'
  | 'popupVisible'
> {
  // Style
  classNames?: Partial<Record<SemanticName, string>>;
  styles?: Partial<Record<SemanticName, CSSProperties>>;

  /** Config popup motion */
  motion?: TriggerProps['popupMotion'];

  // Rest
  trigger?: ActionType[];
  defaultVisible?: boolean;
  visible?: boolean;
  placement?: string;

  onVisibleChange?: (visible: boolean) => void;
  afterVisibleChange?: (visible: boolean) => void;
  overlay: (() => VueNode) | VueNode;

  getTooltipContainer?: (node: HTMLElement) => HTMLElement;
  destroyOnHidden?: boolean;
  align?: AlignType;
  showArrow?: boolean | ArrowType;
  arrowContent?: VueNode;
  id?: string;

  zIndex?: number;

  /**
   * Configures Tooltip to reuse the background for transition usage.
   * This is an experimental API and may not be stable.
   */
  unique?: TriggerProps['unique'];
}

export interface TooltipRef extends TriggerRef {}

const Tooltip = defineComponent(
  ({
    trigger = ['hover'],
    mouseEnterDelay = 0,
    mouseLeaveDelay = 0.1,
    prefixCls = 'rc-tooltip',
    onVisibleChange,
    afterVisibleChange,
    motion,
    placement = 'right',
    align = {},
    destroyOnHidden = false,
    defaultVisible,
    getTooltipContainer,
    arrowContent,
    overlay,
    id,
    showArrow = true,
    classNames,
    styles,
    ...restProps
  }: TooltipProps) => {
    const slots = defineSlots<{ default: () => any }>();

    const mergedId = useId(id);

    // ========================= Arrow ==========================
    // Process arrow configuration
    const mergedArrow = computed(() => {
      if (!showArrow) {
        return false;
      }

      // Convert true to object for unified processing
      const arrowConfig = showArrow === true ? {} : showArrow;

      // Apply semantic styles with unified logic
      return {
        ...arrowConfig,
        class: clsx(arrowConfig.class, classNames?.arrow),
        style: { ...arrowConfig.style, ...styles?.arrow },
        content: arrowConfig.content ?? arrowContent,
      };
    });

    // ========================= Render =========================
    return () => {
      const extraProps: Partial<TooltipProps & TriggerProps> = { ...restProps };

      if ('visible' in restProps) {
        extraProps.popupVisible = restProps.visible;
      }

      // ======================== Children ========================
      const children = filterEmpty(slots?.default?.());
      const getChildren = () => {
        const child = children?.[0];
        const originalProps = child?.props || {};
        const childProps = {
          ...originalProps,
          'aria-describedby': overlay ? mergedId.value : null,
        };
        return createVNode(child, childProps);
      };

      const vm = getCurrentInstance();

      const changeRef = (el) => {
        vm.exposed = el || {};
        vm.exposeProxy = el || {};
      };

      return (
        <Trigger
          popupClassName={classNames?.root}
          prefixCls={prefixCls}
          popup={() => (
            <Popup key="content" prefixCls={prefixCls} id={mergedId.value} classNames={classNames} styles={styles}>
              <Render content={overlay}></Render>
            </Popup>
          )}
          action={trigger}
          builtinPlacements={placements}
          popupPlacement={placement}
          ref={changeRef}
          popupAlign={align}
          getPopupContainer={getTooltipContainer}
          onOpenChange={onVisibleChange}
          afterOpenChange={afterVisibleChange}
          popupMotion={motion}
          defaultPopupVisible={defaultVisible}
          autoDestroy={destroyOnHidden}
          mouseLeaveDelay={mouseLeaveDelay}
          popupStyle={styles?.root}
          mouseEnterDelay={mouseEnterDelay}
          arrow={mergedArrow.value}
          uniqueContainerClassName={classNames?.uniqueContainer}
          uniqueContainerStyle={styles?.uniqueContainer}
          {...extraProps}
        >
          {getChildren()}
        </Trigger>
      );
    };
  },
  { inheritAttrs: false },
);

export default Tooltip;
