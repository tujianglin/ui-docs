import Form, { Field } from '@vc-com/form';
import { defineComponent } from 'vue';
import Input from './components/Input';

export default defineComponent(() => {
  let x = 0;
  return () => {
    console.log(1);
    return (
      <Form>
        <Field dependencies={['field_1']}>
          {() => {
            x += 1;
            console.log(22);
            return `gogogo${x}`;
          }}
        </Field>
        <Field name="field_1">
          <Input />
        </Field>
        <Field name="field_2">
          <Input />
        </Field>
      </Form>
    );
  };
});
