import type { CSSMotionProps } from '@vc-com/motion';
import { CSSMotionList } from '@vc-com/motion';
import type { Key } from '@vc-com/util/lib/types';
import { clsx } from 'clsx';
import { computed, defineComponent, nextTick, ref, shallowRef, watch, type CSSProperties } from 'vue';
import useStack from './hooks/useStack';
import type { InnerOpenConfig, NoticeConfig, OpenConfig, Placement, StackConfig } from './interface';
import Notice from './Notice';
import { useNotificationContextInject } from './NotificationProvider';

export interface NoticeListProps {
  configList?: OpenConfig[];
  placement?: Placement;
  prefixCls?: string;
  motion?: CSSMotionProps | ((placement: Placement) => CSSMotionProps);
  stack?: StackConfig;

  // Events
  onAllNoticeRemoved?: (placement: Placement) => void;
  onNoticeClose?: (key: Key) => void;

  // Common
  class?: string;
  style?: CSSProperties;
}

const NoticeList = defineComponent(
  ({
    configList,
    placement,
    prefixCls,
    class: className,
    style,
    motion,
    onAllNoticeRemoved,
    onNoticeClose,
    stack: stackConfig,
  }: NoticeListProps) => {
    const { classNames: ctxCls } = $(useNotificationContextInject());

    const dictRef = shallowRef<Record<string, HTMLDivElement>>({});
    const latestNotice = ref<HTMLDivElement>(null);
    const hoverKeys = ref<string[]>([]);

    const keys = computed(() =>
      configList.map((config) => ({
        config,
        key: String(config.key),
      })),
    );

    const [stack, resConfig] = useStack(stackConfig);

    const expanded = computed(
      () => stack.value && (hoverKeys.value.length > 0 || keys.value.length <= resConfig.value?.threshold),
    );

    const placementMotion = computed(() => (typeof motion === 'function' ? motion(placement) : motion));

    // Clean hover key
    watch(
      [hoverKeys, keys, stack],
      () => {
        if (stack.value && hoverKeys.value.length > 1) {
          hoverKeys.value = hoverKeys.value.filter((key) => keys.value.some(({ key: dataKey }) => key === dataKey));
        }
      },
      { immediate: true, deep: true },
    );

    // Force update latest notice
    watch(
      [keys, stack],
      async () => {
        await nextTick();
        if (stack.value && dictRef.value[keys.value[keys.value.length - 1]?.key]) {
          latestNotice.value = dictRef.value[keys.value[keys.value.length - 1]?.key];
        }
      },
      { immediate: true, deep: true },
    );

    return () => (
      <CSSMotionList
        key={placement}
        class={clsx(prefixCls, `${prefixCls}-${placement}`, ctxCls?.list, className, {
          [`${prefixCls}-stack`]: !!stack.value,
          [`${prefixCls}-stack-expanded`]: expanded.value,
        })}
        component="div"
        style={style}
        keys={keys.value}
        motionAppear
        {...placementMotion.value}
        onAllRemoved={() => {
          onAllNoticeRemoved(placement);
        }}
      >
        {({ config, class: motionClassName, style: motionStyle, index: motionIndex, ref: nodeRef }) => {
          const { key, times } = config as InnerOpenConfig;
          const strKey = String(key);
          const {
            class: configClassName,
            style: configStyle,
            classNames: configClassNames,
            styles: configStyles,
            ...restConfig
          } = config as NoticeConfig;
          const dataIndex = keys.value.findIndex((item) => item.key === strKey);

          // If dataIndex is -1, that means this notice has been removed in data, but still in dom
          // Should minus (motionIndex - 1) to get the correct index because keys.length is not the same as dom length
          const stackStyle: CSSProperties = {};
          if (stack.value) {
            const index = keys.value.length - 1 - (dataIndex > -1 ? dataIndex : motionIndex - 1);
            const transformX = placement === 'top' || placement === 'bottom' ? '-50%' : '0';
            if (index > 0) {
              const height = expanded.value ? dictRef.value[strKey]?.offsetHeight : latestNotice.value?.offsetHeight;
              stackStyle.height = `${height}px`;

              // Transform
              let verticalOffset = 0;
              for (let i = 0; i < index; i++) {
                verticalOffset += dictRef.value[keys.value[keys.value.length - 1 - i].key]?.offsetHeight + resConfig.value?.gap;
              }

              const transformY =
                (expanded.value ? verticalOffset : index * resConfig.value?.offset) * (placement.startsWith('top') ? 1 : -1);
              const scaleX =
                !expanded.value && latestNotice.value?.offsetWidth && dictRef.value[strKey]?.offsetWidth
                  ? (latestNotice.value?.offsetWidth - resConfig.value?.offset * 2 * (index < 3 ? index : 3)) /
                    dictRef.value[strKey]?.offsetWidth
                  : 1;
              stackStyle.transform = `translate3d(${transformX}, ${transformY}px, 0) scaleX(${scaleX})`;
            } else {
              stackStyle.transform = `translate3d(${transformX}, 0, 0)`;
            }
          }

          return (
            <div
              ref={nodeRef}
              class={clsx(`${prefixCls}-notice-wrapper`, motionClassName, configClassNames?.wrapper)}
              style={{
                ...motionStyle,
                ...stackStyle,
                ...configStyles?.wrapper,
              }}
              onMouseenter={() =>
                (hoverKeys.value = hoverKeys.value.includes(config.key) ? hoverKeys.value : [...hoverKeys.value, config.key])
              }
              onMouseleave={() => (hoverKeys.value = hoverKeys.value.filter((k) => k !== config.key))}
            >
              <Notice
                {...restConfig}
                ref={(node: any) => {
                  if (dataIndex > -1) {
                    dictRef.value[strKey] = node;
                  } else {
                    delete dictRef.value[strKey];
                  }
                }}
                prefixCls={prefixCls}
                classNames={configClassNames}
                styles={configStyles}
                class={clsx(configClassName, ctxCls?.notice)}
                style={configStyle}
                times={times}
                key={key}
                eventKey={key}
                onNoticeClose={onNoticeClose}
                hovering={stack.value && hoverKeys.value.length > 0}
              />
            </div>
          );
        }}
      </CSSMotionList>
    );
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'NoticeList' : undefined },
);

export default NoticeList;
