import { defineComponent } from 'vue';
// import MotionStory from '../packages/resize-observer/docs/resize-observer.story.vue';
import PortalStory from '../packages/mutate-observer/docs/mutate-observer.story.vue';
const App = defineComponent(() => {
  return () => <PortalStory></PortalStory>;
});

export default App;
