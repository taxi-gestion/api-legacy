import { TaskEither } from 'fp-ts/TaskEither';
import { Errors } from '../reporter/HttpReporter';

export type PredictRecurrence = {
  query: string;
};

export type PredictedRecurrence = PredictRecurrence & {
  recurrence: string;
  explanation: string;
};

export type PredictRecurrenceAdapter = (predict: PredictRecurrence) => TaskEither<Errors, PredictedRecurrence>;
