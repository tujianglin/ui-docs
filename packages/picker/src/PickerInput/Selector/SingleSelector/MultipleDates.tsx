import Overflow from '@vc-com/overflow';
import type { RenderNode } from '@vc-com/util/lib/types';
import { clsx } from 'clsx';
import { computed, defineComponent } from 'vue';
import type { MouseEvent, MouseEventHandler } from 'vue-jsx-vapor';
import type { DateType } from '../../../interface';
import type { PickerProps } from '../../SinglePicker';

export interface MultipleDatesProps extends Pick<PickerProps, 'maxTagCount'> {
  prefixCls: string;
  value: DateType[];
  onRemove: (value: DateType) => void;
  removeIcon?: RenderNode;
  formatDate: (date: DateType) => string;
  disabled?: boolean;
  placeholder?: RenderNode;
}

const MultipleDates = defineComponent(
  ({ prefixCls, value, onRemove, removeIcon = '×', formatDate, disabled, maxTagCount, placeholder }: MultipleDatesProps) => {
    const selectorCls = computed(() => `${prefixCls}-selector`);
    const selectionCls = computed(() => `${prefixCls}-selection`);
    const overflowCls = computed(() => `${selectionCls.value}-overflow`);

    // ========================= Item =========================
    function renderSelector(content: RenderNode, onClose?: MouseEventHandler<HTMLSpanElement>) {
      return (
        <span class={clsx(`${selectionCls.value}-item`)} title={typeof content === 'string' ? content : null}>
          <span class={`${selectionCls.value}-item-content`}>{content}</span>
          <span
            v-if={!disabled && onClose}
            onMousedown={(e) => {
              e.preventDefault();
            }}
            onClick={onClose}
            class={`${selectionCls.value}-item-remove`}
          >
            {removeIcon}
          </span>
        </span>
      );
    }

    function renderItem(date: DateType) {
      const displayLabel: RenderNode = formatDate(date);

      const onClose = (event?: MouseEvent) => {
        if (event) event.stopPropagation();
        onRemove(date);
      };

      return renderSelector(displayLabel, onClose);
    }

    // ========================= Rest =========================
    function renderRest(omittedValues: DateType[]) {
      const content = `+ ${omittedValues.length} ...`;

      return renderSelector(content);
    }

    // ======================== Render ========================

    return () => (
      <div class={selectorCls.value}>
        <Overflow
          prefixCls={overflowCls.value}
          data={value}
          renderItem={renderItem}
          renderRest={renderRest}
          // suffix={inputNode}
          itemKey={(date) => formatDate(date)}
          maxCount={maxTagCount}
        />
        {!value.length && <span class={`${prefixCls}-selection-placeholder`}>{placeholder}</span>}
      </div>
    );
  },
  { inheritAttrs: false },
);

export default MultipleDates;
