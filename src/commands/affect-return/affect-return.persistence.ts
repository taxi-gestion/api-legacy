import { TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import type { PoolClient, QueryResult } from 'pg';
import type { PostgresDb } from '@fastify/postgres';
import { Errors, InfrastructureError } from '../../reporter/HttpReporter';
import { Scheduled } from '../../definitions';

export type ScheduledReturnPersistence = Scheduled;

export const toScheduledReturnPersistence = (scheduledFare: Scheduled): ScheduledReturnPersistence => ({
  client: scheduledFare.client,
  creator: scheduledFare.creator,
  datetime: scheduledFare.datetime,
  departure: scheduledFare.departure,
  destination: scheduledFare.destination,
  distance: scheduledFare.distance,
  planning: scheduledFare.planning,
  duration: scheduledFare.duration,
  kind: scheduledFare.kind,
  nature: scheduledFare.nature,
  phone: scheduledFare.phone,
  status: scheduledFare.status
});

export const persistFareAndDeleteReturnToAffect =
  (database: PostgresDb) =>
  (fare: ScheduledReturnPersistence, returnToDeleteId: string): TaskEither<Errors, QueryResult[]> =>
    taskEitherTryCatch(applyQueries(database, fare, returnToDeleteId), onApplyQueriesError);

const applyQueries =
  (database: PostgresDb, fare: ScheduledReturnPersistence, returnToDeleteId: string) => async (): Promise<QueryResult[]> =>
    database.transact(async (client: PoolClient): Promise<QueryResult[]> => {
      const promises: Promise<QueryResult>[] = [
        insertScheduledFareQuery(client, fare),
        removeReturnToAffectQuery(client, returnToDeleteId)
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

const insertScheduledFareQuery = async (client: PoolClient, farePg: ScheduledReturnPersistence): Promise<QueryResult> =>
  client.query(insertFareQueryString, [
    farePg.client,
    farePg.creator,
    farePg.datetime,
    farePg.departure,
    farePg.destination,
    farePg.distance,
    farePg.planning,
    farePg.duration,
    farePg.kind,
    farePg.nature,
    farePg.phone,
    farePg.status
  ]);

const insertFareQueryString: string = `
      INSERT INTO fares (
          client,
          creator,
          datetime,
          departure,
          destination,
          distance,
          planning,
          duration,
          kind,
          nature,
          phone,
          status
      ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      )
    `;

const removeReturnToAffectQuery = async (client: PoolClient, id: string): Promise<QueryResult> =>
  client.query(removeReturnToAffectQueryString, [id]);

const removeReturnToAffectQueryString: string = `DELETE FROM returns_to_affect WHERE id = $1;
      `;
