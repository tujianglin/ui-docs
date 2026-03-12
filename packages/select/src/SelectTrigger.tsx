import Render from '@vc-com/render';
import Trigger, { type TriggerRef } from '@vc-com/trigger';
import type { AlignType, BuildInPlacements } from '@vc-com/trigger/interface';
import type { VueNode } from '@vc-com/util/lib/types';
import { clsx } from 'clsx';
import { computed, defineComponent, type CSSProperties } from 'vue';
import { useRef, type FocusEventHandler, type MouseEventHandler } from 'vue-jsx-vapor';
import type { Placement, RenderDOMFunc } from './BaseSelect';

const getBuiltInPlacements = (popupMatchSelectWidth: boolean | number): Record<string, AlignType> => {
  // Enable horizontal overflow auto-adjustment when a custom dropdown width is provided
  const adjustX = popupMatchSelectWidth === true ? 0 : 1;
  return {
    bottomLeft: {
      points: ['tl', 'bl'],
      offset: [0, 4],
      overflow: {
        adjustX,
        adjustY: 1,
      },
      htmlRegion: 'scroll',
    },
    bottomRight: {
      points: ['tr', 'br'],
      offset: [0, 4],
      overflow: {
        adjustX,
        adjustY: 1,
      },
      htmlRegion: 'scroll',
    },
    topLeft: {
      points: ['bl', 'tl'],
      offset: [0, -4],
      overflow: {
        adjustX,
        adjustY: 1,
      },
      htmlRegion: 'scroll',
    },
    topRight: {
      points: ['br', 'tr'],
      offset: [0, -4],
      overflow: {
        adjustX,
        adjustY: 1,
      },
      htmlRegion: 'scroll',
    },
  };
};

export interface RefTriggerProps {
  getPopupElement: () => HTMLDivElement;
}

export interface SelectTriggerProps {
  prefixCls: string;
  disabled: boolean;
  visible: boolean;
  popupElement: VueNode;

  animation?: string;
  transitionName?: string;
  placement?: Placement;
  builtinPlacements?: BuildInPlacements;
  popupStyle: CSSProperties;
  popupClassName: string;
  direction: string;
  popupMatchSelectWidth?: boolean | number;
  popupRender?: (menu: VueNode) => any;
  getPopupContainer?: RenderDOMFunc;
  popupAlign: AlignType;
  empty: boolean;

  onPopupVisibleChange?: (visible: boolean) => void;

  onPopupMouseEnter: () => void;
  onPopupMouseDown: MouseEventHandler<HTMLDivElement>;
  onPopupBlur?: FocusEventHandler<HTMLDivElement>;
}

const SelectTrigger = defineComponent(
  ({
    prefixCls,
    disabled: _,
    visible,
    popupElement,
    animation,
    transitionName,
    popupStyle,
    popupClassName,
    direction = 'ltr',
    placement,
    builtinPlacements,
    popupMatchSelectWidth,
    popupRender,
    popupAlign,
    getPopupContainer,
    empty,
    onPopupVisibleChange,
    onPopupMouseEnter,
    onPopupMouseDown,
    onPopupBlur,
    ...restProps
  }: SelectTriggerProps) => {
    // We still use `dropdown` className to keep compatibility
    // This is used for:
    // 1. Styles
    // 2. Animation
    // 3. Theme customization
    // Please do not modify this since it's a breaking change
    const popupPrefixCls = computed(() => `${prefixCls}-dropdown`);

    const popupNode = computed(() => {
      let result = popupElement;
      if (popupRender) {
        result = popupRender(popupElement);
      }
      return result;
    });

    const mergedBuiltinPlacements = computed(() => builtinPlacements || getBuiltInPlacements(popupMatchSelectWidth));

    // ===================== Motion ======================
    const mergedTransitionName = computed(() => (animation ? `${popupPrefixCls.value}-${animation}` : transitionName));

    // =================== Popup Width ===================
    const isNumberPopupWidth = computed(() => typeof popupMatchSelectWidth === 'number');

    const stretch = computed(() => {
      if (isNumberPopupWidth.value) {
        return null;
      }

      return popupMatchSelectWidth === false ? 'minWidth' : 'width';
    });

    const mergedPopupStyle = computed(() => {
      let result = popupStyle;
      if (isNumberPopupWidth.value) {
        result = {
          ...popupStyle,
          width: `${popupMatchSelectWidth}px`,
        };
      }
      return result;
    });

    // ======================= Ref =======================
    const triggerPopupRef = useRef<TriggerRef>(null);

    defineExpose({
      getPopupElement: () => triggerPopupRef.value?.popupElement,
    });

    return () => (
      <Trigger
        {...restProps}
        showAction={onPopupVisibleChange ? ['click'] : []}
        hideAction={onPopupVisibleChange ? ['click'] : []}
        popupPlacement={placement || (direction === 'rtl' ? 'bottomRight' : 'bottomLeft')}
        builtinPlacements={mergedBuiltinPlacements.value}
        prefixCls={popupPrefixCls.value}
        popupMotion={{ motionName: mergedTransitionName.value }}
        popup={
          <div onMouseenter={onPopupMouseEnter} onMousedown={onPopupMouseDown} onBlur={onPopupBlur}>
            <Render content={popupNode.value}></Render>
          </div>
        }
        ref={triggerPopupRef}
        stretch={stretch.value}
        popupAlign={popupAlign}
        popupVisible={visible}
        getPopupContainer={getPopupContainer}
        popupClassName={clsx(popupClassName, { [`${popupPrefixCls.value}-empty`]: empty })}
        popupStyle={mergedPopupStyle.value}
        onOpenChange={onPopupVisibleChange}
      >
        <slot></slot>
      </Trigger>
    );
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'SelectTrigger' : undefined },
);

export default SelectTrigger;
