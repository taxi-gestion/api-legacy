import { Errors, InfrastructureError, isInfrastructureError, ValidationError } from '../../reporter/HttpReporter';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { Entity, FareToSubcontract, Scheduled } from '../../definitions';
import { QueryResult } from 'pg';
import {
  entityCodec,
  externalTypeCheckFor,
  fareToSubcontractCodec,
  pendingReturnCodec,
  scheduledFareCodec,
  subcontractedFareCodec,
  toSubcontractCodec
} from '../../codecs';
import { Decoder, type as ioType, Type, union as ioUnion } from 'io-ts';
import { SubcontractedValidated, ToSubcontractValidation } from './subcontract-fare.route';
import { fromDBtoScheduledCandidate } from './subcontract-fare.persistence';

export const $subcontractFareValidation =
  (db: PostgresDb) =>
  (transfer: unknown): TaskEither<Errors, ToSubcontractValidation> =>
    pipe(
      transfer,
      externalTypeCheckFor<Entity & FareToSubcontract>(fareToSubcontractCodec),
      fromEither,
      taskEitherChain($fareToSubcontractExistInDb(db)),
      taskEitherChain(internalTypeCheckForFareToSubcontract)
    );

export const subcontractedValidation = (transfer: unknown): TaskEither<Errors, SubcontractedValidated> =>
  pipe(transfer, externalTypeCheckFor<SubcontractedValidated>(subcontractedCodec), fromEither);

const $fareToSubcontractExistInDb =
  (db: PostgresDb) =>
  (subcontractFareTransfer: Entity & FareToSubcontract): TaskEither<Errors, unknown> =>
    taskEitherTryCatch(async (): Promise<unknown> => {
      const fareToSubcontractQueryResult: QueryResult = await db.query('SELECT * FROM scheduled_fares WHERE id = $1 LIMIT 1', [
        subcontractFareTransfer.id
      ]);

      if (fareToSubcontractQueryResult.rows.length === 0)
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw entityNotFoundValidationError(subcontractFareTransfer.id) satisfies ValidationError;

      const fareToSubcontractPendingReturnQueryResult: QueryResult = await db.query(
        'SELECT id FROM pending_returns WHERE outward_fare_id = $1 LIMIT 1',
        [subcontractFareTransfer.id]
      );

      return fareToSubcontractPendingReturnQueryResult.rows.length === 0
        ? toSubcontractValidationWithoutPendingCandidate(subcontractFareTransfer, fareToSubcontractQueryResult)
        : toSubcontractValidationWithPendingCandidate(
            subcontractFareTransfer,
            fareToSubcontractQueryResult,
            fareToSubcontractPendingReturnQueryResult
          );
    }, onError);

const internalTypeCheckForFareToSubcontract = (fromDB: unknown): TaskEither<Errors, ToSubcontractValidation> =>
  fromEither(toSubcontractActionsCodec.decode(fromDB));

const onError = (error: unknown): Errors =>
  isInfrastructureError(error as InfrastructureError)
    ? ([
        {
          isInfrastructureError: true,
          message: `database error fareToSubcontractExistInDb  - ${(error as Error).message}`,
          // eslint-disable-next-line id-denylist
          value: (error as Error).name,
          stack: (error as Error).stack ?? 'no stack available',
          code: (error as Error).message.includes('ECONNREFUSED') ? '503' : '500'
        } satisfies InfrastructureError
      ] satisfies Errors)
    : [error as ValidationError];

const entityNotFoundValidationError = (id: string): ValidationError => ({
  context: [
    {
      actual: id,
      key: 'id',
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      type: {
        name: 'isValidId'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as Decoder<any, any>
    }
  ],
  message: `Rules check failed, '${id}' not found in the database`,
  // eslint-disable-next-line id-denylist
  value: id
});

const toSubcontractValidationWithoutPendingCandidate = (
  subcontractFareTransfer: Entity & FareToSubcontract,
  fareToSubcontractQueryResult: QueryResult
): unknown =>
  ({
    toSubcontract: subcontractFareTransfer,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-argument
    scheduledToCopyAndDelete: fromDBtoScheduledCandidate(fareToSubcontractQueryResult.rows[0]) as Entity & Scheduled
  } satisfies ToSubcontractValidation);

const toSubcontractValidationWithPendingCandidate = (
  subcontractFareTransfer: Entity & FareToSubcontract,
  fareToSubcontractQueryResult: QueryResult,
  fareToSubcontractPendingReturnQueryResult: QueryResult
): unknown =>
  ({
    toSubcontract: subcontractFareTransfer,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-argument
    scheduledToCopyAndDelete: fromDBtoScheduledCandidate(fareToSubcontractQueryResult.rows[0]) as Entity & Scheduled,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    pendingToDelete: { id: fareToSubcontractPendingReturnQueryResult.rows[0].id }
  } satisfies ToSubcontractValidation);

const subcontractedCodec: Type<SubcontractedValidated> = ioUnion([
  ioType({
    subcontracted: subcontractedFareCodec,
    scheduledDeleted: scheduledFareCodec
  }),
  ioType({
    subcontracted: subcontractedFareCodec,
    scheduledDeleted: scheduledFareCodec,
    pendingDeleted: pendingReturnCodec
  })
]);

const toSubcontractActionsCodec: Type<ToSubcontractValidation> = ioUnion([
  ioType({
    toSubcontract: toSubcontractCodec,
    scheduledToCopyAndDelete: scheduledFareCodec
  }),
  ioType({
    toSubcontract: toSubcontractCodec,
    scheduledToCopyAndDelete: scheduledFareCodec,
    pendingToDelete: entityCodec
  })
]);
