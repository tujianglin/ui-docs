import pickAttrs from '@vc-com/util/lib/pickAttrs';
import { computed, defineComponent } from 'vue';
import { useRef, type InputHTMLAttributes } from 'vue-jsx-vapor';
import { useBaseSelectContextInject } from '../../hooks/useBaseProps';
import { useSelectInputContextInject } from '../context';
import MultipleContent from './MultipleContent';
import SingleContent from './SingleContent';

export interface SharedContentProps {
  inputProps: InputHTMLAttributes<HTMLInputElement>;
}

const SelectContent = defineComponent(
  () => {
    const { multiple, onInputKeyDown, tabindex } = $(useSelectInputContextInject());
    const baseProps = useBaseSelectContextInject();
    const showSearch = computed(() => baseProps?.showSearch);

    const ariaProps = computed(() => pickAttrs(baseProps, { aria: true }));

    const sharedInputProps = computed<SharedContentProps['inputProps']>(() => ({
      ...ariaProps.value,
      onKeydown: onInputKeyDown,
      readonly: !showSearch.value,
      tabindex: tabindex,
    }));

    const domRef = useRef(null);

    defineExpose({
      get nativeElement() {
        return domRef.value?.nativeElement;
      },
    });

    return () => {
      if (multiple) {
        return <MultipleContent ref={domRef} inputProps={sharedInputProps.value} />;
      }
      return <SingleContent ref={domRef} inputProps={sharedInputProps.value} />;
    };
  },
  { inheritAttrs: false },
);

export default SelectContent;
