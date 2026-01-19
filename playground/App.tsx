import { defineComponent } from 'vue';
import MotionStory from '../packages/motion/docs/motion.story.vue';
const App = defineComponent(() => {
  return () => <MotionStory></MotionStory>;
});

export default App;
