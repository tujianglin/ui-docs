import { shallowRef, watch, type Ref } from 'vue';
import KeyCode from '../../../util/src/KeyCode';
import raf from '../../../util/src/raf';

const { ESC, TAB } = KeyCode;

interface UseAccessibilityProps {
  visible: Ref<boolean>;
  triggerRef: Ref<any>;
  onVisibleChange?: (visible: boolean) => void;
  autofocus?: Ref<boolean>;
  overlayRef?: Ref<any>;
}

export default function useAccessibility({ visible, triggerRef, onVisibleChange, autofocus, overlayRef }: UseAccessibilityProps) {
  const focusMenuRef = shallowRef<boolean>(false);

  const handleCloseMenuAndReturnFocus = () => {
    if (visible.value) {
      triggerRef.value?.focus?.();
      onVisibleChange?.(false);
    }
  };

  const focusMenu = () => {
    if (overlayRef.value?.focus) {
      overlayRef.value.focus();
      focusMenuRef.value = true;
      return true;
    }
    return false;
  };

  const handleKeyDown = (event) => {
    switch (event.keyCode) {
      case ESC:
        handleCloseMenuAndReturnFocus();
        break;
      case TAB: {
        let focusResult: boolean = false;
        if (!focusMenuRef.value) {
          focusResult = focusMenu();
        }

        if (focusResult) {
          event.preventDefault();
        } else {
          handleCloseMenuAndReturnFocus();
        }
        break;
      }
    }
  };

  watch(
    visible,
    (_n, _o, onCleanup) => {
      if (visible.value) {
        window.addEventListener('keydown', handleKeyDown);
        if (autofocus.value) {
          // FIXME: hack with raf
          raf(focusMenu, 3);
        }
        onCleanup(() => {
          window.removeEventListener('keydown', handleKeyDown);
          focusMenuRef.value = false;
        });
      }
      onCleanup(() => {
        focusMenuRef.value = false;
      });
    },
    { immediate: true },
  ); // eslint-disable-line react-hooks/exhaustive-deps
}
