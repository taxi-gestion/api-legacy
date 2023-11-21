import { pipe } from 'fp-ts/lib/function';
import { of as taskEitherOf, TaskEither } from 'fp-ts/TaskEither';
import {
  Errors,
  externalTypeCheckFor,
  pendingReturnCodec,
  pendingReturnsCodec,
  regularCodec,
  regularsCodec,
  scheduledFareCodec,
  scheduledFaresCodec,
  subcontractedFareCodec,
  subcontractedFaresCodec,
  unassignedFareCodec,
  unassignedFaresCodec
} from '../../codecs';
import { ValidableTables } from './validate-data.route';
import { keyof as ioKeyOf, Type, Validation } from 'io-ts';
import { Either, isLeft, isRight } from 'fp-ts/Either';

export const allowedTableValidation = (transfer: unknown): Either<Errors, ValidableTables> =>
  pipe(transfer, externalTypeCheckFor<ValidableTables>(validableTableCodec));
//export const scheduledFaresForDateValidation = (transfer: unknown): TaskEither<Errors, (Entity & Scheduled)[]> =>
//  pipe(transfer, externalTypeCheckFor<(Entity & Scheduled)[]>(scheduledFaresCodec), fromEither);

//export const tableValidation = (table: string) => (transfer: unknown): boolean => isRight(mapper(table).decode(transfer));

/* eslint-disable @typescript-eslint/naming-convention */
const validableTableCodec: Type<ValidableTables> = ioKeyOf({
  pending_returns: null,
  scheduled_fares: null,
  subcontracted_fares: null,
  unassigned_fares: null,
  regulars: null
});
/* eslint-enable @typescript-eslint/naming-convention */

export const tableValidation =
  (table: string) =>
  // eslint-disable-next-line max-statements
  (transfer: unknown): TaskEither<Errors, string[] | true> => {
    const validation: Validation<unknown> = batchMapper(table).decode(transfer);
    if (isRight(validation)) {
      return taskEitherOf(true); // A successful TaskEither
    }

    // If the validation fails, find the problematic IDs
    if (Array.isArray(transfer)) {
      const refinedValidation: Type<unknown> = refinedMapper(table);
      const invalidIds: string[] = [];

      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type,@typescript-eslint/typedef
      transfer.forEach((item) => {
        if (typeof item === 'object' && item !== null) {
          const itemValidation: Validation<unknown> = refinedValidation.decode(item);
          if (isLeft(itemValidation) && 'id' in item) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            invalidIds.push(item?.id);
          }
        }
      });

      return taskEitherOf(invalidIds);
    }

    return taskEitherOf([]); // No valid IDs found
  };

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type,@typescript-eslint/no-explicit-any
const batchMapper = (table: string): Type<any> => {
  if (table === 'regulars') return regularsCodec;

  if (table === 'scheduled_fares') return scheduledFaresCodec;

  if (table === 'pending_returns') return pendingReturnsCodec;

  if (table === 'subcontracted_fares') return subcontractedFaresCodec;

  if (table === 'unassigned_fares') return unassignedFaresCodec;

  throw new Error('Invalid table to validate');
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type,@typescript-eslint/no-explicit-any
const refinedMapper = (table: string): Type<any> => {
  if (table === 'regulars') return regularCodec;

  if (table === 'scheduled_fares') return scheduledFareCodec;

  if (table === 'pending_returns') return pendingReturnCodec;

  if (table === 'subcontracted_fares') return subcontractedFareCodec;

  if (table === 'unassigned_fares') return unassignedFareCodec;

  throw new Error('Invalid table to validate');
};
