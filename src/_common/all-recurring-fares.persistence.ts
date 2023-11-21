import { TaskEither } from 'fp-ts/lib/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { pipe } from 'fp-ts/lib/function';
import { map as taskEitherMap, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PoolClient, QueryResult } from 'pg';
import { Errors } from '../codecs';
import { onDatabaseError } from '../errors';
import { fromDBtoRecurringCandidate } from '../mappers';

export const allRecurringFares = (database: PostgresDb): TaskEither<Errors, unknown> =>
  pipe(allRecurring(database)(), taskEitherMap(toTransfer));

const allRecurring = (database: PostgresDb) => (): TaskEither<Errors, QueryResult> =>
  taskEitherTryCatch(selectFromRecurring(database)(), onDatabaseError(`allRecurringDatabaseQuery`));

const selectFromRecurring = (database: PostgresDb) => () => async (): Promise<QueryResult> => {
  const client: PoolClient = await database.connect();
  try {
    return await selectAllRecurringFaresQuery(client)();
  } finally {
    client.release();
  }
};

const selectAllRecurringFaresQuery = (client: PoolClient) => async (): Promise<QueryResult> =>
  client.query(selectRecurringQueryString);

const selectRecurringQueryString: string = `
      SELECT * FROM recurring_fares
    `;

const toTransfer = (queryResult: QueryResult): unknown => queryResult.rows.map(fromDBtoRecurringCandidate);
