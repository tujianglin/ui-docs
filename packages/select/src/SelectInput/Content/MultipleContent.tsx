import Overflow from '@vc-com/overflow';
import Render from '@vc-com/render';
import type { RenderNode, VueNode } from '@vc-com/util/lib/types';
import { clsx } from 'clsx';
import { computed, defineComponent } from 'vue';
import { useRef, type MouseEvent, type MouseEventHandler } from 'vue-jsx-vapor';
import type { SharedContentProps } from '.';
import type { CustomTagProps } from '../../BaseSelect';
import TransBtn from '../../TransBtn';
import { useBaseSelectContextInject } from '../../hooks/useBaseProps';
import type { DisplayValueType, RawValueType } from '../../interface';
import { getTitle } from '../../utils/commonUtil';
import Input from '../Input';
import { useSelectInputContextInject } from '../context';
import Placeholder from './Placeholder';

function itemKey(value: DisplayValueType) {
  return value.key ?? value.value;
}

const onPreventMouseDown = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
};

export default defineComponent(
  ({ inputProps }: SharedContentProps) => {
    const {
      prefixCls,
      displayValues,
      searchValue,
      mode,
      onSelectorRemove,
      // @ts-ignore
      removeIcon: removeIconFromContext,
    } = $(useSelectInputContextInject());
    const {
      disabled,
      showSearch,
      triggerOpen,
      rawOpen,
      toggleOpen,
      autoClearSearchValue,
      tagRender: tagRenderFromContext,
      maxTagPlaceholder: maxTagPlaceholderFromContext,
      maxTagTextLength,
      maxTagCount,
      classNames,
      styles,
    } = $(useBaseSelectContextInject());

    const selectionItemPrefixCls = computed(() => `${prefixCls}-selection-item`);

    // ===================== Search ======================
    // Apply autoClearSearchValue logic: when dropdown is closed and autoClearSearchValue is not false (default true), clear search value
    // Use rawOpen to avoid clearing search when emptyListContent blocks open
    const computedSearchValue = computed(() => {
      let result = searchValue;
      if (!rawOpen && mode === 'multiple' && autoClearSearchValue !== false) {
        result = '';
      }
      return result;
    });

    const inputValue = computed(() => (showSearch ? computedSearchValue.value || '' : ''));
    const inputEditable = computed<boolean>(() => showSearch && !disabled);

    // Props from context with safe defaults
    // @ts-ignore
    const removeIcon = computed(() => removeIconFromContext ?? '×');
    const maxTagPlaceholder = computed(
      // @ts-ignore
      () => maxTagPlaceholderFromContext ?? ((omittedValues: DisplayValueType[]) => `+ ${omittedValues.length} ...`),
    );
    const tagRender = computed<((props: CustomTagProps) => VueNode) | undefined>(() => tagRenderFromContext);

    const onToggleOpen = (newOpen?: boolean) => {
      toggleOpen(newOpen);
    };

    const onRemove = (value: DisplayValueType) => {
      onSelectorRemove?.(value);
    };

    // ======================== Item ========================
    // >>> Render Selector Node. Includes Item & Rest
    const defaultRenderSelector = (
      item: DisplayValueType,
      content: RenderNode,
      itemDisabled: boolean,
      closable?: boolean,
      onClose?: MouseEventHandler,
    ) => (
      <span
        title={getTitle(item)}
        class={clsx(
          selectionItemPrefixCls.value,
          {
            [`${selectionItemPrefixCls.value}-disabled`]: itemDisabled,
          },
          classNames?.item,
        )}
        style={styles?.item}
      >
        <span class={clsx(`${selectionItemPrefixCls.value}-content`, classNames?.itemContent)} style={styles?.itemContent}>
          <Render content={content}></Render>
        </span>
        <TransBtn
          v-if={closable}
          class={clsx(`${selectionItemPrefixCls.value}-remove`, classNames?.itemRemove)}
          style={styles?.itemRemove}
          onMousedown={onPreventMouseDown}
          onClick={onClose}
          customizeIcon={removeIcon.value}
        >
          ×
        </TransBtn>
      </span>
    );

    const customizeRenderSelector = (
      value: RawValueType,
      content: RenderNode,
      itemDisabled: boolean,
      closable?: boolean,
      onClose?: MouseEventHandler,
      isMaxTag?: boolean,
      info?: { index: number },
    ) => {
      const onMousedown = (e: MouseEvent) => {
        onPreventMouseDown(e);
        onToggleOpen(!triggerOpen);
      };
      return (
        <span onMousedown={onMousedown}>
          {tagRender.value({
            label: content,
            value,
            index: info?.index,
            disabled: itemDisabled,
            closable,
            // @ts-ignore
            onClose,
            isMaxTag: !!isMaxTag,
          })}
        </span>
      );
    };

    // ====================== Overflow ======================
    const renderItem = (valueItem: DisplayValueType, info: { index: number }) => {
      const { disabled: itemDisabled, label, value } = valueItem;
      const closable = !disabled && !itemDisabled;

      let displayLabel = label;

      if (typeof maxTagTextLength === 'number') {
        if (typeof label === 'string' || typeof label === 'number') {
          const strLabel = String(displayLabel);
          if (strLabel.length > maxTagTextLength) {
            displayLabel = `${strLabel.slice(0, maxTagTextLength)}...`;
          }
        }
      }

      const onClose = (event?: MouseEvent) => {
        console.log(1);
        if (event) {
          event.stopPropagation();
        }
        onRemove(valueItem);
      };

      return typeof tagRender === 'function'
        ? customizeRenderSelector(value, displayLabel, itemDisabled, closable, onClose, undefined, info)
        : defaultRenderSelector(valueItem, displayLabel, itemDisabled, closable, onClose);
    };

    const renderRest = (omittedValues: DisplayValueType[]) => {
      // https://github.com/ant-design/ant-design/issues/48930
      if (!displayValues.length) {
        return null;
      }
      const content =
        typeof maxTagPlaceholder.value === 'function' ? maxTagPlaceholder.value(omittedValues) : maxTagPlaceholder.value;
      return typeof tagRender === 'function'
        ? customizeRenderSelector(undefined, content, false, false, undefined, true)
        : defaultRenderSelector({ title: content }, content, false);
    };

    const domRef = useRef();

    defineExpose({
      get nativeElement() {
        return domRef.value;
      },
    });

    // ======================= Render =======================
    return () => (
      <Overflow
        prefixCls={`${prefixCls}-content`}
        class={classNames?.content}
        style={styles?.content}
        prefix={!displayValues.length && !inputValue.value && <Placeholder />}
        data={displayValues}
        renderItem={renderItem}
        renderRest={renderRest}
        suffix={() => (
          <Input
            ref={domRef}
            disabled={disabled}
            readOnly={!inputEditable.value}
            {...(inputProps as any)}
            v-model:value={inputValue.value || ''}
            syncWidth
          />
        )}
        itemKey={itemKey}
        maxCount={maxTagCount}
      />
    );
  },
  { inheritAttrs: false },
);
