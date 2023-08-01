import { map as taskEitherMap, TaskEither } from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/function';
import { Errors } from '../../reporter/HttpReporter';
import { ToSchedule, Scheduled } from '../../definitions';

export const affectReturn = (returnToSchedule: TaskEither<Errors, ToSchedule>): TaskEither<Errors, Scheduled> =>
  pipe(
    returnToSchedule,
    taskEitherMap((fareToSchedule: ToSchedule): Scheduled => {
      const scheduledFare: Scheduled = {
        ...fareToSchedule,
        status: 'scheduled',
        creator: 'romain.cambonie@gmail.com'
      };

      return scheduledFare;
    })
  );
