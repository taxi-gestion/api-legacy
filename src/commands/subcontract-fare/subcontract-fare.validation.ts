import { Errors } from '../../reporter/http-reporter';
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
import { type as ioType, Type, union as ioUnion } from 'io-ts';
import { FaresSubcontracted, FaresToSubcontract } from './subcontract-fare.route';
import { throwEntityNotFoundValidationError } from '../../reporter/entity-not-found.validation-error';
import { $onInfrastructureOrValidationError } from '../../reporter/infrastructure-or-validation.error';
import { fromDBtoScheduledCandidate } from '../../persistence/persistence-utils';

export const $subcontractFareValidation =
  (db: PostgresDb) =>
  (transfer: unknown): TaskEither<Errors, FaresToSubcontract> =>
    pipe(
      transfer,
      externalTypeCheckFor<Entity & FareToSubcontract>(fareToSubcontractCodec),
      fromEither,
      taskEitherChain($fareToSubcontractExistIn(db)),
      taskEitherChain(internalTypeCheckForFareToSubcontract)
    );

export const subcontractedValidation = (transfer: unknown): TaskEither<Errors, FaresSubcontracted> =>
  pipe(transfer, externalTypeCheckFor<FaresSubcontracted>(subcontractedCodec), fromEither);

const $fareToSubcontractExistIn =
  (db: PostgresDb) =>
  (subcontractFareTransfer: Entity & FareToSubcontract): TaskEither<Errors, unknown> =>
    taskEitherTryCatch(async (): Promise<unknown> => {
      const fareToSubcontractQueryResult: QueryResult = await db.query('SELECT * FROM scheduled_fares WHERE id = $1 LIMIT 1', [
        subcontractFareTransfer.id
      ]);

      if (fareToSubcontractQueryResult.rows.length === 0) throwEntityNotFoundValidationError(subcontractFareTransfer.id);

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
    }, $onInfrastructureOrValidationError(`$fareToSubcontractExistIn`));

const internalTypeCheckForFareToSubcontract = (fromDB: unknown): TaskEither<Errors, FaresToSubcontract> =>
  fromEither(toSubcontractTransferCodec.decode(fromDB));

const toSubcontractValidationWithoutPendingCandidate = (
  subcontractFareTransfer: Entity & FareToSubcontract,
  fareToSubcontractQueryResult: QueryResult
): unknown =>
  ({
    toSubcontract: subcontractFareTransfer,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-argument
    scheduledToCopyAndDelete: fromDBtoScheduledCandidate(fareToSubcontractQueryResult.rows[0]) as Entity & Scheduled
  } satisfies FaresToSubcontract);

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
  } satisfies FaresToSubcontract);

const subcontractedCodec: Type<FaresSubcontracted> = ioUnion([
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

const toSubcontractTransferCodec: Type<FaresToSubcontract> = ioUnion([
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
