import { pipe } from 'fp-ts/lib/function';
import { Either, map as eitherMap } from 'fp-ts/Either';
import { FaresToSchedulePersist, FareToSchedule } from './schedule-fare.route';
import { isOneWay } from '../../domain/utils';
import { toPending } from '../../mappers';
import { Errors } from '../../reporter';

export const scheduleFare = (fareToSchedule: Either<Errors, FareToSchedule>): Either<Errors, FaresToSchedulePersist> =>
  pipe(fareToSchedule, eitherMap(applySchedule));

const applySchedule = ({ toSchedule }: FareToSchedule): FaresToSchedulePersist => ({
  scheduledToCreate: {
    ...toSchedule,
    status: 'scheduled'
  },
  ...(isOneWay(toSchedule) ? {} : { pendingToCreate: toPending(toSchedule) })
});
