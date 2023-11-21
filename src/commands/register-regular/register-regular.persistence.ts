import {
  chain as taskEitherChain,
  fromEither,
  map as taskEitherMap,
  TaskEither,
  tryCatch as taskEitherTryCatch
} from 'fp-ts/TaskEither';
import type { PoolClient, QueryResult } from 'pg';
import { pipe } from 'fp-ts/lib/function';
import { Either, map as eitherMap } from 'fp-ts/Either';
import type { PostgresDb } from '@fastify/postgres';
import { Errors } from '../../codecs';
import { RegularToRegisterPersist } from './register-regular.route';
import { onDatabaseError } from '../../errors';
import { fromDBtoRegularCandidate } from '../../mappers';
import { RegularPersistence } from '../../definitions';

type RegularToRegisterPersistReady = {
  regularToCreate: RegularPersistence;
};

export const persistRegisterRegular =
  (database: PostgresDb) =>
  (regularPersistence: Either<Errors, RegularToRegisterPersist>): TaskEither<Errors, unknown> =>
    pipe(regularPersistence, eitherMap(toPersistence), fromEither, taskEitherChain(insertRegularIn(database)));

const insertRegularIn =
  (database: PostgresDb) =>
  (regular: RegularToRegisterPersistReady): TaskEither<Errors, unknown> =>
    pipe(taskEitherTryCatch(insertRegular(database)(regular), onDatabaseError(`insertRegularIn`)), taskEitherMap(toTransfer));

const insertRegular =
  (database: PostgresDb) =>
  ({ regularToCreate }: RegularToRegisterPersistReady) =>
  async (): Promise<QueryResult[]> =>
    database.transact(
      async (client: PoolClient): Promise<QueryResult[]> => Promise.all([insertRegularQuery(client)(regularToCreate)])
    );

const insertRegularQuery =
  (client: PoolClient) =>
  async (regularPg: RegularPersistence): Promise<QueryResult> =>
    client.query(insertRegularQueryString, [
      regularPg.civility,
      regularPg.firstname,
      regularPg.lastname,
      regularPg.phones,
      regularPg.waypoints,
      regularPg.comment,
      regularPg.subcontracted_client
    ]);

const insertRegularQueryString: string = `
      INSERT INTO regulars (
          civility,
          firstname,
          lastname,
          phones,
          waypoints,
          comment,
          subcontracted_client
      ) VALUES (
          $1, $2, $3, $4::jsonb[], $5::jsonb[], $6, $7
      )
      RETURNING *
    `;

const toPersistence = ({ regularToCreate }: RegularToRegisterPersist): RegularToRegisterPersistReady => ({
  regularToCreate: {
    ...regularToCreate,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    subcontracted_client: regularToCreate.subcontractedClient
  }
});

const toTransfer = (queriesResults: QueryResult[]): unknown => ({
  regularRegistered: [queriesResults[0]?.rows[0]].map(fromDBtoRegularCandidate)[0]
});
