import { Errors } from '../../reporter';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { RegularToDelete } from './delete-regular.route';
import { type as ioType, Type } from 'io-ts';
import { $onInfrastructureOrValidationError, throwEntityNotFoundValidationError } from '../../errors';
import { entityCodec, externalTypeCheckFor, regularDeletedCodec, stringCodec } from '../../codecs';
import { DeleteRegular, Entity } from '../../definitions';
import { isDefinedGuard } from '../../domain';

export const $regularToDeleteValidation =
  (db: PostgresDb) =>
  (transfer: unknown): TaskEither<Errors, RegularToDelete> =>
    pipe(
      transfer,
      externalTypeCheckFor<string>(stringCodec),
      fromEither,
      taskEitherChain($checkEntitiesToDeleteExist(db)),
      taskEitherChain(typeCheck)
    );

export const deletedValidation = (transfer: unknown): TaskEither<Errors, DeleteRegular> =>
  pipe(transfer, externalTypeCheckFor<DeleteRegular>(regularDeletedCodec), fromEither);

const $checkEntitiesToDeleteExist =
  (db: PostgresDb) =>
  (transfer: string): TaskEither<Errors, unknown> =>
    taskEitherTryCatch(toDeleteCandidate(db, transfer), $onInfrastructureOrValidationError(`$checkEntitiesToDeleteExist`));

const typeCheck = (fromDB: unknown): TaskEither<Errors, RegularToDelete> => fromEither(toDeleteTransferCodec.decode(fromDB));

const toDeleteTransferCodec: Type<RegularToDelete> = ioType({
  regularToDelete: entityCodec
});

const toDeleteCandidate = (db: PostgresDb, regularId: string) => async (): Promise<unknown> => {
  const [regularToDelete]: (Entity | undefined)[] = (
    await db.query<Entity>('SELECT id FROM regulars WHERE id = $1 LIMIT 1', [regularId])
  ).rows;

  if (!isDefinedGuard(regularToDelete)) return throwEntityNotFoundValidationError(regularId);

  return {
    regularToDelete
  };
};
