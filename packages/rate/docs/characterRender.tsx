/* eslint no-console: 0 */
import Rate from '@vc-com/rate';
import Tooltip from '@vc-com/tooltip';
import { defineComponent } from 'vue';
import '../../tooltip/docs/assets/bootstrap.less';
import './assets/index.less';

export default defineComponent(() => {
  return () => (
    <div style={{ margin: '100px' }}>
      <Rate
        defaultValue={3}
        characterRender={(node, props) => (
          <Tooltip placement="top" overlay={props.index}>
            {node}
          </Tooltip>
        )}
      />
    </div>
  );
});
