import { defineComponent, ref, onMounted, onUnmounted, Teleport } from 'vue';

export default defineComponent({
  name: 'PreviewIframe',
  setup(_, { slots }) {
    const iframeRef = ref<HTMLIFrameElement | null>(null);
    const iframeBody = ref<HTMLElement | null>(null);
    const iframeHead = ref<HTMLHeadElement | null>(null);
    const isReady = ref(false);

    const syncStyles = () => {
      if (!iframeHead.value) return;

      // Clear existing styles in iframe head to prevent duplicates during HMR
      iframeHead.value.innerHTML = '';

      // Copy all style and link tags from parent document
      const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
      styles.forEach((style) => {
        iframeHead.value?.appendChild(style.cloneNode(true));
      });
    };

    const handleIframeLoad = () => {
      if (!iframeRef.value) return;
      const doc = iframeRef.value.contentDocument;
      if (!doc) return;

      iframeBody.value = doc.body;
      iframeHead.value = doc.head;

      syncStyles();

      // Add basic reset for iframe body
      const style = doc.createElement('style');
      style.textContent = `
        body {
          margin: 0 !important;
          padding: 2rem !important;
          background: transparent !important;
          min-height: 100vh !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
        }
        * { box-sizing: border-box; }
      `;
      doc.head.appendChild(style);
      isReady.value = true;

      // Observe content changes to resize iframe
      const resizeObserver = new ResizeObserver(() => {
        if (iframeRef.value && doc.documentElement) {
          iframeRef.value.style.height = `${doc.documentElement.scrollHeight}px`;
        }
      });
      resizeObserver.observe(doc.body);

      // Clean up observer on unmount
      onUnmounted(() => resizeObserver.disconnect());
    };

    onMounted(() => {
      if (iframeRef.value) {
        // If iframe is already loaded (though unlikely here)
        if (iframeRef.value.contentDocument?.readyState === 'complete') {
          handleIframeLoad();
        }
      }
    });

    return () => (
      <div class="w-full">
        <iframe
          ref={iframeRef}
          onLoad={handleIframeLoad}
          class="w-full border-none bg-transparent overflow-hidden"
          style={{ minHeight: '100px', display: 'block' }}
          src="about:blank"
        />
        {isReady.value && iframeBody.value && (
          <Teleport to={iframeBody.value}>
            {slots.default?.()}
          </Teleport>
        )}
      </div>
    );
  },
});
