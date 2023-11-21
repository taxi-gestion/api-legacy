import { map as taskEitherMap, TaskEither } from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/function';
import { Errors } from '../../codecs';
import { PendingToSchedule, PendingToSchedulePersist } from './schedule-pending.route';

export const schedulePending = (payload: TaskEither<Errors, PendingToSchedule>): TaskEither<Errors, PendingToSchedulePersist> =>
  pipe(payload, taskEitherMap(applySchedule));

const applySchedule = ({ driveToSchedule, pendingToDelete }: PendingToSchedule): PendingToSchedulePersist => ({
  scheduledToCreate: {
    ...pendingToDelete,
    ...driveToSchedule,
    status: 'scheduled'
  },
  pendingToDelete
});
