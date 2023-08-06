import { TaskEither } from 'fp-ts/TaskEither';
import { Errors } from '../../reporter/HttpReporter';
import { Journey, JourneyEstimate } from '../../definitions';

export type EstimateJourneyAdapter = (journey: Journey) => TaskEither<Errors, JourneyEstimate>;

export const estimateJourney =
  (serviceCall: EstimateJourneyAdapter) =>
  (journey: Journey): TaskEither<Errors, JourneyEstimate> =>
    serviceCall(journey);
