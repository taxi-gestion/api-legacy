import { TaskEither } from 'fp-ts/TaskEither';
import { Errors } from '../../reporter/HttpReporter';
import { PredictedRecurrence, PredictRecurrence, PredictRecurrenceAdapter } from '../../definitions';

export const predictRecurrence =
  (serviceCall: PredictRecurrenceAdapter) =>
  (predict: PredictRecurrence): TaskEither<Errors, PredictedRecurrence> =>
    serviceCall(predict);
