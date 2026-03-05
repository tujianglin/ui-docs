import { getId } from '@vc-com/util/lib/hooks/useId';
import pickAttrs from '@vc-com/util/lib/pickAttrs';
import type { VueNode } from '@vc-com/util/lib/types';
import { reactiveComputed } from '@vueuse/core';
import { clsx } from 'clsx';
import { computed, defineComponent, ref, watch } from 'vue';
import { useFullProps, useRef } from 'vue-jsx-vapor';
import { useTreeContextInject, useUnstableContextInject } from './contextTypes';
import Indent from './Indent';
import type { DataEntity, TreeNodeProps } from './interface';
import getEntity from './utils/keyUtil';
import { convertNodePropsToEventData, isLeafNode } from './utils/treeUtil';

const ICON_OPEN = 'open';
const ICON_CLOSE = 'close';

const defaultTitle = '---';

export type { TreeNodeProps } from './interface';

const TreeNode = defineComponent(
  ({
    eventKey,
    class: className,
    style,
    dragOver,
    dragOverGapTop,
    dragOverGapBottom,
    isLeaf,
    isStart,
    isEnd,
    expanded,
    selected,
    checked,
    halfChecked,
    loading,
    domRef,
    active,
    data,
    onMouseMove,
    selectable,
    treeId,
    ...otherProps
  }: TreeNodeProps) => {
    const props = useFullProps() as TreeNodeProps;
    const nodeId = computed(() => getId(treeId, eventKey));

    const context = useTreeContextInject();
    const { classNames: treeClassNames, styles } = $(context);

    const unstableContext = useUnstableContextInject();

    const selectHandleRef = useRef<HTMLSpanElement>(null);

    const dragNodeHighlight = ref<boolean>(false);

    // ======= State: Disabled State =======
    const isDisabled = computed(() => !!(context.disabled || props.disabled || unstableContext.nodeDisabled?.(data)));

    const isCheckable = computed<VueNode>(() => {
      // Return false if tree or treeNode is not checkable
      if (!context.checkable || props.checkable === false) {
        return false;
      }
      // @ts-ignore
      return context.checkable;
    });

    // ======= Event Handlers: Selection and Check =======
    const onSelect = (e) => {
      if (isDisabled.value) {
        return;
      }
      context.onNodeSelect(e, convertNodePropsToEventData(props));
    };

    const onCheck = (e) => {
      if (isDisabled.value) {
        return;
      }
      if (!isCheckable.value || props.disableCheckbox) {
        return;
      }
      context.onNodeCheck(e, convertNodePropsToEventData(props), !checked);
    };

    // ======= State: Selectable Check =======
    const isSelectable = computed<boolean>(() => {
      // Ignore when selectable is undefined or null
      if (typeof selectable === 'boolean') {
        return selectable;
      }
      return context.selectable;
    });

    const onSelectorClick = (e) => {
      // Click trigger before select/check operation
      context.onNodeClick(e, convertNodePropsToEventData(props));
      if (isSelectable.value) {
        onSelect(e);
      } else {
        onCheck(e);
      }
    };

    const onSelectorDoubleClick = (e) => {
      context.onNodeDoubleClick(e, convertNodePropsToEventData(props));
    };

    const onMouseEnter = (e) => {
      context.onNodeMouseEnter(e, convertNodePropsToEventData(props));
    };

    const onMouseLeave = (e) => {
      context.onNodeMouseLeave(e, convertNodePropsToEventData(props));
    };

    const onContextMenu = (e) => {
      context.onNodeContextMenu(e, convertNodePropsToEventData(props));
    };

    // ======= Drag: Drag Enabled =======
    const isDraggable = computed<boolean>(() => {
      return !!(context.draggable && (!context.draggable.nodeDraggable || context.draggable.nodeDraggable(data)));
    });

    // ======= Drag: Drag Event Handlers =======
    const onDragStart = (e) => {
      e.stopPropagation();
      dragNodeHighlight.value = true;
      context.onNodeDragStart(e, props);
      try {
        // ie throw error
        // firefox-need-it
        e.dataTransfer.setData('text/plain', '');
      } catch {
        // empty
      }
    };

    const onDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      context.onNodeDragEnter(e, props);
    };

    const onDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      context.onNodeDragOver(e, props);
    };

    const onDragLeave = (e) => {
      e.stopPropagation();
      context.onNodeDragLeave(e, props);
    };

    const onDragEnd = (e) => {
      e.stopPropagation();
      dragNodeHighlight.value = false;
      context.onNodeDragEnd(e, props);
    };

    const onDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragNodeHighlight.value = false;
      context.onNodeDrop(e, props);
    };

    // ======= Expand: Node Expansion =======
    const onExpand = (e) => {
      if (loading) {
        return;
      }
      context.onNodeExpand(e, convertNodePropsToEventData(props));
    };

    // ======= State: Has Children =======
    const hasChildren = computed<boolean>(() => {
      const { children } = getEntity(context.keyEntities, eventKey) || {};
      return Boolean((children || []).length);
    });

    // ======= State: Leaf Check =======
    const memoizedIsLeaf = computed<boolean>(() => {
      return isLeafNode(isLeaf, context.loadData, hasChildren.value, props.loaded);
    });

    // ============== Effect ==============
    watch(
      [() => loading, () => context.loadData, () => context.onNodeLoad, () => expanded, () => memoizedIsLeaf.value, () => props],
      () => {
        // Load data to avoid default expanded tree without data
        if (loading) {
          return;
        }
        // read from state to avoid loadData at same time
        if (typeof context.loadData === 'function' && expanded && !memoizedIsLeaf.value && !props.loaded) {
          // We needn't reload data when has children in sync logic
          // It's only needed in node expanded
          context.onNodeLoad(convertNodePropsToEventData(props));
        }
      },
      { immediate: true, deep: true },
    );

    // ==================== Render: Drag Handler ====================
    const DragHandlerNode = () => {
      if (!context.draggable?.icon) {
        return null;
      }
      return <span class={`${context.prefixCls}-draggable-icon`}>{context.draggable.icon}</span>;
    };

    // ====================== Render: Switcher ======================
    const renderSwitcherIconDom = (isInternalLeaf: boolean) => {
      // @ts-ignore
      const switcherIcon = props.switcherIcon || context.switcherIcon;
      // if switcherIconDom is null, no render switcher span
      if (typeof switcherIcon === 'function') {
        return switcherIcon({ ...props, isLeaf: isInternalLeaf });
      }
      return switcherIcon;
    };

    // Switcher
    const renderSwitcher = () => {
      if (memoizedIsLeaf.value) {
        // if switcherIconDom is null, no render switcher span
        const switcherIconDom = renderSwitcherIconDom(true);
        return (
          <span
            v-if={switcherIconDom !== false}
            class={clsx(`${context.prefixCls}-switcher`, `${context.prefixCls}-switcher-noop`)}
          >
            {switcherIconDom}
          </span>
        );
      }
      const switcherIconDom = renderSwitcherIconDom(false);
      return (
        <span
          v-if={switcherIconDom !== false}
          onClick={onExpand}
          class={clsx(`${context.prefixCls}-switcher`, `${context.prefixCls}-switcher_${expanded ? ICON_OPEN : ICON_CLOSE}`)}
        >
          {switcherIconDom}
        </span>
      );
    };

    // ====================== Checkbox ======================
    const CheckboxNode = () => {
      if (!isCheckable.value) {
        return null;
      }

      // [Legacy] Custom element should be separate with `checkable` in future
      const $custom = typeof isCheckable.value !== 'boolean' ? isCheckable.value : null;

      return (
        <span
          class={clsx(`${context.prefixCls}-checkbox`, {
            [`${context.prefixCls}-checkbox-checked`]: checked,
            [`${context.prefixCls}-checkbox-indeterminate`]: !checked && halfChecked,
            [`${context.prefixCls}-checkbox-disabled`]: isDisabled.value || props.disableCheckbox,
          })}
          onClick={onCheck}
          role="checkbox"
          aria-checked={halfChecked ? 'mixed' : checked}
          aria-disabled={isDisabled.value || props.disableCheckbox}
          aria-labelledby={nodeId.value}
        >
          {$custom}
        </span>
      );
    };

    // ============== State: Node State (Open/Close) ==============
    const nodeState = computed<typeof ICON_OPEN | typeof ICON_CLOSE>(() => {
      if (memoizedIsLeaf.value) {
        return null;
      }
      return expanded ? ICON_OPEN : ICON_CLOSE;
    });

    // ==================== Render: Title + Icon ====================
    const iconNode = computed<VueNode>(() => {
      return (
        <span
          class={clsx(
            treeClassNames?.itemIcon,
            `${context.prefixCls}-iconEle`,
            `${context.prefixCls}-icon__${nodeState.value || 'docu'}`,
            { [`${context.prefixCls}-icon_loading`]: loading },
          )}
          style={styles?.itemIcon}
        />
      );
    });

    // =================== Drop Indicator ===================
    const DropIndicatorNode = () => {
      const rootDraggable = Boolean(context.draggable);
      // allowDrop is calculated in Tree.tsx, there is no need for calc it here
      const showIndicator = !props.disabled && rootDraggable && context.dragOverNodeKey === eventKey;
      if (!showIndicator) {
        return null;
      }
      return context.dropIndicatorRender({
        dropPosition: context.dropPosition,
        dropLevelOffset: context.dropLevelOffset,
        indent: context.indent,
        prefixCls: context.prefixCls,
        direction: context.direction,
      }) as JSX.Element;
    };

    // Icon + Title
    const SelectorNode = () => {
      const { title = defaultTitle } = props;

      const wrapClass = `${context.prefixCls}-node-content-wrapper`;

      // Icon - Still show loading icon when loading without showIcon
      let $icon: VueNode;

      if (context.showIcon) {
        // @ts-ignore
        const currentIcon = props.icon || context.icon;

        $icon = currentIcon ? (
          <span
            class={clsx(treeClassNames?.itemIcon, `${context.prefixCls}-iconEle`, `${context.prefixCls}-icon__customize`)}
            style={styles?.itemIcon}
          >
            {typeof currentIcon === 'function' ? currentIcon(props) : currentIcon}
          </span>
        ) : (
          iconNode.value
        );
      } else if (context.loadData && loading) {
        $icon = iconNode.value;
      }

      // Title
      let titleNode: VueNode;
      if (typeof title === 'function') {
        titleNode = title(data);
      } else if (context.titleRender) {
        titleNode = context.titleRender(data);
      } else {
        titleNode = title;
      }

      return (
        <span
          ref={selectHandleRef}
          title={typeof title === 'string' ? title : ''}
          class={clsx(wrapClass, `${wrapClass}-${nodeState.value || 'normal'}`, {
            [`${context.prefixCls}-node-selected`]: !isDisabled.value && (selected || dragNodeHighlight.value),
          })}
          onMouseenter={onMouseEnter}
          onMouseleave={onMouseLeave}
          onContextmenu={onContextMenu}
          onClick={onSelectorClick}
          onDblclick={onSelectorDoubleClick}
        >
          {$icon}
          <span class={clsx(`${context.prefixCls}-title`, treeClassNames?.itemTitle)} style={styles?.itemTitle}>
            {titleNode}
          </span>
          <DropIndicatorNode></DropIndicatorNode>
        </span>
      );
    };

    const dataOrAriaAttributeProps = computed(() => pickAttrs(otherProps, { aria: true, data: true }));

    const { level } = $(reactiveComputed(() => getEntity(context.keyEntities, eventKey) || ({} as DataEntity)));

    const isEndNode = computed(() => isEnd[isEnd.length - 1]);

    const draggableWithoutDisabled = computed(() => !isDisabled.value && isDraggable.value);

    const dragging = computed(() => context.draggingNodeKey === eventKey);

    return () => (
      <div
        ref={domRef}
        role="treeitem"
        id={nodeId.value}
        aria-expanded={memoizedIsLeaf.value ? undefined : expanded}
        aria-selected={isSelectable.value && !isDisabled.value ? selected : undefined}
        aria-checked={isCheckable.value && !isDisabled.value ? (halfChecked ? 'mixed' : checked) : undefined}
        aria-disabled={isDisabled.value}
        class={clsx(className, `${context.prefixCls}-treenode`, treeClassNames?.item, {
          [`${context.prefixCls}-treenode-disabled`]: isDisabled.value,
          [`${context.prefixCls}-treenode-switcher-${expanded ? 'open' : 'close'}`]: !isLeaf,
          [`${context.prefixCls}-treenode-checkbox-checked`]: checked,
          [`${context.prefixCls}-treenode-checkbox-indeterminate`]: halfChecked,
          [`${context.prefixCls}-treenode-selected`]: selected,
          [`${context.prefixCls}-treenode-loading`]: loading,
          [`${context.prefixCls}-treenode-active`]: active,
          [`${context.prefixCls}-treenode-leaf-last`]: isEndNode.value,
          [`${context.prefixCls}-treenode-draggable`]: isDraggable.value,
          dragging: dragging.value,
          'drop-target': context.dropTargetKey === eventKey,
          'drop-container': context.dropContainerKey === eventKey,
          'drag-over': !isDisabled.value && dragOver,
          'drag-over-gap-top': !isDisabled.value && dragOverGapTop,
          'drag-over-gap-bottom': !isDisabled.value && dragOverGapBottom,
          'filter-node': context.filterTreeNode?.(convertNodePropsToEventData(props)),
          [`${context.prefixCls}-treenode-leaf`]: memoizedIsLeaf.value,
        })}
        style={{ ...style, ...styles?.item }}
        // Draggable config
        draggable={draggableWithoutDisabled.value}
        onDragstart={draggableWithoutDisabled.value ? onDragStart : undefined}
        // Drop config
        onDragenter={isDraggable.value ? onDragEnter : undefined}
        onDragover={isDraggable.value ? onDragOver : undefined}
        onDragleave={isDraggable.value ? onDragLeave : undefined}
        onDrop={isDraggable.value ? onDrop : undefined}
        onDragend={isDraggable.value ? onDragEnd : undefined}
        onMousemove={onMouseMove}
        {...dataOrAriaAttributeProps.value}
      >
        <Indent prefixCls={context.prefixCls} level={level} isStart={isStart} isEnd={isEnd} />
        <DragHandlerNode></DragHandlerNode>
        {renderSwitcher()}
        <CheckboxNode></CheckboxNode>
        <SelectorNode></SelectorNode>
      </div>
    );
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'TreeNode' : undefined, isTreeNode: 1 },
);

export default TreeNode;
