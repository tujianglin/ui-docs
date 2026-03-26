import useControlledState from '@vc-com/util/lib/hooks/useControlledState';
import { composeRef } from '@vc-com/util/lib/ref';
import type { RenderNode, VueNode } from '@vc-com/util/lib/types';
import { clsx } from 'clsx';
import { computed, defineComponent, ref, type CSSProperties } from 'vue';
import { useRef, type ChangeEvent, type HTMLAttributes } from 'vue-jsx-vapor';
import MotionThumb from './MotionThumb';

export type SemanticName = 'item' | 'label';
export type SegmentedValue = string | number;

export type SegmentedRawOption = SegmentedValue;

export interface SegmentedLabeledOption {
  class?: string;
  disabled?: boolean;
  label: RenderNode;
  value: any;
  /**
   * html `title` property for label
   */
  title?: string;
}

type ItemRender = (node: VueNode, info: { item: SegmentedLabeledOption }) => VueNode;

type SegmentedOptions<T = SegmentedRawOption> = (T | SegmentedLabeledOption)[];

export interface SegmentedProps extends Omit<HTMLAttributes, 'value' | 'onChange'> {
  options: SegmentedOptions;
  defaultValue?: any;
  value?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
  prefixCls?: string;
  direction?: 'ltr' | 'rtl';
  motionName?: string;
  vertical?: boolean;
  name?: string;
  classNames?: Partial<Record<SemanticName, string>>;
  styles?: Partial<Record<SemanticName, CSSProperties>>;
  itemRender?: ItemRender;
}

function getValidTitle(option: SegmentedLabeledOption) {
  if (typeof option.title !== 'undefined') {
    return option.title;
  }

  // read `label` when title is `undefined`
  if (typeof option.label !== 'object') {
    return (option.label as any)?.toString();
  }
}

function normalizeOptions(options: SegmentedOptions): SegmentedLabeledOption[] {
  return options.map((option) => {
    if (typeof option === 'object' && option !== null) {
      const validTitle = getValidTitle(option);
      return {
        ...option,
        title: validTitle,
      };
    }
    return {
      label: option?.toString(),
      title: option?.toString(),
      value: option,
    };
  });
}

type Props = {
  prefixCls: string;
  class?: string;
  style?: CSSProperties;
  classNames?: Partial<Record<SemanticName, string>>;
  styles?: Partial<Record<SemanticName, CSSProperties>>;
  data: SegmentedLabeledOption;
  disabled?: boolean;
  checked: boolean;
  label: RenderNode;
  title?: string;
  value: SegmentedRawOption;
  name?: string;
  onChange: (e, value: SegmentedRawOption) => void;
  onFocus: (e) => void;
  onBlur: (e?) => void;
  onKeydown: (e) => void;
  onKeyup: (e) => void;
  onMousedown: () => void;
  itemRender?: ItemRender;
};

const InternalSegmentedOption = defineComponent(
  ({
    prefixCls,
    class: className,
    style,
    styles,
    classNames: segmentedClassNames,
    data,
    disabled,
    checked,
    label: _label,
    title,
    value,
    name,
    onChange,
    onFocus,
    onBlur,
    onKeydown,
    onKeyup,
    onMousedown,
    itemRender = (node) => node,
  }: Props) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      if (disabled) {
        return;
      }
      onChange(event, value);
    };
    return () => {
      const itemContent = (
        <label class={clsx(className, { [`${prefixCls}-item-disabled`]: disabled })} style={style} onMousedown={onMousedown}>
          <input
            name={name}
            class={`${prefixCls}-item-input`}
            type="radio"
            disabled={disabled}
            checked={checked}
            onChange={handleChange}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeydown={onKeydown}
            onKeyup={onKeyup}
          />
          <div class={clsx(`${prefixCls}-item-label`, segmentedClassNames?.label)} title={title} style={styles?.label}>
            {_label}
          </div>
        </label>
      );
      return itemRender(itemContent, { item: data }) as JSX.Element;
    };
  },
  { inheritAttrs: false },
);

const Segmented = defineComponent(
  ({
    prefixCls = 'rc-segmented',
    direction,
    vertical,
    options = [],
    disabled,
    defaultValue,
    value,
    name,
    onChange,
    class: className = '',
    style,
    styles,
    classNames: segmentedClassNames,
    motionName = 'thumb-motion',
    itemRender,
    ...restProps
  }: SegmentedProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const segmentedOptions = computed(() => {
      return normalizeOptions(options);
    });

    // Note: We should not auto switch value when value not exist in options
    // which may break single source of truth.
    const [rawValue, setRawValue] = useControlledState(
      defaultValue ?? segmentedOptions.value[0]?.value,
      computed(() => value),
    );

    // ======================= Change ========================
    const thumbShow = ref(false);

    const handleChange = (_event: ChangeEvent<HTMLInputElement>, val: SegmentedRawOption) => {
      setRawValue(val);
      onChange?.(val);
    };

    // ======================= Focus ========================
    const isKeyboard = ref(false);
    const isFocused = ref(false);

    const handleFocus = () => {
      isFocused.value = true;
    };

    const handleBlur = () => {
      isFocused.value = false;
    };

    const handleMouseDown = () => {
      isKeyboard.value = false;
    };

    // capture keyboard tab interaction for correct focus style
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        isKeyboard.value = true;
      }
    };

    // ======================= Keyboard ========================
    const onOffset = (offset: number) => {
      const currentIndex = segmentedOptions.value.findIndex((option) => option.value === rawValue);

      const total = segmentedOptions.value.length;
      const nextIndex = (currentIndex + offset + total) % total;

      const nextOption = segmentedOptions.value[nextIndex];
      if (nextOption) {
        setRawValue(nextOption.value);
        onChange?.(nextOption.value);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      console.log(1);
      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          onOffset(-1);
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          onOffset(1);
          break;
      }
    };

    const renderOption = (segmentedOption: SegmentedLabeledOption) => {
      const { value: optionValue, disabled: optionDisabled } = segmentedOption;
      return (
        <InternalSegmentedOption
          {...segmentedOption}
          name={name}
          data={segmentedOption}
          itemRender={itemRender}
          key={optionValue}
          prefixCls={prefixCls}
          class={clsx(segmentedOption.class, `${prefixCls}-item`, segmentedClassNames?.item, {
            [`${prefixCls}-item-selected`]: optionValue === rawValue.value && !thumbShow.value,
            [`${prefixCls}-item-focused`]: isFocused.value && isKeyboard.value && optionValue === rawValue.value,
          })}
          style={styles?.item}
          classNames={segmentedClassNames}
          styles={styles}
          checked={optionValue === rawValue.value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeydown={handleKeyDown}
          onKeyup={handleKeyUp}
          onMousedown={handleMouseDown}
          disabled={!!disabled || !!optionDisabled}
        />
      );
    };

    return () => (
      <div
        role="radiogroup"
        aria-label="segmented control"
        tabindex={disabled ? undefined : 0}
        aria-orientation={vertical ? 'vertical' : 'horizontal'}
        style={style}
        {...restProps}
        class={clsx(
          prefixCls,
          {
            [`${prefixCls}-rtl`]: direction === 'rtl',
            [`${prefixCls}-disabled`]: disabled,
            [`${prefixCls}-vertical`]: vertical,
          },
          className,
        )}
        ref={composeRef(containerRef)}
      >
        <div class={`${prefixCls}-group`}>
          <MotionThumb
            vertical={vertical}
            prefixCls={prefixCls}
            value={rawValue.value}
            containerRef={containerRef}
            motionName={`${prefixCls}-${motionName}`}
            direction={direction}
            getValueIndex={(val) => segmentedOptions.value.findIndex((n) => n.value === val)}
            onMotionStart={() => {
              thumbShow.value = true;
            }}
            onMotionEnd={() => {
              thumbShow.value = false;
            }}
          />
          {segmentedOptions.value.map(renderOption)}
        </div>
      </div>
    );
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'Segmented' : undefined },
);

export default Segmented;
