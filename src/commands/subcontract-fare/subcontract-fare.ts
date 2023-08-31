import { pipe } from 'fp-ts/lib/function';
import { map as taskEitherMap, TaskEither } from 'fp-ts/TaskEither';
import { Entity, Scheduled, Subcontracted } from '../../definitions';
import { Errors } from '../../reporter/HttpReporter';
import { SubcontractedActions, ToSubcontractValidation } from './subcontract-fare.route';

// eslint-disable-next-line max-lines-per-function
export const subcontractFare = (
  fareToSubcontract: TaskEither<Errors, ToSubcontractValidation>
): TaskEither<Errors, SubcontractedActions> =>
  pipe(
    fareToSubcontract,
    taskEitherMap(
      ({ toSubcontract, scheduledToCopyAndDelete, pendingToDelete }: ToSubcontractValidation): SubcontractedActions => {
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
