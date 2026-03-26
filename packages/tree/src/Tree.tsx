// TODO: Fully accessibility support
// Reference: https://www.w3.org/WAI/ARIA/apg/patterns/treeview

import KeyCode from '@vc-com/util/lib/KeyCode';
import pickAttrs from '@vc-com/util/lib/pickAttrs';
import type { VueNode } from '@vc-com/util/lib/types';
import { warning } from '@vc-com/util/lib/warning';
import clsx from 'clsx';
import {
  computed,
  defineComponent,
  getCurrentInstance,
  onBeforeUnmount,
  reactive,
  ref,
  shallowRef,
  watch,
  watchEffect,
  type CSSProperties,
} from 'vue';
import {
  useFullProps,
  type FocusEventHandler,
  type KeyboardEventHandler,
  type MouseEventHandler,
  type UIEventHandler,
} from 'vue-jsx-vapor';
import type { ScrollTo } from '../../virtual-list/src';
import {
  TreeContextProvider,
  type NodeDragEventParams,
  type NodeMouseEventHandler,
  type NodeMouseEventParams,
} from './contextTypes';
import type { DropIndicatorProps } from './DropIndicator';
import DropIndicator from './DropIndicator';
import type {
  BasicDataNode,
  DataNode,
  Direction,
  EventDataNode,
  FieldNames,
  IconType,
  Key,
  KeyEntities,
  TreeNodeProps,
} from './interface';
import NodeList, { MOTION_KEY, MotionEntity, type NodeListRef } from './NodeList';
import {
  arrAdd,
  arrDel,
  calcDropPosition,
  calcSelectedKeys,
  conductExpandParent,
  getDragChildrenKeys,
  parseCheckedKeys,
  posToArr,
} from './util';
import { conductCheck } from './utils/conductUtil';
import getEntity from './utils/keyUtil';
import {
  convertDataToEntities,
  convertNodePropsToEventData,
  fillFieldNames,
  flattenTreeData,
  getTreeNodeProps,
  isLeafNode,
  warningWithoutKey,
} from './utils/treeUtil';

const MAX_RETRY_TIMES = 10;

export interface CheckInfo<TreeDataType extends BasicDataNode = DataNode> {
  event: 'check';
  node: EventDataNode<TreeDataType>;
  checked: boolean;
  nativeEvent: MouseEvent;
  checkedNodes: TreeDataType[];
  checkedNodesPositions?: { node: TreeDataType; pos: string }[];
  halfCheckedKeys?: Key[];
}

export interface AllowDropOptions<TreeDataType extends BasicDataNode = DataNode> {
  dragNode: TreeDataType;
  dropNode: TreeDataType;
  dropPosition: -1 | 0 | 1;
}
export type AllowDrop<TreeDataType extends BasicDataNode = DataNode> = (options: AllowDropOptions<TreeDataType>) => boolean;

export type DraggableFn = (node: DataNode) => boolean;
export type DraggableConfig = {
  icon?: VueNode | false;
  nodeDraggable?: DraggableFn;
};

export type ExpandAction = false | 'click' | 'doubleClick';

export type SemanticName = 'itemIcon' | 'item' | 'itemTitle';
export interface TreeProps<TreeDataType extends BasicDataNode = DataNode> {
  prefixCls?: string;
  class?: string;
  style?: CSSProperties;
  styles?: Partial<Record<SemanticName, CSSProperties>>;
  classNames?: Partial<Record<SemanticName, string>>;
  focusable?: boolean;
  activeKey?: Key | null;
  tabIndex?: number;
  children?: VueNode;
  treeData?: TreeDataType[]; // Generate treeNode by children
  fieldNames?: FieldNames;
  showLine?: boolean;
  showIcon?: boolean;
  icon?: IconType;
  selectable?: boolean;
  expandAction?: ExpandAction;
  disabled?: boolean;
  multiple?: boolean;
  checkable?: boolean | VueNode;
  checkStrictly?: boolean;
  draggable?: DraggableFn | boolean | DraggableConfig;
  defaultExpandParent?: boolean;
  autoExpandParent?: boolean;
  defaultExpandAll?: boolean;
  defaultExpandedKeys?: Key[];
  expandedKeys?: Key[];
  defaultCheckedKeys?: Key[];
  checkedKeys?: Key[] | { checked: Key[]; halfChecked: Key[] };
  defaultSelectedKeys?: Key[];
  selectedKeys?: Key[];
  allowDrop?: AllowDrop<TreeDataType>;
  titleRender?: (node: TreeDataType) => VueNode;
  dropIndicatorRender?: (props: DropIndicatorProps) => VueNode;
  onFocus?: FocusEventHandler<HTMLDivElement>;
  onBlur?: FocusEventHandler<HTMLDivElement>;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
  onContextMenu?: MouseEventHandler<HTMLDivElement>;
  onClick?: NodeMouseEventHandler<TreeDataType>;
  onDoubleClick?: NodeMouseEventHandler<TreeDataType>;
  onScroll?: UIEventHandler<HTMLElement>;
  onExpand?: (
    expandedKeys: Key[],
    info: {
      node: EventDataNode<TreeDataType>;
      expanded: boolean;
      nativeEvent: MouseEvent;
    },
  ) => void;
  onCheck?: (checked: { checked: Key[]; halfChecked: Key[] } | Key[], info: CheckInfo<TreeDataType>) => void;
  onSelect?: (
    selectedKeys: Key[],
    info: {
      event: 'select';
      selected: boolean;
      node: EventDataNode<TreeDataType>;
      selectedNodes: TreeDataType[];
      nativeEvent: MouseEvent;
    },
  ) => void;
  onLoad?: (
    loadedKeys: Key[],
    info: {
      event: 'load';
      node: EventDataNode<TreeDataType>;
    },
  ) => void;
  loadData?: (treeNode: EventDataNode<TreeDataType>) => Promise<any>;
  loadedKeys?: Key[];
  onMouseEnter?: (info: NodeMouseEventParams<TreeDataType>) => void;
  onMouseLeave?: (info: NodeMouseEventParams<TreeDataType>) => void;
  onRightClick?: (info: { event: MouseEvent; node: EventDataNode<TreeDataType> }) => void;
  onDragStart?: (info: NodeDragEventParams<TreeDataType>) => void;
  onDragEnter?: (info: NodeDragEventParams<TreeDataType> & { expandedKeys: Key[] }) => void;
  onDragOver?: (info: NodeDragEventParams<TreeDataType>) => void;
  onDragLeave?: (info: NodeDragEventParams<TreeDataType>) => void;
  onDragEnd?: (info: NodeDragEventParams<TreeDataType>) => void;
  onDrop?: (
    info: NodeDragEventParams<TreeDataType> & {
      dragNode: EventDataNode<TreeDataType>;
      dragNodesKeys: Key[];
      dropPosition: number;
      dropToGap: boolean;
    },
  ) => void;
  /**
   * Used for `rc-tree-select` only.
   * Do not use in your production code directly since this will be refactor.
   */
  onActiveChange?: (key: Key) => void;
  filterTreeNode?: (treeNode: EventDataNode<TreeDataType>) => boolean;
  motion?: any;
  switcherIcon?: IconType;

  // Virtual List
  height?: number;
  itemHeight?: number;
  scrollWidth?: number;
  itemScrollOffset?: number;
  virtual?: boolean;

  // direction for drag logic
  direction?: Direction;

  rootClassName?: string;
  rootStyle?: CSSProperties;
}

const Tree = defineComponent(
  ({
    prefixCls = 'rc-tree',
    showLine = false,
    showIcon = true,
    selectable = true,
    multiple = false,
    checkable = false,
    disabled = false,
    checkStrictly = false,
    draggable = false,
    defaultExpandParent = true,
    autoExpandParent = false,
    defaultExpandAll = false,
    defaultExpandedKeys = [],
    defaultCheckedKeys = [],
    defaultSelectedKeys = [],
    dropIndicatorRender,
    allowDrop = () => true,
    expandAction = false,
    class: className,
    style,
    styles,
    classNames: treeClassNames,
    focusable,
    tabIndex = 0,
    icon,
    switcherIcon,
    motion,
    loadData,
    filterTreeNode,
    height,
    itemHeight,
    scrollWidth,
    virtual,
    titleRender,
    onContextMenu,
    onScroll,
    direction,
    rootClassName,
    rootStyle,
    treeData,
  }: TreeProps) => {
    const props = useFullProps() as TreeProps;

    const fieldNames = computed(() => fillFieldNames(props.fieldNames));

    watchEffect(() => {
      warningWithoutKey(treeData, fieldNames.value);
    });

    const entities = computed(() => {
      return convertDataToEntities(treeData as any, { fieldNames: fieldNames.value });
    });

    const keyEntities = computed<KeyEntities<any>>(() => ({
      [MOTION_KEY]: MotionEntity,
      ...entities.value.keyEntities,
    }));

    const getInitExpandedKeys = () => {
      let keys: Key[] = [];

      if (defaultExpandAll) {
        keys = Object.values(keyEntities.value)
          .filter((entity) => entity.key !== MOTION_KEY)
          .map((entity) => entity.key);
      } else {
        keys = props?.expandedKeys || defaultExpandedKeys || [];
      }
      if (defaultExpandParent) {
        keys = conductExpandParent(keys, keyEntities.value);
      }

      return keys;
    };

    const expandedKeys = shallowRef<Key[]>(getInitExpandedKeys());

    const setExpandedKeys = (keys: Key[]) => {
      expandedKeys.value = keys;
    };
    watch(
      () => props.expandedKeys,
      () => {
        if (props.expandedKeys === undefined) return;

        const keys = props.expandedKeys || [];
        if (autoExpandParent) {
          expandedKeys.value = conductExpandParent(keys, keyEntities.value);
          return;
        }
        expandedKeys.value = keys;
      },
    );

    const flattenNodes = computed(() => flattenTreeData(treeData as any, expandedKeys.value, fieldNames.value));

    const selectedKeys = shallowRef<Key[]>(
      calcSelectedKeys(props?.selectedKeys || defaultSelectedKeys || [], { multiple: multiple }) || [],
    );
    watch(
      () => props.selectedKeys,
      () => {
        if (props.selectedKeys === undefined) {
          return;
        }
        selectedKeys.value = calcSelectedKeys(props.selectedKeys, { multiple: multiple }) || [];
      },
    );

    const setSelectedKeys = (keys: Key[]) => {
      selectedKeys.value = keys;
    };

    const getDefaultCheckedKeyEntity = () => {
      const parsed = parseCheckedKeys(props?.checkedKeys as any);
      if (parsed) {
        return {
          checkedKeys: parsed.checkedKeys || [],
          halfCheckedKeys: parsed.halfCheckedKeys || [],
        };
      }
      return {
        checkedKeys: defaultCheckedKeys || [],
        halfCheckedKeys: [],
      };
    };
    const defaultCheckedKeyEntity = getDefaultCheckedKeyEntity();
    const rawCheckedKeys = shallowRef<Key[]>(defaultCheckedKeyEntity.checkedKeys);
    const setRawCheckedKeys = (keys: Key[]) => {
      rawCheckedKeys.value = keys;
    };
    watch(
      () => props.checkedKeys,
      () => {
        if (props.checkedKeys === undefined) {
          return;
        }
        const parsed = parseCheckedKeys(props.checkedKeys);
        rawCheckedKeys.value = parsed?.checkedKeys || [];
      },
    );

    const rawHalfCheckedKeys = shallowRef<Key[]>(defaultCheckedKeyEntity.halfCheckedKeys);
    const setRawHalfCheckedKeys = (keys: Key[]) => {
      rawHalfCheckedKeys.value = keys;
    };
    watch(
      () => props.checkedKeys,
      () => {
        if (props.checkedKeys === undefined) {
          return;
        }
        const parsed = parseCheckedKeys(props.checkedKeys);
        rawHalfCheckedKeys.value = parsed?.halfCheckedKeys || [];
      },
    );

    const mergedChecked = computed(() => {
      if (!checkable) {
        return { checkedKeys: [], halfCheckedKeys: [] };
      }

      let checkedKeysValue = rawCheckedKeys.value || [];
      let halfCheckedKeysValue = rawHalfCheckedKeys.value || [];

      if (!checkStrictly) {
        // Skip conduct check when tree data not ready to avoid warning:
        // `Tree missing follow keys: ...`
        const hasTreeEntity = Object.keys(keyEntities.value || {}).some((key) => key !== MOTION_KEY);
        if (hasTreeEntity) {
          const conductKeys = conductCheck(checkedKeysValue, true, keyEntities.value);
          checkedKeysValue = conductKeys.checkedKeys;
          halfCheckedKeysValue = conductKeys.halfCheckedKeys;
        }
      }

      return {
        checkedKeys: checkedKeysValue,
        halfCheckedKeys: halfCheckedKeysValue,
      };
    });

    const loadedKeys = ref<Key[]>([]);
    const loadingKeys = ref<Key[]>([]);
    const activeKey = ref(null);
    const listChanging = ref(false);

    // ================= loadedKeys ==================
    watchEffect(() => {
      if (props.loadedKeys) {
        loadedKeys.value = props.loadedKeys;
      }
    });

    watchEffect(() => {
      if (props.activeKey) {
        activeKey.value = props.activeKey;
      }
    });

    function onListChangeStart() {
      listChanging.value = true;
    }

    function onListChangeEnd() {
      setTimeout(() => {
        listChanging.value = false;
      });
    }

    const draggingNodeKey = ref<Key | null>(null);
    const dragChildrenKeys = ref<Key[]>([]);
    const indent = ref<number | null>(null);

    const dropTargetKey = ref<Key | null>(null);
    const dropPosition = ref<-1 | 0 | 1 | null>(null);
    const dropContainerKey = ref<Key | null>(null);
    const dropLevelOffset = ref<number | null>(null);
    const dropTargetPos = ref<string | null>(null);
    const dropAllowed = ref(true);
    const dragOverNodeKey = ref<Key | null>(null);

    let dragNodeProps: TreeNodeProps<any> | null = null;
    let dragStartMousePosition: { x: number; y: number } | null = null;
    let currentMouseOverDroppableNodeKey: Key | null = null;

    const delayedDragEnterLogic: Record<string, number> = {};
    const loadingRetryTimes: Record<string, number> = {};

    const listRef = ref<NodeListRef>();

    const getTreeNodeRequiredProps = computed(() => ({
      expandedKeys: expandedKeys.value || [],
      selectedKeys: selectedKeys.value || [],
      loadedKeys: loadedKeys.value || [],
      loadingKeys: loadingKeys.value || [],
      checkedKeys: mergedChecked.value.checkedKeys || [],
      halfCheckedKeys: mergedChecked.value.halfCheckedKeys || [],
      dragOverNodeKey: dragOverNodeKey.value,
      dropPosition: dropPosition.value,
      keyEntities: keyEntities.value,
    }));

    const getActiveItem = computed(() => {
      if (activeKey.value === null) return null;
      return flattenNodes.value.find(({ key }) => key === activeKey.value) || null;
    });

    const scrollTo: ScrollTo = (scroll) => {
      listRef.value?.scrollTo(scroll);
    };

    defineExpose({ scrollTo, onKeyDown });

    function onActiveChange(newActiveKey: Key | null) {
      if (activeKey.value === newActiveKey) return;

      activeKey.value = newActiveKey;

      if (newActiveKey !== null) {
        scrollTo({ key: newActiveKey, offset: props.itemScrollOffset || 0 });
      }

      props.onActiveChange?.(newActiveKey);
    }

    function offsetActiveKey(offset: number) {
      const nodes = flattenNodes.value;
      const currentActiveKey = activeKey.value;

      let index = nodes.findIndex(({ key }) => key === currentActiveKey);
      if (index === -1 && offset < 0) {
        index = nodes.length;
      }

      index = (index + offset + nodes.length) % nodes.length;
      const item = nodes[index];
      onActiveChange(item ? item.key : null);
    }

    function onFocus(...args) {
      if (!disabled && activeKey.value === null) {
        const visibleSelectedKey = selectedKeys.value.find((key) => {
          return flattenNodes.value.some((nodeItem) => nodeItem.key === key);
        });

        if (visibleSelectedKey !== undefined) {
          onActiveChange(visibleSelectedKey);
        } else {
          onActiveChange(flattenNodes.value?.[0]?.key || null);
        }
      }
      // @ts-ignore
      props.onFocus?.(...args);
    }

    function onBlur(...args) {
      onActiveChange(null);
      // @ts-ignore
      props.onBlur?.(...args);
    }

    function onNodeLoad(treeNode: EventDataNode<any>) {
      const key = treeNode.key;

      if (getEntity(keyEntities.value, key)?.children?.length) return;

      if (!loadData || loadedKeys.value.includes(key) || loadingKeys.value.includes(key)) return;

      loadingKeys.value = arrAdd(loadingKeys.value, key);

      const promise = loadData(treeNode);
      const wrapped = Promise.resolve(promise)
        .then(() => {
          const newLoadedKeys = arrAdd(loadedKeys.value, key);

          props.onLoad?.(newLoadedKeys, {
            event: 'load',
            node: treeNode,
          });

          loadedKeys.value = newLoadedKeys;
          loadingKeys.value = arrDel(loadingKeys.value, key);
        })
        .catch((err) => {
          loadingKeys.value = arrDel(loadingKeys.value, key);

          loadingRetryTimes[String(key)] = (loadingRetryTimes[String(key)] || 0) + 1;
          if (loadingRetryTimes[String(key)] >= MAX_RETRY_TIMES) {
            warning(false, 'Retry for `loadData` many times but still failed. No more retry.');
            loadedKeys.value = arrAdd(loadedKeys.value, key);
            return;
          }

          throw err;
        });

      wrapped.catch(() => {});

      return wrapped;
    }

    function onNodeExpand(e: MouseEvent, treeNode: EventDataNode<any>) {
      const expanded = treeNode.expanded;
      const key = (treeNode as any)[fieldNames.value.key];

      // Do nothing when motion is in progress
      if (listChanging.value) return;

      const targetExpanded = !expanded;
      const certain = expandedKeys.value.includes(key);

      warning((expanded && certain) || (!expanded && !certain), 'Expand state not sync with index check');

      const nextExpandedKeys = targetExpanded ? arrAdd(expandedKeys.value, key) : arrDel(expandedKeys.value, key);
      setExpandedKeys(nextExpandedKeys);

      props.onExpand?.(nextExpandedKeys, {
        node: treeNode,
        expanded: targetExpanded,
        nativeEvent: e,
      });

      if (targetExpanded && loadData) {
        const loadPromise = onNodeLoad(treeNode);
        if (loadPromise) {
          loadPromise.catch(() => {
            setExpandedKeys(arrDel(expandedKeys.value, key));
          });
        }
      }
    }

    function triggerExpandActionExpand(e: MouseEvent, treeNode: EventDataNode<any>) {
      const expanded = treeNode.expanded;
      const key = treeNode.key;

      if (treeNode.isLeaf || e.shiftKey || e.metaKey || e.ctrlKey) return;

      const node = flattenNodes.value.find((nodeItem) => nodeItem.key === key);
      if (!node) return;

      const eventNode = convertNodePropsToEventData({
        ...getTreeNodeProps(key, getTreeNodeRequiredProps.value),
        data: node.data,
      } as any);

      setExpandedKeys(expanded ? arrDel(expandedKeys.value, key) : arrAdd(expandedKeys.value, key));
      onNodeExpand(e, eventNode);
    }

    const onNodeClick: NodeMouseEventHandler<any> = (e, treeNode) => {
      if (expandAction === 'click') {
        triggerExpandActionExpand(e, treeNode);
      }

      props.onClick?.(e, treeNode);
    };

    const onNodeDoubleClick: NodeMouseEventHandler<any> = (e, treeNode) => {
      if (expandAction === 'doubleClick') {
        triggerExpandActionExpand(e, treeNode);
      }

      props.onDoubleClick?.(e, treeNode);
    };

    const onNodeSelect: NodeMouseEventHandler<any> = (e, treeNode) => {
      const selected = treeNode.selected;
      const key = (treeNode as any)[fieldNames.value.key];
      const targetSelected = !selected;

      let nextSelectedKeys = selectedKeys.value;
      if (!targetSelected) {
        nextSelectedKeys = arrDel(nextSelectedKeys, key);
      } else if (!multiple) {
        nextSelectedKeys = [key];
      } else {
        nextSelectedKeys = arrAdd(nextSelectedKeys, key);
      }

      const selectedNodes = nextSelectedKeys
        .map((selectedKey) => {
          const entity = getEntity(keyEntities.value, selectedKey);
          return entity ? entity.node : null;
        })
        .filter(Boolean);

      setSelectedKeys(nextSelectedKeys);

      props.onSelect?.(nextSelectedKeys, {
        event: 'select',
        selected: targetSelected,
        node: treeNode,
        selectedNodes,
        nativeEvent: e,
      });
    };

    function onNodeCheck(e: MouseEvent, treeNode: EventDataNode<any>, checked: boolean) {
      const { checkedKeys: oriCheckedKeys, halfCheckedKeys: oriHalfCheckedKeys } = mergedChecked.value;
      const key = treeNode.key;

      let checkedObj: { checked: Key[]; halfChecked: Key[] } | Key[];

      const eventObj: any = {
        event: 'check',
        node: treeNode,
        checked,
        nativeEvent: e,
      };

      if (checkStrictly) {
        const nextCheckedKeys = checked ? arrAdd(oriCheckedKeys, key) : arrDel(oriCheckedKeys, key);
        const nextHalfCheckedKeys = arrDel(oriHalfCheckedKeys, key);

        checkedObj = { checked: nextCheckedKeys, halfChecked: nextHalfCheckedKeys };

        eventObj.checkedNodes = nextCheckedKeys
          .map((checkedKey) => getEntity(keyEntities.value, checkedKey))
          .filter(Boolean)
          .map((entity) => entity.node);

        setRawCheckedKeys(nextCheckedKeys);
        setRawHalfCheckedKeys(nextHalfCheckedKeys);
      } else {
        let { checkedKeys: nextCheckedKeys, halfCheckedKeys: nextHalfCheckedKeys } = conductCheck(
          [...oriCheckedKeys, key],
          true,
          keyEntities.value,
        );

        if (!checked) {
          const keySet = new Set(nextCheckedKeys);
          keySet.delete(key);
          ({ checkedKeys: nextCheckedKeys, halfCheckedKeys: nextHalfCheckedKeys } = conductCheck(
            Array.from(keySet),
            { checked: false, halfCheckedKeys: nextHalfCheckedKeys },
            keyEntities.value,
          ));
        }

        checkedObj = nextCheckedKeys;
        eventObj.checkedNodes = [];
        eventObj.checkedNodesPositions = [];
        eventObj.halfCheckedKeys = nextHalfCheckedKeys;

        nextCheckedKeys.forEach((checkedKey) => {
          const entity = getEntity(keyEntities.value, checkedKey);
          if (!entity) return;

          const { node, pos } = entity;
          eventObj.checkedNodes.push(node);
          eventObj.checkedNodesPositions.push({ node, pos });
        });

        setRawCheckedKeys(nextCheckedKeys);
        setRawHalfCheckedKeys(nextHalfCheckedKeys);
      }

      props.onCheck?.(checkedObj, eventObj);
    }

    const onNodeMouseEnter: NodeMouseEventHandler<any> = (e, node) => {
      props.onMouseEnter?.({ event: e, node });
    };

    const onNodeMouseLeave: NodeMouseEventHandler<any> = (e, node) => {
      props.onMouseLeave?.({ event: e, node });
    };

    const onNodeContextMenu: NodeMouseEventHandler<any> = (e, node) => {
      if (props.onRightClick) {
        e.preventDefault();
        props.onRightClick({ event: e, node });
      }
    };

    function resetDragState() {
      dragOverNodeKey.value = null;
      dropPosition.value = null;
      dropLevelOffset.value = null;
      dropTargetKey.value = null;
      dropContainerKey.value = null;
      dropTargetPos.value = null;
      dropAllowed.value = false;
    }

    function cleanDragState() {
      if (draggingNodeKey.value !== null) {
        draggingNodeKey.value = null;
        dropPosition.value = null;
        dropContainerKey.value = null;
        dropTargetKey.value = null;
        dropLevelOffset.value = null;
        dropAllowed.value = true;
        dragOverNodeKey.value = null;
      }

      dragStartMousePosition = null;
      currentMouseOverDroppableNodeKey = null;
      dragChildrenKeys.value = [];
      indent.value = null;
    }

    const onWindowDragEnd = (event: DragEvent) => {
      onNodeDragEnd(event, null, true);
      window.removeEventListener('dragend', onWindowDragEnd);
    };

    onBeforeUnmount(() => {
      window.removeEventListener('dragend', onWindowDragEnd);
      Object.keys(delayedDragEnterLogic).forEach((key) => {
        clearTimeout(delayedDragEnterLogic[key]);
      });
    });

    const onNodeDragStart = (event: DragEvent, nodeProps: TreeNodeProps<any>) => {
      dragNodeProps = nodeProps;
      dragStartMousePosition = { x: event.clientX, y: event.clientY };

      const newExpandedKeys = arrDel(expandedKeys.value, nodeProps.eventKey!);

      draggingNodeKey.value = nodeProps.eventKey!;
      dragChildrenKeys.value = getDragChildrenKeys(nodeProps.eventKey!, keyEntities.value);
      indent.value = listRef.value?.getIndentWidth() || 0;

      setExpandedKeys(newExpandedKeys);

      window.addEventListener('dragend', onWindowDragEnd);

      props.onDragStart?.({ event, node: convertNodePropsToEventData(nodeProps as any) });
    };

    const onNodeDragEnter = (event: DragEvent, nodeProps: TreeNodeProps<any>) => {
      const { pos, eventKey } = nodeProps;
      if (currentMouseOverDroppableNodeKey !== eventKey) {
        currentMouseOverDroppableNodeKey = eventKey!;
      }

      if (!dragNodeProps || !dragStartMousePosition) {
        resetDragState();
        return;
      }

      const {
        dropPosition: nextDropPosition,
        dropLevelOffset: nextDropLevelOffset,
        dropTargetKey: nextDropTargetKey,
        dropContainerKey: nextDropContainerKey,
        dropTargetPos: nextDropTargetPos,
        dropAllowed: nextDropAllowed,
        dragOverNodeKey: nextDragOverNodeKey,
      } = calcDropPosition(
        event,
        dragNodeProps,
        nodeProps,
        indent.value || 0,
        dragStartMousePosition,
        allowDrop,
        flattenNodes.value as any,
        keyEntities.value,
        expandedKeys.value,
        direction,
      );

      if (dragChildrenKeys.value.includes(nextDropTargetKey) || !nextDropAllowed) {
        resetDragState();
        return;
      }

      Object.keys(delayedDragEnterLogic).forEach((key) => {
        clearTimeout(delayedDragEnterLogic[key]);
      });

      if (dragNodeProps.eventKey !== nodeProps.eventKey) {
        delayedDragEnterLogic[pos!] = window.setTimeout(() => {
          if (draggingNodeKey.value === null) return;

          let newExpandedKeys = [...expandedKeys.value];
          const entity = getEntity(keyEntities.value, nodeProps.eventKey!);
          if (entity && (entity.children || []).length) {
            newExpandedKeys = arrAdd(expandedKeys.value, nodeProps.eventKey!);
          }

          if (expandedKeys === undefined) {
            setExpandedKeys(newExpandedKeys);
          }

          props.onExpand?.(newExpandedKeys, {
            node: convertNodePropsToEventData(nodeProps as any),
            expanded: true,
            nativeEvent: event,
          });
        }, 800);
      }

      if (dragNodeProps.eventKey === nextDropTargetKey && nextDropLevelOffset === 0) {
        resetDragState();
        return;
      }

      dragOverNodeKey.value = nextDragOverNodeKey;
      dropPosition.value = nextDropPosition;
      dropLevelOffset.value = nextDropLevelOffset;
      dropTargetKey.value = nextDropTargetKey;
      dropContainerKey.value = nextDropContainerKey;
      dropTargetPos.value = nextDropTargetPos;
      dropAllowed.value = nextDropAllowed;

      props.onDragEnter?.({
        event,
        node: convertNodePropsToEventData(nodeProps as any),
        expandedKeys: expandedKeys.value,
      });
    };

    const onNodeDragOver = (event: DragEvent, nodeProps: TreeNodeProps<any>) => {
      if (!dragNodeProps || !dragStartMousePosition) return;

      const {
        dropPosition: nextDropPosition,
        dropLevelOffset: nextDropLevelOffset,
        dropTargetKey: nextDropTargetKey,
        dropContainerKey: nextDropContainerKey,
        dropTargetPos: nextDropTargetPos,
        dropAllowed: nextDropAllowed,
        dragOverNodeKey: nextDragOverNodeKey,
      } = calcDropPosition(
        event,
        dragNodeProps,
        nodeProps,
        indent.value || 0,
        dragStartMousePosition,
        allowDrop,
        flattenNodes.value as any,
        keyEntities.value,
        expandedKeys.value,
        direction,
      );

      if (dragChildrenKeys.value.includes(nextDropTargetKey) || !nextDropAllowed) return;

      if (dragNodeProps.eventKey === nextDropTargetKey && nextDropLevelOffset === 0) {
        if (
          !(
            dropPosition.value === null &&
            dropLevelOffset.value === null &&
            dropTargetKey.value === null &&
            dropContainerKey.value === null &&
            dropTargetPos.value === null &&
            dropAllowed.value === false &&
            dragOverNodeKey.value === null
          )
        ) {
          resetDragState();
        }
      } else if (
        !(
          nextDropPosition === dropPosition.value &&
          nextDropLevelOffset === dropLevelOffset.value &&
          nextDropTargetKey === dropTargetKey.value &&
          nextDropContainerKey === dropContainerKey.value &&
          nextDropTargetPos === dropTargetPos.value &&
          nextDropAllowed === dropAllowed.value &&
          nextDragOverNodeKey === dragOverNodeKey.value
        )
      ) {
        dropPosition.value = nextDropPosition;
        dropLevelOffset.value = nextDropLevelOffset;
        dropTargetKey.value = nextDropTargetKey;
        dropContainerKey.value = nextDropContainerKey;
        dropTargetPos.value = nextDropTargetPos;
        dropAllowed.value = nextDropAllowed;
        dragOverNodeKey.value = nextDragOverNodeKey;
      }

      props.onDragOver?.({ event, node: convertNodePropsToEventData(nodeProps as any) });
    };

    const onNodeDragLeave = (event: DragEvent, nodeProps: TreeNodeProps<any>) => {
      const target = event.currentTarget as HTMLElement | null;
      const related = event.relatedTarget as Node | null;

      if (currentMouseOverDroppableNodeKey === nodeProps.eventKey && target && related && !target.contains(related)) {
        resetDragState();
        currentMouseOverDroppableNodeKey = null;
      } else if (currentMouseOverDroppableNodeKey === nodeProps.eventKey && target && !related) {
        resetDragState();
        currentMouseOverDroppableNodeKey = null;
      }

      props.onDragLeave?.({ event, node: convertNodePropsToEventData(nodeProps as any) });
    };

    function onNodeDragEnd(event: DragEvent, nodeProps: TreeNodeProps<any> | null, _outsideTree?: boolean) {
      dragOverNodeKey.value = null;
      cleanDragState();

      if (nodeProps) {
        props.onDragEnd?.({ event, node: convertNodePropsToEventData(nodeProps as any) });
      }

      dragNodeProps = null;
      window.removeEventListener('dragend', onWindowDragEnd);
    }

    const onNodeDrop = (event: DragEvent, _nodeProps: TreeNodeProps<any> | null, outsideTree = false) => {
      const dropAllowedValue = dropAllowed.value;
      const dropPositionValue = dropPosition.value;
      const dropTargetKeyValue = dropTargetKey.value;
      const dropTargetPosValue = dropTargetPos.value;
      const dragChildrenKeysValue = dragChildrenKeys.value;
      const dragNodePropsValue = dragNodeProps;

      if (!dropAllowedValue) return;

      dragOverNodeKey.value = null;
      cleanDragState();

      if (dropTargetKeyValue === null) return;

      const abstractDropNodeProps = {
        ...getTreeNodeProps(dropTargetKeyValue, getTreeNodeRequiredProps.value),
        active: getActiveItem.value?.key === dropTargetKeyValue,
        data: getEntity(keyEntities.value, dropTargetKeyValue)?.node,
      };

      warning(
        !dragChildrenKeysValue.includes(dropTargetKeyValue),
        "Can not drop to dragNode's children node. This is a bug of vc-tree. Please report an issue.",
      );

      const posArr = posToArr(dropTargetPosValue || '0');

      const dropResult: any = {
        event,
        node: convertNodePropsToEventData(abstractDropNodeProps as any),
        dragNode: dragNodePropsValue ? convertNodePropsToEventData(dragNodePropsValue as any) : null,
        dragNodesKeys: dragNodePropsValue ? [dragNodePropsValue.eventKey].concat(dragChildrenKeysValue) : dragChildrenKeysValue,
        dropToGap: dropPositionValue !== 0,
        dropPosition: (dropPositionValue || 0) + Number(posArr[posArr.length - 1]),
      };

      if (!outsideTree) {
        props.onDrop?.(dropResult);
      }

      dragNodeProps = null;
    };

    function onKeyDown(event) {
      if (disabled) return;

      const nodes = flattenNodes.value;
      switch (event.keyCode) {
        case KeyCode.UP:
          offsetActiveKey(-1);
          event.preventDefault();
          break;
        case KeyCode.DOWN:
          offsetActiveKey(1);
          event.preventDefault();
          break;
        case KeyCode.HOME:
          onActiveChange(nodes[0]?.key ?? null);
          event.preventDefault();
          break;
        case KeyCode.END:
          onActiveChange(nodes[nodes.length - 1]?.key ?? null);
          event.preventDefault();
          break;
      }

      const activeItem = getActiveItem.value;
      if (activeItem && activeItem.data) {
        const required = getTreeNodeRequiredProps.value;

        const eventNode = convertNodePropsToEventData({
          ...getTreeNodeProps(activeKey.value!, required),
          data: activeItem.data,
          active: true,
        } as any);

        const entity = getEntity(keyEntities.value, activeKey.value!);
        const hasChildren = !!entity?.children?.length;
        const expandable = !isLeafNode(activeItem.data.isLeaf, loadData, hasChildren, eventNode.loaded);

        const canCheck = checkable && !eventNode.disabled && eventNode.checkable !== false && !eventNode.disableCheckbox;
        const canSelect = !checkable && selectable && !eventNode.disabled && eventNode.selectable !== false;

        switch (event.key) {
          case KeyCode.LEFT:
            if (expandable && expandedKeys.value.includes(activeKey.value!)) {
              onNodeExpand({} as any, eventNode);
            } else if (activeItem.parent) {
              onActiveChange(activeItem.parent.key);
            }
            event.preventDefault();
            break;
          case KeyCode.RIGHT:
            if (expandable && !expandedKeys.value.includes(activeKey.value!)) {
              onNodeExpand({} as any, eventNode);
            } else if (activeItem.children && activeItem.children.length) {
              onActiveChange(activeItem.children[0].key);
            }
            event.preventDefault();
            break;
          case KeyCode.ENTER:
          case KeyCode.SPACE:
            if (canCheck) {
              onNodeCheck({} as any, eventNode, !mergedChecked.value.checkedKeys.includes(activeKey.value!));
            } else if (canSelect) {
              onNodeSelect({} as any, eventNode);
            }
            break;
        }
      }

      props.onKeyDown?.(event);
    }

    const draggableConfig = computed(() => {
      if (!draggable) return undefined;
      if (typeof draggable === 'object') return draggable as DraggableConfig;
      if (typeof draggable === 'function') return { nodeDraggable: draggable };
      return {};
    });

    const contextValue = reactive<any>({
      prefixCls: prefixCls,
      selectable: selectable,
      showIcon: showIcon,
      icon: icon,
      switcherIcon: switcherIcon,
      draggable: draggableConfig.value,
      draggingNodeKey: draggingNodeKey.value,
      checkable: checkable,
      checkStrictly: checkStrictly,
      disabled: disabled,
      keyEntities: keyEntities.value,
      dropLevelOffset: dropLevelOffset.value,
      dropContainerKey: dropContainerKey.value,
      dropTargetKey: dropTargetKey.value,
      dropPosition: dropPosition.value,
      indent: indent.value,
      dropIndicatorRender: (diProps: any) => {
        if (dropIndicatorRender) return dropIndicatorRender?.(diProps);
        return (
          <DropIndicator dropPosition={diProps.dropPosition} dropLevelOffset={diProps.dropLevelOffset} indent={diProps.indent} />
        );
      },
      dragOverNodeKey: dragOverNodeKey.value,
      direction: direction,
      loadData: loadData,
      filterTreeNode: filterTreeNode,
      titleRender: titleRender,
      allowDrop: allowDrop,
      styles: styles,
      classNames: treeClassNames,
      onNodeClick,
      onNodeDoubleClick,
      onNodeExpand,
      onNodeSelect,
      onNodeCheck,
      onNodeLoad,
      onNodeMouseEnter,
      onNodeMouseLeave,
      onNodeContextMenu,
      onNodeDragStart,
      onNodeDragEnter,
      onNodeDragOver,
      onNodeDragLeave,
      onNodeDragEnd,
      onNodeDrop,
    });

    watchEffect(() => {
      contextValue.prefixCls = prefixCls;
      contextValue.selectable = selectable;
      contextValue.showIcon = showIcon;
      contextValue.icon = icon;
      contextValue.switcherIcon = switcherIcon;
      contextValue.draggable = draggableConfig.value;
      contextValue.draggingNodeKey = draggingNodeKey.value;
      contextValue.checkable = checkable;
      contextValue.checkStrictly = checkStrictly;
      contextValue.disabled = disabled;
      contextValue.keyEntities = keyEntities.value;
      contextValue.dropLevelOffset = dropLevelOffset.value;
      contextValue.dropContainerKey = dropContainerKey.value;
      contextValue.dropTargetKey = dropTargetKey.value;
      contextValue.dropPosition = dropPosition.value;
      contextValue.indent = indent.value;
      contextValue.dragOverNodeKey = dragOverNodeKey.value;
      contextValue.direction = direction;
      contextValue.loadData = loadData;
      contextValue.filterTreeNode = filterTreeNode;
      contextValue.titleRender = titleRender;
      contextValue.styles = styles;
      contextValue.classNames = treeClassNames;
      contextValue.allowDrop = allowDrop;
    });

    const vm = getCurrentInstance();
    function changeRef(el) {
      listRef.value = el;
      vm.exposeProxy = el || {};
      vm.exposed = el || {};
    }
    return () => {
      const domProps = pickAttrs(props, { aria: true, data: true });
      return (
        <TreeContextProvider value={contextValue}>
          <div
            class={clsx(prefixCls, className, rootClassName, {
              [`${prefixCls}-show-line`]: showLine,
            })}
            style={rootStyle}
          >
            <NodeList
              ref={changeRef}
              prefixCls={prefixCls}
              style={style}
              data={flattenNodes.value}
              disabled={disabled}
              selectable={selectable}
              checkable={!!checkable}
              motion={motion}
              dragging={draggingNodeKey !== null}
              height={height}
              itemHeight={itemHeight}
              virtual={virtual}
              focusable={focusable}
              tabIndex={tabIndex}
              activeItem={getActiveItem.value}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyDown={onKeyDown}
              onActiveChange={onActiveChange}
              onListChangeStart={onListChangeStart}
              onListChangeEnd={onListChangeEnd}
              onContextmenu={onContextMenu}
              onScroll={onScroll}
              scrollWidth={scrollWidth}
              {...getTreeNodeRequiredProps.value}
              {...domProps}
            />
          </div>
        </TreeContextProvider>
      );
    };
  },
  { inheritAttrs: false },
);

export default Tree;
