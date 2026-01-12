import MarkdownIt from 'markdown-it';
import { createHighlighter } from 'shiki';
import { computed, defineComponent, onUnmounted, ref, watch } from 'vue';
import PreviewIframe from './PreviewIframe';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

// Singleton highlighter to avoid re-creation
let shikiHighlighter: any = null;
const availableLangs = new Set(['vue', 'typescript', 'javascript', 'tsx', 'jsx']);

const getHighlighter = async () => {
  if (shikiHighlighter) return shikiHighlighter;
  try {
    shikiHighlighter = await createHighlighter({
      themes: ['github-light'],
      langs: ['vue', 'typescript', 'javascript', 'tsx', 'jsx'],
    });
    return shikiHighlighter;
  } catch (e) {
    console.error('Failed to init shiki:', e);
    return null;
  }
};

export default defineComponent({
  name: 'DemoBlock',
  props: {
    title: String,
    description: String,
    code: {
      type: String,
      default: '',
    },
    codeLang: String,
    storyKey: String,
    variantTitle: String,
    hideDocsTab: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { slots }) {
    const showCode = ref(false);
    const copied = ref(false);
    const highlightedCode = ref('');
    let timer: any = null;

    const resolveLang = (lang?: string) => {
      const normalized = (lang || 'vue').toLowerCase();
      if (normalized === 'ts') return 'typescript';
      if (normalized === 'js') return 'javascript';
      return availableLangs.has(normalized) ? normalized : 'vue';
    };

    const highlight = async () => {
      if (!props.code) {
        highlightedCode.value = '';
        return;
      }
      const highlighter = await getHighlighter();
      if (!highlighter) {
        // Fallback to plain text if shiki fails
        highlightedCode.value = props.code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return;
      }

      try {
        highlightedCode.value = highlighter.codeToHtml(props.code, {
          lang: resolveLang(props.codeLang),
          theme: 'github-light',
        });
      } catch (err) {
        console.error('Shiki highlight failed:', err);
        highlightedCode.value = props.code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }
    };

    watch([() => props.code, () => props.codeLang], highlight, { immediate: true });

    const handleCopy = async () => {
      if (!props.code) return;
      try {
        await navigator.clipboard.writeText(props.code);
        copied.value = true;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          copied.value = false;
        }, 2000);
      } catch (err) {
        console.error('Failed to copy!', err);
      }
    };

    onUnmounted(() => {
      if (timer) clearTimeout(timer);
    });

    const descRef = ref<HTMLElement | null>(null);
    const codeRef = ref<HTMLElement | null>(null);

    const renderedMiniDescription = computed(() => {
      return props.description ? md.render(props.description) : '';
    });

    watch(
      [renderedMiniDescription, descRef],
      ([html, el]) => {
        if (el && html) (el as HTMLElement).innerHTML = html as string;
      },
      { immediate: true },
    );

    watch(
      [highlightedCode, codeRef],
      ([html, el]) => {
        if (el && html) (el as HTMLElement).innerHTML = html as string;
      },
      { immediate: true },
    );

    return () => (
      <div class="demo-block animate-in fade-in mb-12 duration-500">
        <div class="space-y-4">
          {(props.title || props.description) && (
            <div class="mb-4">
              {props.title && <h4 class="mb-1 text-base font-semibold text-gray-900">{props.title}</h4>}
              {props.description && <div ref={descRef} class="markdown-style text-[13px] leading-relaxed text-gray-500" />}
            </div>
          )}

          <div
            class={`overflow-hidden rounded-lg border border-gray-200 bg-white transition-all ${props.hideDocsTab ? 'mt-2' : ''}`}
          >
            <div class="flex min-h-45 items-center justify-center border-b border-gray-100 p-4 md:p-6">
              <div class="relative z-10 w-full">
                <PreviewIframe storyKey={props.storyKey} variantTitle={props.variantTitle}>
                  {slots.default?.()}
                </PreviewIframe>
              </div>
            </div>

            <div class="group relative flex items-center justify-center space-x-6 bg-white py-3">
              <div class="absolute top-1/2 right-6 flex -translate-y-1/2 items-center space-x-2 opacity-0 transition-opacity group-hover:opacity-100">
                <span class="text-[10px] font-bold tracking-widest text-gray-300 uppercase">vue</span>
              </div>

              <button onClick={handleCopy} class="p-1 text-gray-400 transition-colors hover:text-gray-900" title="复制代码">
                {copied.value ? (
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    stroke="currentColor"
                    stroke-width="2.5"
                    fill="none"
                    class="text-green-500"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  </svg>
                )}
              </button>

              <button class="p-1 text-gray-400 transition-colors hover:text-gray-900" title="在外部编辑">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>

              <button
                onClick={() => (showCode.value = !showCode.value)}
                class={['p-1 transition-colors', showCode.value ? 'text-blue-500' : 'text-gray-400 hover:text-gray-900']}
                title={showCode.value ? '收起代码' : '查看代码'}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="16 18 22 12 16 6"></polyline>
                  <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
              </button>
            </div>

            <div
              class={[
                'overflow-hidden border-t border-dashed border-gray-100 bg-[#fafafa] transition-all duration-300 ease-in-out',
                showCode.value ? 'visible max-h-750' : 'invisible max-h-0',
              ]}
            >
              <div class="relative">
                <div
                  ref={codeRef}
                  class="shiki-container custom-scrollbar overflow-auto bg-[#fafafa] p-6 font-mono text-[13px] leading-relaxed"
                />
                <button
                  onClick={() => (showCode.value = false)}
                  class="group/collapse flex h-11 w-full items-center justify-center border-t border-gray-100 bg-white text-gray-400 transition-colors hover:text-gray-600"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    class="mr-2 transition-transform group-hover/collapse:-translate-y-0.5"
                  >
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                  <span class="text-xs font-medium">收起代码</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
});
