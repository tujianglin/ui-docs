import { defineComponent, inject, computed, type ComputedRef } from 'vue';
import DemoBlock from './DemoBlock';
import MarkdownIt from 'markdown-it';
import { slugify } from '../App';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

export default defineComponent({
  name: 'Variant',
  props: {
    title: {
      type: String,
      required: true,
    },
    description: String,
  },
  setup(props, { slots }) {
    // Inject all variant codes from App.tsx
    const variantCodes = inject<ComputedRef<Record<string, string>>>('variantCodes');
    const code = computed(() => {
      if (!variantCodes?.value) return '';
      return variantCodes.value[props.title || ''] || '';
    });

    const id = computed(() => props.title ? slugify(props.title) : undefined);

    // @ts-ignore
    const renderedDescription = computed(() => {
        return props.description ? md.render(props.description) : '';
    });

    return () => (
      <div id={id.value} class="variant-container mb-8 scroll-mt-24">
        <div class="mb-6">
            <h4 class="text-base font-bold text-gray-900 border-l-4 border-blue-500 pl-4 mb-2">
                {props.title}
            </h4>
            {props.description && (
                <div class="text-[13px] text-gray-500 leading-relaxed markdown-style pl-5" v-html={renderedDescription.value} />
            )}
        </div>
        <DemoBlock
          code={code.value}
          hideDocsTab={true}
        >
          {slots.default?.()}
        </DemoBlock>
      </div>
    );
  },
});
