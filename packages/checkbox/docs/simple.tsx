/* eslint no-console:0, jsx-a11y/label-has-for: 0, jsx-a11y/label-has-associated-control: 0 */
import Checkbox from '@vc-com/checkbox';
import './assets/index.less';

import type { CheckboxProps } from '@vc-com/checkbox';
import { defineComponent, ref } from 'vue';

const onChange = (e: any) => {
  console.log('Checkbox checked:', e.target.checked);
};

const onKeydown: CheckboxProps['onKeydown'] = (e) => {
  console.log('Checkbox key down:', e.key);
};

const onKeypress: CheckboxProps['onKeypress'] = (e) => {
  console.log('Checkbox key press:', e.key);
};

const onKeyup: CheckboxProps['onKeyup'] = (e) => {
  console.log('Checkbox key up:', e.key);
};

export default defineComponent(() => {
  const disabled = ref(false);

  const toggle = () => {
    disabled.value = !disabled.value;
  };

  return () => (
    <div style={{ margin: '20px' }}>
      <div>
        <p>
          <label>
            <Checkbox checked onChange={onChange} disabled={disabled.value} />
            &nbsp; controlled checked rc-checkbox
          </label>
          &nbsp;&nbsp;
        </p>
        <p>
          <label>
            <input checked type="checkbox" onChange={onChange} disabled={disabled.value} />
            &nbsp; controlled checked native
          </label>
          &nbsp;&nbsp;
        </p>
      </div>

      <div>
        <p>
          <label>
            <Checkbox checked={true} onChange={onChange} disabled={disabled.value} />
            &nbsp; defaultChecked rc-checkbox
          </label>
          &nbsp;&nbsp;
        </p>
        <p>
          <label>
            <input type="checkbox" onChange={onChange} disabled={disabled.value} />
            &nbsp; defaultChecked native
          </label>
          &nbsp;&nbsp;
        </p>
      </div>

      <div>
        <p>
          <label>
            <Checkbox name="my-checkbox" checked={true} onChange={onChange} disabled={disabled.value} />
            &nbsp; defaultChecked rc-checkbox with name
          </label>
          &nbsp;&nbsp;
        </p>
        <p>
          <label>
            <input name="my-checkbox" type="checkbox" onChange={onChange} disabled={disabled.value} />
            &nbsp; defaultChecked native with name
          </label>
          &nbsp;&nbsp;
        </p>
      </div>

      <div>
        <p>
          <label>
            <Checkbox
              onChange={onChange}
              onKeydown={onKeydown}
              onKeypress={onKeypress}
              onKeyup={onKeyup}
              disabled={disabled.value}
            />
            &nbsp; rc-checkbox with key events
          </label>
          &nbsp;&nbsp;
        </p>
        <p>
          <label>
            <input
              type="checkbox"
              onChange={onChange}
              onKeydown={onKeydown}
              onKeypress={onKeypress}
              onKeyup={onKeyup}
              disabled={disabled.value}
            />
            &nbsp; native checkbox with key events
          </label>
          &nbsp;&nbsp;
        </p>
      </div>

      <button type="button" onClick={toggle}>
        toggle disabled
      </button>
    </div>
  );
});
