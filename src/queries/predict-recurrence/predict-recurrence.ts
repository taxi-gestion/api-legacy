import { TaskEither } from 'fp-ts/TaskEither';
import { Errors } from '../../reporter/http-reporter';
import { PredictedRecurrence, PredictRecurrence } from '../../definitions';

export type PredictRecurrenceAdapter = (predict: PredictRecurrence) => TaskEither<Errors, PredictedRecurrence>;

export const predictRecurrence =
  (serviceCall: PredictRecurrenceAdapter) =>
  (predict: PredictRecurrence): TaskEither<Errors, PredictedRecurrence> =>
    serviceCall(predict);
