export const PHOTO_REWARD=30;
export const photoReward=task=>Number.isInteger(task?.reward)&&task.reward>=20&&task.reward<=90?task.reward:PHOTO_REWARD;
