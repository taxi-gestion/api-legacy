import { TaskEither } from 'fp-ts/TaskEither';
import { Errors } from '../../reporter/HttpReporter';
import { EstimateJourneyAdapter, Journey, JourneyEstimate } from '../../definitions';

export const estimateJourney =
  (serviceCall: EstimateJourneyAdapter) =>
  (journey: Journey): TaskEither<Errors, JourneyEstimate> =>
    serviceCall(journey);
