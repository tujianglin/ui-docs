import { computed, defineComponent, type CSSProperties } from 'vue';

export interface DropIndicatorProps {
  dropPosition: -1 | 0 | 1;
  dropLevelOffset: number;
  indent: number;
}

const DropIndicator = defineComponent(
  ({ dropPosition, dropLevelOffset, indent }: DropIndicatorProps) => {
    const style = computed(() => {
      const result: CSSProperties = {
        pointerEvents: 'none',
        position: 'absolute',
        right: 0,
        backgroundColor: 'red',
        height: '2px',
      };
      switch (dropPosition) {
        case -1:
          result.top = 0;
          result.left = `${-dropLevelOffset * indent}px`;
          break;
        case 1:
          result.bottom = 0;
          result.left = `${-dropLevelOffset * indent}px`;
          break;
        case 0:
          result.bottom = 0;
          result.left = `${indent}px`;
          break;
      }
      return result;
    });
    return () => <div style={style.value} />;
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'DropIndicator' : undefined },
);

export default DropIndicator;
