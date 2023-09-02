import { Errors } from '../../reporter';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { FaresDeleted, FaresToDelete } from './delete-fare.route';
import { type as ioType, Type, union as ioUnion } from 'io-ts';
import { $onInfrastructureOrValidationError, throwEntityNotFoundValidationError } from '../../errors';
import { entityCodec, externalTypeCheckFor, pendingReturnCodec, scheduledFareCodec, stringCodec } from '../../codecs';
import { Entity } from '../../definitions';
import { isOneWay } from '../../domain';

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
  const [scheduledToDeleteWithKind]: ((Entity & { kind: string }) | undefined)[] = (
    await db.query<Entity & { kind: string }>('SELECT id,kind FROM scheduled_fares WHERE id = $1 LIMIT 1', [scheduledId])
  ).rows;

  if (scheduledToDeleteWithKind === undefined) throwEntityNotFoundValidationError(scheduledId);

  return isOneWay(scheduledToDeleteWithKind as { kind: 'one-way' | 'two-way' })
    ? { scheduledToDelete: { id: scheduledToDeleteWithKind?.id } }
    : $withPendingToDelete(db)(scheduledId, {
        // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
        scheduledToDelete: { id: scheduledToDeleteWithKind?.id as string }
      });
};

const $withPendingToDelete =
  (db: PostgresDb) =>
  async (scheduledId: string, scheduledToDelete: FaresToDelete): Promise<FaresToDelete> => {
    const [pendingToDelete]: (Entity | undefined)[] = (
      await db.query<Entity>('SELECT id FROM pending_returns WHERE outward_fare_id = $1 LIMIT 1', [scheduledId])
    ).rows;

    return {
      ...scheduledToDelete,
      ...(pendingToDelete === undefined ? {} : { pendingToDelete })
    } satisfies FaresToDelete;
  };
/* eslint-enable @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
