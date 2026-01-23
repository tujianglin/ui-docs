import Portal from '@vc-com/portal';
import { resolveToElement } from '@vc-com/util/lib/vnode';
import { clsx } from 'clsx';
import { computed, shallowRef, watch } from 'vue';
import {
  TriggerContextProvider,
  UniqueContextProvider,
  useTriggerContextInject,
  type TriggerContextProps,
  type UniqueContextProps,
  type UniqueShowOptions,
} from '../context';
import useAlign from '../hooks/useAlign';
import useDelay from '../hooks/useDelay';
import Popup from '../Popup';
import { getAlignPopupClassName } from '../util';
import UniqueContainer from './UniqueContainer';
import useTargetState from './useTargetState';

export interface UniqueProviderProps {
  /** Additional handle options data to do the customize info */
  postTriggerProps?: (options: UniqueShowOptions) => UniqueShowOptions;
}

const UniqueProvider = ({ postTriggerProps }: UniqueProviderProps) => {
  const [trigger, open, options, onTargetVisibleChanged] = useTargetState();

  // ========================== Options ===========================
  const mergedOptions = computed(() => {
    if (!options.value || !postTriggerProps) {
      return options.value;
    }

    return postTriggerProps(options.value);
  });

  // =========================== Popup ============================
  const popupEle = shallowRef<HTMLDivElement>(null);
  const popupSize = shallowRef<{
    width: number;
    height: number;
  }>(null);

  // Used for forwardRef popup. Not use internal
  const externalPopupRef = shallowRef<HTMLDivElement>(null);

  const setPopupRef = (node: any) => {
    const element = resolveToElement(node) as HTMLDivElement | null;
    if (!element) {
      return;
    }
    externalPopupRef.value = element;

    if (popupEle.value !== element) {
      popupEle.value = element;
    }
  };

  // ========================== Register ==========================
  // Store the isOpen function from the latest show call
  const isOpenRef = shallowRef<(() => boolean) | null>(null);

  const delayInvoke = useDelay();

  const show = (showOptions: UniqueShowOptions, isOpen: () => boolean) => {
    // Store the isOpen function for later use in hide
    isOpenRef.value = isOpen;

    delayInvoke(() => {
      trigger(showOptions);
    }, showOptions.delay);
  };

  const hide = (delay: number) => {
    delayInvoke(() => {
      // Check if we should still hide by calling the isOpen function
      // If isOpen returns true, it means another trigger wants to keep it open
      if (isOpenRef.value?.()) {
        return; // Don't hide if something else wants it open
      }

      trigger(false);
      // Don't clear target, currentNode, options immediately, wait until animation completes
    }, delay);
  };

  // Callback after animation completes
  const onVisibleChanged = (visible: boolean) => {
    // Call useTargetState callback to handle animation state
    onTargetVisibleChanged(visible);
  };

  // =========================== Align ============================
  const [
    ready,
    offsetX,
    offsetY,
    offsetR,
    offsetB,
    arrowX,
    arrowY, // scaleX - not used in UniqueProvider
    // scaleY - not used in UniqueProvider
    ,
    ,
    alignInfo,
    onAlign,
  ] = useAlign(
    open,
    popupEle,
    computed(() => mergedOptions?.value?.target),
    computed(() => mergedOptions?.value?.popupPlacement),
    computed(() => mergedOptions?.value?.builtinPlacements || {}),
    computed(() => mergedOptions?.value?.popupAlign),
    undefined, // onPopupAlign
    computed(() => false), // isMobile
  );

  const alignedClassName = computed(() => {
    if (!mergedOptions.value) {
      return '';
    }

    const baseClassName = getAlignPopupClassName(
      mergedOptions.value?.builtinPlacements || {},
      mergedOptions.value?.prefixCls || '',
      alignInfo.value,
      false, // alignPoint is false for UniqueProvider
    );

    return clsx(baseClassName, mergedOptions.value?.getPopupClassNameFromAlign?.(alignInfo.value));
  });

  const contextValue = computed<UniqueContextProps>(() => ({
    show,
    hide,
  }));

  // =========================== Align ============================
  watch(
    () => mergedOptions?.value?.target,
    () => {
      onAlign();
    },
    { immediate: true, deep: true },
  );

  // =========================== Motion ===========================
  const onPrepare = () => {
    onAlign();

    return Promise.resolve();
  };

  // ======================== Trigger Context =====================
  const subPopupElements = shallowRef<Record<string, HTMLElement>>({});
  const parentContext = useTriggerContextInject();

  const triggerContextValue = computed<TriggerContextProps>(() => ({
    registerSubPopup: (id, subPopupEle) => {
      subPopupElements.value[id] = subPopupEle;
      parentContext?.registerSubPopup(id, subPopupEle);
    },
  }));

  // =========================== Render ===========================
  const prefixCls = computed(() => mergedOptions.value?.prefixCls);
  const slots = defineSlots();
  return (
    <UniqueContextProvider value={contextValue.value}>
      <slots.default></slots.default>
      {mergedOptions && (
        <TriggerContextProvider value={triggerContextValue.value}>
          <Popup
            ref={setPopupRef}
            portal={Portal}
            onEsc={mergedOptions.value?.onEsc}
            prefixCls={prefixCls.value}
            popup={mergedOptions.value?.popup}
            class={clsx(mergedOptions.value?.popupClassName, alignedClassName.value, `${prefixCls.value}-unique-controlled`)}
            style={mergedOptions.value?.popupStyle}
            target={mergedOptions.value?.target}
            open={open.value}
            keepDom={true}
            fresh={true}
            autoDestroy={false}
            onVisibleChanged={onVisibleChanged}
            ready={ready.value}
            offsetX={offsetX.value}
            offsetY={offsetY.value}
            offsetR={offsetR.value}
            offsetB={offsetB.value}
            onAlign={onAlign}
            onPrepare={onPrepare}
            onResize={(size) =>
              (popupSize.value = {
                width: size.offsetWidth,
                height: size.offsetHeight,
              })
            }
            arrowPos={{
              x: arrowX.value,
              y: arrowY.value,
            }}
            align={alignInfo.value}
            zIndex={mergedOptions.value?.zIndex}
            mask={mergedOptions.value?.mask}
            arrow={mergedOptions.value?.arrow}
            motion={mergedOptions.value?.popupMotion}
            maskMotion={mergedOptions.value?.maskMotion}
            getPopupContainer={mergedOptions.value?.getPopupContainer}
          >
            <UniqueContainer
              prefixCls={prefixCls.value}
              isMobile={false}
              ready={ready.value}
              open={open.value}
              align={alignInfo.value}
              offsetR={offsetR.value}
              offsetB={offsetB.value}
              offsetX={offsetX.value}
              offsetY={offsetY.value}
              arrowPos={{
                x: arrowX.value,
                y: arrowY.value,
              }}
              popupSize={popupSize.value}
              motion={mergedOptions.value?.popupMotion}
              uniqueContainerClassName={clsx(mergedOptions.value?.uniqueContainerClassName, alignedClassName.value)}
              uniqueContainerStyle={mergedOptions.value?.uniqueContainerStyle}
            />
          </Popup>
        </TriggerContextProvider>
      )}
    </UniqueContextProvider>
  );
};

export default UniqueProvider;
