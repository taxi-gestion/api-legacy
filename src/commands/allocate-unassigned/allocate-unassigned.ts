import { pipe } from 'fp-ts/lib/function';
import { Either, map as eitherMap } from 'fp-ts/Either';
import { Errors } from '../../reporter';
import { ToUnassigned } from '../../definitions';
import { UnassignedToAllocatePersist } from './allocate-unassigned.route';

export const allocateUnassigned = (fareToSchedule: Either<Errors, ToUnassigned>): Either<Errors, UnassignedToAllocatePersist> =>
  pipe(fareToSchedule, eitherMap(applyUnassigned));

const applyUnassigned = (toUnassigned: ToUnassigned): UnassignedToAllocatePersist => ({
  unassignedToCreate: {
    ...toUnassigned,
    status: 'unassigned'
  }
});
