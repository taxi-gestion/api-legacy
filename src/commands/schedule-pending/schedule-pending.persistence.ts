import { map as taskEitherMap, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import type { PoolClient, QueryResult } from 'pg';
import type { PostgresDb } from '@fastify/postgres';
import { Errors } from '../../reporter';
import { Entity, Scheduled } from '../../definitions';
import { PendingToSchedulePersist } from './schedule-pending.route';
import { pipe } from 'fp-ts/function';
import { onDatabaseError } from '../../errors';
import { fromDBtoPendingCandidate, fromDBtoScheduledCandidate } from '../../mappers';

export const persistPendingScheduled =
  (database: PostgresDb) =>
  (fares: PendingToSchedulePersist): TaskEither<Errors, unknown> =>
    pipe(
      taskEitherTryCatch(applyQueries(database, fares), onDatabaseError(`persistPendingScheduled`)),
      taskEitherMap(toPersistedFares)
    );

const applyQueries =
  (database: PostgresDb, { scheduledToCreate, pendingToDelete }: PendingToSchedulePersist) =>
  async (): Promise<QueryResult[]> =>
    database.transact(
      async (client: PoolClient): Promise<QueryResult[]> =>
        Promise.all([insertScheduledFareQuery(client, scheduledToCreate), deletePendingQuery(client, pendingToDelete)])
    );

const insertScheduledFareQuery = async (client: PoolClient, farePg: Scheduled): Promise<QueryResult> =>
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

const deletePendingQuery = async (client: PoolClient, pendingToDelete: Entity): Promise<QueryResult> =>
  client.query(removeReturnToScheduleQueryString, [pendingToDelete.id]);

const removeReturnToScheduleQueryString: string = `DELETE FROM pending_returns WHERE id = $1 RETURNING *;
      `;

const toPersistedFares = (queriesResults: QueryResult[]): unknown => ({
  scheduledCreated: [queriesResults[0]?.rows[0]].map(fromDBtoScheduledCandidate)[0],
  ...(queriesResults[1] === undefined ? {} : { pendingDeleted: [queriesResults[1].rows[0]].map(fromDBtoPendingCandidate)[0] })
});
