import type { RefOptionListProps } from '@vc-com/select/OptionList';
import type { TreeProps } from '@vc-com/tree';
import Tree, { UnstableContextProvider } from '@vc-com/tree';
import type { EventDataNode, ScrollTo } from '@vc-com/tree/interface';
import KeyCode from '@vc-com/util/lib/KeyCode';
import { computed, defineComponent, ref, watch } from 'vue';
import { useRef, type KeyboardEvent, type MouseEventHandler } from 'vue-jsx-vapor';
import { useBaseSelectContextInject } from '../../select/src';
import { resolveVNode } from '../../util/src/vnode';
import { useLegacySelectContextInject } from './LegacyContext';
import { useTreeSelectContextInject } from './TreeSelectContext';
import type { DataNode, Key, SafeKey } from './interface';
import { getAllKeys, isCheckDisabled } from './utils/valueUtil';

const HIDDEN_STYLE = {
  width: 0,
  height: 0,
  display: 'flex',
  overflow: 'hidden',
  opacity: 0,
  border: 0,
  padding: 0,
  margin: 0,
};

interface TreeEventInfo {
  node: { key: Key };
  selected?: boolean;
  checked?: boolean;
}

type ReviseRefOptionListProps = Omit<RefOptionListProps, 'scrollTo'> & { scrollTo: ScrollTo };

const OptionList = defineComponent(
  (_: ReviseRefOptionListProps) => {
    const { prefixCls, multiple, searchValue, toggleOpen, open, notFoundContent } = $(useBaseSelectContextInject());

    const {
      virtual,
      listHeight,
      listItemHeight,
      listItemScrollOffset,
      treeData,
      fieldNames,
      onSelect,
      popupMatchSelectWidth,
      treeExpandAction,
      treeTitleRender,
      onPopupScroll,
      leftMaxCount,
      leafCountOnly,
      valueEntities,
      classNames: treeClassNames,
      styles,
    } = $(useTreeSelectContextInject());

    const {
      checkable,
      checkedKeys,
      halfCheckedKeys,
      treeExpandedKeys,
      treeDefaultExpandAll,
      treeDefaultExpandedKeys,
      onTreeExpand,
      treeIcon,
      showTreeIcon,
      switcherIcon,
      treeLine,
      treeNodeFilterProp,
      loadData,
      treeLoadedKeys,
      treeMotion,
      onTreeLoad,
      keyEntities,
    } = $(useLegacySelectContextInject());

    const treeRef = useRef();

    const memoTreeData = computed(() => (treeData || []) as TreeProps['treeData']);

    // ========================== Values ==========================
    const mergedCheckedKeys = computed(() => {
      if (!checkable) {
        return null;
      }

      return {
        checked: checkedKeys,
        halfChecked: halfCheckedKeys,
      };
    });

    // ========================== Scroll ==========================
    watch(
      () => open,
      () => {
        // Single mode should scroll to current key
        if (open && !multiple && checkedKeys.length) {
          treeRef.value?.scrollTo({ key: checkedKeys[0] });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      },
      { immediate: true },
    );

    // ========================== Events ==========================
    const onListMouseDown: MouseEventHandler<HTMLDivElement> = (event) => {
      event.preventDefault();
    };

    const onInternalSelect = (__: Key[], info: TreeEventInfo) => {
      const { node } = info;

      if (checkable && isCheckDisabled(node)) {
        return;
      }

      onSelect(node.key, {
        selected: !checkedKeys.includes(node.key),
      });

      if (!multiple) {
        toggleOpen(false);
      }
    };

    // =========================== Keys ===========================
    const expandedKeys = ref<Key[]>(treeDefaultExpandedKeys);
    const searchExpandedKeys = ref<Key[]>(null);

    const mergedExpandedKeys = computed(() => {
      if (treeExpandedKeys) {
        return [...treeExpandedKeys];
      }
      return searchValue ? searchExpandedKeys.value : expandedKeys.value;
    });

    const onInternalExpand = (keys: Key[]) => {
      expandedKeys.value = keys;
      searchExpandedKeys.value = keys;

      if (onTreeExpand) {
        onTreeExpand(keys);
      }
    };

    // ========================== Search ==========================
    const lowerSearchValue = computed(() => String(searchValue).toLowerCase());
    const filterTreeNode = (treeNode: EventDataNode<any>) => {
      if (!lowerSearchValue.value) {
        return false;
      }
      return String(treeNode[treeNodeFilterProp]).toLowerCase().includes(lowerSearchValue.value);
    };

    watch(
      () => searchValue,
      () => {
        if (searchValue) {
          searchExpandedKeys.value = getAllKeys(treeData, fieldNames);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      },
      { immediate: true },
    );

    // ========================= Disabled =========================
    // Cache disabled states in React state to ensure re-render when cache updates
    const disabledCache = ref<Map<string, boolean>>(new Map());

    watch(
      () => leftMaxCount,
      () => {
        if (leftMaxCount) {
          disabledCache.value = new Map();
        }
      },
      { immediate: true },
    );

    function getDisabledWithCache(node: DataNode) {
      const value = node[fieldNames.value];
      if (!disabledCache.value.has(value)) {
        const entity = valueEntities.get(value);
        const isLeaf = (entity.children || []).length === 0;

        if (!isLeaf) {
          // @ts-ignore
          const checkableChildren = entity.children.filter(
            (childTreeNode) =>
              !childTreeNode.node.disabled &&
              !childTreeNode.node.disableCheckbox &&
              !checkedKeys.includes(childTreeNode.node[fieldNames.value]),
          );

          const checkableChildrenCount = checkableChildren.length;
          disabledCache.value.set(value, checkableChildrenCount > leftMaxCount);
        } else {
          disabledCache.value.set(value, false);
        }
      }
      return disabledCache.value.get(value);
    }

    const nodeDisabled = (node: DataNode) => {
      const nodeValue = node[fieldNames.value];

      if (checkedKeys.includes(nodeValue)) {
        return false;
      }

      if (leftMaxCount === null) {
        return false;
      }

      if (leftMaxCount <= 0) {
        return true;
      }

      // This is a low performance calculation
      if (leafCountOnly && leftMaxCount) {
        return getDisabledWithCache(node);
      }

      return false;
    };

    // ========================== Get First Selectable Node ==========================
    const getFirstMatchingNode = (nodes: EventDataNode<any>[]): EventDataNode<any> | null => {
      for (const node of nodes) {
        if (node.disabled || node.selectable === false) {
          continue;
        }

        if (searchValue) {
          if (filterTreeNode(node)) {
            return node;
          }
        } else {
          return node;
        }

        if (node[fieldNames.children]) {
          const matchInChildren = getFirstMatchingNode(node[fieldNames.children]);
          if (matchInChildren) {
            return matchInChildren;
          }
        }
      }
      return null;
    };

    // ========================== Active ==========================
    const activeKey = ref<Key>(null);
    const activeEntity = computed(() => keyEntities[activeKey.value as SafeKey]);

    watch([() => open, () => searchValue], () => {
      if (!open) {
        return;
      }
      let nextActiveKey = null;

      const getFirstNode = () => {
        const firstNode = getFirstMatchingNode(memoTreeData.value);
        return firstNode ? firstNode[fieldNames.value] : null;
      };

      // single mode active first checked node
      if (!multiple && checkedKeys.length && !searchValue) {
        nextActiveKey = checkedKeys[0];
      } else {
        nextActiveKey = getFirstNode();
      }

      activeKey.value = nextActiveKey;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    });

    // ========================= Keyboard =========================
    defineExpose({
      scrollTo: treeRef.value?.scrollTo,
      onKeyDown: (event) => {
        const { which } = event;
        switch (which) {
          // >>> Arrow keys
          case KeyCode.UP:
          case KeyCode.DOWN:
          case KeyCode.LEFT:
          case KeyCode.RIGHT:
            treeRef.value?.onKeyDown(event as KeyboardEvent<HTMLDivElement>);
            break;

          // >>> Select item
          case KeyCode.ENTER: {
            if (activeEntity.value) {
              const isNodeDisabled = nodeDisabled(activeEntity.value.node);
              const { selectable, value, disabled } = activeEntity.value?.node || {};
              if (selectable !== false && !disabled && !isNodeDisabled) {
                onInternalSelect(null, {
                  node: { key: activeKey.value },
                  selected: !checkedKeys.includes(value),
                });
              }
            }
            break;
          }

          // >>> Close
          case KeyCode.ESC: {
            toggleOpen(false);
          }
        }
      },
      onKeyUp: () => {},
    });

    const hasLoadDataFn = computed(() => (searchValue ? false : true));

    const syncLoadData = computed(() => (hasLoadDataFn.value ? loadData : null) as unknown as TreeProps['loadData']);

    // ========================== Render ==========================
    return () => {
      if (memoTreeData.value.length === 0) {
        return (
          <div role="listbox" class={`${prefixCls}-empty`} onMousedown={onListMouseDown}>
            {/* @ts-ignore */}
            {resolveVNode(notFoundContent)}
          </div>
        );
      }

      const treeProps: Partial<TreeProps> = {
        fieldNames,
      };
      if (treeLoadedKeys) {
        treeProps.loadedKeys = treeLoadedKeys;
      }
      if (mergedExpandedKeys.value) {
        treeProps.expandedKeys = mergedExpandedKeys.value;
      }
      return (
        <div onMousedown={onListMouseDown}>
          <span v-if={activeEntity.value && open} style={HIDDEN_STYLE} aria-live="assertive">
            {activeEntity.value.node.value}
          </span>
          <UnstableContextProvider value={{ nodeDisabled }}>
            <Tree
              classNames={treeClassNames?.popup}
              styles={styles?.popup}
              ref={treeRef}
              focusable={false}
              prefixCls={`${prefixCls}-tree`}
              treeData={memoTreeData.value}
              height={listHeight}
              itemHeight={listItemHeight}
              itemScrollOffset={listItemScrollOffset}
              virtual={virtual !== false && popupMatchSelectWidth !== false}
              multiple={multiple}
              icon={treeIcon as any}
              showIcon={showTreeIcon}
              switcherIcon={switcherIcon}
              showLine={treeLine}
              loadData={syncLoadData.value}
              motion={treeMotion}
              activeKey={activeKey.value}
              // We handle keys by out instead tree self
              checkable={checkable}
              checkStrictly
              checkedKeys={mergedCheckedKeys.value}
              selectedKeys={!checkable ? checkedKeys : []}
              defaultExpandAll={treeDefaultExpandAll}
              titleRender={treeTitleRender}
              {...treeProps}
              // Proxy event out
              onActiveChange={(e) => (activeKey.value = e)}
              onSelect={onInternalSelect}
              onCheck={onInternalSelect as any}
              onExpand={onInternalExpand}
              onLoad={onTreeLoad}
              filterTreeNode={filterTreeNode}
              expandAction={treeExpandAction}
              onScroll={onPopupScroll as any}
            />
          </UnstableContextProvider>
        </div>
      );
    };
  },
  { inheritAttrs: false },
);

export default OptionList;
