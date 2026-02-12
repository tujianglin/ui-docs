import useControlledState from '@vc-com/util/lib/hooks/useControlledState';
import { computed, type ComputedRef, type Ref } from 'vue';
import type { Color } from '../color';
import type { ColorGenInput } from '../interface';
import { generateColor } from '../util';
type Updater<T> = (updater: T | ((origin: T) => T)) => void;

type ColorValue = ColorGenInput | undefined;

const useColorState = (defaultValue: ColorValue, value?: Ref<ColorValue>): [ComputedRef<Color>, Updater<ColorValue>] => {
  const [mergedValue, setValue] = useControlledState(defaultValue, value);

  const color = computed(() => generateColor(mergedValue.value));

  return [color, setValue];
};

export default useColorState;
