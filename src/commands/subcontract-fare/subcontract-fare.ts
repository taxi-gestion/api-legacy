import { pipe } from 'fp-ts/lib/function';
import { map as taskEitherMap, TaskEither } from 'fp-ts/TaskEither';
import { Entity, Pending, Scheduled, Subcontracted, Unassigned } from '../../definitions';
import { Errors } from '../../codecs';
import { FaresToSubcontract, SubcontractedToPersist } from './subcontract-fare.route';
import { isTwoWay, isUnassigned } from '../../domain';
import { toPending } from '../../mappers';

export const subcontractFare = (
  fareToSubcontract: TaskEither<Errors, FaresToSubcontract>
): TaskEither<Errors, SubcontractedToPersist> => pipe(fareToSubcontract, taskEitherMap(applySubcontract));

const createPendingIfTwoWayUnassigned = (toCopyAndDelete: Entity & (Pending | Scheduled | Unassigned)): Pending | undefined =>
  isUnassigned(toCopyAndDelete) && isTwoWay(toCopyAndDelete) ? toPending(toCopyAndDelete) : undefined;

// eslint-disable-next-line max-lines-per-function
const applySubcontract = ({
  toSubcontract,
  toCopyAndDelete,
  pendingToDelete,
  scheduledToDelete,
  unassignedToDelete
}: FaresToSubcontract): SubcontractedToPersist => {
  const {
    id: scheduledToDeleteId,
    status,
    ...toCopy
  }: {
    id: string;
    status: string;
  } = toCopyAndDelete;

  const subcontractedFare: Subcontracted = {
    ...(toCopy as Omit<Entity & Scheduled, 'driver' | 'id' | 'status'>),
    subcontractor: toSubcontract.subcontractor,
    status: 'subcontracted'
  };

  return {
    subcontractedToPersist: subcontractedFare,
    pendingToCreate: createPendingIfTwoWayUnassigned(toCopyAndDelete),
    scheduledToDelete,
    pendingToDelete,
    unassignedToDelete
  };
};
