import { defineComponent } from 'vue';
import type { InputHTMLAttributes } from 'vue-jsx-vapor';

const CustomizeInput = defineComponent(({ value, ...props }: InputHTMLAttributes<HTMLInputElement>) => {
  return () => (
    <div style={{ padding: '10px' }}>
      <input style={{ outline: 'none' }} value={value} {...props} />
    </div>
  );
});

export default CustomizeInput;
