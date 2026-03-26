import { filterEmpty } from '@vc-com/util/lib/props-util';
import { defineComponent } from 'vue';
import type { RenderIconInfo, RenderIconType } from './interface';

export interface IconProps {
  icon?: RenderIconType;
  props: RenderIconInfo;
}

export default defineComponent(
  ({ icon, props }: IconProps) => {
    const slots = defineSlots();
    return () => {
      const children = slots.default?.();
      let iconNode: any;
      if (icon === null || icon === false) {
        return null;
      }
      if (typeof icon === 'function') {
        const childIcons = (icon as any)(props);
        if (!childIcons) {
          iconNode = null;
          return children;
        }
        const childArray = childIcons ? (Array.isArray(childIcons) ? childIcons : [childIcons]) : [];
        iconNode = filterEmpty(childArray);
      } else if (typeof icon !== 'boolean') {
        iconNode = icon;
      }
      return iconNode || children || null;
    };
  },
  { inheritAttrs: false },
);
