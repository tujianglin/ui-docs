import { createVNode, defineComponent } from 'vue';
import { filterEmpty } from '../../../util/src/props-util';
import Form from '../../src';
import type { FieldProps } from '../../src/Field';

const { Field } = Form;

interface ErrorProps {
  warning?: boolean;
}

const Error = defineComponent(({ warning }: ErrorProps) => {
  const slots = defineSlots();
  return () => {
    const children = filterEmpty(slots.default?.());
    return (
      <ul style={{ color: warning ? 'orange' : 'red' }}>
        {children.map((error, index: number) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
    );
  };
});

const FieldState = defineComponent(({ touched, validating }: { touched: boolean; validating: boolean }) => {
  return () => (
    <div
      style={{
        color: 'green',
        position: 'absolute',
        marginTop: '-35px',
        left: '300px',
      }}
    >
      {touched ? <span>Touched!</span> : null}
      {validating ? <span>Validating!</span> : null}
    </div>
  );
});

interface LabelFieldProps extends FieldProps {
  label?: any;
}

const LabelField = defineComponent(({ name, label, ...restProps }: LabelFieldProps) => {
  const slots = defineSlots();
  return () => {
    const children = filterEmpty(slots.default?.());
    return (
      <Field name={name} {...restProps}>
        {(control, meta, form) => {
          const childNode =
            typeof children === 'function'
              ? children(control, meta, form)
              : createVNode(children, {
                  ...control,
                });

          return (
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ flex: 'none', width: 100 }}>{label || name}</label>

                {childNode}
              </div>

              <FieldState {...meta} />
              <Error>{meta.errors}</Error>
              <Error warning>{meta.warnings}</Error>
            </div>
          );
        }}
      </Field>
    );
  };
});

export default LabelField;
