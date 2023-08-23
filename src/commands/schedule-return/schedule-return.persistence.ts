import { TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import type { PoolClient, QueryResult } from 'pg';
import type { PostgresDb } from '@fastify/postgres';
import { Errors, InfrastructureError } from '../../reporter/HttpReporter';
import { ReturnToDelete, Scheduled } from '../../definitions';

export const persistFareAndDeleteReturnToSchedule =
  (database: PostgresDb) =>
  (fare: ReturnToDelete & Scheduled): TaskEither<Errors, QueryResult[]> =>
    taskEitherTryCatch(applyQueries(database, fare), onApplyQueriesError);

const applyQueries =
  (database: PostgresDb, { idToDelete, ...fare }: ReturnToDelete & Scheduled) =>
  async (): Promise<QueryResult[]> =>
    database.transact(async (client: PoolClient): Promise<QueryResult[]> => {
      const promises: Promise<QueryResult>[] = [
        insertScheduledFareQuery(client, fare),
        removeReturnToScheduleQuery(client, { idToDelete })
      ];
      return Promise.all(promises);
    });

const onApplyQueriesError = (error: unknown): Errors =>
  [
    {
      isInfrastructureError: true,
      message: `database error - ${(error as Error).message}`,
      // eslint-disable-next-line id-denylist
      value: (error as Error).name,
      stack: (error as Error).stack ?? 'no stack available',
      code: (error as Error).message.includes('ECONNREFUSED') ? '503' : '500'
    } satisfies InfrastructureError
  ] satisfies Errors;

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

const removeReturnToScheduleQuery = async (client: PoolClient, { idToDelete }: ReturnToDelete): Promise<QueryResult> =>
  client.query(removeReturnToScheduleQueryString, [idToDelete]);

const removeReturnToScheduleQueryString: string = `DELETE FROM returns_to_schedule WHERE id = $1;
      `;
