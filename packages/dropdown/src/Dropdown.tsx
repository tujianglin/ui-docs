import type { TriggerProps } from '@vc-com/trigger';
import Trigger from '@vc-com/trigger';
import type { ActionType, AlignType, AnimationType, BuildInPlacements } from '@vc-com/trigger/interface';
import { filterEmpty } from '@vc-com/util/lib/props-util';
import type { RenderNode } from '@vc-com/util/lib/types';
import { clsx } from 'clsx';
import { computed, createVNode, defineComponent, ref, type CSSProperties } from 'vue';
import { useFullProps, useRef } from 'vue-jsx-vapor';
import useAccessibility from './hooks/useAccessibility';
import Overlay from './Overlay';
import Placements from './placements';

export interface DropdownProps extends Pick<
  TriggerProps,
  'getPopupContainer' | 'mouseEnterDelay' | 'mouseLeaveDelay' | 'onPopupAlign' | 'builtinPlacements' | 'autoDestroy'
> {
  minOverlayWidthMatchTrigger?: boolean;
  arrow?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  onOverlayClick?: (e: Event) => void;
  prefixCls?: string;
  transitionName?: string;
  overlayClassName?: string;
  openClassName?: string;
  animation?: AnimationType;
  align?: AlignType;
  overlayStyle?: CSSProperties;
  placement?: keyof typeof Placements;
  placements?: BuildInPlacements;
  overlay?: RenderNode;
  trigger?: ActionType[];
  alignPoint?: boolean;
  showAction?: ActionType[];
  hideAction?: ActionType[];
  visible?: boolean;
  autoFocus?: boolean;
}

const Dropdown = defineComponent(
  ({
    arrow = false,
    prefixCls = 'rc-dropdown',
    transitionName,
    animation,
    align,
    placement = 'bottomLeft',
    placements = Placements,
    getPopupContainer,
    showAction,
    hideAction,
    overlayClassName,
    overlayStyle,
    visible,
    trigger = ['hover'],
    autoFocus,
    overlay,
    onVisibleChange,
    ...otherProps
  }: DropdownProps) => {
    const slots = defineSlots();
    const props = useFullProps() as DropdownProps;
    const triggerVisible = ref<boolean>();
    const mergedVisible = computed(() => ('visible' in props ? visible : triggerVisible.value));
    const mergedMotionName = computed(() => (animation ? `${prefixCls}-${animation}` : transitionName));

    const triggerRef = useRef(null);
    const overlayRef = useRef(null);
    const childRef = useRef(null);
    defineExpose({
      get nativeElement() {
        return triggerRef.value;
      },
    });

    const handleVisibleChange = (newVisible: boolean) => {
      triggerVisible.value = newVisible;
      onVisibleChange?.(newVisible);
    };

    useAccessibility({
      visible: mergedVisible,
      triggerRef: childRef,
      onVisibleChange: handleVisibleChange,
      autofocus: computed(() => autoFocus),
      overlayRef,
    });

    const onClick = (e) => {
      const { onOverlayClick } = props;
      triggerVisible.value = false;

      if (onOverlayClick) {
        onOverlayClick(e);
      }
    };

    const getMinOverlayWidthMatchTrigger = () => {
      const { minOverlayWidthMatchTrigger, alignPoint } = props;
      if ('minOverlayWidthMatchTrigger' in props) {
        return minOverlayWidthMatchTrigger;
      }

      return !alignPoint;
    };

    const getOpenClassName = () => {
      const { openClassName } = props;
      if (openClassName !== undefined) {
        return openClassName;
      }
      return `${prefixCls}-open`;
    };

    return () => {
      const getMenuElement = () => <Overlay ref={overlayRef} overlay={overlay} prefixCls={prefixCls} arrow={arrow} />;

      const getMenuElementOrLambda = () => {
        if (typeof overlay === 'function') {
          return getMenuElement;
        }
        return getMenuElement();
      };

      const children = filterEmpty(slots?.default?.() ?? [])[0];
      const childrenNode = createVNode(children, {
        class: clsx(mergedVisible.value && getOpenClassName()),
        ref: childRef,
      });

      let triggerHideAction = hideAction;
      if (!triggerHideAction && trigger?.includes('contextmenu')) {
        triggerHideAction = ['click'];
      }
      return (
        <Trigger
          builtinPlacements={placements}
          {...otherProps}
          prefixCls={prefixCls}
          ref={triggerRef}
          popupClassName={clsx(overlayClassName, {
            [`${prefixCls}-show-arrow`]: arrow,
          })}
          popupStyle={overlayStyle}
          action={trigger}
          showAction={showAction}
          hideAction={triggerHideAction}
          popupPlacement={placement}
          popupAlign={align}
          popupMotion={{ motionName: mergedMotionName.value }}
          popupVisible={mergedVisible.value}
          stretch={getMinOverlayWidthMatchTrigger() ? 'minWidth' : ''}
          popup={getMenuElementOrLambda()}
          onOpenChange={handleVisibleChange}
          onPopupClick={onClick}
          getPopupContainer={getPopupContainer}
        >
          {childrenNode}
        </Trigger>
      );
    };
  },
  { inheritAttrs: false },
);

export default Dropdown;
