import { computed, type CSSProperties, type Ref } from 'vue';
import { useMenuContextInject } from '../context/MenuContext';
export default function useDirectionStyle(level: Ref<number>) {
  const { mode, rtl, inlineIndent } = $(useMenuContextInject());

  return computed<CSSProperties>(() => {
    if (mode !== 'inline') {
      return null;
    }

    const len = level;
    return rtl ? { paddingRight: `${len.value * inlineIndent!}px` } : { paddingLeft: `${len.value * inlineIndent!}px` };
  });
}
