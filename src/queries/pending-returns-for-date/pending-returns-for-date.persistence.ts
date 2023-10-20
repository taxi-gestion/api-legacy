import { TaskEither } from 'fp-ts/lib/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { Either } from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';
import { chain as taskEitherChain, fromEither, map as taskEitherMap, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PoolClient, QueryResult } from 'pg';
import { Errors } from '../../reporter';
import { onDatabaseError } from '../../errors';
import { fromDBtoPendingCandidate } from '../../mappers';

export const pendingReturnsForTheDateDatabaseQuery =
  (database: PostgresDb) =>
  (date: Either<Errors, string>): TaskEither<Errors, unknown> =>
    pipe(date, fromEither, taskEitherChain(selectPendingReturnsForDate(database)), taskEitherMap(toTransfer));

const toTransfer = (queryResult: QueryResult): unknown => queryResult.rows.map(fromDBtoPendingCandidate);

const selectPendingReturnsForDate =
  (database: PostgresDb) =>
  (date: string): TaskEither<Errors, QueryResult> =>
    taskEitherTryCatch(selectFromPendingReturns(database)(date), onDatabaseError(`pendingReturnsForTheDateDatabaseQuery`));

const selectFromPendingReturns = (database: PostgresDb) => (date: string) => async (): Promise<QueryResult> => {
  const client: PoolClient = await database.connect();
  try {
    return await selectPendingReturnsWhereDateQuery(client)(date);
  } finally {
    client.release();
  }
};

const selectPendingReturnsWhereDateQuery =
  (client: PoolClient) =>
  async (date: string): Promise<QueryResult> =>
    client.query(selectPendingReturnsWhereDateQueryString, [date]);

const selectPendingReturnsWhereDateQueryString: string = `
      SELECT * FROM pending_returns WHERE datetime >= $1::DATE AND datetime < ($1::DATE + INTERVAL '1 day')
    `;
