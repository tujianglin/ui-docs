import raf from '@vc-com/util/lib/raf';
import { onMounted, shallowRef } from 'vue';

/**
 * Always trigger latest once when call multiple time
 */
export default () => {
  const idRef = shallowRef(0);

  const cleanUp = () => {
    raf.cancel(idRef.value);
  };

  onMounted(() => cleanUp);

  return (callback: () => void) => {
    cleanUp();

    idRef.value = raf(() => {
      callback();
    });
  };
};
