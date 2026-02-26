import CSSMotion from '@vc-com/motion';
import { clsx } from 'clsx';
import { computed, defineComponent, getCurrentInstance, nextTick, ref, shallowRef, watch } from 'vue';
import { useRef } from 'vue-jsx-vapor';
import { useTreeContextInject } from './contextTypes';
import type { FlattenNode, TreeNodeProps } from './interface';
import TreeNode from './TreeNode';
import useUnmount from './useUnmount';
import { getTreeNodeProps, type TreeNodeRequiredProps } from './utils/treeUtil';

interface MotionTreeNodeProps extends Omit<TreeNodeProps, 'domRef'> {
  active: boolean;
  motion?: any;
  motionNodes?: FlattenNode[];
  onMotionStart: () => void;
  onMotionEnd: () => void;
  motionType?: 'show' | 'hide';

  treeNodeRequiredProps: TreeNodeRequiredProps;
}

const MotionTreeNode = defineComponent(
  ({
    class: className,
    style,
    motion,
    motionNodes,
    motionType,
    onMotionStart: onOriginMotionStart,
    onMotionEnd: onOriginMotionEnd,
    active,
    treeNodeRequiredProps,
    ...props
  }: MotionTreeNodeProps) => {
    const visible = ref(true);
    const { prefixCls } = $(useTreeContextInject());

    // Calculate target visible here.
    // And apply in effect to make `leave` motion work.
    const targetVisible = computed(() => motionNodes && motionType !== 'hide');

    watch(
      () => motionNodes,
      async () => {
        await nextTick();
        if (motionNodes) {
          if (targetVisible.value !== visible.value) {
            visible.value = targetVisible.value;
          }
        }
      },
      { immediate: true, deep: true, flush: 'post' },
    );

    const triggerMotionStart = () => {
      if (motionNodes) {
        onOriginMotionStart?.();
      }
    };

    // Should only trigger once
    const triggerMotionEndRef = shallowRef(false);
    const triggerMotionEnd = () => {
      if (motionNodes && !triggerMotionEndRef.value) {
        triggerMotionEndRef.value = true;
        onOriginMotionEnd?.();
      }
    };

    // Effect if unmount
    useUnmount(triggerMotionStart, triggerMotionEnd);

    // Motion end event
    const onVisibleChanged = (nextVisible: boolean) => {
      if (targetVisible.value === nextVisible) {
        triggerMotionEnd();
      }
    };

    const vm = getCurrentInstance();

    const changeRef = (el) => {
      vm.exposed = el || {};
      vm.exposeProxy = el || {};
    };
    const domRef = useRef();

    return () => (
      <>
        <CSSMotion
          v-if={motionNodes}
          ref={changeRef}
          visible={visible.value}
          {...motion}
          motionAppear={motionType === 'show'}
          onVisibleChanged={onVisibleChanged}
        >
          {({ class: motionClassName, style: motionStyle, ref: motionRef }) => {
            return (
              <div ref={motionRef} class={clsx(`${prefixCls}-treenode-motion`, motionClassName)} style={motionStyle}>
                {motionNodes.map((treeNode) => {
                  const {
                    data: { ...restProps },
                    title,
                    key,
                    isStart,
                    isEnd,
                  } = treeNode;
                  delete restProps.children;

                  const treeNodeProps = getTreeNodeProps(key, treeNodeRequiredProps);

                  return (
                    <TreeNode
                      {...(restProps as Omit<typeof restProps, 'children'>)}
                      {...treeNodeProps}
                      title={title}
                      active={active}
                      data={treeNode.data}
                      key={key}
                      isStart={isStart}
                      isEnd={isEnd}
                    />
                  );
                })}
              </div>
            );
          }}
        </CSSMotion>
        <TreeNode v-else domRef={domRef} class={className} style={style} {...props} active={active} />
      </>
    );
  },
  { inheritAttrs: false, name: process.env.NODE_ENV === 'production' ? 'MotionTreeNode' : undefined },
);

export default MotionTreeNode;
