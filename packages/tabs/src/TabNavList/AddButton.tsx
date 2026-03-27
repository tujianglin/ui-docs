import { useComposeRef } from '@vc-com/util/lib/ref';
import { defineComponent, type CSSProperties } from 'vue';
import type { EditableConfig, TabsLocale } from '../interface';

export interface AddButtonProps {
  prefixCls: string;
  editable?: EditableConfig;
  locale?: TabsLocale;
  style?: CSSProperties;
}

const AddButton = defineComponent(
  ({ prefixCls, editable, locale, style }: AddButtonProps) => {
    return () => (
      <button
        v-if={!(!editable || editable.showAdd === false)}
        ref={useComposeRef()}
        type="button"
        class={`${prefixCls}-nav-add`}
        style={style}
        aria-label={locale?.addAriaLabel || 'Add tab'}
        onClick={(event) => {
          editable.onEdit('add', { event });
        }}
      >
        {editable.addIcon || '+'}
      </button>
    );
  },
  { inheritAttrs: false },
);

export default AddButton;
