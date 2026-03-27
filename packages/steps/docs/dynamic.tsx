import Steps from '@vc-com/steps';
import { defineComponent, ref } from 'vue';
import './assets/iconfont.less';
import './assets/index.less';

export default defineComponent(() => {
  const items = ref([
    {
      title: '已完成',
      description: '这里是多信息的描述啊描述啊描述啊描述啊哦耶哦耶哦耶哦耶哦耶哦耶哦耶哦耶哦耶哦耶哦耶哦耶',
    },
    {
      title: '进行中',
      description: '这里是多信息的描述啊描述啊描述啊描述啊哦耶哦耶哦耶哦耶哦耶哦耶哦耶哦耶哦耶哦耶哦耶哦耶',
    },
    {
      title: '待运行',
      description: '这里是多信息的描述啊描述啊描述啊描述啊哦耶哦耶哦耶哦耶哦耶哦耶哦耶哦耶哦耶哦耶哦耶哦耶',
    },
    {
      title: '待运行',
      description: '这里是多信息的描述啊描述啊描述啊描述啊哦耶哦耶哦耶哦耶哦耶哦耶哦耶哦耶哦耶哦耶哦耶哦耶',
    },
  ]);

  const addStep = () => {
    const newSteps = [...items.value];
    newSteps.push({
      title: '待运行',
      description: '新的节点',
    });
    items.value = newSteps;
  };
  return () => (
    <div>
      <button type="button" onClick={addStep}>
        Add new step
      </button>
      <Steps items={items.value} />
    </div>
  );
});
