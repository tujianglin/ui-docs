import MarkdownIt from 'markdown-it';
import { defineComponent, onMounted, ref, watch } from 'vue';
import { slugify } from '../utils/slugify';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

// Simple plugin to add IDs to headers
md.use((md) => {
  const originalHeaderOpen =
    md.renderer.rules.heading_open ||
    function (tokens, idx, options, _env, self) {
      return self.renderToken(tokens, idx, options);
    };

  md.renderer.rules.heading_open = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    const contentToken = tokens[idx + 1];
    if (contentToken && contentToken.type === 'inline') {
      const id = slugify(contentToken.content);
      token.attrSet('id', id);
    }
    return originalHeaderOpen(tokens, idx, options, env, self);
  };
});

export default defineComponent({
  name: 'Markdown',
  props: {
    content: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const renderedHtml = ref('');

    const render = () => {
      renderedHtml.value = md.render(props.content);
    };

    onMounted(render);
    watch(() => props.content, render);

    return () => <div class="markdown-body p-6" v-html={renderedHtml.value} />;
  },
});
