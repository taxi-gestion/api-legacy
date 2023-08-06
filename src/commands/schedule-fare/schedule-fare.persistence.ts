import { chain as taskEitherChain, fromEither, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import type { PoolClient, QueryResult } from 'pg';
import { pipe } from 'fp-ts/lib/function';
import { Either, map as eitherMap } from 'fp-ts/Either';
import type { PostgresDb } from '@fastify/postgres';
import { Errors, InfrastructureError } from '../../reporter/HttpReporter';
import { Pending, Scheduled } from '../../definitions';

export type ScheduledPersistence = Omit<Scheduled, 'departure' | 'destination'> & {
  departure: string;
  destination: string;
};

type PendingPersistence = Omit<Pending, 'departure' | 'destination'> & {
  departure: string;
  destination: string;
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
  destination: JSON.stringify(pending.destination)
});

const insertFaresIn =
  (database: PostgresDb) =>
  (fares: FaresToPersist): TaskEither<Errors, QueryResult[]> =>
    taskEitherTryCatch(insertFares(database, fares), onInsertFaresError);

const insertFares =
  (database: PostgresDb, fares: [ScheduledPersistence, PendingPersistence?]) => async (): Promise<QueryResult[]> =>
    database.transact(async (client: PoolClient): Promise<QueryResult[]> => {
      const [fare, fareToSchedule]: [ScheduledPersistence, PendingPersistence?] = fares;
      const promises: Promise<QueryResult>[] = [
        insertScheduledFareQuery(client, fare),
        ...insertPendingQueryOrEmpty(fareToSchedule, client)
      ];
      return Promise.all(promises);
    });

const insertPendingQueryOrEmpty = (
  fareToSchedule: PendingPersistence | undefined,
  client: PoolClient
): [] | [Promise<QueryResult>] => (fareToSchedule == null ? [] : [insertPendingQuery(client, fareToSchedule)]);

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
    JSON.stringify(farePg.departure),
    JSON.stringify(farePg.destination),
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
    `;

const insertPendingQuery = async (client: PoolClient, farePg: PendingPersistence): Promise<QueryResult> =>
  client.query(insertPendingQueryString, [
    farePg.passenger,
    farePg.datetime,
    JSON.stringify(farePg.departure),
    JSON.stringify(farePg.destination),
    farePg.driver,
    farePg.kind,
    farePg.nature,
    farePg.phone
  ]);

const insertPendingQueryString: string = `
      INSERT INTO pending_returns (
          client,
          datetime,
          departure,
          destination,
          driver,
          kind,
          nature,
          phone
      ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
      )
      `;
