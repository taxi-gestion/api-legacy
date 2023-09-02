import {
  chain as taskEitherChain,
  fromEither,
  map as taskEitherMap,
  TaskEither,
  tryCatch as taskEitherTryCatch
} from 'fp-ts/TaskEither';
import type {PoolClient, QueryResult} from 'pg';
import {pipe} from 'fp-ts/lib/function';
import type {PostgresDb} from '@fastify/postgres';
import {Errors} from '../../reporter';
import {PendingPersistence, ScheduledPersistence} from '../../persistence/persistence.definitions';
import {FaresToSchedulePersist} from './schedule-fare.route';
import {onDatabaseError, throwEntityNotFoundValidationError} from '../../errors';
import {fromDBtoPendingCandidate, fromDBtoScheduledCandidate} from '../../persistence/persistence-utils';
import {Pending} from '../../definitions';
import {Either} from 'fp-ts/Either';

export const persistScheduledFares =
  (database: PostgresDb) =>
    (fares: Either<Errors, FaresToSchedulePersist>): TaskEither<Errors, unknown> =>
      pipe(fares, fromEither, taskEitherChain(insertIn(database)));

const insertIn =
  (database: PostgresDb) =>
    (fares: FaresToSchedulePersist): TaskEither<Errors, unknown> =>
      pipe(
        taskEitherTryCatch(applyQueries(database)(fares), onDatabaseError(`persistScheduledFares`)),
        taskEitherMap(toScheduledFares)
      );

const applyQueries =
  (database: PostgresDb) =>
    ({scheduledToCreate, pendingToCreate}: FaresToSchedulePersist) =>
      async (): Promise<QueryResult[]> =>
        database.transact(async (client: PoolClient): Promise<QueryResult[]> => {
          const scheduledCreatedQueryResult: QueryResult = await insertScheduledFareQuery(client, scheduledToCreate);

          if (scheduledCreatedQueryResult.rows[0] === undefined) throwEntityNotFoundValidationError('undefinedId');

          return pendingToCreate === undefined
            ? [scheduledCreatedQueryResult]
            : $withPendingToCreateQueryResult(client)(scheduledCreatedQueryResult, pendingToCreate);
        });

const $withPendingToCreateQueryResult =
  (client: PoolClient) =>
    async (scheduledCreatedQueryResult: QueryResult, pendingToCreate: Pending): Promise<QueryResult[]> => {
      const pendingCreatedQueryResult: QueryResult = await insertPendingQuery(client, {
        ...pendingToCreate,
        outwardFareId: scheduledCreatedQueryResult.rows[0].id as string
      } satisfies PendingPersistence);

      return [scheduledCreatedQueryResult, pendingCreatedQueryResult];
    };

const insertScheduledFareQuery = async (client: PoolClient, farePg: ScheduledPersistence): Promise<QueryResult> =>
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
    farePg.phone,
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
          phone,
          status
      ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      ) 
      RETURNING *
    `;

const insertPendingQuery = async (client: PoolClient, pendingPg: PendingPersistence): Promise<QueryResult> =>
  client.query(insertPendingQueryString, [
    pendingPg.passenger,
    pendingPg.datetime,
    pendingPg.departure,
    pendingPg.destination,
    pendingPg.driver,
    pendingPg.kind,
    pendingPg.nature,
    pendingPg.phone,
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
          phone,
          outward_fare_id
      ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
      )
      RETURNING *
      `;

const toScheduledFares = (queriesResults: QueryResult[]): unknown => ({
  scheduledCreated: [queriesResults[0]?.rows[0]].map(fromDBtoScheduledCandidate)[0],
  ...(queriesResults[1] === undefined ? {} : {pendingCreated: [queriesResults[1].rows[0]].map(fromDBtoPendingCandidate)[0]})
});
