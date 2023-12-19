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
import { Errors } from '../../codecs';
import { UnassignedPersistence } from '../../definitions';
import { onDatabaseError } from '../../errors';
import { fromDBtoUnassignedCandidate, toUnassignedPersistence } from '../../mappers';
import { Either } from 'fp-ts/Either';
import { UnassignedPersist } from './allocate-unassigned.route';

export const persistUnassignedFP =
  (database: PostgresDb) =>
  (fares: Either<Errors, UnassignedPersist>): TaskEither<Errors, unknown> =>
    pipe(fares, fromEither, taskEitherChain(insertUnassignedIn(database)));

export const insertUnassignedIn =
  (database: PostgresDb) =>
  (fare: UnassignedPersist): TaskEither<Errors, unknown> =>
    pipe(taskEitherTryCatch(insertUnassigned(database)(fare), onDatabaseError(`persistUnassigned`)), taskEitherMap(toTransfer));

const insertUnassigned =
  (database: PostgresDb) =>
  ({ unassignedToCreate }: UnassignedPersist) =>
  async (): Promise<QueryResult[]> =>
    database.transact(
      async (client: PoolClient): Promise<QueryResult[]> =>
        Promise.all([insertUnassignedFareQuery(client)(toUnassignedPersistence(unassignedToCreate))])
    );

const insertUnassignedFareQuery =
  (client: PoolClient) =>
  async (farePg: UnassignedPersistence): Promise<QueryResult> =>
    client.query(insertUnassignedFareQueryString, [
      farePg.passenger,
      farePg.datetime,
      farePg.departure,
      farePg.arrival,
      farePg.distance,
      farePg.duration,
      farePg.kind,
      farePg.nature,
      farePg.creator
    ]);

const insertUnassignedFareQueryString: string = `
      INSERT INTO unassigned_fares (
          passenger,
          datetime,
          departure,
          arrival,
          distance,
          duration,
          kind,
          nature,
          creator
      ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
      )
      RETURNING *
    `;

const toTransfer = (queriesResults: QueryResult[]): unknown => ({
  unassignedCreated: [queriesResults[0]?.rows[0]].map(fromDBtoUnassignedCandidate)[0]
});
