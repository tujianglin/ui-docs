import type { CSSMotionProps } from '@vc-com/motion';
import Trigger from '@vc-com/trigger';
import raf from '@vc-com/util/lib/raf';
import type { VueNode } from '@vc-com/util/lib/types';
import { clsx } from 'clsx';
import { computed, defineComponent, ref, shallowRef, watch, watchEffect, type CSSProperties } from 'vue';
import { useMenuContextInject } from '../context/MenuContext';
import type { MenuMode } from '../interface';
import { placements, placementsRtl } from '../placements';
import { getMotion } from '../utils/motionUtil';

const popupPlacementMap = {
  horizontal: 'bottomLeft',
  vertical: 'rightTop',
  'vertical-left': 'rightTop',
  'vertical-right': 'leftTop',
};

export interface PopupTriggerProps {
  prefixCls: string;
  mode: MenuMode;
  visible: boolean;
  popup: VueNode;
  popupStyle?: CSSProperties;
  popupClassName?: string;
  popupOffset?: number[];
  disabled: boolean;
  onVisibleChange: (visible: boolean) => void;
}

export default defineComponent(
  ({
    prefixCls,
    visible,
    popup,
    popupStyle,
    popupClassName,
    popupOffset,
    disabled,
    mode,
    onVisibleChange,
  }: PopupTriggerProps) => {
    const {
      getPopupContainer,
      rtl,
      subMenuOpenDelay,
      subMenuCloseDelay,
      builtinPlacements,
      triggerSubMenuAction,
      forceSubMenuRender,
      rootClassName,

      // Motion
      motion,
      defaultMotions,
    } = $(useMenuContextInject());

    const innerVisible = ref(false);

    const placement = computed(() =>
      rtl ? { ...placementsRtl, ...builtinPlacements } : { ...placements, ...builtinPlacements },
    );

    const popupPlacement = computed(() => popupPlacementMap[mode]);

    const targetMotion = computed(() => getMotion(mode, motion, defaultMotions));
    const targetMotionRef = shallowRef(targetMotion.value);
    watchEffect(() => {
      targetMotionRef.value = targetMotion.value;
    });

    watch(
      () => mode,
      (mode) => {
        if (mode !== 'inline') {
          /**
           * PopupTrigger is only used for vertical and horizontal types.
           * When collapsed is unfolded, the inline animation will destroy the vertical animation.
           */
          targetMotionRef.value = targetMotion.value;
        }
      },
      { immediate: true },
    );
    const mergedMotion = computed<CSSMotionProps>(() => ({
      ...targetMotionRef.value,
      leavedClassName: `${prefixCls}-hidden`,
      removeOnLeave: false,
      motionAppear: true,
    }));

    // Delay to change visible
    const visibleRef = shallowRef<number>();
    watch(
      () => visible,
      (_n, _o, onCleanup) => {
        visibleRef.value = raf(() => {
          innerVisible.value = visible;
        });

        onCleanup(() => {
          raf.cancel(visibleRef.value);
        });
      },
      { immediate: true },
    );
    return () => (
      <Trigger
        prefixCls={prefixCls}
        popupClassName={clsx(`${prefixCls}-popup`, { [`${prefixCls}-rtl`]: rtl }, popupClassName, rootClassName)}
        stretch={mode === 'horizontal' ? 'minWidth' : null}
        getPopupContainer={getPopupContainer}
        builtinPlacements={placement.value}
        popupPlacement={popupPlacement.value}
        popupVisible={innerVisible.value}
        popup={popup}
        popupStyle={popupStyle}
        popupAlign={popupOffset && { offset: popupOffset }}
        action={disabled ? [] : [triggerSubMenuAction]}
        mouseEnterDelay={subMenuOpenDelay}
        mouseLeaveDelay={subMenuCloseDelay}
        onOpenChange={onVisibleChange}
        forceRender={forceSubMenuRender}
        popupMotion={mergedMotion.value}
        fresh
      >
        <slot></slot>
      </Trigger>
    );
  },
  { inheritAttrs: false },
);
