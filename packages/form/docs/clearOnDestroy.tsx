import Form, { Field } from '@vc-com/form';
import { defineComponent, ref } from 'vue';
import Input from './components/Input';

export default defineComponent(() => {
  const load = ref(false);
  const count = ref(0);

  const [form] = Form.useForm(undefined);

  return () => (
    <>
      <button
        onClick={() => {
          count.value++;
          load.value = !load.value;
        }}
      >
        load
      </button>

      <button
        onClick={() => {
          console.log(form.getFieldsValue(true));
        }}
      >
        values
      </button>
      {load.value && (
        <Form form={form} initialValues={{ count: count.value }} clearOnDestroy>
          <Field name="count">
            <Input placeholder="count" />
          </Field>
          <button type="submit">Submit</button>
        </Form>
      )}
    </>
  );
});
