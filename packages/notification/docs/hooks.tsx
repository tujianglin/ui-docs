/* eslint-disable no-console */
import { defineComponent } from 'vue';
import { useNotification } from '../src';
import './assets/index.less';
import motion from './motion';

export default defineComponent(() => {
  const [notice, ContextHolder] = useNotification({ motion, closable: true });

  return () => (
    <>
      <div>
        <div>
          {/* Default */}
          <button
            onClick={() => {
              notice.open({
                content: `${new Date().toISOString()}`,
              });
            }}
          >
            Basic
          </button>

          {/* Not Close */}
          <button
            onClick={() => {
              notice.open({
                content: `${Array(Math.round(Math.random() * 5) + 1)
                  .fill(1)
                  .map(() => new Date().toISOString())
                  .join('\n')}`,
                duration: null,
              });
            }}
          >
            Not Auto Close
          </button>

          {/* Not Close */}
          <button
            onClick={() => {
              notice.open({
                content: `${Array(5)
                  .fill(1)
                  .map(() => new Date().toISOString())
                  .join('\n')}`,
                duration: null,
              });
            }}
          >
            Not Auto Close
          </button>
        </div>

        <div>
          {/* No Closable */}
          <button
            onClick={() => {
              notice.open({
                content: `No Close! ${new Date().toISOString()}`,
                duration: null,
                closable: false,
                key: 'No Close',
                onClose: () => {
                  console.log('Close!!!');
                },
              });
            }}
          >
            No Closable
          </button>

          {/* Force Close */}
          <button
            onClick={() => {
              notice.close('No Close');
            }}
          >
            Force Close No Closable
          </button>
        </div>
      </div>

      <div>
        {/* Destroy All */}
        <button
          onClick={() => {
            notice.destroy();
          }}
        >
          Destroy All
        </button>
      </div>

      <ContextHolder></ContextHolder>
    </>
  );
});
