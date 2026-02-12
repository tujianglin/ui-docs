import { defineComponent, getCurrentInstance } from 'vue';

const Transform = defineComponent(
  ({ x, y }: { x: number; y: number }) => {
    const vm = getCurrentInstance();
    const changeRef = (el) => {
      vm.exposed = el || {};
      vm.exposeProxy = el || {};
    };
    return () => (
      <div
        ref={changeRef}
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          zIndex: 1,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <slot></slot>
      </div>
    );
  },
  { inheritAttrs: false },
);

export default Transform;
