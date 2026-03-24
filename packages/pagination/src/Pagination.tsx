import KeyCode from '@vc-com/util/lib/KeyCode';
import pickAttrs from '@vc-com/util/lib/pickAttrs';
import { clsx } from 'clsx';
import { computed, createVNode, defineComponent, ref, watchEffect } from 'vue';
import { useFullProps, useRef, type FocusEvent, type KeyboardEvent } from 'vue-jsx-vapor';
import useControlledState from '../../util/src/hooks/useControlledState';
import type { PaginationProps } from './interface';
import zhCN from './locale/zh_CN';
import Options from './Options';
import type { PagerProps } from './Pager';
import Pager from './Pager';

const defaultItemRender: PaginationProps['itemRender'] = (_, __, element) => element;

function noop() {}

function isInteger(v: number) {
  const value = Number(v);
  return typeof value === 'number' && !Number.isNaN(value) && isFinite(value) && Math.floor(value) === value;
}

function calculatePage(p: number | undefined, pageSize: number, total: number) {
  const _pageSize = typeof p === 'undefined' ? pageSize : p;
  return Math.floor((total - 1) / _pageSize) + 1;
}

const Pagination = defineComponent(
  ({
    // cls
    prefixCls = 'rc-pagination',
    selectPrefixCls = 'rc-select',
    class: className,
    classNames: paginationClassNames,
    styles,

    // control
    current: currentProp,
    defaultCurrent = 1,
    total = 0,
    pageSize: pageSizeProp,
    defaultPageSize = 10,
    onChange = noop,

    // config
    hideOnSinglePage,
    align,
    showPrevNextJumpers = true,
    showQuickJumper,
    showLessItems,
    showTitle = true,
    onShowSizeChange = noop,
    locale = zhCN,
    style,
    totalBoundaryShowSizeChanger = 50,
    disabled,
    simple,
    showTotal,
    showSizeChanger = total > totalBoundaryShowSizeChanger,
    sizeChangerRender,
    pageSizeOptions,

    // render
    itemRender = defaultItemRender,
    jumpPrevIcon,
    jumpNextIcon,
    prevIcon,
    nextIcon,
  }: PaginationProps) => {
    const props = useFullProps() as PaginationProps;
    const paginationRef = useRef<HTMLUListElement>(null);

    const [pageSize, setPageSize] = useControlledState<number>(
      defaultPageSize,
      computed(() => pageSizeProp),
    );

    const [internalCurrent, setCurrent] = useControlledState<number>(
      defaultCurrent,
      computed(() => currentProp),
    );

    const current = computed(() => Math.max(1, Math.min(internalCurrent.value, calculatePage(undefined, pageSize.value, total))));

    const internalInputVal = ref(current.value);
    watchEffect(() => {
      internalInputVal.value = current.value;
    });

    const jumpPrevPage = computed(() => Math.max(1, current.value - (showLessItems ? 3 : 5)));
    const jumpNextPage = computed(() =>
      Math.min(calculatePage(undefined, pageSize.value, total), current.value + (showLessItems ? 3 : 5)),
    );

    function getItemIcon(icon, label: string) {
      let iconNode = icon || <button type="button" aria-label={label} class={`${prefixCls}-item-link`} />;
      if (typeof icon === 'function') {
        iconNode = createVNode(icon, { ...props });
      }
      return iconNode;
    }

    function getValidValue(e: any): number {
      const inputValue = e.target.value;
      const allPages = calculatePage(undefined, pageSize.value, total);
      let value: number;
      if (inputValue === '') {
        value = inputValue;
      } else if (Number.isNaN(Number(inputValue))) {
        value = internalInputVal.value;
      } else if (inputValue >= allPages) {
        value = allPages;
      } else {
        value = Number(inputValue);
      }
      return value;
    }

    function isValid(page: number) {
      return isInteger(page) && page !== current.value && isInteger(total) && total > 0;
    }

    const shouldDisplayQuickJumper = total > pageSize.value ? showQuickJumper : false;

    /**
     * prevent "up arrow" key reseting cursor position within textbox
     * @see https://stackoverflow.com/a/1081114
     */
    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
      if (event.keyCode === KeyCode.UP || event.keyCode === KeyCode.DOWN) {
        event.preventDefault();
      }
    }

    function handleKeyUp(event) {
      const value = getValidValue(event);
      if (value !== internalInputVal.value) {
        internalInputVal.value = value;
      }

      switch ((event as KeyboardEvent<HTMLInputElement>).keyCode) {
        case KeyCode.ENTER:
          handleChange(value);
          break;
        case KeyCode.UP:
          handleChange(value - 1);
          break;
        case KeyCode.DOWN:
          handleChange(value + 1);
          break;
        default:
          break;
      }
    }

    function handleBlur(event: FocusEvent<HTMLInputElement, Element>) {
      handleChange(getValidValue(event));
    }

    function changePageSize(size: number) {
      const newCurrent = calculatePage(size, pageSize.value, total);
      const nextCurrent = current.value > newCurrent && newCurrent !== 0 ? newCurrent : current.value;

      setPageSize(size);
      internalInputVal.value = nextCurrent;
      onShowSizeChange?.(current.value, size);
      setCurrent(nextCurrent);
      onChange?.(nextCurrent, size);
    }

    function handleChange(page: number) {
      if (isValid(page) && !disabled) {
        const currentPage = calculatePage(undefined, pageSize.value, total);
        let newPage = page;
        if (page > currentPage) {
          newPage = currentPage;
        } else if (page < 1) {
          newPage = 1;
        }

        if (newPage !== internalInputVal.value) {
          internalInputVal.value = newPage;
        }

        setCurrent(newPage);
        onChange?.(newPage, pageSize.value);

        return newPage;
      }

      return current;
    }

    const hasPrev = computed(() => current.value > 1);
    const hasNext = computed(() => current.value < calculatePage(undefined, pageSize.value, total));

    function prevHandle() {
      if (hasPrev.value) handleChange(current.value - 1);
    }

    function nextHandle() {
      if (hasNext.value) handleChange(current.value + 1);
    }

    function jumpPrevHandle() {
      handleChange(jumpPrevPage.value);
    }

    function jumpNextHandle() {
      handleChange(jumpNextPage.value);
    }

    function runIfEnter(event: KeyboardEvent<HTMLLIElement>, callback: (...args: any[]) => void, ...restParams: any[]) {
      if (event.key === 'Enter' || event.charCode === KeyCode.ENTER || event.keyCode === KeyCode.ENTER) {
        callback(...restParams);
      }
    }

    function runIfEnterPrev(event: KeyboardEvent<HTMLLIElement>) {
      runIfEnter(event, prevHandle);
    }

    function runIfEnterNext(event: KeyboardEvent<HTMLLIElement>) {
      runIfEnter(event, nextHandle);
    }

    function runIfEnterJumpPrev(event: KeyboardEvent<HTMLLIElement>) {
      runIfEnter(event, jumpPrevHandle);
    }

    function runIfEnterJumpNext(event: KeyboardEvent<HTMLLIElement>) {
      runIfEnter(event, jumpNextHandle);
    }

    function renderPrev(prevPage: number) {
      const prevButton = itemRender(prevPage, 'prev', getItemIcon(prevIcon, 'prev page'));
      return isValid(prevButton) ? createVNode(prevButton, { disabled: !hasPrev }) : prevButton;
    }

    function renderNext(nextPage: number) {
      const nextButton = itemRender(nextPage, 'next', getItemIcon(nextIcon, 'next page'));
      return isValid(nextButton) ? createVNode(nextButton, { disabled: !hasNext }) : nextButton;
    }

    function handleGoTO(event: any) {
      if (event.type === 'click' || event.keyCode === KeyCode.ENTER) {
        handleChange(internalInputVal.value);
      }
    }
    return () => {
      let jumpPrev = null;

      const dataOrAriaAttributeProps = pickAttrs(props, {
        aria: true,
        data: true,
      });

      const totalText = (
        <li v-if={showTotal} class={`${prefixCls}-total-text`}>
          {showTotal(total, [
            total === 0 ? 0 : (current.value - 1) * pageSize.value + 1,
            current.value * pageSize.value > total ? total : current.value * pageSize.value,
          ])}
        </li>
      );

      let jumpNext = null;

      const allPages = calculatePage(undefined, pageSize.value, total);

      // ================== Render ==================
      // When hideOnSinglePage is true and there is only 1 page, hide the pager
      if (hideOnSinglePage && total <= pageSize.value) {
        return null;
      }

      const pagerList = [];

      const pagerProps: PagerProps = {
        rootPrefixCls: prefixCls,
        onClick: handleChange,
        onKeypress: runIfEnter,
        showTitle,
        itemRender,
        page: -1,
        class: paginationClassNames?.item,
        style: styles?.item,
      };

      const prevPage = current.value - 1 > 0 ? current.value - 1 : 0;
      const nextPage = current.value + 1 < allPages ? current.value + 1 : allPages;
      const goButton = showQuickJumper && (showQuickJumper as any).goButton;

      // ================== Simple ==================
      // FIXME: ts type
      const isReadOnly = typeof simple === 'object' ? simple.readOnly : !simple;
      let gotoButton: any = goButton;
      let simplePager = null;

      if (simple) {
        // ====== Simple quick jump ======
        if (goButton) {
          if (typeof goButton === 'boolean') {
            gotoButton = (
              <button type="button" onClick={handleGoTO} onKeyup={handleGoTO}>
                {locale.jump_to_confirm}
              </button>
            );
          } else {
            gotoButton = (
              <span onClick={handleGoTO} onKeyup={handleGoTO}>
                {goButton}
              </span>
            );
          }

          gotoButton = (
            <li title={showTitle ? `${locale.jump_to}${current.value}/${allPages}` : null} class={`${prefixCls}-simple-pager`}>
              {gotoButton}
            </li>
          );
        }

        simplePager = (
          <li
            title={showTitle ? `${current.value}/${allPages}` : null}
            class={clsx(`${prefixCls}-simple-pager`, paginationClassNames?.item)}
            style={styles?.item}
          >
            {isReadOnly ? (
              internalInputVal.value
            ) : (
              <input
                type="text"
                aria-label={locale.jump_to}
                value={internalInputVal.value}
                disabled={disabled}
                onKeydown={handleKeyDown}
                onKeyup={handleKeyUp}
                onInput={handleKeyUp}
                onBlur={handleBlur}
                size={3}
              />
            )}
            <span class={`${prefixCls}-slash`}>/</span>
            {allPages}
          </li>
        );
      }

      // ====================== Normal ======================
      const pageBufferSize = showLessItems ? 1 : 2;
      if (allPages <= 3 + pageBufferSize * 2) {
        if (!allPages) {
          pagerList.push(<Pager {...pagerProps} key="noPager" page={1} class={`${prefixCls}-item-disabled`} />);
        }

        for (let i = 1; i <= allPages; i += 1) {
          pagerList.push(<Pager {...pagerProps} key={i} page={i} active={current.value === i} />);
        }
      } else {
        const prevItemTitle = showLessItems ? locale.prev_3 : locale.prev_5;
        const nextItemTitle = showLessItems ? locale.next_3 : locale.next_5;

        const jumpPrevContent = itemRender(jumpPrevPage.value, 'jump-prev', getItemIcon(jumpPrevIcon, 'prev page'));
        const jumpNextContent = itemRender(jumpNextPage.value, 'jump-next', getItemIcon(jumpNextIcon, 'next page'));

        if (showPrevNextJumpers) {
          jumpPrev = (
            <li
              v-if={jumpPrevContent}
              title={showTitle ? prevItemTitle : null}
              key="prev"
              onClick={jumpPrevHandle}
              tabindex={0}
              onKeydown={runIfEnterJumpPrev}
              class={clsx(`${prefixCls}-jump-prev`, {
                [`${prefixCls}-jump-prev-custom-icon`]: !!jumpPrevIcon,
              })}
            >
              {jumpPrevContent}
            </li>
          );

          jumpNext = (
            <li
              v-if={jumpNextContent}
              title={showTitle ? nextItemTitle : null}
              key="next"
              onClick={jumpNextHandle}
              tabindex={0}
              onKeydown={runIfEnterJumpNext}
              class={clsx(`${prefixCls}-jump-next`, {
                [`${prefixCls}-jump-next-custom-icon`]: !!jumpNextIcon,
              })}
            >
              {jumpNextContent}
            </li>
          );
        }

        let left = Math.max(1, current.value - pageBufferSize);
        let right = Math.min(current.value + pageBufferSize, allPages);

        if (current.value - 1 <= pageBufferSize) {
          right = 1 + pageBufferSize * 2;
        }
        if (allPages - current.value <= pageBufferSize) {
          left = allPages - pageBufferSize * 2;
        }

        for (let i = left; i <= right; i += 1) {
          pagerList.push(<Pager {...pagerProps} key={i} page={i} active={current.value === i} />);
        }

        if (current.value - 1 >= pageBufferSize * 2 && current.value !== 1 + 2) {
          pagerList[0] = createVNode(pagerList[0], {
            class: clsx(`${prefixCls}-item-after-jump-prev`, pagerList[0].props.class),
          });

          pagerList.unshift(jumpPrev);
        }

        if (allPages - current.value >= pageBufferSize * 2 && current.value !== allPages - 2) {
          const lastOne = pagerList[pagerList.length - 1];
          pagerList[pagerList.length - 1] = createVNode(lastOne, {
            class: clsx(`${prefixCls}-item-before-jump-next`, lastOne.props.class),
          });

          pagerList.push(jumpNext);
        }

        if (left !== 1) {
          pagerList.unshift(<Pager {...pagerProps} key={1} page={1} />);
        }
        if (right !== allPages) {
          pagerList.push(<Pager {...pagerProps} key={allPages} page={allPages} />);
        }
      }

      let prev = renderPrev(prevPage);
      if (prev) {
        const prevDisabled = !hasPrev || !allPages;
        prev = (
          <li
            title={showTitle ? locale.prev_page : null}
            onClick={prevHandle}
            tabindex={prevDisabled ? null : 0}
            onKeydown={runIfEnterPrev}
            class={clsx(`${prefixCls}-prev`, paginationClassNames?.item, {
              [`${prefixCls}-disabled`]: prevDisabled,
            })}
            style={styles?.item}
            aria-disabled={prevDisabled}
          >
            {prev}
          </li>
        );
      }

      let next = renderNext(nextPage);
      if (next) {
        let nextDisabled: boolean, nextTabIndex: number | null;

        if (simple) {
          nextDisabled = !hasNext.value;
          nextTabIndex = hasPrev ? 0 : null;
        } else {
          nextDisabled = !hasNext.value || !allPages;
          nextTabIndex = nextDisabled ? null : 0;
        }

        next = (
          <li
            title={showTitle ? locale.next_page : null}
            onClick={nextHandle}
            tabindex={nextTabIndex}
            onKeydown={runIfEnterNext}
            class={clsx(`${prefixCls}-next`, paginationClassNames?.item, {
              [`${prefixCls}-disabled`]: nextDisabled,
            })}
            style={styles?.item}
            aria-disabled={nextDisabled}
          >
            {next}
          </li>
        );
      }

      const cls = clsx(prefixCls, className, {
        [`${prefixCls}-start`]: align === 'start',
        [`${prefixCls}-center`]: align === 'center',
        [`${prefixCls}-end`]: align === 'end',
        [`${prefixCls}-simple`]: simple,
        [`${prefixCls}-disabled`]: disabled,
      });

      return (
        <ul class={cls} style={style} ref={paginationRef} {...dataOrAriaAttributeProps}>
          {totalText}
          {prev}
          {simple ? simplePager : pagerList}
          {next}
          <Options
            locale={locale}
            rootPrefixCls={prefixCls}
            disabled={disabled}
            selectPrefixCls={selectPrefixCls}
            changeSize={changePageSize}
            pageSize={pageSize.value}
            pageSizeOptions={pageSizeOptions}
            quickGo={shouldDisplayQuickJumper ? handleChange : null}
            goButton={gotoButton}
            showSizeChanger={showSizeChanger}
            sizeChangerRender={sizeChangerRender}
          />
        </ul>
      );
    };
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'Pagination' : undefined },
);

export default Pagination;
