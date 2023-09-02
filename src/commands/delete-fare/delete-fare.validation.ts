import { Errors } from '../../reporter';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { QueryResult } from 'pg';
import { FaresDeleted, FaresToDelete } from './delete-fare.route';
import { type as ioType, Type, union as ioUnion } from 'io-ts';
import { $onInfrastructureOrValidationError, throwEntityNotFoundValidationError } from '../../errors';
import { entityCodec, externalTypeCheckFor, pendingReturnCodec, scheduledFareCodec, stringCodec } from '../../codecs';

export const $fareToDeleteValidation =
  (db: PostgresDb) =>
  (transfer: unknown): TaskEither<Errors, FaresToDelete> =>
    pipe(
      transfer,
      externalTypeCheckFor<string>(stringCodec),
      fromEither,
      taskEitherChain($checkEntitiesToDeleteExist(db)),
      taskEitherChain(typeCheck)
    );

export const deletedValidation = (transfer: unknown): TaskEither<Errors, FaresDeleted> =>
  pipe(transfer, externalTypeCheckFor<FaresDeleted>(deletedCodec), fromEither);

const $checkEntitiesToDeleteExist =
  (db: PostgresDb) =>
  (transfer: string): TaskEither<Errors, unknown> =>
    taskEitherTryCatch(toDeleteCandidate(db, transfer), $onInfrastructureOrValidationError(`$checkEntitiesToDeleteExist`));

const typeCheck = (fromDB: unknown): TaskEither<Errors, FaresToDelete> => fromEither(toDeleteTransferCodec.decode(fromDB));

const toDeleteTransferCodec: Type<FaresToDelete> = ioUnion([
  ioType({
    scheduledToDelete: entityCodec
  }),
  ioType({
    scheduledToDelete: entityCodec,
    pendingToDelete: entityCodec
  })
]);

const deletedCodec: Type<FaresDeleted> = ioUnion([
  ioType({
    scheduledDeleted: scheduledFareCodec
  }),
  ioType({
    scheduledDeleted: scheduledFareCodec,
    pendingDeleted: pendingReturnCodec
  })
]);

/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
const toDeleteCandidate = (db: PostgresDb, scheduledId: string) => async (): Promise<unknown> => {
  const scheduledFareToDeleteIdAndKind: QueryResult<{ id: string; kind: string }> = await db.query(
    'SELECT id,kind FROM scheduled_fares WHERE id = $1 LIMIT 1',
    [scheduledId]
  );

  if (scheduledFareToDeleteIdAndKind.rows.length === 0) throwEntityNotFoundValidationError(scheduledId);

  return isOneWay(scheduledFareToDeleteIdAndKind)
    ? { scheduledToDelete: { id: scheduledFareToDeleteIdAndKind.rows[0]!.id } }
    : toCandidateDeleteTransferWithPending(db, scheduledId, {
        scheduledToDelete: { id: scheduledFareToDeleteIdAndKind.rows[0]!.id }
      });
};

const toCandidateDeleteTransferWithPending = async (
  db: PostgresDb,
  fareId: string,
  scheduledToDelete: FaresToDelete
): Promise<FaresToDelete> => {
  const returnToScheduleValues: QueryResult = await db.query(
    'SELECT id FROM pending_returns WHERE outward_fare_id = $1 LIMIT 1',
    [fareId]
  );

  return {
    ...scheduledToDelete,
    ...(returnToScheduleValues.rows[0].id === undefined ? {} : { pendingToDelete: { id: returnToScheduleValues.rows[0].id } })
  } satisfies FaresToDelete;
};
/* eslint-enable @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */

const isOneWay = (fareDbResult: QueryResult): boolean => fareDbResult.rows[0].kind === 'one-way';
