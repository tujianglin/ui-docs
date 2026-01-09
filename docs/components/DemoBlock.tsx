import { defineComponent, ref, onUnmounted, watch, computed } from 'vue';
import PreviewIframe from './PreviewIframe';
import MarkdownIt from 'markdown-it';
import { createHighlighter } from 'shiki';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

// Singleton highlighter to avoid re-creation
let shikiHighlighter: any = null;

const getHighlighter = async () => {
  if (shikiHighlighter) return shikiHighlighter;
  try {
    shikiHighlighter = await createHighlighter({
      themes: ['github-light'],
      langs: ['vue', 'typescript', 'javascript'],
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
          lang: 'vue',
          theme: 'github-light',
        });
      } catch (err) {
        console.error('Shiki highlight failed:', err);
        highlightedCode.value = props.code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }
    };

    watch(() => props.code, highlight, { immediate: true });

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

    watch([renderedMiniDescription, descRef], ([html, el]) => {
        if (el && html) (el as HTMLElement).innerHTML = html as string;
    }, { immediate: true });

    watch([highlightedCode, codeRef], ([html, el]) => {
        if (el && html) (el as HTMLElement).innerHTML = html as string;
    }, { immediate: true });

    return () => (
      <div class="demo-block mb-12 animate-in fade-in duration-500">
        <div class="space-y-4">
            {(props.title || props.description) && (
                <div class="mb-4">
                    {props.title && <h4 class="text-base font-semibold text-gray-900 mb-1">{props.title}</h4>}
                    {props.description && <div ref={descRef} class="text-[13px] text-gray-500 leading-relaxed markdown-style" />}
                </div>
            )}

            <div class={`border border-gray-200 rounded-lg bg-white overflow-hidden transition-all ${props.hideDocsTab ? 'mt-2' : ''}`}>
                <div class="p-4 md:p-6 flex items-center justify-center min-h-45 border-b border-gray-100">
                    <div class="w-full relative z-10">
                        <PreviewIframe>
                            {slots.default?.()}
                        </PreviewIframe>
                    </div>
                </div>

                <div class="flex items-center justify-center space-x-6 py-3 bg-white relative group">
                    <div class="absolute right-6 top-1/2 -translate-y-1/2 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span class="text-[10px] font-bold text-gray-300 uppercase tracking-widest">vue</span>
                    </div>

                    <button
                        onClick={handleCopy}
                        class="text-gray-400 hover:text-gray-900 transition-colors p-1"
                        title="复制代码"
                    >
                        {copied.value ? (
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" class="text-green-500"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        ) : (
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                        )}
                    </button>

                    <button class="text-gray-400 hover:text-gray-900 transition-colors p-1" title="在外部编辑">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>

                    <button
                        onClick={() => showCode.value = !showCode.value}
                        class={[
                            "transition-colors p-1",
                            showCode.value ? "text-blue-500" : "text-gray-400 hover:text-gray-900"
                        ]}
                        title={showCode.value ? "收起代码" : "查看代码"}
                    >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                    </button>
                </div>

                <div
                    class={[
                        "overflow-hidden transition-all duration-300 ease-in-out border-t border-dashed border-gray-100 bg-[#fafafa]",
                        showCode.value ? "max-h-750 visible" : "max-h-0 invisible"
                    ]}
                >
                    <div class="relative">
                        <div ref={codeRef} class="shiki-container p-6 text-[13px] font-mono leading-relaxed overflow-auto custom-scrollbar bg-[#fafafa]" />
                        <button
                            onClick={() => showCode.value = false}
                            class="w-full h-11 border-t border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors bg-white group/collapse"
                        >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" class="mr-2 group-hover/collapse:-translate-y-0.5 transition-transform"><polyline points="18 15 12 9 6 15"></polyline></svg>
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
