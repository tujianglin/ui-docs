import CSSMotion, { type CSSMotionProps } from '@vc-com/motion';
import { computed, defineComponent, ref, shallowRef, watch, watchEffect } from 'vue';
import MenuContextProvider, { useMenuContextInject } from '../context/MenuContext';
import type { MenuMode } from '../interface';
import { getMotion } from '../utils/motionUtil';
import SubMenuList from './SubMenuList';

export interface InlineSubMenuListProps {
  id?: string;
  open: boolean;
  keyPath: string[];
}

export default defineComponent(
  ({ id, open, keyPath }: InlineSubMenuListProps) => {
    const fixedMode: MenuMode = 'inline';

    const { prefixCls, forceSubMenuRender, motion, defaultMotions, mode } = $(useMenuContextInject());
    // Always use latest mode check
    const sameModeRef = shallowRef(false);
    watchEffect(() => {
      sameModeRef.value = mode === fixedMode;
    });

    // We record `destroy` mark here since when mode change from `inline` to others.
    // The inline list should remove when motion end.
    const destroy = ref(!sameModeRef.value);

    const mergedOpen = computed(() => (sameModeRef.value ? open : false));

    // ================================= Effect =================================
    // Reset destroy state when mode change back
    watch(
      () => mode,
      () => {
        if (sameModeRef.value) {
          destroy.value = false;
        }
      },
      { immediate: true },
    );

    const mergedMotion = computed<CSSMotionProps>(() => {
      const result = { ...getMotion(fixedMode, motion, defaultMotions) };

      // No need appear since nest inlineCollapse changed
      if (keyPath.length > 1) {
        result.motionAppear = false;
      }

      // Hide inline list when mode changed and motion end
      const originOnVisibleChanged = result.onVisibleChanged;
      result.onVisibleChanged = (newVisible) => {
        if (!sameModeRef.value && !newVisible) {
          destroy.value = true;
        }

        return originOnVisibleChanged?.(newVisible);
      };
      return result;
    });

    // ================================= Render =================================
    return () => (
      <MenuContextProvider v-if={!destroy.value} mode={fixedMode} locked={!sameModeRef.value}>
        <CSSMotion
          visible={mergedOpen.value}
          motionAppear={mergedMotion.value.motionAppear}
          motionName={mergedMotion.value.motionName}
          onAppearActive={mergedMotion.value.onAppearActive}
          onAppearStart={mergedMotion.value.onAppearStart}
          onEnterActive={mergedMotion.value.onEnterActive}
          onEnterStart={mergedMotion.value.onEnterStart}
          onLeaveActive={mergedMotion.value.onLeaveActive}
          onLeaveStart={mergedMotion.value.onLeaveStart}
          forceRender={forceSubMenuRender}
          removeOnLeave={false}
          leavedClassName={`${prefixCls}-hidden`}
        >
          {({ class: motionClassName, style: motionStyle, ref: motionRef }) => {
            return (
              <SubMenuList id={id} class={motionClassName} style={motionStyle} ref={motionRef}>
                <slot></slot>
              </SubMenuList>
            );
          }}
        </CSSMotion>
      </MenuContextProvider>
    );
  },
  { inheritAttrs: false },
);
