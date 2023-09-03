import { Errors } from '../../reporter';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { FaresToDelete } from './delete-fare.route';
import { type as ioType, Type, union as ioUnion, undefined as ioUndefined } from 'io-ts';
import { $onInfrastructureOrValidationError, throwEntityNotFoundValidationError } from '../../errors';
import { entityCodec, externalTypeCheckFor, faresDeletedCodec, stringCodec } from '../../codecs';
import { Entity, FaresDeleted } from '../../definitions';
import { isDefinedGuard } from '../../domain';

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
  pipe(transfer, externalTypeCheckFor<FaresDeleted>(faresDeletedCodec), fromEither);

const $checkEntitiesToDeleteExist =
  (db: PostgresDb) =>
  (transfer: string): TaskEither<Errors, unknown> =>
    taskEitherTryCatch(toDeleteCandidate(db, transfer), $onInfrastructureOrValidationError(`$checkEntitiesToDeleteExist`));

const typeCheck = (fromDB: unknown): TaskEither<Errors, FaresToDelete> => fromEither(toDeleteTransferCodec.decode(fromDB));

const toDeleteTransferCodec: Type<FaresToDelete> = ioType({
  scheduledToDelete: entityCodec,
  pendingToDelete: ioUnion([entityCodec, ioUndefined])
});

const toDeleteCandidate = (db: PostgresDb, scheduledId: string) => async (): Promise<unknown> => {
  const [scheduledToDelete]: (Entity | undefined)[] = (
    await db.query<Entity>('SELECT id FROM scheduled_fares WHERE id = $1 LIMIT 1', [scheduledId])
  ).rows;

  if (!isDefinedGuard(scheduledToDelete)) return throwEntityNotFoundValidationError(scheduledId);

  const [pendingToDelete]: (Entity | undefined)[] = (
    await db.query<Entity>('SELECT id FROM pending_returns WHERE outward_fare_id = $1 LIMIT 1', [scheduledId])
  ).rows;

  return {
    scheduledToDelete,
    pendingToDelete
  };
};
