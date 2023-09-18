import {
  chain as taskEitherChain,
  fromEither,
  map as taskEitherMap,
  TaskEither,
  tryCatch as taskEitherTryCatch
} from 'fp-ts/TaskEither';
import type { PoolClient, QueryResult } from 'pg';
import { pipe } from 'fp-ts/lib/function';
import type { PostgresDb } from '@fastify/postgres';
import { Errors } from '../../reporter';
import { Pending, PendingPersistence, ScheduledPersistence } from '../../definitions';
import { FaresToSchedulePersist } from './schedule-fare.route';
import { onDatabaseError, throwEntityNotFoundValidationError } from '../../errors';
import { fromDBtoPendingCandidate, fromDBtoScheduledCandidate } from '../../mappers';
import { Either } from 'fp-ts/Either';

export const persistScheduledFares =
  (database: PostgresDb) =>
  (fares: Either<Errors, FaresToSchedulePersist>): TaskEither<Errors, unknown> =>
    pipe(fares, fromEither, taskEitherChain(insertIn(database)));

const insertIn =
  (database: PostgresDb) =>
  (fares: FaresToSchedulePersist): TaskEither<Errors, unknown> =>
    pipe(
      taskEitherTryCatch(applyQueries(database)(fares), onDatabaseError(`persistScheduledFares`)),
      taskEitherMap(toTransfer)
    );

const applyQueries =
  (database: PostgresDb) =>
  ({ scheduledToCreate, pendingToCreate }: FaresToSchedulePersist) =>
  async (): Promise<QueryResult[]> =>
    database.transact(async (client: PoolClient): Promise<QueryResult[]> => {
      const scheduledCreatedQueryResult: QueryResult = await insertScheduledFareQuery(client)(scheduledToCreate);

      if (scheduledCreatedQueryResult.rows[0] === undefined) throwEntityNotFoundValidationError('undefinedId');

      return pendingToCreate === undefined
        ? [scheduledCreatedQueryResult]
        : $withPendingToCreateQueryResult(client)(scheduledCreatedQueryResult, pendingToCreate);
    });

const $withPendingToCreateQueryResult =
  (client: PoolClient) =>
  async (scheduledCreatedQueryResult: QueryResult, pendingToCreate: Pending): Promise<QueryResult[]> => {
    const pendingCreatedQueryResult: QueryResult = await insertPendingQuery(client)({
      ...pendingToCreate,
      outwardFareId: scheduledCreatedQueryResult.rows[0].id as string
    } satisfies PendingPersistence);

    return [scheduledCreatedQueryResult, pendingCreatedQueryResult];
  };

const insertScheduledFareQuery =
  (client: PoolClient) =>
  async (farePg: ScheduledPersistence): Promise<QueryResult> =>
    client.query(insertFareQueryString, [
      farePg.passenger,
      farePg.datetime,
      farePg.departure,
      farePg.destination,
      farePg.distance,
      farePg.driver,
      farePg.duration,
      farePg.kind,
      farePg.nature,
      farePg.status
    ]);

const insertFareQueryString: string = `
      INSERT INTO scheduled_fares (
          passenger,
          datetime,
          departure,
          destination,
          distance,
          driver,
          duration,
          kind,
          nature,
          status
      ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      ) 
      RETURNING *
    `;

const insertPendingQuery =
  (client: PoolClient) =>
  async (pendingPg: PendingPersistence): Promise<QueryResult> =>
    client.query(insertPendingQueryString, [
      pendingPg.passenger,
      pendingPg.datetime,
      pendingPg.departure,
      pendingPg.destination,
      pendingPg.driver,
      pendingPg.kind,
      pendingPg.nature,
      pendingPg.outwardFareId
    ]);

const insertPendingQueryString: string = `
      INSERT INTO pending_returns (
          passenger,
          datetime,
          departure,
          destination,
          driver,
          kind,
          nature,
          outward_fare_id
      ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
      )
      RETURNING *
      `;

const toTransfer = (queriesResults: QueryResult[]): unknown => ({
  scheduledCreated: [queriesResults[0]?.rows[0]].map(fromDBtoScheduledCandidate)[0],
  pendingCreated: queriesResults[1] === undefined ? undefined : [queriesResults[1].rows[0]].map(fromDBtoPendingCandidate)[0]
});
