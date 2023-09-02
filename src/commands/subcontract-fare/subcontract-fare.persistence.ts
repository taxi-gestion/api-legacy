import {
  chain as taskEitherChain,
  right as taskEitherRight,
  TaskEither,
  tryCatch as taskEitherTryCatch
} from 'fp-ts/TaskEither';
import type { PoolClient, QueryResult } from 'pg';
import type { PostgresDb } from '@fastify/postgres';
import { Errors, InfrastructureError } from '../../reporter';
import { Entity, SubcontractedPersistence } from '../../definitions';
import { pipe } from 'fp-ts/lib/function';
import { SubcontractedToPersist } from './subcontract-fare.route';
import { fromDBtoPendingCandidate, fromDBtoScheduledCandidate, fromDBtoSubcontractedCandidate } from '../../mappers';

export const persistSubcontractedFares =
  (database: PostgresDb) =>
  (fares: SubcontractedToPersist): TaskEither<Errors, unknown> =>
    pipe(
      taskEitherTryCatch(applyQueries(database, fares), onApplySubcontractFareQueriesError),
      taskEitherChain(
        (queriesResults: QueryResult[]): TaskEither<Errors, unknown> =>
          taskEitherRight(toSubcontractedFareAndDeleted(queriesResults))
      )
    );

const applyQueries =
  (database: PostgresDb, { subcontractedToPersist, scheduledToDelete, pendingToDelete }: SubcontractedToPersist) =>
  async (): Promise<QueryResult[]> =>
    database.transact(async (client: PoolClient): Promise<QueryResult[]> => {
      const promises: Promise<QueryResult>[] = [
        insertSubcontractedQuery(client, subcontractedToPersist),
        deleteScheduledQuery(client, scheduledToDelete),
        ...insertPendingToDeleteQueryOrEmpty(client, pendingToDelete)
      ];

      return Promise.all(promises);
    });

const insertPendingToDeleteQueryOrEmpty = (
  client: PoolClient,
  pendingToDelete: Entity | undefined
): [] | [Promise<QueryResult>] => (pendingToDelete === undefined ? [] : [deletePendingQuery(client, pendingToDelete)]);

const onApplySubcontractFareQueriesError = (error: unknown): Errors =>
  [
    {
      isInfrastructureError: true,
      message: `database error onApplySubcontractFareQueriesError - ${(error as Error).message}`,
      // eslint-disable-next-line id-denylist
      value: (error as Error).name,
      stack: (error as Error).stack ?? 'no stack available',
      code: (error as Error).message.includes('ECONNREFUSED') ? '503' : '500'
    } satisfies InfrastructureError
  ] satisfies Errors;

const insertSubcontractedQuery = async (client: PoolClient, farePg: SubcontractedPersistence): Promise<QueryResult> =>
  client.query(insertSubcontractedFareQueryString, [
    farePg.subcontractor,
    farePg.passenger,
    farePg.datetime,
    farePg.departure,
    farePg.destination,
    farePg.distance,
    farePg.duration,
    farePg.kind,
    farePg.nature,
    farePg.phone,
    farePg.status
  ]);

const insertSubcontractedFareQueryString: string = `
      INSERT INTO subcontracted_fares (
          subcontractor,
          passenger,
          datetime,
          departure,
          destination,
          distance,
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

const deleteScheduledQuery = async (client: PoolClient, scheduledToDelete: Entity): Promise<QueryResult> =>
  client.query(removeScheduledQueryString, [scheduledToDelete.id]);

const removeScheduledQueryString: string = `DELETE FROM scheduled_fares WHERE id = $1 RETURNING *
      `;

const deletePendingQuery = async (client: PoolClient, pendingToDelete: Entity): Promise<QueryResult> =>
  client.query(removeReturnToScheduleQueryString, [pendingToDelete.id]);

const removeReturnToScheduleQueryString: string = `DELETE FROM pending_returns WHERE id = $1 RETURNING *
      `;

const toSubcontractedFareAndDeleted = (queriesResults: QueryResult[]): unknown => ({
  subcontracted: [queriesResults[0]?.rows[0]].map(fromDBtoSubcontractedCandidate)[0],
  scheduledDeleted: [queriesResults[1]?.rows[0]].map(fromDBtoScheduledCandidate)[0],
  ...(queriesResults[2] === undefined ? {} : { pendingDeleted: [queriesResults[2].rows[0]].map(fromDBtoPendingCandidate)[0] })
});
