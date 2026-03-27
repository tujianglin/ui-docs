import raf from '@vc-com/util/lib/raf';
import { macroTask } from '../hooks/useNotifyWatch';

export default async function delayFrame() {
  return new Promise<void>((resolve) => {
    macroTask(() => {
      raf(() => {
        resolve();
      });
    });
  });
}
