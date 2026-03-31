/* eslint-disable react/prop-types */

import Form, { FormProvider } from '@vc-com/form';
import { defineComponent, type CSSProperties } from 'vue';
import type { ValidateMessages } from '../src/interface';
import Input from './components/Input';
import LabelField from './components/LabelField';

const myMessages: ValidateMessages = {
  required: '${name} 是必需品',
};

const formStyle: CSSProperties = {
  padding: '10px 15px',
  flex: 'auto',
};

const Form1 = defineComponent(() => {
  const [form] = Form.useForm();

  return () => (
    <Form form={form} style={{ ...formStyle, border: '1px solid #000' }} name="first">
      <h4>Form 1</h4>
      <p>Change me!</p>
      <LabelField name="username" rules={[{ required: true }]}>
        <Input placeholder="username" />
      </LabelField>
      <LabelField name="password" rules={[{ required: true }]}>
        <Input placeholder="password" />
      </LabelField>

      <button type="submit">Submit</button>
    </Form>
  );
});

const Form2 = defineComponent(() => {
  const [form] = Form.useForm();

  return () => (
    <Form form={form} style={{ ...formStyle, border: '1px solid #F00' }} name="second">
      <h4>Form 2</h4>
      <p>Will follow Form 1 but sync back only when submit</p>
      <LabelField name="username" rules={[{ required: true }]}>
        <Input placeholder="username" />
      </LabelField>
      <LabelField name="password" rules={[{ required: true }]}>
        <Input placeholder="password" />
      </LabelField>

      <button type="submit">Submit</button>
    </Form>
  );
});

const Demo = defineComponent(() => {
  return () => (
    <div>
      <h3>Form Context</h3>
      <p>Support global `validateMessages` config and communication between forms.</p>
      <FormProvider
        validateMessages={myMessages}
        onFormChange={(name, { changedFields, forms }) => {
          console.log('change from:', name, changedFields, forms);
          if (name === 'first') {
            forms.second.setFields(changedFields);
          }
        }}
        onFormFinish={(name, { values, forms }) => {
          console.log('finish from:', name, values, forms);
          if (name === 'second') {
            forms.first.setFieldsValue(values);
          }
        }}
      >
        <div style={{ display: 'flex', width: '100%' }}>
          <Form1 />
          <Form2 />
        </div>
      </FormProvider>
    </div>
  );
});

export default Demo;
