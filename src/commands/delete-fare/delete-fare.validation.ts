import { entityCodec, Errors, externalTypeCheckFor, faresDeletedCodec, stringCodec } from '../../codecs';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { FaresToDelete } from './delete-fare.route';
import { type as ioType, Type, undefined as ioUndefined, union as ioUnion } from 'io-ts';
import { $onInfrastructureOrValidationError, throwEntityNotFoundValidationError } from '../../errors';
import { DeleteFare, Entity } from '../../definitions';
import { QueryResult } from 'pg';

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

export const deletedValidation = (transfer: unknown): TaskEither<Errors, DeleteFare> =>
  pipe(transfer, externalTypeCheckFor<DeleteFare>(faresDeletedCodec), fromEither);

const $checkEntitiesToDeleteExist =
  (db: PostgresDb) =>
  (transfer: string): TaskEither<Errors, unknown> =>
    taskEitherTryCatch(toDeleteCandidate(db, transfer), $onInfrastructureOrValidationError(`$checkEntitiesToDeleteExist`));

const typeCheck = (fromDB: unknown): TaskEither<Errors, FaresToDelete> => fromEither(toDeleteTransferCodec.decode(fromDB));

const toDeleteTransferCodec: Type<FaresToDelete> = ioType({
  scheduledToDelete: ioUnion([entityCodec, ioUndefined]),
  unassignedToDelete: ioUnion([entityCodec, ioUndefined]),
  pendingToDelete: ioUnion([entityCodec, ioUndefined]),
  recurringToDelete: ioUnion([entityCodec, ioUndefined]),
  subcontractedToDelete: ioUnion([entityCodec, ioUndefined])
});

const fetchSingleEntity = async (
  db: PostgresDb,
  table: string,
  conditionColumn: string,
  id: string
): Promise<Entity | undefined> => {
  const query: string = `SELECT id FROM ${table} WHERE ${conditionColumn} = $1 LIMIT 1`;
  const results: QueryResult<Entity> = await db.query<Entity>(query, [id]);
  return results.rows[0];
};

const fetchFaresToDelete = async (db: PostgresDb, fareToDeleteId: string): Promise<(Entity | undefined)[]> =>
  Promise.all([
    fetchSingleEntity(db, 'pending_returns', 'id', fareToDeleteId),
    fetchSingleEntity(db, 'unassigned_fares', 'id', fareToDeleteId),
    fetchSingleEntity(db, 'scheduled_fares', 'id', fareToDeleteId),
    fetchSingleEntity(db, 'recurring_fares', 'id', fareToDeleteId),
    fetchSingleEntity(db, 'subcontracted_fares', 'id', fareToDeleteId)
  ]);

const fetchRelatedPendingReturns = async (db: PostgresDb, fareToDeleteId: string): Promise<Entity | undefined> =>
  fetchSingleEntity(db, 'pending_returns', 'outward_fare_id', fareToDeleteId);

const toDeleteCandidate = (db: PostgresDb, fareToDeleteId: string) => async (): Promise<unknown> => {
  const [pendingToDelete, unassignedToDelete, scheduledToDelete, recurringToDelete, subcontractedToDelete]: (
    | Entity
    | undefined
  )[] = await fetchFaresToDelete(db, fareToDeleteId);

  if (pendingToDelete !== undefined) return { pendingToDelete };

  if (noValidEntities(scheduledToDelete, unassignedToDelete, recurringToDelete, subcontractedToDelete))
    return throwEntityNotFoundValidationError(fareToDeleteId);

  const relatedPendingToDelete: Entity | undefined = await fetchRelatedPendingReturns(db, fareToDeleteId);
  return {
    scheduledToDelete,
    unassignedToDelete,
    pendingToDelete: relatedPendingToDelete,
    recurringToDelete,
    subcontractedToDelete
  };
};

const noValidEntities = (
  scheduled: Entity | undefined,
  unassigned: Entity | undefined,
  recurring: Entity | undefined,
  subcontracted: Entity | undefined
): boolean => unassigned === undefined && scheduled === undefined && recurring === undefined && subcontracted === undefined;
