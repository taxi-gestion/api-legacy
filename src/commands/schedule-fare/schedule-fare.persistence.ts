/* eslint-disable max-lines */
import { chain as taskEitherChain, fromEither, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import type { PoolClient, QueryResult } from 'pg';
import { pipe } from 'fp-ts/lib/function';
import { Either, map as eitherMap } from 'fp-ts/Either';
import type { PostgresDb } from '@fastify/postgres';
import { Errors, InfrastructureError } from '../../reporter/HttpReporter';
import { Pending, Scheduled } from '../../definitions';

type ScheduledPersistence = Omit<Scheduled, 'departure' | 'destination'> & {
  departure: string;
  destination: string;
};

type PendingPersistence = Omit<Pending, 'departure' | 'destination'> & {
  departure: string;
  destination: string;
  outwardFareId: string;
};

export type FaresToPersist = [ScheduledPersistence, PendingPersistence?];

export const persistFares =
  (database: PostgresDb) =>
  (farePersistence: Either<Errors, FaresToPersist>): TaskEither<Errors, QueryResult[]> =>
    pipe(farePersistence, fromEither, taskEitherChain(insertFaresIn(database)));

export const toFaresPersistence = (fare: Either<Errors, [Scheduled, Pending?]>): Either<Errors, FaresToPersist> =>
  pipe(
    fare,
    eitherMap(
      ([scheduledFare, fareReturnToSchedule]: [Scheduled, Pending?]): FaresToPersist =>
        fareReturnToSchedule == null
          ? [toScheduledFarePersistence(scheduledFare)]
          : [toScheduledFarePersistence(scheduledFare), toPendingPersistence(fareReturnToSchedule)]
    )
  );

const toScheduledFarePersistence = (scheduledFare: Scheduled): ScheduledPersistence => ({
  ...scheduledFare,
  departure: JSON.stringify(scheduledFare.departure),
  destination: JSON.stringify(scheduledFare.destination)
});

const toPendingPersistence = (pending: Pending): PendingPersistence => ({
  ...pending,
  departure: JSON.stringify(pending.departure),
  destination: JSON.stringify(pending.destination),
  outwardFareId: ''
});

const insertFaresIn =
  (database: PostgresDb) =>
  (fares: FaresToPersist): TaskEither<Errors, QueryResult[]> =>
    taskEitherTryCatch(insertFares(database, fares), onInsertFaresError);

const insertFares =
  (database: PostgresDb, fares: [ScheduledPersistence, PendingPersistence?]) => async (): Promise<QueryResult[]> =>
    database.transact(async (client: PoolClient): Promise<QueryResult[]> => {
      const [fare, fareToSchedule]: [ScheduledPersistence, PendingPersistence?] = fares;

      const scheduledFareResult: QueryResult = await insertScheduledFareQuery(client, fare);

      if (fareToSchedule == null) {
        return [scheduledFareResult];
      }

      const pendingFareResult: QueryResult = await insertPendingQuery(client, {
        ...fareToSchedule,
        outwardFareId: scheduledFareResult.rows[0].id as string
      });

      return [scheduledFareResult, pendingFareResult];
    });

const onInsertFaresError = (error: unknown): Errors =>
  [
    {
      isInfrastructureError: true,
      message: `insertFaresIn database error - ${(error as Error).message}`,
      // eslint-disable-next-line id-denylist
      value: (error as Error).name,
      stack: (error as Error).stack ?? 'no stack available',
      code: (error as Error).message.includes('ECONNREFUSED') ? '503' : '500'
    } satisfies InfrastructureError
  ] satisfies Errors;

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
