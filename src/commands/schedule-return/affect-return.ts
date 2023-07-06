import { map as taskEitherMap, TaskEither } from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/function';
import { Errors } from '../../reporter/HttpReporter';
import { FareToSchedule, ScheduledFare } from '../../definitions/fares.definitions';

export const affectReturn = (returnToSchedule: TaskEither<Errors, FareToSchedule>): TaskEither<Errors, ScheduledFare> =>
  pipe(
    returnToSchedule,
    taskEitherMap((fareToSchedule: FareToSchedule): ScheduledFare => {
      const scheduledFare: ScheduledFare = {
        ...fareToSchedule,
        status: 'scheduled',
        duration: 20,
        distance: 1000,
        creator: 'romain.cambonie@gmail.com'
      };

      return scheduledFare;
    })
  );
