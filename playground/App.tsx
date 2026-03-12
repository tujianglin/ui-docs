import { defineComponent } from 'vue';
// import MotionStory from '../packages/resize-observer/docs/resize-observer.story.vue';
// import Select from '../packages/select/docs/select.story.vue';
import PortalStory from '../packages/cascader/docs/cascader.story.vue';
const App = defineComponent(() => {
  return () => (
    <>
      <PortalStory></PortalStory>
      {/* <Select></Select> */}
    </>
  );
});

export default App;
