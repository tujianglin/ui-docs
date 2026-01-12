import { defineComponent, markRaw, nextTick, onMounted, onUnmounted, provide, ref, shallowRef, watch } from 'vue';

const storyModules = import.meta.glob('../**/*.story.vue');

const normalizeStoryKey = (rawKey: string) => {
  if (storyModules[rawKey]) return rawKey;
  const withDot = rawKey.startsWith('./') ? rawKey : `./${rawKey}`;
  if (storyModules[withDot]) return withDot;
  const withoutDot = rawKey.startsWith('./') ? rawKey.slice(2) : rawKey;
  if (storyModules[withoutDot]) return withoutDot;
  return rawKey;
};

export default defineComponent({
  name: 'PreviewApp',
  setup() {
    const params = new URLSearchParams(window.location.search);
    const storyKey = ref(normalizeStoryKey(params.get('story') || ''));
    const variantTitle = ref(params.get('variant') || '');
    const iframeId = params.get('iframeId') || '';
    const parentOrigin = params.get('parentOrigin') || '';
    const targetOrigin = parentOrigin && parentOrigin !== 'null' ? parentOrigin : '*';
    const ActiveComponent = shallowRef<any>(null);
    const isLoading = ref(false);
    const previewRootRef = ref<HTMLDivElement | null>(null);

    const loadStory = async (key: string) => {
      const normalizedKey = normalizeStoryKey(key);
      const loader = storyModules[normalizedKey] as (() => Promise<any>) | undefined;
      if (!loader) {
        ActiveComponent.value = null;
        return;
      }

      isLoading.value = true;
      try {
        const mod = await loader();
        ActiveComponent.value = mod?.default ? markRaw(mod.default) : null;
      } finally {
        isLoading.value = false;
      }
    };

    provide('previewContext', {
      isPreview: true,
      activeVariant: variantTitle,
    });
    provide('activeStoryKey', storyKey);

    const isExtensionIframe = (node: Element) => {
      if (node.tagName !== 'IFRAME') return false;
      const src = (node as HTMLIFrameElement).src || '';
      return (
        src.startsWith('chrome-extension://') || src.startsWith('moz-extension://') || src.startsWith('safari-web-extension://')
      );
    };

    const isOverlayNode = (node: Element) => {
      if (node.tagName === 'VITE-ERROR-OVERLAY' || node.id === 'vite-error-overlay') return true;
      if (node.id === 'immersive-translate-popup') return true;
      if (node.id === '__vconsole' || node.classList.contains('vconsole')) return true;
      return isExtensionIframe(node);
    };

    const removeExternalOverlays = (root: ParentNode = document) => {
      const selectors = [
        'vite-error-overlay',
        '#vite-error-overlay',
        '#immersive-translate-popup',
        '#__vconsole',
        '.vconsole',
        'iframe[src^="chrome-extension://"]',
        'iframe[src^="moz-extension://"]',
        'iframe[src^="safari-web-extension://"]',
      ];
      root.querySelectorAll(selectors.join(',')).forEach((node) => node.parentNode?.removeChild(node));
    };

    const getPreviewHeight = () => {
      const rootEl = previewRootRef.value;
      if (rootEl) {
        const rectHeight = rootEl.getBoundingClientRect().height;
        const scrollHeight = rootEl.scrollHeight;
        const offsetHeight = rootEl.offsetHeight;
        const contentHeight = Math.max(rectHeight, scrollHeight, offsetHeight);
        if (contentHeight) return Math.ceil(contentHeight);
      }

      const body = document.body;
      const documentElement = document.documentElement;

      const bodyHeight = body ? Math.max(body.scrollHeight, body.offsetHeight, body.clientHeight) : 0;
      const documentHeight = documentElement
        ? Math.max(documentElement.scrollHeight, documentElement.offsetHeight, documentElement.clientHeight)
        : 0;

      return Math.ceil(Math.max(bodyHeight, documentHeight));
    };

    const postHeight = () => {
      if (!iframeId) return;
      const height = Math.max(getPreviewHeight(), 100);
      window.parent?.postMessage(
        {
          type: 'vc-docs:preview-resize',
          id: iframeId,
          height,
        },
        targetOrigin,
      );
    };

    onMounted(() => {
      let rafId = 0;
      const schedule = () => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(postHeight);
      };

      const observer = new ResizeObserver(schedule);
      const handleWindowResize = () => schedule();
      const viewport = window.visualViewport;
      if (previewRootRef.value) observer.observe(previewRootRef.value);
      if (document.body) observer.observe(document.body);
      if (document.documentElement) observer.observe(document.documentElement);
      schedule();
      window.addEventListener('resize', handleWindowResize);
      viewport?.addEventListener('resize', handleWindowResize);

      removeExternalOverlays();
      const overlayObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (!(node instanceof Element)) return;
            if (isOverlayNode(node)) {
              node.parentNode?.removeChild(node);
              return;
            }
            removeExternalOverlays(node);
          });
        });
      });
      if (document.body) {
        overlayObserver.observe(document.body, {
          childList: true,
          subtree: true,
        });
      }

      onUnmounted(() => {
        observer.disconnect();
        overlayObserver.disconnect();
        if (rafId) cancelAnimationFrame(rafId);
        window.removeEventListener('resize', handleWindowResize);
        viewport?.removeEventListener('resize', handleWindowResize);
      });
    });

    onMounted(() => {
      void loadStory(storyKey.value);
    });

    watch(storyKey, (nextKey) => {
      void loadStory(nextKey);
    });

    watch([ActiveComponent, variantTitle], async () => {
      await nextTick();
      postHeight();
    });

    return () => (
      <div ref={previewRootRef} class="preview-root">
        {ActiveComponent.value ? (
          <ActiveComponent.value />
        ) : (
          <div class="preview-empty">{isLoading.value ? '预览加载中...' : '预览内容加载失败'}</div>
        )}
      </div>
    );
  },
});
