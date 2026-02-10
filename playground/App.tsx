import { defineComponent } from 'vue';
// import MotionStory from '../packages/resize-observer/docs/resize-observer.story.vue';
import PortalStory from '../packages/virtual-list/docs/virtual-list.story.vue';
const App = defineComponent(() => {
  return () => <PortalStory></PortalStory>;
});

export default App;
