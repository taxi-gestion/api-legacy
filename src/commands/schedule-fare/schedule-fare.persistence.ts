import { chain as taskEitherChain, fromEither, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import type { PoolClient, QueryResult } from 'pg';
import { Errors } from 'io-ts';
import { pipe } from 'fp-ts/lib/function';
import { Either, map as eitherMap } from 'fp-ts/Either';
import type { PostgresDb } from '@fastify/postgres';
import type { ScheduledFare } from './schedule-fare.definitions';

export type FarePersistence = ScheduledFare;

export const persistScheduledFare =
  (database: PostgresDb) =>
  (farePersistence: Either<Errors, FarePersistence>): TaskEither<Errors, QueryResult> =>
    pipe(farePersistence, fromEither, taskEitherChain(insertFareIn(database)));
export const toScheduledFarePersistence = (fare: Either<Errors, ScheduledFare>): Either<Errors, FarePersistence> =>
  eitherMap(
    (fareReady: ScheduledFare): FarePersistence => ({
      client: fareReady.client,
      creator: fareReady.creator,
      date: fareReady.date,
      departure: fareReady.departure,
      destination: fareReady.destination,
      distance: fareReady.distance,
      planning: fareReady.planning,
      duration: fareReady.duration,
      kind: fareReady.kind,
      nature: fareReady.nature,
      phone: fareReady.phone,
      status: fareReady.status,
      time: fareReady.time
    })
  )(fare);

const insertFareIn =
  (database: PostgresDb) =>
  (fare: FarePersistence): TaskEither<Errors, QueryResult> =>
    taskEitherTryCatch(insertIntoFares(database)(fare), onInsertFareError);

const insertIntoFares = (database: PostgresDb) => (fare: FarePersistence) => async (): Promise<QueryResult> => {
  const client: PoolClient = await database.connect();
  try {
    return await insertFareQuery(client, fare);
  } finally {
    client.release();
  }
};

const onInsertFareError = (error: unknown): Errors =>
  [
    {
      message: `Error - insertFare: ${(error as Error).message}`,
      // eslint-disable-next-line id-denylist
      value: (error as Error).name,
      context: []
    }
  ] satisfies Errors;

const insertFareQuery = async (client: PoolClient, farePg: FarePersistence): Promise<QueryResult> =>
  client.query(insertFareQueryString, [
    farePg.client,
    farePg.creator,
    farePg.date,
    farePg.departure,
    farePg.destination,
    farePg.distance,
    farePg.planning,
    farePg.duration,
    farePg.kind,
    farePg.nature,
    farePg.phone,
    farePg.status,
    farePg.time
  ]);

const insertFareQueryString: string = `
      INSERT INTO fares (
          client,
          creator,
          date,
          departure,
          destination,
          distance,
          planning,
          duration,
          kind,
          nature,
          phone,
          status,
          time
      ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      )
    `;
