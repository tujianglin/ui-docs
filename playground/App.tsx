import { defineComponent } from 'vue';
// import Cascader from '../packages/cascader/docs/cascader.story.vue';
import Select from '../packages/steps/docs/steps.story.vue';
const App = defineComponent(() => {
  return () => (
    <>
      {/* <Cascader></Cascader> */}
      <Select></Select>
    </>
  );
});

export default App;
