import Steps from '@vc-com/steps';
import './assets/iconfont.less';
import './assets/index.less';

const content = '这里是多信息的描述啊这里是多信息的描述啊这里是多信息的描述啊这里是多信息的描述啊这里是多信息的描述啊';

export default () => (
  <Steps
    titlePlacement="vertical"
    current={1}
    items={[
      {
        title: '已完成',
        content,
        status: 'wait',
      },
      {
        title: '进行中',
        content,
        status: 'wait',
        subTitle: '剩余 00:00:07',
      },
      undefined,
      {
        title: '待运行',
        content,
        status: 'process',
      },
      undefined,
      {
        title: '待运行',
        content,
        status: 'finish',
        disabled: true,
      },
      null,
    ]}
  />
);
