import { map as taskEitherMap, TaskEither } from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/function';
import { Errors } from '../../reporter/HttpReporter';
import { ToSchedule, Scheduled } from '../../definitions/fares.definitions';

export const affectReturn = (returnToSchedule: TaskEither<Errors, ToSchedule>): TaskEither<Errors, Scheduled> =>
  pipe(
    returnToSchedule,
    taskEitherMap((fareToSchedule: ToSchedule): Scheduled => {
      const scheduledFare: Scheduled = {
        ...fareToSchedule,
        status: 'scheduled',
        duration: 20,
        distance: 1000,
        creator: 'romain.cambonie@gmail.com'
      };

      return scheduledFare;
    })
  );
