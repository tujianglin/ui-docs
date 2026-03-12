import type { AlignType, BuildInPlacements } from '@vc-com/trigger';
import { getDOM } from '@vc-com/util/lib/Dom/findDOMNode';
import type { RenderNode, VueNode } from '@vc-com/util/lib/types';
import { resolveToElement } from '@vc-com/util/lib/vnode';
import type { ScrollConfig, ScrollTo } from '@vc-com/virtual-list';
import { clsx } from 'clsx';
import { computed, defineComponent, ref, toRaw, watch, type CSSProperties } from 'vue';
import {
  useFullProps,
  useRef,
  type AriaAttributes,
  type FocusEventHandler,
  type HTMLAttributes,
  type KeyboardEventHandler,
  type MouseEvent,
  type MouseEventHandler,
  type UIEventHandler,
} from 'vue-jsx-vapor';
import { useAllowClear } from '../hooks/useAllowClear';
import { BaseSelectContextProvider, type BaseSelectContextProps } from '../hooks/useBaseProps';
import type { ComponentsConfig } from '../hooks/useComponents';
import useComponents from '../hooks/useComponents';
import useLock from '../hooks/useLock';
import useOpen, { macroTask } from '../hooks/useOpen';
import useSelectTriggerControl, { isInside } from '../hooks/useSelectTriggerControl';
import type { DisplayInfoType, DisplayValueType, Mode, Placement, RawValueType, RenderDOMFunc } from '../interface';
import type { SelectInputRef } from '../SelectInput';
import SelectInput from '../SelectInput';
import type { RefTriggerProps } from '../SelectTrigger';
import SelectTrigger from '../SelectTrigger';
import { getSeparatedContent, isValidCount } from '../utils/valueUtil';
import Polite from './Polite';

export type BaseSelectSemanticName =
  | 'prefix'
  | 'suffix'
  | 'input'
  | 'clear'
  | 'placeholder'
  | 'content'
  | 'item'
  | 'itemContent'
  | 'itemRemove';

/**
 * ZombieJ:
 * We are currently refactoring the semantic structure of the component. Changelog:
 * - Remove `suffixIcon` and change to `suffix`.
 * - Add `components.root` for replacing response element.
 *   - Remove `getInputElement` and `getRawInputElement` since we can use `components.input` instead.
 */

export type { DisplayInfoType, DisplayValueType, Mode, Placement, RawValueType, RenderDOMFunc };
export interface RefOptionListProps {
  onKeydown: KeyboardEventHandler;
  onKeyup: KeyboardEventHandler;
  scrollTo?: (args: number | ScrollConfig) => void;
}

export type CustomTagProps = {
  label: RenderNode;
  value: any;
  disabled: boolean;
  onClose: (event?: MouseEvent<HTMLElement, MouseEvent>) => void;
  closable: boolean;
  isMaxTag: boolean;
  index: number;
};

export interface BaseSelectRef {
  focus: (options?: FocusOptions) => void;
  blur: () => void;
  scrollTo: ScrollTo;
  nativeElement: HTMLElement;
}

export interface BaseSelectPrivateProps {
  // >>> MISC
  id: string;
  prefixCls: string;
  omitDomProps?: string[];

  // >>> Value
  displayValues: DisplayValueType[];
  onDisplayValuesChange: (
    values: DisplayValueType[],
    info: {
      type: DisplayInfoType;
      values: DisplayValueType[];
    },
  ) => void;

  // >>> Active
  /** Current dropdown list active item string value */
  activeValue?: string;
  /** Link search input with target element */
  activeDescendantId?: string;
  onActiveValueChange?: (value: string | null) => void;

  // >>> Search
  searchValue: string;
  autoClearSearchValue?: boolean;
  /** Trigger onSearch, return false to prevent trigger open event */
  onSearch: (
    searchValue: string,
    info: {
      source:
        | 'typing' //User typing
        | 'effect' // Code logic trigger
        | 'submit' // tag mode only
        | 'blur'; // Not trigger event
    },
  ) => void;
  /** Trigger when search text match the `tokenSeparators`. Will provide split content */
  onSearchSplit?: (words: string[]) => void;

  // >>> Dropdown
  OptionList: any;
  /** Tell if provided `options` is empty */
  emptyOptions: boolean;
}

export type BaseSelectPropsWithoutPrivate = Omit<BaseSelectProps, keyof BaseSelectPrivateProps>;

export interface BaseSelectProps extends BaseSelectPrivateProps, AriaAttributes, Pick<HTMLAttributes<HTMLElement>, 'role'> {
  // Style
  class?: string;
  style?: CSSProperties;
  classNames?: Partial<Record<BaseSelectSemanticName, string>>;
  styles?: Partial<Record<BaseSelectSemanticName, CSSProperties>>;

  // Selector
  showSearch?: boolean;
  tagRender?: (props: CustomTagProps) => VueNode;
  direction?: 'ltr' | 'rtl';
  autofocus?: boolean;
  placeholder?: RenderNode;
  maxCount?: number;

  // MISC
  title?: string;
  tabIndex?: number;
  notFoundContent?: RenderNode;
  onClear?: () => void;
  maxlength?: number;
  showScrollBar?: boolean | 'optional';

  choiceTransitionName?: string;

  // >>> Mode
  mode?: Mode;

  // >>> Status
  disabled?: boolean;
  loading?: boolean;

  // >>> Open
  open?: boolean;
  defaultOpen?: boolean;
  onPopupVisibleChange?: (open: boolean) => void;

  // >>> Customize Input
  /** @private Internal usage. Do not use in your production. */
  getInputElement?: () => JSX.Element;
  /** @private Internal usage. Do not use in your production. */
  getRawInputElement?: () => JSX.Element;

  // >>> Selector
  maxTagTextLength?: number;
  maxTagCount?: number | 'responsive';
  maxTagPlaceholder?: VueNode | ((omittedValues: DisplayValueType[]) => VueNode);

  // >>> Search
  tokenSeparators?: string[];

  // >>> Icons
  allowClear?: boolean | { clearIcon?: RenderNode };
  prefix?: RenderNode;
  suffix?: RenderNode;
  /** Selector remove icon */
  removeIcon?: RenderNode;

  // >>> Dropdown/Popup
  animation?: string;
  transitionName?: string;

  popupStyle?: CSSProperties;
  popupClassName?: string;
  popupMatchSelectWidth?: boolean | number;
  popupRender?: (menu: VueNode) => VueNode;
  popupAlign?: AlignType;

  placement?: Placement;
  builtinPlacements?: BuildInPlacements;
  getPopupContainer?: RenderDOMFunc;

  // >>> Focus
  showAction?: ('focus' | 'click')[];
  onBlur?: FocusEventHandler<HTMLElement>;
  onFocus?: FocusEventHandler<HTMLElement>;

  // >>> Rest Events
  onKeyup?: KeyboardEventHandler<HTMLDivElement>;
  onKeydown?: KeyboardEventHandler<HTMLDivElement>;
  onMousedown?: MouseEventHandler<HTMLDivElement>;
  onPopupScroll?: UIEventHandler;
  onInputKeyDown?: KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onMouseenter?: MouseEventHandler<HTMLDivElement>;
  onMouseleave?: MouseEventHandler<HTMLDivElement>;
  onClick?: MouseEventHandler<HTMLDivElement>;

  // >>> Components
  components?: ComponentsConfig;
}

export const isMultiple = (mode: Mode) => mode === 'tags' || mode === 'multiple';

const BaseSelect = defineComponent(
  ({
    id,
    prefixCls,
    class: className,
    styles,
    classNames,
    showSearch,
    tagRender: _tagRender,
    showScrollBar = 'optional',
    direction,
    omitDomProps: _omitDomProps,

    // Value
    displayValues,
    onDisplayValuesChange,
    emptyOptions,
    notFoundContent = 'Not Found',
    onClear,
    maxCount,
    placeholder,

    // Mode
    mode,

    // Status
    disabled,
    loading,

    // Customize Input
    getInputElement,
    getRawInputElement,

    // Open
    open,
    defaultOpen,
    onPopupVisibleChange,

    // Active
    activeValue,
    onActiveValueChange,
    activeDescendantId: _activeDescendantId,

    // Search
    searchValue,
    autoClearSearchValue: _autoClearSearchValue,
    onSearch,
    onSearchSplit,
    tokenSeparators,

    // Icons
    allowClear,
    prefix,
    suffix,

    // Dropdown
    OptionList,
    animation,
    transitionName,
    popupStyle,
    popupClassName,
    popupMatchSelectWidth,
    popupRender,
    popupAlign,
    placement,
    builtinPlacements,
    getPopupContainer,

    // Focus
    showAction = [],
    onFocus,
    onBlur,

    // Rest Events
    onKeyup,
    onKeydown,
    onMousedown,

    // Components
    components,

    // Rest Props
    ...restProps
  }: BaseSelectProps) => {
    const props = useFullProps() as unknown as BaseSelectProps;

    // ============================== MISC ==============================
    const multiple = computed(() => isMultiple(mode));

    // ============================== Refs ==============================
    const containerRef = useRef<SelectInputRef>(null);
    const triggerRef = useRef<RefTriggerProps>(null);
    const listRef = useRef<RefOptionListProps>(null);

    /** Used for component focused management */
    const focused = ref(false);

    // =========================== Imperative ===========================
    defineExpose({
      focus: containerRef.value?.focus,
      blur: containerRef.value?.blur,
      scrollTo: (arg) => listRef.value?.scrollTo(arg),
      get nativeElement() {
        return getDOM(containerRef.value) as HTMLElement;
      },
    });

    // =========================== Components ===========================
    const mergedComponents = useComponents(
      computed(() => components),
      computed(() => getInputElement),
      computed(() => getRawInputElement),
    );

    // ========================== Search Value ==========================
    const mergedSearchValue = computed(() => {
      if (mode !== 'combobox') {
        return searchValue;
      }

      const val = displayValues[0]?.value;

      return typeof val === 'string' || typeof val === 'number' ? String(val) : '';
    });

    // ========================== Custom Input ==========================
    // Only works in `combobox`
    const customizeInputElement = computed(
      () => (mode === 'combobox' && typeof getInputElement === 'function' && getInputElement()) || null,
    );

    // ============================== Open ==============================
    // Not trigger `open` when `notFoundContent` is empty
    const emptyListContent = computed(() => !notFoundContent && emptyOptions);

    const [rawOpen, mergedOpen, triggerOpen, lockOptions] = useOpen(
      computed(() => defaultOpen || false),
      computed(() => open),
      onPopupVisibleChange,
      (nextOpen) => (disabled || emptyListContent.value ? false : nextOpen),
    );

    // ============================= Search =============================
    const tokenWithEnter = computed<boolean>(() =>
      (tokenSeparators || []).some((tokenSeparator) => ['\n', '\r\n'].includes(tokenSeparator)),
    );

    const onInternalSearch = (searchText: string, fromTyping: boolean, isCompositing: boolean) => {
      if (multiple.value && isValidCount(maxCount) && displayValues.length >= maxCount) {
        return;
      }
      let ret = true;
      let newSearchText = searchText;
      onActiveValueChange?.(null);

      const separatedList = getSeparatedContent(
        searchText,
        tokenSeparators,
        isValidCount(maxCount) ? maxCount - displayValues.length : undefined,
      );

      // Check if match the `tokenSeparators`
      const patchLabels: string[] = isCompositing ? null : separatedList;

      // Ignore combobox since it's not split-able
      if (mode !== 'combobox' && patchLabels) {
        newSearchText = '';

        onSearchSplit?.(patchLabels);

        // Should close when paste finish
        triggerOpen(false);

        // Tell Selector that break next actions
        ret = false;
      }

      if (onSearch && mergedSearchValue.value !== newSearchText) {
        onSearch(newSearchText, {
          source: fromTyping ? 'typing' : 'effect',
        });
      }

      // Open if from typing
      if (searchText && fromTyping && ret) {
        triggerOpen(true);
      }

      return ret;
    };

    // Only triggered when menu is closed & mode is tags
    // If menu is open, OptionList will take charge
    // If mode isn't tags, press enter is not meaningful when you can't see any option
    const onInternalSearchSubmit = (searchText: string) => {
      // prevent empty tags from appearing when you click the Enter button
      if (!searchText || !searchText.trim()) {
        return;
      }
      onSearch(searchText, { source: 'submit' });
    };

    // Clean up search value when the dropdown is closed.
    // We use `rawOpen` here to avoid clearing the search input when the dropdown is
    // programmatically closed due to `notFoundContent={null}` and no matching options.
    // This allows the user to continue typing their search query.
    watch(
      [rawOpen],
      () => {
        if (!rawOpen.value && !multiple.value && mode !== 'combobox') {
          onInternalSearch('', false, false);
        }
      },
      { immediate: true },
    );

    // ============================ Disabled ============================
    // Close dropdown & remove focus state when disabled change
    watch(
      [() => disabled, mergedOpen],
      () => {
        // After onBlur is triggered, the focused does not need to be reset
        if (disabled) {
          triggerOpen(false);
          focused.value = false;
        }
      },
      { immediate: true },
    );

    // ============================ Keyboard ============================
    /**
     * We record input value here to check if can press to clean up by backspace
     * - null: Key is not down, this is reset by key up
     * - true: Search text is empty when first time backspace down
     * - false: Search text is not empty when first time backspace down
     */
    const [getClearLock, setClearLock] = useLock();
    const keyLockRef = useRef(false);

    // KeyDown
    const onInternalKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
      const clearLock = getClearLock();
      const { key } = event;

      const isEnterKey = key === 'Enter';
      const isSpaceKey = key === ' ';

      if (isEnterKey || isSpaceKey) {
        // Do not submit form when type in the input; prevent Space from scrolling page
        const isCombobox = mode === 'combobox';
        const isEditable = isCombobox || showSearch;
        if ((isSpaceKey && !isEditable) || (isEnterKey && !isCombobox)) {
          event.preventDefault();
        }

        // We only manage open state here, close logic should handle by list component
        if (!mergedOpen.value) {
          triggerOpen(true);
        }
      }

      setClearLock(!!mergedSearchValue.value);

      // Remove value by `backspace`
      if (key === 'Backspace' && !clearLock && multiple.value && !mergedSearchValue.value && displayValues.length) {
        const cloneDisplayValues = [...displayValues];
        let removedDisplayValue = null;

        for (let i = cloneDisplayValues.length - 1; i >= 0; i -= 1) {
          const value = cloneDisplayValues[i];

          if (!value.disabled) {
            cloneDisplayValues.splice(i, 1);
            removedDisplayValue = value;
            break;
          }
        }

        if (removedDisplayValue) {
          onDisplayValuesChange(cloneDisplayValues, {
            type: 'remove',
            values: [removedDisplayValue],
          });
        }
      }

      if (mergedOpen.value && (!isEnterKey || !keyLockRef.value)) {
        // Lock the Enter key after it is pressed to avoid repeated triggering of the onChange event.
        if (isEnterKey) {
          keyLockRef.value = true;
        }
        listRef.value?.onKeydown(event);
      }

      onKeydown?.(event);
    };

    // KeyUp
    const onInternalKeyUp: KeyboardEventHandler<any> = (event, ...rest) => {
      if (mergedOpen.value) {
        listRef.value?.onKeyup(event, ...rest);
      }
      if (event.key === 'Enter') {
        keyLockRef.value = false;
      }
      onKeyup?.(event, ...rest);
    };

    // ============================ Selector ============================
    const onSelectorRemove = (val: DisplayValueType) => {
      const newValues = displayValues.filter((i) => i !== toRaw(val));
      onDisplayValuesChange(newValues, {
        type: 'remove',
        values: [val],
      });
    };

    const onInputBlur = () => {
      // Unlock the Enter key after the input blur; otherwise, the Enter key needs to be pressed twice to trigger the correct effect.
      keyLockRef.value = false;
    };

    // ========================== Focus / Blur ==========================
    const getSelectElements = () => [resolveToElement(containerRef.value), triggerRef.value?.getPopupElement()];

    // Close when click on non-select element
    useSelectTriggerControl(
      getSelectElements,
      mergedOpen,
      triggerOpen,
      computed(() => !!mergedComponents.value.root),
    );

    // ========================== Focus / Blur ==========================
    const internalMouseDownRef = useRef(false);

    const onInternalFocus: FocusEventHandler<HTMLElement> = (event) => {
      focused.value = true;

      if (!disabled) {
        // `showAction` should handle `focus` if set
        if (showAction.includes('focus')) {
          triggerOpen(true);
        }

        onFocus?.(event);
      }
    };

    const onRootBlur = () => {
      // Delay close should check the activeElement
      if (mergedOpen.value && !internalMouseDownRef.value) {
        triggerOpen(false, {
          cancelFun: () => isInside(getSelectElements(), document.activeElement as HTMLElement),
        });
      }
    };

    const onInternalBlur: FocusEventHandler<HTMLElement> = (event) => {
      focused.value = false;

      if (mergedSearchValue.value) {
        // `tags` mode should move `searchValue` into values
        if (mode === 'tags') {
          onSearch(mergedSearchValue.value, { source: 'submit' });
        } else if (mode === 'multiple') {
          // `multiple` mode only clean the search value but not trigger event
          onSearch('', {
            source: 'blur',
          });
        }
      }

      onRootBlur();

      if (!disabled) {
        onBlur?.(event);
      }
    };

    const onRootMouseDown: MouseEventHandler<HTMLDivElement> = (event, ...restArgs) => {
      const { target } = event;
      const popupElement: HTMLDivElement = triggerRef.value?.getPopupElement();

      // We should give focus back to selector if clicked item is not focusable
      if (popupElement?.contains(target as HTMLElement) && triggerOpen) {
        // Tell `open` not to close since it's safe in the popup
        triggerOpen(true);
      }

      onMousedown?.(event, ...restArgs);

      internalMouseDownRef.value = true;
      macroTask(() => {
        internalMouseDownRef.value = false;
      });
    };

    // ============================ Dropdown ============================
    const forceUpdate = ref(Symbol('update'));

    // We need force update here since popup dom is render async
    function onPopupMouseEnter() {
      forceUpdate.value = Symbol('update');
    }

    // Used for raw custom input trigger
    let onTriggerVisibleChange: null | ((newOpen: boolean) => void);
    // oxlint-disable-next-line no-extra-boolean-cast
    if (!!mergedComponents.value.root) {
      onTriggerVisibleChange = (newOpen: boolean) => {
        triggerOpen(newOpen);
      };
    }

    // ============================ Context =============================
    const baseSelectContext = computed<BaseSelectContextProps>(() => ({
      ...(props as any),
      notFoundContent,
      open: mergedOpen.value,
      triggerOpen: mergedOpen.value,
      rawOpen: rawOpen.value,
      id,
      showSearch,
      multiple: multiple.value,
      toggleOpen: triggerOpen,
      showScrollBar,
      styles,
      classNames,
      lockOptions,
    }));

    // ==================================================================
    // ==                            Render                            ==
    // ==================================================================

    // ============================= Suffix =============================
    const mergedSuffixIcon = computed(() => {
      const nextSuffix = suffix;

      if (typeof nextSuffix === 'function') {
        return nextSuffix({
          searchValue: mergedSearchValue.value,
          open: mergedOpen.value,
          focused: focused.value,
          showSearch,
          loading,
        });
      }
      return nextSuffix;
    });

    // ============================= Clear ==============================
    const onClearMouseDown: MouseEventHandler<HTMLSpanElement> = () => {
      onClear?.();

      containerRef.value?.focus();
      onDisplayValuesChange([], {
        type: 'clear',
        values: displayValues,
      });
      onInternalSearch('', false, false);
    };

    const { allowClear: mergedAllowClear, clearIcon: clearNode } = $(
      useAllowClear(
        computed(() => prefixCls),
        computed(() => displayValues),
        computed(() => allowClear),
        computed(() => disabled),
        mergedSearchValue,
        computed(() => mode),
      ).value,
    );

    // ============================= Select =============================
    const mergedClassName = computed(() =>
      clsx(prefixCls, className, {
        [`${prefixCls}-focused`]: focused.value,
        [`${prefixCls}-multiple`]: multiple.value,
        [`${prefixCls}-single`]: !multiple.value,
        [`${prefixCls}-allow-clear`]: mergedAllowClear,
        [`${prefixCls}-show-arrow`]: mergedSuffixIcon.value !== undefined && mergedSuffixIcon.value !== null,
        [`${prefixCls}-disabled`]: disabled,
        [`${prefixCls}-loading`]: loading,
        [`${prefixCls}-open`]: mergedOpen.value,
        [`${prefixCls}-customize-input`]: customizeInputElement.value,
        [`${prefixCls}-show-search`]: showSearch,
      }),
    );
    return () => (
      <BaseSelectContextProvider value={baseSelectContext.value}>
        <Polite visible={focused.value && !mergedOpen.value} values={displayValues} />
        <SelectTrigger
          ref={triggerRef}
          disabled={disabled}
          prefixCls={prefixCls}
          visible={mergedOpen.value}
          popupElement={<OptionList ref={listRef} />}
          animation={animation}
          transitionName={transitionName}
          popupStyle={popupStyle}
          popupClassName={popupClassName}
          direction={direction}
          popupMatchSelectWidth={popupMatchSelectWidth}
          popupRender={popupRender}
          popupAlign={popupAlign}
          placement={placement}
          builtinPlacements={builtinPlacements}
          getPopupContainer={getPopupContainer}
          empty={emptyOptions}
          onPopupVisibleChange={onTriggerVisibleChange}
          onPopupMouseEnter={onPopupMouseEnter}
          onPopupMouseDown={onRootMouseDown}
          onPopupBlur={onRootBlur}
        >
          <SelectInput
            {...restProps}
            // Ref
            ref={containerRef}
            // Style
            prefixCls={prefixCls}
            class={mergedClassName.value}
            // Focus state
            focused={focused.value}
            // UI
            prefix={prefix}
            suffix={mergedSuffixIcon.value}
            clearIcon={clearNode}
            // Type or mode
            multiple={multiple.value}
            mode={mode}
            // Values
            displayValues={displayValues}
            placeholder={placeholder}
            searchValue={mergedSearchValue.value}
            activeValue={activeValue}
            onSearch={onInternalSearch}
            onSearchSubmit={onInternalSearchSubmit}
            onInputBlur={onInputBlur}
            onFocus={onInternalFocus}
            onBlur={onInternalBlur}
            onClearMouseDown={onClearMouseDown}
            onKeydown={onInternalKeyDown}
            onKeyup={onInternalKeyUp}
            onSelectorRemove={onSelectorRemove}
            // Token handling
            tokenWithEnter={tokenWithEnter.value}
            // Open
            onMousedown={onRootMouseDown}
            // Components
            components={mergedComponents.value}
          />
        </SelectTrigger>
      </BaseSelectContextProvider>
    );
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'BaseSelect' : undefined },
);

export default BaseSelect;
