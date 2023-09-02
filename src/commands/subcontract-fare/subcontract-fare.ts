import { pipe } from 'fp-ts/lib/function';
import { map as taskEitherMap, TaskEither } from 'fp-ts/TaskEither';
import { Entity, Scheduled, Subcontracted } from '../../definitions';
import { Errors } from '../../reporter';
import { FaresToSubcontract, SubcontractedToPersist } from './subcontract-fare.route';

// eslint-disable-next-line max-lines-per-function
export const subcontractFare = (
  fareToSubcontract: TaskEither<Errors, FaresToSubcontract>
): TaskEither<Errors, SubcontractedToPersist> =>
  pipe(
    fareToSubcontract,
    taskEitherMap(
      ({ toSubcontract, scheduledToCopyAndDelete, pendingToDelete }: FaresToSubcontract): SubcontractedToPersist => {
        const {
          id: scheduledToDeleteId,
          driver,
          status,
          ...toCopy
        }: {
          id: string;
          driver: string;
          status: string;
        } = scheduledToCopyAndDelete;

        const subcontractedFare: Subcontracted = {
          subcontractor: toSubcontract.subcontractor,
          status: 'subcontracted',
          ...(toCopy as Omit<Entity & Scheduled, 'driver' | 'id' | 'status'>)
        };

        return {
          subcontractedToPersist: subcontractedFare,
          scheduledToDelete: { id: scheduledToDeleteId },
          ...(pendingToDelete === undefined ? {} : { pendingToDelete })
        };
      }
    )
  );
