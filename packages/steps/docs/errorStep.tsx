import Steps from '@vc-com/steps';
import './assets/iconfont.less';
import './assets/index.less';

const content = '这里是多信息的描述啊这里是多信息的描述啊这里是多信息的描述啊这里是多信息的描述啊这里是多信息的描述啊';

export default () => (
  <Steps
    current={2}
    status="error"
    items={[
      {
        title: '已完成',
        content,
      },
      {
        title: '进行中',
        content,
      },
      {
        title: '待运行',
        content,
      },
      {
        title: '待运行',
        content,
      },
    ]}
  />
);
