import { computed, defineComponent, onMounted, onUnmounted, ref, watch } from 'vue';

export default defineComponent({
  name: 'PreviewIframe',
  props: {
    storyKey: String,
    variantTitle: String,
  },
  setup(props) {
    const iframeRef = ref<HTMLIFrameElement | null>(null);
    const containerRef = ref<HTMLDivElement | null>(null);
    const height = ref(120);
    const shouldLoad = ref(false);
    const frameId = `preview-${Math.random().toString(36).slice(2)}`;
    const resolveBaseHref = () => {
      if (typeof document !== 'undefined' && document.baseURI) return document.baseURI;
      if (typeof window !== 'undefined') return window.location.href;
      return '';
    };
    const resolveParentOrigin = () => {
      if (typeof window === 'undefined') return '';
      if (!window.location.origin || window.location.origin === 'null') return '';
      return window.location.origin;
    };
    const baseHref = resolveBaseHref();
    const parentOrigin = resolveParentOrigin();

    const src = computed(() => {
      if (!shouldLoad.value || !props.storyKey || !props.variantTitle || !baseHref) return 'about:blank';
      const url = new URL('preview.html', baseHref);
      url.searchParams.set('story', props.storyKey);
      url.searchParams.set('variant', props.variantTitle);
      url.searchParams.set('iframeId', frameId);
      if (parentOrigin) {
        url.searchParams.set('parentOrigin', parentOrigin);
      }
      return url.toString();
    });

    const expectedOrigin = computed(() => {
      if (src.value === 'about:blank') return '';
      try {
        return new URL(src.value).origin;
      } catch {
        return '';
      }
    });

    const handleMessage = (event: MessageEvent) => {
      if (!iframeRef.value || event.source !== iframeRef.value.contentWindow) return;
      if (expectedOrigin.value && event.origin !== expectedOrigin.value && event.origin !== 'null') return;
      const data = event.data as { type?: string; id?: string; height?: number };
      if (!data || data.type !== 'vc-docs:preview-resize' || data.id !== frameId) return;
      if (typeof data.height !== 'number') return;
      height.value = Math.max(data.height, 100);
    };

    onMounted(() => {
      window.addEventListener('message', handleMessage);
    });

    onUnmounted(() => {
      window.removeEventListener('message', handleMessage);
    });

    onMounted(() => {
      if (!containerRef.value) {
        shouldLoad.value = true;
        return;
      }

      if (!('IntersectionObserver' in window)) {
        shouldLoad.value = true;
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            shouldLoad.value = true;
            observer.disconnect();
          }
        },
        { rootMargin: '240px' },
      );

      observer.observe(containerRef.value);
      onUnmounted(() => observer.disconnect());
    });

    watch([() => props.storyKey, () => props.variantTitle], () => {
      height.value = 120;
    });

    return () => (
      <div ref={containerRef} class="w-full">
        <iframe
          ref={iframeRef}
          title={props.variantTitle || 'Preview'}
          class="w-full overflow-hidden border-none bg-transparent"
          style={{ height: `${height.value}px`, minHeight: '100px', display: 'block' }}
          sandbox="allow-scripts allow-same-origin"
          referrerpolicy="no-referrer"
          allow="clipboard-read; clipboard-write"
          loading="lazy"
          src={src.value}
        />
      </div>
    );
  },
});
