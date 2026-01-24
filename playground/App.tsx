import { defineComponent } from 'vue';
// import MotionStory from '../packages/resize-observer/docs/resize-observer.story.vue';
import PortalStory from '../packages/motion/docs/motion.story.vue';
const App = defineComponent(() => {
  return () => <PortalStory></PortalStory>;
});

export default App;
