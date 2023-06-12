import { TaskEither } from 'fp-ts/lib/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { Either } from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PoolClient, QueryResult } from 'pg';
import { Errors, InfrastructureError } from '../../reporter/HttpReporter';

export const faresForTheDateQuery =
  (database: PostgresDb) =>
  (date: Either<Errors, string>): TaskEither<Errors, QueryResult> =>
    pipe(date, fromEither, taskEitherChain(selectFaresForDate(database)));

const selectFaresForDate =
  (database: PostgresDb) =>
  (date: string): TaskEither<Errors, QueryResult> =>
    taskEitherTryCatch(selectFromFares(database)(date), onSelectFaresError);

const onSelectFaresError = (error: unknown): Errors =>
  [
    {
      isInfrastructureError: true,
      message: `selectFaresForDate database error - ${(error as Error).message}`,
      // eslint-disable-next-line id-denylist
      value: (error as Error).name,
      stack: (error as Error).stack ?? 'no stack available',
      code: '503'
    } satisfies InfrastructureError
  ] satisfies Errors;

const selectFromFares = (database: PostgresDb) => (date: string) => async (): Promise<QueryResult> => {
  const client: PoolClient = await database.connect();
  try {
    return await selectFaresWhereDateQuery(client, date);
  } finally {
    client.release();
  }
};

const selectFaresWhereDateQuery = async (client: PoolClient, date: string): Promise<QueryResult> =>
  client.query(selectFaresWhereDateQueryString, [date]);

const selectFaresWhereDateQueryString: string = `
      SELECT * FROM fares WHERE date = $1
      `;
