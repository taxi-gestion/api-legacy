import {
  chain as taskEitherChain,
  fromEither,
  map as taskEitherMap,
  TaskEither,
  tryCatch as taskEitherTryCatch
} from 'fp-ts/TaskEither';
import type { PoolClient, QueryResult } from 'pg';
import { pipe } from 'fp-ts/lib/function';
import { Either } from 'fp-ts/Either';
import type { PostgresDb } from '@fastify/postgres';
import { Errors } from '../../reporter';
import { Regular } from '../../definitions';
import { RegularToRegister } from './register-regular.route';
import { onDatabaseError } from '../../errors';
import { fromDBtoRegularCandidate } from '../../persistence/persistence-utils';

export const persistRegisterRegular =
  (database: PostgresDb) =>
  (regularPersistence: Either<Errors, RegularToRegister>): TaskEither<Errors, unknown> =>
    pipe(regularPersistence, fromEither, taskEitherChain(insertRegularIn(database)));

const insertRegularIn =
  (database: PostgresDb) =>
  (regular: RegularToRegister): TaskEither<Errors, unknown> =>
    pipe(
      taskEitherTryCatch(insertRegular(database, regular), onDatabaseError(`insertRegularIn`)),
      taskEitherMap(toRegisteredRegular)
    );

const insertRegular =
  (database: PostgresDb, { toRegister }: RegularToRegister) =>
  async (): Promise<QueryResult[]> =>
    database.transact(
      async (client: PoolClient): Promise<QueryResult[]> => Promise.all([insertRegularQuery(client, toRegister)])
    );

const insertRegularQuery = async (client: PoolClient, regularPg: Regular): Promise<QueryResult> =>
  client.query(insertRegularQueryString, [regularPg.firstname, regularPg.lastname, regularPg.phone]);

const insertRegularQueryString: string = `
      INSERT INTO passengers (
          firstname,
          lastname,
          phone
      ) VALUES (
          $1, $2, $3
      )
      RETURNING *
    `;

const toRegisteredRegular = (queriesResults: QueryResult[]): unknown => ({
  regularRegistered: [queriesResults[0]?.rows[0]].map(fromDBtoRegularCandidate)[0]
});
