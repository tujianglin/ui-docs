import { defineComponent } from 'vue';
import ResizeObserverStory from '../packages/resize-observer/docs/resize-observer.story.vue';
const App = defineComponent(() => {
  return () => <ResizeObserverStory></ResizeObserverStory>;
});

export default App;
