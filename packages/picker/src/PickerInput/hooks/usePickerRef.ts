import { useRef } from 'vue-jsx-vapor';
import type { PickerRef } from '../../interface';

type PickerRefType<OptionType> = Omit<PickerRef, 'focus'> & {
  focus: (options?: OptionType) => void;
};

export default function usePickerRef<OptionType>() {
  const selectorRef = useRef<PickerRefType<OptionType>>();

  defineExpose({
    get nativeElement() {
      return selectorRef.value?.nativeElement;
    },
    focus: (options) => {
      selectorRef.value?.focus(options);
    },
    blur: () => {
      selectorRef.value?.blur();
    },
  });

  return selectorRef;
}
