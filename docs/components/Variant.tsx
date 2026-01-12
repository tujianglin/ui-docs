import MarkdownIt from 'markdown-it';
import { computed, defineComponent, inject, onUnmounted, watch, type ComputedRef, type Ref } from 'vue';
import type { PreviewContext } from '../utils/previewContext';
import { slugify } from '../utils/slugify';
import DemoBlock from './DemoBlock';

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
    height: [Number, String],
    backgroundColor: String,
    backgroundcolor: String,
    order: [Number, String],
  },
  setup(props, { slots }) {
    // Inject all variant codes from App.tsx
    const variantCodes = inject<ComputedRef<Record<string, { code: string; lang?: string }>>>(
      'variantCodes',
      computed(() => ({})),
    );
    const previewContext = inject<PreviewContext | null>('previewContext', null);
    const activeStoryKey = inject<Ref<string>>('activeStoryKey');
    const code = computed(() => {
      if (!variantCodes?.value) return '';
      const entry = variantCodes.value[props.title || ''];
      if (!entry) return '';
      if (typeof entry === 'string') return entry;
      return entry.code || '';
    });

    const codeLang = computed(() => {
      if (!variantCodes?.value) return 'vue';
      const entry = variantCodes.value[props.title || ''];
      if (!entry) return 'vue';
      if (typeof entry === 'string') return 'vue';
      return entry.lang || 'vue';
    });

    const id = computed(() => (props.title ? slugify(props.title) : undefined));
    const isPreview = computed(() => previewContext?.isPreview === true);
    const previewVariant = computed(() => {
      const value = previewContext?.activeVariant;
      if (typeof value === 'string') return value;
      return value?.value || '';
    });
    const storyKey = computed(() => activeStoryKey?.value || '');

    // @ts-ignore
    const renderedDescription = computed(() => {
      return props.description ? md.render(props.description) : '';
    });

    const resolvedPreviewHeight = computed(() => {
      if (props.height === undefined || props.height === null || props.height === '') {
        return { cssValue: undefined };
      }
      if (typeof props.height === 'number') {
        return { cssValue: `${props.height}px` };
      }
      const raw = String(props.height).trim();
      if (!raw) return { cssValue: undefined };
      if (/^\d+(\.\d+)?$/.test(raw)) {
        return { cssValue: `${raw}px` };
      }
      return { cssValue: raw };
    });

    const resolvedBackgroundColor = computed(() => props.backgroundColor || props.backgroundcolor);

    const isActivePreviewVariant = computed(() => {
      if (!isPreview.value) return false;
      if (!previewVariant.value) return true;
      return previewVariant.value === props.title;
    });

    let prevBodyBackground = '';
    let hasSetBodyBackground = false;

    watch(
      [isActivePreviewVariant, resolvedBackgroundColor],
      ([active, bg]) => {
        if (!active) {
          if (hasSetBodyBackground) {
            document.body.style.background = prevBodyBackground;
            hasSetBodyBackground = false;
          }
          return;
        }

        if (!bg) return;
        if (!hasSetBodyBackground) {
          prevBodyBackground = document.body.style.background;
          hasSetBodyBackground = true;
        }
        document.body.style.background = bg;
      },
      { immediate: true },
    );

    onUnmounted(() => {
      if (!hasSetBodyBackground) return;
      document.body.style.background = prevBodyBackground;
      hasSetBodyBackground = false;
    });

    return () => {
      const shouldRender = !isPreview.value || !previewVariant.value || previewVariant.value === props.title;
      if (!shouldRender) return null;

      if (isPreview.value) {
        return (
          <div
            class="preview-variant"
            style={{
              minHeight: resolvedPreviewHeight.value.cssValue,
              height: resolvedPreviewHeight.value.cssValue,
              backgroundColor: resolvedBackgroundColor.value,
            }}
          >
            {slots.default?.()}
          </div>
        );
      }

      return (
        <div id={id.value} class="variant-container mb-8 scroll-mt-24">
          <div class="mb-6">
            <h4 class="mb-2 border-l-4 border-blue-500 pl-4 text-base font-bold text-gray-900">{props.title}</h4>
            {props.description && (
              <div class="markdown-style pl-5 text-[13px] leading-relaxed text-gray-500" v-html={renderedDescription.value} />
            )}
          </div>
          <DemoBlock
            code={code.value}
            codeLang={codeLang.value}
            hideDocsTab={true}
            storyKey={storyKey.value}
            variantTitle={props.title}
          >
            {slots.default?.()}
          </DemoBlock>
        </div>
      );
    };
  },
});
