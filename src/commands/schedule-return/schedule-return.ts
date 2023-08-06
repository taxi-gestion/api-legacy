import { map as taskEitherMap, TaskEither } from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/function';
import { Errors } from '../../reporter/HttpReporter';
import { CompletedReturnToSchedule, Entity, ReturnToDelete, Scheduled } from '../../definitions';

export const scheduleReturn = (
  payload: TaskEither<Errors, CompletedReturnToSchedule & Entity>
): TaskEither<Errors, ReturnToDelete & Scheduled> =>
  pipe(
    payload,
    taskEitherMap((returnToSchedule: CompletedReturnToSchedule & Entity): ReturnToDelete & Scheduled => ({
      ...returnToSchedule,
      status: 'scheduled',
      idToDelete: returnToSchedule.id
    }))
  );
