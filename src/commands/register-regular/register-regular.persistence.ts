import { chain as taskEitherChain, fromEither, TaskEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import type { PoolClient, QueryResult } from 'pg';
import { pipe } from 'fp-ts/lib/function';
import { Either } from 'fp-ts/Either';
import type { PostgresDb } from '@fastify/postgres';
import { Errors, InfrastructureError } from '../../reporter/HttpReporter';
import { Regular } from '../../definitions';

export const persistRegular =
  (database: PostgresDb) =>
  (regularPersistence: Either<Errors, Regular>): TaskEither<Errors, QueryResult[]> =>
    pipe(regularPersistence, fromEither, taskEitherChain(insertRegularIn(database)));

const insertRegularIn =
  (database: PostgresDb) =>
  (regular: Regular): TaskEither<Errors, QueryResult[]> =>
    taskEitherTryCatch(insertRegular(database, regular), onInsertRegularError);

const insertRegular = (database: PostgresDb, regular: Regular) => async (): Promise<QueryResult[]> =>
  database.transact(async (client: PoolClient): Promise<QueryResult[]> => {
    const promises: Promise<QueryResult>[] = [insertRegularQuery(client, regular)];
    return Promise.all(promises);
  });

const onInsertRegularError = (error: unknown): Errors =>
  [
    {
      isInfrastructureError: true,
      message: `insertRegular database error - ${(error as Error).message}`,
      // eslint-disable-next-line id-denylist
      value: (error as Error).name,
      stack: (error as Error).stack ?? 'no stack available',
      code: (error as Error).message.includes('ECONNREFUSED') ? '503' : '500'
    } satisfies InfrastructureError
  ] satisfies Errors;

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
