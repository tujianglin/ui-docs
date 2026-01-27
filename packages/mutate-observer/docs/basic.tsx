import { ref } from 'vue';
import MutateObserver from '../src';

const App = () => {
  const flag = ref<boolean>(true);

  const onMutate = (mutations: MutationRecord[]) => {
    console.log(mutations);
  };

  return (
    <MutateObserver onMutate={onMutate}>
      <button class={flag.value ? 'aaa' : 'bbb'} onClick={() => (flag.value = !flag.value)}>
        click
      </button>
    </MutateObserver>
  );
};

export default App;
