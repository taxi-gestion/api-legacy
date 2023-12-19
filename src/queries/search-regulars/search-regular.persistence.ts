import { TaskEither } from 'fp-ts/lib/TaskEither';
import { PostgresDb } from '@fastify/postgres';
import { pipe } from 'fp-ts/lib/function';
import { map as taskEitherMap, tryCatch as taskEitherTryCatch } from 'fp-ts/TaskEither';
import { PoolClient, QueryResult } from 'pg';
import { onDatabaseError } from '../../errors';
import { fromDBtoRegularCandidate } from '../../mappers';
import { Errors } from '../../codecs';

export const searchRegularsDatabaseQuery =
  (database: PostgresDb) =>
  (search: string): TaskEither<Errors, unknown> =>
    pipe(searchRegulars(database)(search), taskEitherMap(toTransfer));

const searchRegulars =
  (database: PostgresDb) =>
  (search: string): TaskEither<Errors, QueryResult> =>
    taskEitherTryCatch(selectFromRegular(database)(search), onDatabaseError(`searchRegularsDatabaseQuery`));

const selectFromRegular = (database: PostgresDb) => (search: string) => async (): Promise<QueryResult> => {
  const client: PoolClient = await database.connect();
  try {
    return await selectRegularsQuery(client)(search);
  } finally {
    client.release();
  }
};

const selectRegularsQuery =
  (client: PoolClient) =>
  async (search: string): Promise<QueryResult> =>
    client.query(selectRegularsQueryString, [`%${search}%`]);

const selectRegularsQueryString: string = `
      SELECT * FROM regulars
      WHERE 
        (civility ILIKE $1) OR
        (firstname ILIKE $1) OR
        (lastname ILIKE $1)
    `;

const toTransfer = (queryResult: QueryResult): unknown => queryResult.rows.map(fromDBtoRegularCandidate);
