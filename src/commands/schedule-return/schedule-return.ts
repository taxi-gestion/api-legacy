import { map as taskEitherMap, TaskEither } from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/function';
import { Errors } from '../../reporter/HttpReporter';
import { Entity, ReturnToDelete, ReturnToSchedule, Scheduled } from '../../definitions';

export const scheduleReturn = (
  payload: TaskEither<Errors, Entity & ReturnToSchedule>
): TaskEither<Errors, ReturnToDelete & Scheduled> =>
  pipe(
    payload,
    taskEitherMap((returnToSchedule: Entity & ReturnToSchedule): ReturnToDelete & Scheduled => ({
      ...returnToSchedule,
      status: 'scheduled',
      idToDelete: returnToSchedule.id
    }))
  );
