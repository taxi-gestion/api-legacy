import type { PostgresDb } from '@fastify/postgres';
import type { PoolClient, QueryResult } from 'pg';
import type { FareReady } from './add-fare-to-planning.provider';
import { Either, map } from 'fp-ts/Either';
import { Errors } from 'io-ts';
import { pipe } from 'fp-ts/lib/function';
import { chain as chainTaskEither, fromEither, TaskEither, tryCatch as tryCatchTaskEither } from 'fp-ts/TaskEither';

export type FarePg = FareReady;

export const toFarePg = (fare: Either<Errors, FareReady>): Either<Errors, FarePg> =>
  map(
    (fareReady: FareReady): FarePg => ({
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

// helper function to handle the async operation

export const addFareToPlanningPersist =
  (db: PostgresDb) =>
  (farePg: Either<Errors, FarePg>): TaskEither<Errors, QueryResult> =>
    pipe(farePg, fromEither, chainTaskEither(insertFare(db)));

const insertFare =
  (db: PostgresDb) =>
  (fare: FarePg): TaskEither<Errors, QueryResult> =>
    tryCatchTaskEither(
      async (): Promise<QueryResult> => {
        const client: PoolClient = await db.connect();
        try {
          return await insertFareSQLQueryBuilder(client, fare);
        } finally {
          client.release();
        }
      },
      (error: unknown): Errors =>
        [
          {
            message: `Error - addFareToPlanningPersist: ${(error as Error).message}`,
            // eslint-disable-next-line id-denylist
            value: (error as Error).name,
            context: []
          }
        ] satisfies Errors
    );

const insertFareSQLQueryBuilder = async (client: PoolClient, farePg: FarePg): Promise<QueryResult> =>
  client.query(insertFareSQLQueryString, [
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

const insertFareSQLQueryString: string = `
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
