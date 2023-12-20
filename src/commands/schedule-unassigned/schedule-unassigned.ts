import { map as taskEitherMap, TaskEither } from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/function';
import { Errors } from '../../codecs';
import { UnassignedToSchedule, UnassignedToSchedulePersist } from './schedule-unassigned.route';
import { isOneWay } from '../../domain';
import { toPending } from '../../mappers';

export const scheduleUnassigned = (
  payload: TaskEither<Errors, UnassignedToSchedule>
): TaskEither<Errors, UnassignedToSchedulePersist> =>
  pipe(payload, taskEitherMap(applySchedule));

const applySchedule = ({ toSchedule, unassignedToDelete }: UnassignedToSchedule): UnassignedToSchedulePersist => ({
  scheduledToCreate: {
    ...toSchedule,
    status: 'scheduled'
  },
  unassignedToDelete,
  pendingToCreate: isOneWay(toSchedule) ? undefined : toPending(toSchedule)
});
