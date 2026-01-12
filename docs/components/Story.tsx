import { defineComponent, inject } from 'vue';
import type { PreviewContext } from '../utils/previewContext';

export default defineComponent({
  name: 'Story',
  props: {
    title: String,
    label: String,
    group: String,
    description: String,
    groupOrder: [Number, String],
    order: [Number, String],
    cols: {
      type: Number,
      default: 1,
    },
  },
  setup(props, { slots }) {
    const previewContext = inject<PreviewContext | null>('previewContext', null);

    return () => {
      const children = slots.default?.() || [];

      // Flatten children in case they are fragments
      const flatChildren = children.flatMap((child) =>
        child.type?.toString() === 'Symbol(v-fgt)' || child.type?.toString() === 'Symbol(Fragment)'
          ? (child.children as any[])
          : child,
      );

      const normalizedChildren = flatChildren.map((child, index) => {
        const rawOrder = (child as any)?.props?.order;
        const parsedOrder = rawOrder === undefined || rawOrder === null ? undefined : Number(rawOrder);
        const order = Number.isFinite(parsedOrder) ? parsedOrder : undefined;
        return { child, index, order };
      });
      const shouldSort = normalizedChildren.some((item) => Number.isFinite(item.order));
      const orderedChildren = shouldSort
        ? normalizedChildren
            .sort((a, b) => {
              const orderA = Number.isFinite(a.order) ? (a.order as number) : Number.POSITIVE_INFINITY;
              const orderB = Number.isFinite(b.order) ? (b.order as number) : Number.POSITIVE_INFINITY;
              if (orderA !== orderB) return orderA - orderB;
              return a.index - b.index;
            })
            .map((item) => item.child)
        : flatChildren;

      if (previewContext?.isPreview) {
        return <div class="preview-story">{orderedChildren}</div>;
      }

      if (props.cols > 1) {
        const leftCol: any[] = [];
        const rightCol: any[] = [];

        orderedChildren.forEach((child, index) => {
          if (index % 2 === 0) leftCol.push(child);
          else rightCol.push(child);
        });

        return (
          <div class="story-container mb-8 grid scroll-mt-24 grid-cols-1 gap-8 md:grid-cols-2">
            <div class="space-y-8">{leftCol}</div>
            <div class="space-y-8">{rightCol}</div>
          </div>
        );
      }

      return <div class="story-container mb-8 scroll-mt-24 space-y-12">{orderedChildren}</div>;
    };
  },
});
