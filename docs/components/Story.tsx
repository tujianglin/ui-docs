import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Story',
  props: {
    title: String,
    icon: String,
    cols: {
      type: Number,
      default: 1,
    },
  },
  setup(props, { slots }) {
    return () => {
      const children = slots.default?.() || [];

      // Flatten children in case they are fragments
      const flatChildren = children.flatMap(child =>
        (child.type?.toString() === 'Symbol(v-fgt)' || child.type?.toString() === 'Symbol(Fragment)')
          ? (child.children as any[])
          : child
      );

      if (props.cols > 1) {
        const leftCol: any[] = [];
        const rightCol: any[] = [];

        flatChildren.forEach((child, index) => {
          if (index % 2 === 0) leftCol.push(child);
          else rightCol.push(child);
        });

        return (
          <div class="story-container grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 scroll-mt-24">
            <div class="space-y-8">{leftCol}</div>
            <div class="space-y-8">{rightCol}</div>
          </div>
        );
      }

      return (
        <div class="story-container space-y-12 mb-8 scroll-mt-24">
          {flatChildren}
        </div>
      );
    };
  },
});
