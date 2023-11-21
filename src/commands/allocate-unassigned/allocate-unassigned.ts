import { pipe } from 'fp-ts/lib/function';
import { Either, map as eitherMap } from 'fp-ts/Either';
import { Errors } from '../../codecs';
import { ToUnassigned } from '../../definitions';
import { UnassignedPersist } from './allocate-unassigned.route';

export const allocateUnassigned = (fareToSchedule: Either<Errors, ToUnassigned>): Either<Errors, UnassignedPersist> =>
  pipe(fareToSchedule, eitherMap(applyUnassigned));

const applyUnassigned = (toUnassigned: ToUnassigned): UnassignedPersist => ({
  unassignedToCreate: {
    ...toUnassigned,
    status: 'unassigned'
  }
});
