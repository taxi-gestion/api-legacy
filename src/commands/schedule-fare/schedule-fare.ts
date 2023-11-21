import { pipe } from 'fp-ts/lib/function';
import { Either, map as eitherMap } from 'fp-ts/Either';
import { FareToSchedule, ScheduledPersist, ScheduledAndPendingPersist } from './schedule-fare.route';
import { isOneWay } from '../../domain';
import { toPending } from '../../mappers';
import { Errors } from '../../codecs';

export const scheduleFare = (
  fareToSchedule: Either<Errors, FareToSchedule>
): Either<Errors, ScheduledAndPendingPersist | ScheduledPersist> => pipe(fareToSchedule, eitherMap(applySchedule));

const applySchedule = ({ toSchedule }: FareToSchedule): ScheduledAndPendingPersist | ScheduledPersist => ({
  scheduledToCreate: {
    ...toSchedule,
    status: 'scheduled'
  },
  pendingToCreate: isOneWay(toSchedule) ? undefined : toPending(toSchedule)
});
